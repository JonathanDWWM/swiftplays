import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';
import { Game, MessageType, MessageCategory, Priority } from '@prisma/client';
import { notificationService } from '../services/notificationService';

/**
 * Obtenir ou créer un LadderPlayer pour un utilisateur
 */
const getOrCreateLadderPlayer = async (userId: string, game: Game, gameMode: string) => {
  let ladderPlayer = await prisma.ladderPlayer.findUnique({
    where: {
      userId_game_gameMode: {
        userId,
        game,
        gameMode
      }
    }
  });

  if (!ladderPlayer) {
    ladderPlayer = await prisma.ladderPlayer.create({
      data: {
        userId,
        game,
        gameMode
      }
    });
  }

  return ladderPlayer;
};

/**
 * Valider les créneaux horaires (par quart d'heure)
 */
const validateTimeSlot = (dateTime: Date): boolean => {
  const minutes = dateTime.getMinutes();
  return minutes === 0 || minutes === 15 || minutes === 30 || minutes === 45;
};

/**
 * Créer un nouveau défi
 */
export const createChallenge = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { game, gameMode, scheduledAt, message } = req.body;
    const userId = req.user!.userId;

    // Validation des paramètres
    if (!game || !gameMode || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'Les champs game, gameMode et scheduledAt sont requis'
      });
    }

    // Vérifier que le jeu et mode sont supportés pour le ladder
    const supportedModes: { [key: string]: string[] } = {
      'FC_26': ['1v1', '2v2', '5v5'],
      'CALL_OF_DUTY_BO7': ['1v1', '2v2', '4v4']
    };

    if (!supportedModes[game] || !supportedModes[game].includes(gameMode)) {
      const gameDisplayName = game === 'FC_26' ? 'FC 26' : 'Call of Duty Black Ops 7';
      const modes = supportedModes[game]?.join(', ') || 'aucun mode';
      return res.status(400).json({
        success: false,
        message: `Seuls les modes ${modes} sont supportés pour ${gameDisplayName}`
      });
    }

    // Pour les modes d'équipe (2v2, 5v5), vérifier que l'utilisateur fait partie d'une équipe
    if (gameMode !== '1v1') {
      const userTeam = await prisma.teamMember.findFirst({
        where: {
          userId,
          team: {
            game: game as Game,
            gameMode
          }
        },
        include: {
          team: true
        }
      });

      if (!userTeam) {
        return res.status(400).json({
          success: false,
          message: `Vous devez faire partie d'une équipe ${gameMode} pour créer un défi dans ce mode`
        });
      }
    }

    const scheduledDate = new Date(scheduledAt);
    const now = new Date();

    // Vérifier que la date est dans le futur
    if (scheduledDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'La date du match doit être dans le futur'
      });
    }

    // Vérifier que la date n'est pas trop loin (max 24h)
    const maxDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (scheduledDate > maxDate) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez programmer un match que dans les 24 prochaines heures'
      });
    }

    // Valider le créneau (par quart d'heure)
    if (!validateTimeSlot(scheduledDate)) {
      return res.status(400).json({
        success: false,
        message: 'Les créneaux horaires doivent être par quart d\'heure (00, 15, 30, 45 minutes)'
      });
    }

    // Obtenir ou créer le LadderPlayer
    const ladderPlayer = await getOrCreateLadderPlayer(userId, game as Game, gameMode);

    // Vérifier qu'il n'y a pas déjà un défi actif à cette heure
    const existingChallenge = await prisma.challenge.findFirst({
      where: {
        creatorId: ladderPlayer.id,
        scheduledAt: scheduledDate,
        status: {
          in: ['PENDING', 'ACCEPTED']
        }
      }
    });

    if (existingChallenge) {
      return res.status(409).json({
        success: false,
        message: 'Vous avez déjà un défi actif à cette heure'
      });
    }

    // Créer le défi
    const challenge = await prisma.challenge.create({
      data: {
        creatorId: ladderPlayer.id,
        game: game as Game,
        gameMode,
        scheduledAt: scheduledDate,
        expiresAt: scheduledDate, // Expire à l'heure du match
        message
      },
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true,
                discordAvatar: true
              }
            }
          }
        }
      }
    });

    // Créer notifications pour le créateur du défi
    try {
      // Vérifier si c'est son premier défi
      const userChallengeCount = await prisma.challenge.count({
        where: {
          creator: { userId }
        }
      });
      
      if (userChallengeCount === 1) { // C'est son premier défi
        await notificationService.createNotification(userId, {
          type: MessageType.FIRST_CHALLENGE_CREATED,
          category: MessageCategory.ACHIEVEMENT,
          title: '⚔️ Premier défi créé !',
          content: `Bravo ! Vous venez de créer votre premier défi en ${challenge.game} ${challenge.gameMode}. Les autres joueurs peuvent maintenant l'accepter !`,
          priority: Priority.HIGH,
          data: {
            challengeId: challenge.id,
            game: challenge.game,
            gameMode: challenge.gameMode,
            scheduledAt: challenge.scheduledAt,
            achievement: 'first_challenge',
            url: '/ladder'
          }
        });
      } else {
        // Notification normale
        await notificationService.createNotification(userId, {
          type: MessageType.CHALLENGE_CREATED,
          category: MessageCategory.NOTIFICATION,
          title: 'Défi créé avec succès',
          content: `Votre défi ${challenge.game} ${challenge.gameMode} a été publié et est maintenant visible par les autres joueurs.`,
          priority: Priority.NORMAL,
          data: {
            challengeId: challenge.id,
            game: challenge.game,
            gameMode: challenge.gameMode,
            scheduledAt: challenge.scheduledAt,
            url: '/ladder'
          }
        });
      }
    } catch (error) {
      console.error('Erreur création notification défi:', error);
    }

    res.status(201).json({
      success: true,
      data: challenge,
      message: 'Défi créé avec succès'
    });

  } catch (error) {
    console.error('Erreur création défi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer tous les défis disponibles (anonymes)
 */
export const getAvailableChallenges = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { game = 'FC_26', gameMode = '1v1' } = req.query;
    const userId = req.user!.userId;
    const now = new Date();

    // Pour les modes d'équipe, vérifier que l'utilisateur fait partie d'une équipe
    if (gameMode !== '1v1') {
      const userTeam = await prisma.teamMember.findFirst({
        where: {
          userId,
          team: {
            game: game as Game,
            gameMode: gameMode as string
          }
        }
      });

      if (!userTeam) {
        return res.status(400).json({
          success: false,
          message: `Vous devez faire partie d'une équipe ${gameMode} pour voir les défis dans ce mode`
        });
      }
    }

    // Obtenir le LadderPlayer de l'utilisateur pour l'exclure des défis
    const userLadderPlayer = await prisma.ladderPlayer.findUnique({
      where: {
        userId_game_gameMode: {
          userId,
          game: game as Game,
          gameMode: gameMode as string
        }
      }
    });

    // Récupérer les défis disponibles (pas expirés)
    // NOTE: En mode test, on affiche aussi ses propres défis
    const challenges = await prisma.challenge.findMany({
      where: {
        game: game as Game,
        gameMode: gameMode as string,
        status: 'PENDING',
        expiresAt: {
          gt: now
        }
        // Temporairement désactivé pour les tests :
        // ...(userLadderPlayer && {
        //   creatorId: {
        //     not: userLadderPlayer.id
        //   }
        // })
      },
      select: {
        id: true,
        scheduledAt: true,
        message: true,
        game: true,
        gameMode: true,
        createdAt: true
        // Pas d'informations sur le créateur (anonyme)
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    res.json({
      success: true,
      data: challenges
    });

  } catch (error) {
    console.error('Erreur récupération défis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Accepter un défi
 */
export const acceptChallenge = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Récupérer le défi
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true,
                discordAvatar: true
              }
            }
          }
        }
      }
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Défi introuvable'
      });
    }

    // Pour les modes d'équipe, vérifier que l'utilisateur fait partie d'une équipe
    if (challenge.gameMode !== '1v1') {
      const userTeam = await prisma.teamMember.findFirst({
        where: {
          userId,
          team: {
            game: challenge.game,
            gameMode: challenge.gameMode
          }
        }
      });

      if (!userTeam) {
        return res.status(400).json({
          success: false,
          message: `Vous devez faire partie d'une équipe ${challenge.gameMode} pour accepter ce défi`
        });
      }
    }

    // Vérifier que le défi est encore disponible
    if (challenge.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        message: 'Ce défi n\'est plus disponible'
      });
    }

    // Vérifier que le défi n'est pas expiré
    if (challenge.expiresAt <= new Date()) {
      return res.status(409).json({
        success: false,
        message: 'Ce défi a expiré'
      });
    }

    // Obtenir ou créer le LadderPlayer accepteur
    const acceptorLadderPlayer = await getOrCreateLadderPlayer(
      userId, 
      challenge.game, 
      challenge.gameMode
    );

    // Vérifier que l'utilisateur n'accepte pas son propre défi
    if (challenge.creatorId === acceptorLadderPlayer.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas accepter votre propre défi'
      });
    }

    // Transaction pour accepter le défi et créer le match
    const result = await prisma.$transaction(async (tx) => {
      // Créer le match
      const match = await tx.match.create({
        data: {
          player1Id: challenge.creatorId,
          player2Id: acceptorLadderPlayer.id,
          game: challenge.game,
          gameMode: challenge.gameMode,
          scheduledAt: challenge.scheduledAt
        }
      });

      // Mettre à jour le défi
      const updatedChallenge = await tx.challenge.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          acceptorId: acceptorLadderPlayer.id,
          matchId: match.id
        },
        include: {
          creator: {
            include: {
              user: {
                select: {
                  id: true,
                  pseudo: true,
                  avatar: true,
                  discordAvatar: true
                }
              }
            }
          },
          acceptor: {
            include: {
              user: {
                select: {
                  id: true,
                  pseudo: true,
                  avatar: true,
                  discordAvatar: true
                }
              }
            }
          },
          match: true
        }
      });

      return updatedChallenge;
    });

    // Créer notifications pour les deux joueurs
    try {
      // Notification pour le créateur du défi (quelqu'un a accepté son défi)
      await notificationService.createNotification(result.creator.user.id, {
        type: MessageType.CHALLENGE_ACCEPTED,
        category: MessageCategory.NOTIFICATION,
        title: 'Défi accepté !',
        content: `${result.acceptor?.user.pseudo} a accepté votre défi ${result.game} ${result.gameMode}. Le match est programmé pour ${new Date(result.scheduledAt).toLocaleString('fr-FR')}.`,
        priority: Priority.HIGH,
        senderId: result.acceptor?.user.id,
        data: {
          challengeId: result.id,
          matchId: result.match?.id,
          opponentPseudo: result.acceptor?.user.pseudo,
          game: result.game,
          gameMode: result.gameMode,
          scheduledAt: result.scheduledAt,
          url: '/matches'
        }
      });

      // Notification pour l'accepteur (confirmation d'acceptation)
      await notificationService.createNotification(userId, {
        type: MessageType.CHALLENGE_ACCEPTED,
        category: MessageCategory.NOTIFICATION,
        title: 'Match confirmé',
        content: `Vous avez accepté le défi de ${result.creator.user.pseudo} en ${result.game} ${result.gameMode}. Rendez-vous le ${new Date(result.scheduledAt).toLocaleString('fr-FR')} !`,
        priority: Priority.HIGH,
        senderId: result.creator.user.id,
        data: {
          challengeId: result.id,
          matchId: result.match?.id,
          opponentPseudo: result.creator.user.pseudo,
          game: result.game,
          gameMode: result.gameMode,
          scheduledAt: result.scheduledAt,
          url: '/matches'
        }
      });
    } catch (error) {
      console.error('Erreur création notifications acceptation défi:', error);
    }

    res.json({
      success: true,
      data: result,
      message: `Match programmé avec ${result.creator.user.pseudo} !`
    });

  } catch (error) {
    console.error('Erreur acceptation défi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer mes matchs
 */
export const getMyMatches = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { game = 'FC_26', gameMode = '1v1', status } = req.query;

    // Récupérer le LadderPlayer de l'utilisateur
    const ladderPlayer = await prisma.ladderPlayer.findUnique({
      where: {
        userId_game_gameMode: {
          userId,
          game: game as Game,
          gameMode: gameMode as string
        }
      }
    });

    if (!ladderPlayer) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Construire les filtres
    const whereClause: any = {
      OR: [
        { player1Id: ladderPlayer.id },
        { player2Id: ladderPlayer.id }
      ],
      game: game as Game,
      gameMode: gameMode as string
    };

    if (status) {
      whereClause.status = status;
    }

    // Récupérer les matchs
    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        player1: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true,
                discordAvatar: true
              }
            }
          }
        },
        player2: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true,
                discordAvatar: true
              }
            }
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: matches
    });

  } catch (error) {
    console.error('Erreur récupération matchs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer le classement Ladder
 */
export const getLadderRanking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { game = 'FC_26', gameMode = '1v1', limit = '50' } = req.query;

    const ranking = await prisma.ladderPlayer.findMany({
      where: {
        game: game as Game,
        gameMode: gameMode as string,
        matchesPlayed: {
          gt: 0 // Seulement les joueurs qui ont joué au moins un match
        }
      },
      include: {
        user: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            discordAvatar: true
          }
        }
      },
      orderBy: [
        { victories: 'desc' },    // Plus de victoires
        { defeats: 'asc' },       // Moins de défaites
        { lastMatchAt: 'desc' }   // Plus récent en cas d'égalité
      ],
      take: parseInt(limit as string)
    });

    // Ajouter la position dans le classement
    const rankingWithPosition = ranking.map((player, index) => ({
      ...player,
      rank: index + 1
    }));

    res.json({
      success: true,
      data: rankingWithPosition
    });

  } catch (error) {
    console.error('Erreur récupération classement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer les statistiques d'un joueur
 */
export const getPlayerStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { game = 'FC_26', gameMode = '1v1' } = req.query;

    const ladderPlayer = await prisma.ladderPlayer.findUnique({
      where: {
        userId_game_gameMode: {
          userId,
          game: game as Game,
          gameMode: gameMode as string
        }
      },
      include: {
        user: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            discordAvatar: true
          }
        }
      }
    });

    if (!ladderPlayer) {
      // Créer un profil vide si inexistant
      const newLadderPlayer = await getOrCreateLadderPlayer(userId, game as Game, gameMode as string);
      const playerWithUser = await prisma.ladderPlayer.findUnique({
        where: { id: newLadderPlayer.id },
        include: {
          user: {
            select: {
              id: true,
              pseudo: true,
              avatar: true,
              discordAvatar: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: playerWithUser
      });
    }

    // Calculer la position dans le classement
    const betterPlayers = await prisma.ladderPlayer.count({
      where: {
        game: game as Game,
        gameMode: gameMode as string,
        matchesPlayed: { gt: 0 },
        OR: [
          { victories: { gt: ladderPlayer.victories } },
          {
            AND: [
              { victories: ladderPlayer.victories },
              { defeats: { lt: ladderPlayer.defeats } }
            ]
          }
        ]
      }
    });

    const playerWithRank = {
      ...ladderPlayer,
      rank: betterPlayers + 1
    };

    res.json({
      success: true,
      data: playerWithRank
    });

  } catch (error) {
    console.error('Erreur récupération statistiques joueur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer les statistiques globales des jeux (page principale ladder)
 */
export const getGameStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Statistiques pour FC26
    const fc26Players = await prisma.ladderPlayer.count({
      where: { 
        game: 'FC_26',
        gameMode: '1v1'
      }
    });

    const fc26Matches = await prisma.match.count({
      where: { 
        game: 'FC_26',
        gameMode: '1v1',
        status: 'IN_PROGRESS'
      }
    });

    // Statistiques pour COD BO7
    const codBo7Players = await prisma.ladderPlayer.count({
      where: { 
        game: 'CALL_OF_DUTY_BO7'
      }
    });

    const codBo7Matches = await prisma.match.count({
      where: { 
        game: 'CALL_OF_DUTY_BO7',
        status: 'IN_PROGRESS'
      }
    });

    res.json({
      success: true,
      data: {
        fc26: {
          activePlayers: fc26Players,
          ongoingMatches: fc26Matches
        },
        codBo7: {
          activePlayers: codBo7Players,
          ongoingMatches: codBo7Matches
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération stats jeux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer les statistiques détaillées d'un jeu spécifique
 */
export const getSpecificGameStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { game } = req.params;

    // Déterminer le jeu en base de données selon le paramètre
    const gameMap: { [key: string]: { db: Game, modes: string[] } } = {
      'fc26': { db: 'FC_26', modes: ['1v1', '2v2', '5v5'] },
      'cod-bo7': { db: 'CALL_OF_DUTY_BO7', modes: ['1v1', '2v2', '4v4'] }
    };

    const gameConfig = gameMap[game];
    if (!gameConfig) {
      return res.status(404).json({
        success: false,
        message: 'Jeu non trouvé'
      });
    }

    // Stats générales
    const totalPlayers = await prisma.ladderPlayer.count({
      where: { 
        game: gameConfig.db
      }
    });

    const activeMatches = await prisma.match.count({
      where: { 
        game: gameConfig.db,
        status: 'IN_PROGRESS'
      }
    });

    // Stats par mode - génération dynamique
    const modeStats: { [key: string]: { players: number, matches: number } } = {};
    
    for (const mode of gameConfig.modes) {
      const players = await prisma.ladderPlayer.count({
        where: { 
          game: gameConfig.db,
          gameMode: mode
        }
      });

      const matches = await prisma.match.count({
        where: {
          game: gameConfig.db,
          gameMode: mode,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      modeStats[mode] = { players, matches };
    }

    // Stats quotidiennes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const challengesCreated = await prisma.challenge.count({
      where: {
        game: gameConfig.db,
        createdAt: { gte: today }
      }
    });

    const matchesCompleted = await prisma.match.count({
      where: {
        game: gameConfig.db,
        status: 'COMPLETED',
        updatedAt: { gte: today }
      }
    });

    const activePlayers = await prisma.ladderPlayer.count({
      where: {
        game: gameConfig.db,
        lastMatchAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
        }
      }
    });

    res.json({
      success: true,
      data: {
        gameStats: {
          totalPlayers,
          activeMatches
        },
        modeStats,
        dailyStats: {
          challengesCreated,
          matchesCompleted,
          activePlayers
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération stats jeu spécifique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer l'activité récente
 */
export const getRecentActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Récupérer les derniers matchs terminés
    const recentMatches = await prisma.match.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        player1: {
          include: { user: true }
        },
        player2: {
          include: { user: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // Récupérer les derniers défis créés
    const recentChallenges = await prisma.challenge.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        creator: {
          include: { user: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Créer un tableau d'activités mixtes
    const activities: any[] = [];

    // Ajouter les matchs terminés
    recentMatches.forEach(match => {
      if (match.winnerId && match.player1 && match.player2) {
        const winner = match.winnerId === match.player1Id ? match.player1 : match.player2;
        const loser = match.winnerId === match.player1Id ? match.player2 : match.player1;
        
        if (winner && loser) {
          activities.push({
            id: `match-${match.id}`,
            type: 'match_completed',
            message: `${winner.user.pseudo} a battu ${loser.user.pseudo} en ${match.game} ${match.gameMode}`,
            createdAt: match.updatedAt
          });
        }
      }
    });

    // Ajouter les défis créés
    recentChallenges.forEach(challenge => {
      activities.push({
        id: `challenge-${challenge.id}`,
        type: 'challenge_created',
        message: `${challenge.creator.user.pseudo} a créé un défi en ${challenge.game} ${challenge.gameMode}`,
        createdAt: challenge.createdAt
      });
    });

    // Trier par date et prendre les 10 plus récents
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentActivity = activities.slice(0, 10);

    res.json({
      success: true,
      data: recentActivity
    });

  } catch (error) {
    console.error('Erreur récupération activité récente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};