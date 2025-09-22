import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';
import { MessageType, MessageCategory, Priority } from '@prisma/client';
import { notificationService } from '../services/notificationService';

/**
 * Mettre à jour les statistiques des joueurs/équipes après un match
 */
const updateMatchStatistics = async (matchId: string, winnerId: string, gameMode: string) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId }
  });

  if (!match) return;

  const now = new Date();

  if (gameMode === '1v1') {
    // Mode individuel - mettre à jour les LadderPlayers
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

    await prisma.$transaction([
      // Gagnant
      prisma.ladderPlayer.update({
        where: { id: winnerId },
        data: {
          victories: { increment: 1 },
          matchesPlayed: { increment: 1 },
          lastMatchAt: now
        }
      }),
      // Perdant
      prisma.ladderPlayer.update({
        where: { id: loserId! },
        data: {
          defeats: { increment: 1 },
          matchesPlayed: { increment: 1 },
          lastMatchAt: now
        }
      })
    ]);
  } else {
    // Mode équipe - TODO: Ajouter les statistiques d'équipe si nécessaire
    // Pour l'instant, les équipes n'ont pas de statistiques ELO
    console.log(`Match équipe terminé: ${winnerId} a gagné contre ${winnerId === match.team1Id ? match.team2Id : match.team1Id}`);
  }
};

/**
 * Soumettre le résultat d'un match
 */
