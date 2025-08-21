import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';

/**
 * Inviter un joueur dans une équipe
 */
export const invitePlayer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const { playerPseudo, message } = req.body;
    const inviterId = req.user!.userId;

    // Vérifier que l'équipe existe et que l'utilisateur en est le propriétaire
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: { id: true, pseudo: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, pseudo: true }
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

    if (team.ownerId !== inviterId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à inviter des joueurs dans cette équipe'
      });
    }

    // Trouver le joueur à inviter
    const playerToInvite = await prisma.user.findUnique({
      where: { pseudo: playerPseudo },
      select: { id: true, pseudo: true }
    });

    if (!playerToInvite) {
      return res.status(404).json({
        success: false,
        message: 'Joueur introuvable'
      });
    }

    // Vérifier que le joueur n'est pas déjà dans l'équipe
    const existingMember = team.members.find(member => member.userId === playerToInvite.id);
    if (existingMember || team.ownerId === playerToInvite.id) {
      return res.status(400).json({
        success: false,
        message: 'Ce joueur fait déjà partie de l\'équipe'
      });
    }

    // Vérifier que l'équipe n'est pas pleine
    const currentMemberCount = team.members.length + 1; // +1 pour le propriétaire
    if (currentMemberCount >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'L\'équipe est complète'
      });
    }

    // Vérifier que le joueur n'est pas déjà dans une équipe pour ce jeu et ce mode
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId: playerToInvite.id,
        team: {
          game: team.game,
          gameMode: team.gameMode
        }
      },
      include: {
        team: {
          select: { name: true, game: true, gameMode: true }
        }
      }
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: `Ce joueur est déjà membre de l'équipe "${existingMembership.team.name}" pour ${team.game} en mode ${team.gameMode}. Il ne peut être que dans une équipe par mode de jeu.`
      });
    }

    // Vérifier que le joueur n'est pas propriétaire d'une équipe pour ce jeu et ce mode
    const ownedTeam = await prisma.team.findFirst({
      where: {
        ownerId: playerToInvite.id,
        game: team.game,
        gameMode: team.gameMode
      },
      select: { name: true, game: true, gameMode: true }
    });

    if (ownedTeam) {
      return res.status(409).json({
        success: false,
        message: `Ce joueur est déjà propriétaire de l'équipe "${ownedTeam.name}" pour ${team.game} en mode ${team.gameMode}. Il ne peut être que dans une équipe par mode de jeu.`
      });
    }

    // Vérifier qu'il n'y a pas déjà une invitation en attente
    const existingInvitation = await prisma.message.findFirst({
      where: {
        receiverId: playerToInvite.id,
        type: 'TEAM_INVITATION',
        category: 'INVITATION',
        isRead: false,
        data: {
          path: ['teamId'],
          equals: teamId
        }
      }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'Une invitation est déjà en attente pour ce joueur'
      });
    }

    // Créer l'invitation
    const invitation = await prisma.message.create({
      data: {
        type: 'TEAM_INVITATION',
        category: 'INVITATION',
        title: `Invitation à rejoindre l'équipe ${team.name}`,
        content: message || `${team.owner.pseudo} vous invite à rejoindre l'équipe "${team.name}" (${team.game} - ${team.gameMode})`,
        senderId: inviterId,
        receiverId: playerToInvite.id,
        priority: 'HIGH',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        actions: [
          {
            id: 'accept',
            label: 'Accepter',
            type: 'success',
            payload: {
              action: 'accept_team_invitation',
              teamId: teamId
            }
          },
          {
            id: 'decline',
            label: 'Refuser',
            type: 'danger',
            payload: {
              action: 'decline_team_invitation',
              teamId: teamId
            }
          }
        ],
        data: {
          teamId: teamId,
          teamName: team.name,
          inviterId: inviterId,
          inviterPseudo: team.owner.pseudo
        }
      }
    });

    res.status(201).json({
      success: true,
      data: invitation,
      message: `Invitation envoyée à ${playerToInvite.pseudo}`
    });

  } catch (error) {
    console.error('Erreur invitation joueur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Accepter une invitation d'équipe
 */
export const acceptInvitation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.user!.userId;

    // Trouver l'invitation
    const invitation = await prisma.message.findFirst({
      where: {
        receiverId: userId,
        type: 'TEAM_INVITATION',
        category: 'INVITATION',
        isRead: false,
        data: {
          path: ['teamId'],
          equals: teamId
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation introuvable ou expirée'
      });
    }

    // Vérifier que l'équipe existe toujours
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe introuvable'
      });
    }

    // Vérifier que l'équipe n'est pas pleine
    const currentMemberCount = team.members.length + 1; // +1 pour le propriétaire
    if (currentMemberCount >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'L\'équipe est maintenant complète'
      });
    }

    // Vérifier que l'utilisateur n'est pas déjà dans une équipe pour ce jeu et ce mode
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId: userId,
        team: {
          game: team.game,
          gameMode: team.gameMode
        }
      },
      include: {
        team: {
          select: { name: true, game: true, gameMode: true }
        }
      }
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: `Vous êtes déjà membre de l'équipe "${existingMembership.team.name}" pour ${team.game} en mode ${team.gameMode}. Vous ne pouvez être que dans une équipe par mode de jeu.`
      });
    }

    // Vérifier que l'utilisateur n'est pas propriétaire d'une équipe pour ce jeu et ce mode
    const ownedTeam = await prisma.team.findFirst({
      where: {
        ownerId: userId,
        game: team.game,
        gameMode: team.gameMode
      },
      select: { name: true, game: true, gameMode: true }
    });

    if (ownedTeam) {
      return res.status(409).json({
        success: false,
        message: `Vous êtes déjà propriétaire de l'équipe "${ownedTeam.name}" pour ${team.game} en mode ${team.gameMode}. Vous ne pouvez être que dans une équipe par mode de jeu.`
      });
    }

    // Ajouter le membre à l'équipe
    const newMember = await prisma.teamMember.create({
      data: {
        teamId: teamId,
        userId: userId,
        role: 'MEMBER'
      },
      include: {
        user: {
          select: { id: true, pseudo: true, avatar: true, discordAvatar: true }
        },
        team: {
          select: { id: true, name: true }
        }
      }
    });

    // Marquer l'invitation comme lue
    await prisma.message.update({
      where: { id: invitation.id },
      data: { isRead: true }
    });

    res.json({
      success: true,
      data: newMember,
      message: `Vous avez rejoint l'équipe ${team.name}`
    });

  } catch (error) {
    console.error('Erreur acceptation invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Refuser une invitation d'équipe
 */
export const declineInvitation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.user!.userId;

    // Trouver et marquer l'invitation comme lue
    const invitation = await prisma.message.findFirst({
      where: {
        receiverId: userId,
        type: 'TEAM_INVITATION',
        category: 'INVITATION',
        isRead: false,
        data: {
          path: ['teamId'],
          equals: teamId
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation introuvable'
      });
    }

    await prisma.message.update({
      where: { id: invitation.id },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Invitation refusée'
    });

  } catch (error) {
    console.error('Erreur refus invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer les invitations en attente pour une équipe
 */
export const getTeamInvitations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.user!.userId;

    // Vérifier que l'utilisateur est propriétaire de l'équipe
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team || team.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    // Récupérer les invitations en attente
    const invitations = await prisma.message.findMany({
      where: {
        type: 'TEAM_INVITATION',
        category: 'INVITATION',
        isRead: false,
        data: {
          path: ['teamId'],
          equals: teamId
        }
      },
      include: {
        receiver: {
          select: { id: true, pseudo: true, avatar: true, discordAvatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: invitations
    });

  } catch (error) {
    console.error('Erreur récupération invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};