import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';
import { CreateTeamData, UpdateTeamData } from '../types/team';
import { Game, MessageType, MessageCategory, Priority } from '@prisma/client';
import { notificationService } from '../services/notificationService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuration des jeux et modes (1v1 désactivé pour les équipes)
const GAME_MODES = {
  FC_26: ['2v2', '5v5'],
  CALL_OF_DUTY_BO7: ['2v2', '4v4']
};

const GAME_MAX_MEMBERS = {
  FC_26: {
    '2v2': 2,
    '5v5': 5
  },
  CALL_OF_DUTY_BO7: {
    '2v2': 2,
    '4v4': 4
  }
};

/**
 * Calculer maxMembers basé sur le jeu et le mode
 */
const getMaxMembersForGameMode = (game: Game, gameMode: string): number => {
  const gameModes = GAME_MAX_MEMBERS[game as keyof typeof GAME_MAX_MEMBERS];
  if (gameModes && typeof gameModes === 'object') {
    return gameModes[gameMode as keyof typeof gameModes] || 1;
  }
  return 1;
};

/**
 * Générer un nom court aléatoire unique
 */
const generateRandomShortName = async (): Promise<string> => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shortName = '';
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    shortName = '';
    for (let i = 0; i < 3; i++) {
      shortName += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const existing = await prisma.team.findUnique({
      where: { shortName }
    });
    
    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    throw new Error('Impossible de générer un nom court unique');
  }
  
  return shortName;
};