export const submitMatchResult = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { winnerId, score1, score2, comments, evidenceUrls } = req.body;
    const userId = req.user!.userId;

    // Récupérer le match avec les joueurs/équipes et soumissions existantes
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        },
        player2: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        },
        team1: {
          include: {
            members: {
              include: {
                user: { select: { id: true, pseudo: true } }
              }
            }
          }
        },
        team2: {
          include: {
            members: {
              include: {
                user: { select: { id: true, pseudo: true } }
              }
            }
          }
        },
        submissions: true
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match introuvable'
      });
    }

    // Vérifier que l'utilisateur fait partie du match
    let userCanSubmit = false;
    let submitterRole = null;

    if (match.gameMode === '1v1') {
      // Mode 1v1 : vérifier que l'utilisateur est l'un des joueurs
      userCanSubmit = match.player1?.user.id === userId || match.player2?.user.id === userId;
    } else {
      // Mode équipe : vérifier que l'utilisateur est membre d'une des équipes
      const team1Member = match.team1?.members.find(m => m.user.id === userId);
      const team2Member = match.team2?.members.find(m => m.user.id === userId);
      
      if (team1Member) {
        userCanSubmit = true;
        submitterRole = team1Member.role;
      } else if (team2Member) {
        userCanSubmit = true;
        submitterRole = team2Member.role;
      }
    }

    if (!userCanSubmit) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à soumettre le résultat de ce match'
      });
    }

    // Vérifier que le match est dans le bon état
    if (match.status !== 'IN_PROGRESS' && match.status !== 'AWAITING_RESULTS') {
      return res.status(409).json({
        success: false,
        message: 'Ce match n\'est plus en attente de résultats'
      });
    }

    // Vérifier qu'une soumission n'a pas déjà été faite par cet utilisateur
    const existingSubmission = match.submissions.find(s => s.submittedBy === userId);
    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: 'Vous avez déjà soumis un résultat pour ce match'
      });
    }

    // Valider le winnerId selon le mode de jeu
    let validWinnerId = false;
    if (match.gameMode === '1v1') {
      validWinnerId = winnerId === match.player1Id || winnerId === match.player2Id;
    } else {
      validWinnerId = winnerId === match.team1Id || winnerId === match.team2Id;
    }

    if (!validWinnerId) {
      return res.status(400).json({
        success: false,
        message: 'Le gagnant spécifié n\'est pas valide pour ce match'
      });
    }

    const now = new Date();
    const validationDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    // Créer la soumission
    const submission = await prisma.matchSubmission.create({
      data: {
        matchId,
        submittedBy: userId,
        winnerId,
        score1: score1 || null,
        score2: score2 || null,
        submitterRole,
        comments: comments || null,
        evidenceUrls: evidenceUrls ? JSON.stringify(evidenceUrls) : undefined
      }
    });

    // Vérifier s'il y a déjà une autre soumission
    const allSubmissions = await prisma.matchSubmission.findMany({
      where: { matchId }
    });

    let newStatus: 'AWAITING_RESULTS' | 'AWAITING_CONFIRMATION' | 'COMPLETED' = 'AWAITING_RESULTS';
    let shouldComplete = false;

    // Si c'est le mode 1v1 et qu'il y a 2 soumissions, ou si les résultats concordent
    if (allSubmissions.length === 2) {
      const [sub1, sub2] = allSubmissions;
      
      // Vérifier si les résultats concordent
      if (sub1.winnerId === sub2.winnerId && 
          sub1.score1 === sub2.score1 && 
          sub1.score2 === sub2.score2) {
        // Les résultats concordent, validation automatique
        newStatus = 'COMPLETED';
        shouldComplete = true;
      } else {
        // Les résultats diffèrent, attendre confirmation
        newStatus = 'AWAITING_CONFIRMATION';
      }
    } else if (allSubmissions.length === 1) {
      // Une seule soumission, attendre confirmation de l'autre partie
      newStatus = 'AWAITING_CONFIRMATION';
    }

    // Mettre à jour le match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: newStatus,
        validationDeadline: newStatus === 'AWAITING_CONFIRMATION' ? validationDeadline : null,
        ...(shouldComplete ? {
          winnerId,
          loserId: match.gameMode === '1v1' ? 
            (winnerId === match.player1Id ? match.player2Id : match.player1Id) :
            (winnerId === match.team1Id ? match.team2Id : match.team1Id),
          score1: score1 || null,
          score2: score2 || null,
          completedAt: now
        } : {})
      },
      include: {
        player1: {
          include: {
            user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
          }
        },
        player2: {
          include: {
            user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
          }
        },
        team1: {
          include: {
            members: {
              include: {
                user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
              }
            }
          }
        },
        team2: {
          include: {
            members: {
              include: {
                user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
              }
            }
          }
        },
        submissions: true
      }
    });

    // Si le match est complété, mettre à jour les statistiques
    if (shouldComplete) {
      await updateMatchStatistics(matchId, winnerId, match.gameMode);
      
      // Créer notifications de fin de match
      try {
        const winnerName = match.gameMode === '1v1' ? 
          (winnerId === match.player1Id ? match.player1?.user.pseudo : match.player2?.user.pseudo) :
          (winnerId === match.team1Id ? `Équipe ${match.team1?.name}` : `Équipe ${match.team2?.name}`);
        
        const loserName = match.gameMode === '1v1' ? 
          (winnerId === match.player1Id ? match.player2?.user.pseudo : match.player1?.user.pseudo) :
          (winnerId === match.team1Id ? `Équipe ${match.team2?.name}` : `Équipe ${match.team1?.name}`);

        if (match.gameMode === '1v1') {
          // Notification pour le gagnant
          const winnerUserId = winnerId === match.player1Id ? match.player1?.user.id : match.player2?.user.id;
          const loserUserId = winnerId === match.player1Id ? match.player2?.user.id : match.player1?.user.id;
          
          if (winnerUserId) {
            await notificationService.createNotification(winnerUserId, {
              type: MessageType.MATCH_RESULT_CONFIRMED,
              category: MessageCategory.NOTIFICATION,
              title: '🏆 Victoire confirmée !',
              content: `Félicitations ! Votre victoire contre ${loserName} en ${match.game} ${match.gameMode} a été validée.`,
              priority: Priority.HIGH,
              data: {
                matchId: match.id,
                result: 'victory',
                opponent: loserName,
                game: match.game,
                gameMode: match.gameMode,
                score: `${score1} - ${score2}`,
                url: '/matches'
              }
            });
          }

          // Notification pour le perdant
          if (loserUserId) {
            await notificationService.createNotification(loserUserId, {
              type: MessageType.MATCH_RESULT_CONFIRMED,
              category: MessageCategory.NOTIFICATION,
              title: 'Match terminé',
              content: `Votre match contre ${winnerName} en ${match.game} ${match.gameMode} est terminé. Bonne chance pour le prochain !`,
              priority: Priority.NORMAL,
              data: {
                matchId: match.id,
                result: 'defeat',
                opponent: winnerName,
                game: match.game,
                gameMode: match.gameMode,
                score: `${score1} - ${score2}`,
                url: '/matches'
              }
            });
          }
        }
        // TODO: Ajouter notifications pour les équipes
      } catch (error) {
        console.error('Erreur création notifications fin de match:', error);
      }
    } else if (newStatus === 'AWAITING_CONFIRMATION') {
      // Notification pour l'adversaire qu'un résultat a été soumis
      try {
        const submitterName = match.gameMode === '1v1' ? 
          (match.player1?.user.id === userId ? match.player1?.user.pseudo : match.player2?.user.pseudo) : 
          'votre adversaire';
        
        const opponentId = match.gameMode === '1v1' ? 
          (match.player1?.user.id === userId ? match.player2?.user.id : match.player1?.user.id) : 
          null;

        if (opponentId) {
          await notificationService.createNotification(opponentId, {
            type: MessageType.MATCH_RESULT_SUBMITTED,
            category: MessageCategory.NOTIFICATION,
            title: 'Résultat de match soumis',
            content: `${submitterName} a soumis un résultat pour votre match en ${match.game} ${match.gameMode}. Veuillez confirmer ou contester le résultat.`,
            priority: Priority.HIGH,
            senderId: userId,
            data: {
              matchId: match.id,
              submittedBy: submitterName,
              game: match.game,
              gameMode: match.gameMode,
              score: `${score1 || 'N/A'} - ${score2 || 'N/A'}`,
              url: '/matches',
              actions: ['confirm', 'dispute']
            }
          });
        }
      } catch (error) {
        console.error('Erreur création notification soumission résultat:', error);
      }
    }

    res.json({
      success: true,
      data: {
        match: updatedMatch,
        submission
      },
      message: shouldComplete ? 
        'Résultat validé automatiquement - match terminé' :
        'Résultat soumis avec succès - en attente de confirmation'
    });

  } catch (error) {
    console.error('Erreur soumission résultat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Contester le résultat d'un match
 */
export const disputeMatchResult = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { reason, description, proofUrls } = req.body;
    const userId = req.user!.userId;

    // Récupérer le match avec les joueurs
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        },
        player2: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match introuvable'
      });
    }

    // Vérifier que l'utilisateur fait partie du match
    const isPlayer1 = match.player1?.user.id === userId;
    const isPlayer2 = match.player2?.user.id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à contester ce match'
      });
    }

    // Vérifier que le match est complété
    if (match.status !== 'COMPLETED') {
      return res.status(409).json({
        success: false,
        message: 'Seuls les matchs terminés peuvent être contestés'
      });
    }

    // Vérifier qu'il n'y a pas déjà une contestation en cours
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        matchId,
        status: 'PENDING'
      }
    });

    if (existingDispute) {
      return res.status(409).json({
        success: false,
        message: 'Une contestation est déjà en cours pour ce match'
      });
    }

    // Vérifier que l'utilisateur n'est pas celui qui a soumis le résultat
    const submissions = await prisma.matchSubmission.findMany({
      where: { matchId }
    });
    
    const userSubmission = submissions.find(s => s.submittedBy === userId);
    if (userSubmission) {
      return res.status(409).json({
        success: false,
        message: 'Vous ne pouvez pas contester un match pour lequel vous avez soumis un résultat'
      });
    }

    // Transaction pour créer la contestation et mettre à jour le match
    const result = await prisma.$transaction(async (tx) => {
      // Créer la contestation
      const dispute = await tx.dispute.create({
        data: {
          matchId,
          disputedBy: userId,
          reason,
          description,
          proofUrls
        }
      });

      // Mettre à jour le statut du match
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: 'DISPUTED'
        }
      });

      return dispute;
    });

    res.json({
      success: true,
      data: result,
      message: 'Contestation soumise avec succès. Un modérateur examinera votre demande.'
    });

  } catch (error) {
    console.error('Erreur contestation match:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer les détails d'un match
 */
export const getMatchDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const userId = req.user!.userId;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
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
        },
        disputes: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            reason: true,
            description: true,
            disputedBy: true,
            createdAt: true
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match introuvable'
      });
    }

    // Vérifier que l'utilisateur a le droit de voir ce match
    const isPlayer1 = match.player1?.user.id === userId;
    const isPlayer2 = match.player2?.user.id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à voir ce match'
      });
    }

    res.json({
      success: true,
      data: match
    });

  } catch (error) {
    console.error('Erreur récupération détails match:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer les matches en attente de résultats pour un utilisateur
 */
export const getUserPendingMatches = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const matches = await prisma.match.findMany({
      where: {
        AND: [
          {
            OR: [
              { status: 'IN_PROGRESS' },
              { status: 'AWAITING_RESULTS' },
              { status: 'AWAITING_CONFIRMATION' }
            ]
          },
          {
            OR: [
              // Mode 1v1
              {
                player1: { user: { id: userId } }
              },
              {
                player2: { user: { id: userId } }
              },
              // Mode équipe
              {
                team1: {
                  members: {
                    some: { user: { id: userId } }
                  }
                }
              },
              {
                team2: {
                  members: {
                    some: { user: { id: userId } }
                  }
                }
              }
            ]
          }
        ]
      },
      include: {
        player1: {
          include: {
            user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
          }
        },
        player2: {
          include: {
            user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
          }
        },
        team1: {
          include: {
            members: {
              include: {
                user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
              }
            }
          }
        },
        team2: {
          include: {
            members: {
              include: {
                user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
              }
            }
          }
        },
        submissions: {
          select: {
            id: true,
            submittedBy: true,
            winnerId: true,
            score1: true,
            score2: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });

    res.json({
      success: true,
      data: matches
    });

  } catch (error) {
    console.error('Erreur récupération matches en attente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer les matches terminés pour un utilisateur
 */
export const getUserCompletedMatches = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const matches = await prisma.match.findMany({
      where: {
        AND: [
          {
            OR: [
              { status: 'COMPLETED' },
              { status: 'DISPUTED' },
              { status: 'CANCELLED' }
            ]
          },
          {
            OR: [
              // Mode 1v1
              {
                player1: { user: { id: userId } }
              },
              {
                player2: { user: { id: userId } }
              },
              // Mode équipe
              {
                team1: {
                  members: {
                    some: { user: { id: userId } }
                  }
                }
              },
              {
                team2: {
                  members: {
                    some: { user: { id: userId } }
                  }
                }
              }
            ]
          }
        ]
      },
      include: {
        player1: {
          include: {
            user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
          }
        },
        player2: {
          include: {
            user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
          }
        },
        team1: {
          include: {
            members: {
              include: {
                user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
              }
            }
          }
        },
        team2: {
          include: {
            members: {
              include: {
                user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
              }
            }
          }
        },
        disputes: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            reason: true,
            status: true,
            disputedBy: true,
            createdAt: true
          }
        },
        submissions: {
          select: {
            id: true,
            submittedBy: true,
            winnerId: true,
            score1: true,
            score2: true,
            isValidated: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: Number(limit),
      skip: offset
    });

    // Compter le total pour la pagination
    const total = await prisma.match.count({
      where: {
        AND: [
          {
            OR: [
              { status: 'COMPLETED' },
              { status: 'DISPUTED' },
              { status: 'CANCELLED' }
            ]
          },
          {
            OR: [
              { player1: { user: { id: userId } } },
              { player2: { user: { id: userId } } },
              { team1: { members: { some: { user: { id: userId } } } } },
              { team2: { members: { some: { user: { id: userId } } } } }
            ]
          }
        ]
      }
    });

    res.json({
      success: true,
      data: matches,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Erreur récupération matches terminés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Confirmer un résultat soumis par l'adversaire
 */
export const confirmMatchResult = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const userId = req.user!.userId;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        submissions: true,
        player1: { include: { user: true } },
        player2: { include: { user: true } },
        team1: { include: { members: { include: { user: true } } } },
        team2: { include: { members: { include: { user: true } } } }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match introuvable'
      });
    }

    // Vérifier que l'utilisateur fait partie du match
    let userCanConfirm = false;
    if (match.gameMode === '1v1') {
      userCanConfirm = match.player1?.user.id === userId || match.player2?.user.id === userId;
    } else {
      const isInTeam1 = match.team1?.members.some(m => m.user.id === userId) || false;
      const isInTeam2 = match.team2?.members.some(m => m.user.id === userId) || false;
      userCanConfirm = isInTeam1 || isInTeam2;
    }

    if (!userCanConfirm) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à confirmer ce match'
      });
    }

    if (match.status !== 'AWAITING_CONFIRMATION') {
      return res.status(409).json({
        success: false,
        message: 'Ce match n\'est pas en attente de confirmation'
      });
    }

    // Vérifier qu'il y a au moins une soumission
    if (match.submissions.length === 0) {
      return res.status(409).json({
        success: false,
        message: 'Aucun résultat n\'a été soumis pour ce match'
      });
    }

    // Prendre la première soumission comme résultat validé
    const submission = match.submissions[0];
    const now = new Date();

    // Marquer le match comme complété
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        winnerId: submission.winnerId,
        loserId: match.gameMode === '1v1' ? 
          (submission.winnerId === match.player1Id ? match.player2Id : match.player1Id) :
          (submission.winnerId === match.team1Id ? match.team2Id : match.team1Id),
        score1: submission.score1,
        score2: submission.score2,
        completedAt: now,
        validationDeadline: null
      }
    });

    // Mettre à jour les statistiques
    await updateMatchStatistics(matchId, submission.winnerId, match.gameMode);

    // Marquer la soumission comme validée
    await prisma.matchSubmission.update({
      where: { id: submission.id },
      data: { isValidated: true }
    });

    res.json({
      success: true,
      data: updatedMatch,
      message: 'Résultat confirmé avec succès'
    });

  } catch (error) {
    console.error('Erreur confirmation résultat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Annuler un match (avant qu'il commence)
 */
export const cancelMatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const userId = req.user!.userId;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        },
        player2: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        },
        challenge: true
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match introuvable'
      });
    }

    // Vérifier que l'utilisateur fait partie du match
    const isPlayer1 = match.player1?.user.id === userId;
    const isPlayer2 = match.player2?.user.id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à annuler ce match'
      });
    }

    // Vérifier que le match n'a pas encore commencé/terminé
    if (match.status !== 'IN_PROGRESS') {
      return res.status(409).json({
        success: false,
        message: 'Ce match ne peut plus être annulé'
      });
    }

    // Vérifier que le match n'est pas trop proche (moins d'1h)
    const now = new Date();
    const oneHourBeforeMatch = new Date(match.scheduledAt.getTime() - 60 * 60 * 1000);
    
    if (now > oneHourBeforeMatch) {
      return res.status(409).json({
        success: false,
        message: 'Vous ne pouvez plus annuler un match moins d\'1 heure avant l\'heure prévue'
      });
    }

    // Transaction pour annuler le match et remettre le challenge en PENDING
    await prisma.$transaction(async (tx) => {
      // Annuler le match
      await tx.match.update({
        where: { id: matchId },
        data: { status: 'CANCELLED' }
      });

      // Si le match avait un challenge associé, le remettre en PENDING
      if (match.challenge) {
        await tx.challenge.update({
          where: { id: match.challenge.id },
          data: {
            status: 'PENDING',
            acceptorId: null,
            matchId: null
          }
        });
      }
    });

    res.json({
      success: true,
      message: 'Match annulé avec succès'
    });

  } catch (error) {
    console.error('Erreur annulation match:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};