// Configuration multer pour l'upload d'avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/team-avatars');
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique avec timestamp
    const uniqueName = `team-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accepter seulement les images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers image sont autorisés'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

/**
 * Créer une nouvelle équipe
 */
export const createTeam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, shortName, game, gameMode } = req.body;
    const userId = req.user!.userId;
    const avatarFile = req.file;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de l\'équipe est requis'
      });
    }

    if (!game || !gameMode) {
      return res.status(400).json({
        success: false,
        message: 'Le jeu et le mode de jeu sont requis'
      });
    }

    // Vérifier que le jeu est valide
    if (!Object.keys(GAME_MODES).includes(game)) {
      return res.status(400).json({
        success: false,
        message: 'Jeu invalide'
      });
    }

    // Vérifier que le mode de jeu est valide pour ce jeu
    if (!GAME_MODES[game as keyof typeof GAME_MODES].includes(gameMode)) {
      return res.status(400).json({
        success: false,
        message: 'Mode de jeu invalide pour ce jeu'
      });
    }

    // Vérifier si le nom d'équipe existe déjà
    const existingTeam = await prisma.team.findUnique({
      where: { name: name.trim() }
    });

    if (existingTeam) {
      return res.status(409).json({
        success: false,
        message: 'Ce nom d\'équipe est déjà pris'
      });
    }

    // Vérifier si l'utilisateur a déjà une équipe pour ce jeu et ce mode (en tant que propriétaire OU membre)
    const existingGameModeTeam = await prisma.team.findFirst({
      where: {
        AND: [
          { game: game as Game },
          { gameMode: gameMode },
          {
            OR: [
              { ownerId: userId }, // Utilisateur est propriétaire
              { 
                members: {
                  some: {
                    userId: userId
                  }
                }
              } // Utilisateur est membre
            ]
          }
        ]
      },
      include: {
        owner: { select: { pseudo: true } },
        members: {
          where: { userId: userId },
          select: { role: true }
        }
      }
    });

    if (existingGameModeTeam) {
      const isOwner = existingGameModeTeam.ownerId === userId;
      const memberRole = existingGameModeTeam.members[0]?.role;
      
      let roleText = '';
      if (isOwner) {
        roleText = 'capitaine';
      } else if (memberRole === 'CO_CAPTAIN') {
        roleText = 'vice-capitaine';
      } else {
        roleText = 'membre';
      }

      return res.status(409).json({
        success: false,
        message: `Vous faites déjà partie d'une équipe pour ${game} en mode ${gameMode} en tant que ${roleText}. Vous ne pouvez faire partie que d'une seule équipe par mode de jeu.`
      });
    }

    // Générer ou valider le nom court
    let finalShortName = shortName;
    if (!finalShortName) {
      finalShortName = await generateRandomShortName();
    } else {
      if (finalShortName.length !== 3) {
        return res.status(400).json({
          success: false,
          message: 'Le nom court doit faire exactement 3 caractères'
        });
      }
      
      const existingShortName = await prisma.team.findUnique({
        where: { shortName: finalShortName.toUpperCase() }
      });
      
      if (existingShortName) {
        return res.status(409).json({
          success: false,
          message: 'Ce nom court est déjà pris'
        });
      }
    }

    // Calculer maxMembers basé sur le jeu et mode
    const maxMembers = getMaxMembersForGameMode(game as Game, gameMode);

    // Construire l'URL de l'avatar si un fichier a été uploadé
    let avatarUrl = null;
    if (avatarFile) {
      avatarUrl = `/uploads/team-avatars/${avatarFile.filename}`;
    }

    // Créer l'équipe
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        shortName: finalShortName.toUpperCase(),
        avatar: avatarUrl,
        game: game as Game,
        gameMode,
        maxMembers,
        ownerId: userId
      },
      include: {
        owner: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            discordAvatar: true
          }
        }
      }
    });

    // Créer notification première équipe si c'est la première équipe de l'utilisateur
    try {
      const userTeamCount = await prisma.team.count({
        where: { ownerId: userId }
      });
      
      if (userTeamCount === 1) { // C'est sa première équipe
        await notificationService.createNotification(userId, {
          type: MessageType.FIRST_TEAM_CREATED,
          category: MessageCategory.ACHIEVEMENT,
          title: '🏆 Première équipe créée !',
          content: `Félicitations ! Vous venez de créer votre première équipe "${team.name}" pour ${game} ${gameMode}. Vous pouvez maintenant recruter des joueurs et participer aux défis d'équipe !`,
          priority: Priority.HIGH,
          data: {
            teamId: team.id,
            teamName: team.name,
            game: team.game,
            gameMode: team.gameMode,
            achievement: 'first_team',
            url: `/equipe/${team.id}`
          }
        });
      }
    } catch (error) {
      console.error('Erreur notification première équipe:', error);
    }

    res.status(201).json({
      success: true,
      data: team,
      message: 'Équipe créée avec succès'
    });

  } catch (error) {
    console.error('Erreur création équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer toutes les équipes de l'utilisateur connecté
 */
export const getMyTeams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          {
            ownerId: userId
          },
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        description: true,
        avatar: true, // Avatar de l'équipe
        game: true,
        gameMode: true,
        maxMembers: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            discordAvatar: true
          }
        },
        members: {
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
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: teams
    });

  } catch (error) {
    console.error('Erreur récupération équipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer une équipe par son ID
 */
export const getTeamById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            discordAvatar: true
          }
        },
        members: {
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
            { role: 'asc' }, // CO_CAPTAIN avant MEMBER avant SUBSTITUTE
            { joinedAt: 'asc' } // Plus anciens en premier
          ]
        }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe introuvable'
      });
    }

    res.json({
      success: true,
      data: team
    });

  } catch (error) {
    console.error('Erreur récupération équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Mettre à jour une équipe
 */
export const updateTeam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, shortName, game, gameMode } = req.body;
    const userId = req.user!.userId;
    const avatarFile = req.file;

    // Vérifier si l'équipe existe
    const existingTeam = await prisma.team.findUnique({
      where: { id }
    });

    if (!existingTeam) {
      return res.status(404).json({
        success: false,
        message: 'Équipe introuvable'
      });
    }

    // Vérifier si l'utilisateur est propriétaire
    if (existingTeam.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette équipe'
      });
    }

    // Vérifier l'unicité du nom si il est modifié
    if (name && name.trim() !== existingTeam.name) {
      const nameExists = await prisma.team.findUnique({
        where: { name: name.trim() }
      });

      if (nameExists) {
        return res.status(409).json({
          success: false,
          message: 'Ce nom d\'équipe est déjà pris'
        });
      }
    }

    // Vérifier l'unicité du nom court si il est modifié
    if (shortName && shortName.toUpperCase() !== existingTeam.shortName) {
      if (shortName.length !== 3) {
        return res.status(400).json({
          success: false,
          message: 'Le nom court doit faire exactement 3 caractères'
        });
      }
      
      const shortNameExists = await prisma.team.findUnique({
        where: { shortName: shortName.toUpperCase() }
      });

      if (shortNameExists) {
        return res.status(409).json({
          success: false,
          message: 'Ce nom court est déjà pris'
        });
      }
    }

    // Calculer maxMembers si le jeu ou mode change
    let maxMembers = existingTeam.maxMembers;
    if ((game && game !== existingTeam.game) || (gameMode && gameMode !== existingTeam.gameMode)) {
      const finalGame = game || existingTeam.game;
      const finalGameMode = gameMode || existingTeam.gameMode;
      maxMembers = getMaxMembersForGameMode(finalGame as Game, finalGameMode);
    }

    // Gestion du nouvel avatar
    let updateData: any = {
      ...(name && { name: name.trim() }),
      ...(shortName && { shortName: shortName.toUpperCase() }),
      ...(game && { game: game as Game }),
      ...(gameMode && { gameMode }),
      ...((game || gameMode) && { maxMembers })
    };

    // Si un nouveau fichier avatar est uploadé
    if (avatarFile) {
      const newAvatarUrl = `/uploads/team-avatars/${avatarFile.filename}`;
      updateData.avatar = newAvatarUrl;
      
      // Supprimer l'ancien avatar s'il existe
      if (existingTeam.avatar) {
        const oldAvatarPath = path.join(__dirname, '../../', existingTeam.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
    }

    // Mettre à jour l'équipe
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            discordAvatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedTeam,
      message: 'Équipe mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur mise à jour équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Supprimer une équipe
 */
export const deleteTeam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Vérifier si l'équipe existe
    const existingTeam = await prisma.team.findUnique({
      where: { id }
    });

    if (!existingTeam) {
      return res.status(404).json({
        success: false,
        message: 'Équipe introuvable'
      });
    }

    // Vérifier si l'utilisateur est propriétaire
    if (existingTeam.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer cette équipe'
      });
    }

    // Supprimer l'avatar s'il existe
    if (existingTeam.avatar) {
      const avatarPath = path.join(__dirname, '../../', existingTeam.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Supprimer l'équipe
    await prisma.team.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Équipe supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Mettre à jour le rôle d'un membre de l'équipe
 */
export const updateMemberRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user!.userId;

    // Vérifier si l'équipe existe et récupérer les membres
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe introuvable'
      });
    }

    // Vérifier si l'utilisateur a les droits (propriétaire ou vice-capitaine)
    const currentUserMember = team.members.find(m => m.userId === userId);
    if (team.ownerId !== userId && (!currentUserMember || currentUserMember.role !== 'CO_CAPTAIN')) {
      return res.status(403).json({
        success: false,
        message: 'Seuls le propriétaire et les vice-capitaines peuvent modifier les rôles des membres'
      });
    }

    // Vérifier si le rôle est valide
    const validRoles = ['MEMBER', 'CO_CAPTAIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide. Les rôles autorisés sont : MEMBER, CO_CAPTAIN'
      });
    }

    // Vérifier si le membre existe dans l'équipe
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: memberId
        }
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Membre introuvable dans cette équipe'
      });
    }

    // Ne pas permettre de modifier le rôle du propriétaire
    if (memberId === team.ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier le rôle du propriétaire'
      });
    }

    // Un vice-capitaine ne peut pas modifier le rôle d'un capitaine
    if (currentUserMember?.role === 'CO_CAPTAIN' && member.role === 'CAPTAIN') {
      return res.status(403).json({
        success: false,
        message: 'Un vice-capitaine ne peut pas modifier le rôle d\'un capitaine'
      });
    }

    // Mettre à jour le rôle du membre
    const updatedMember = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: memberId
        }
      },
      data: {
        role: role as any
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

    res.json({
      success: true,
      data: updatedMember,
      message: 'Rôle mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur mise à jour rôle membre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Exclure un membre de l'équipe
 */
export const kickMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId, memberId } = req.params;
    const userId = req.user!.userId;

    // Vérifier si l'équipe existe et récupérer les membres
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe introuvable'
      });
    }

    // Vérifier les permissions de l'utilisateur
    const isOwner = team.ownerId === userId;
    const currentUserMember = team.members.find(m => m.userId === userId);
    const isCoCaptain = currentUserMember?.role === 'CO_CAPTAIN';

    if (!isOwner && !isCoCaptain) {
      return res.status(403).json({
        success: false,
        message: 'Seuls le propriétaire et les vice-capitaines peuvent exclure des membres'
      });
    }

    // Ne pas permettre d'exclure le propriétaire lui-même
    if (memberId === team.ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Le propriétaire ne peut pas être exclu de sa propre équipe'
      });
    }

    // Vérifier si le membre existe dans l'équipe
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: memberId
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

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Membre introuvable dans cette équipe'
      });
    }

    // Si l'utilisateur est vice-capitaine, il ne peut pas exclure un capitaine
    if (isCoCaptain && !isOwner) {
      if (member.role === 'CAPTAIN') {
        return res.status(403).json({
          success: false,
          message: 'Un vice-capitaine ne peut pas exclure un capitaine'
        });
      }
    }

    // Supprimer le membre de l'équipe
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: memberId
        }
      }
    });

    res.json({
      success: true,
      message: `${member.user.pseudo} a été exclu de l'équipe avec succès`
    });

  } catch (error) {
    console.error('Erreur exclusion membre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};