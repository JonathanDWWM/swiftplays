import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../types/auth';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * GET /api/teams/my
 * Récupérer les équipes de l'utilisateur connecté
 */
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: userId
      },
      include: {
        team: {
          include: {
            creator: {
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
            },
            _count: {
              select: {
                members: true
              }
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    const teams = teamMemberships.map(membership => ({
      id: membership.team.id,
      name: membership.team.name,
      shortName: membership.team.shortName,
      avatar: membership.team.avatar,
      game: membership.team.game,
      gameMode: membership.team.gameMode,
      memberCount: membership.team._count.members,
      myRole: membership.role,
      creator: membership.team.creator,
      members: membership.team.members.map(member => ({
        id: member.user.id,
        pseudo: member.user.pseudo,
        avatar: member.user.avatar || member.user.discordAvatar,
        role: member.role,
        joinedAt: member.joinedAt
      })),
      createdAt: membership.team.createdAt,
      joinedAt: membership.joinedAt
    }));

    res.json({
      success: true,
      data: {
        teams: teams,
        total: teams.length
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération équipes:', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({
      success: false,
      message: 'Erreur de chargement, impossible de charger vos équipes',
      ...(process.env.NODE_ENV === 'development' && { 
        debug: { 
          error: error.message,
          code: error.code 
        }
      })
    });
  }
});

/**
 * POST /api/teams
 * Créer une nouvelle équipe
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { name, shortName, avatar, game, gameMode } = req.body;

    // Validation
    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de l\'équipe doit contenir au moins 3 caractères'
      });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de l\'équipe ne peut pas dépasser 50 caractères'
      });
    }

    if (!shortName || shortName.trim().length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Le nom court est requis et ne peut pas dépasser 3 caractères'
      });
    }

    if (!game || game.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le jeu est requis'
      });
    }

    if (!gameMode || gameMode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le mode de jeu est requis'
      });
    }

    // Vérifier si le nom et nom court sont déjà pris
    const [existingTeamByName, existingTeamByShortName] = await Promise.all([
      prisma.team.findUnique({ where: { name: name.trim() } }),
      prisma.team.findUnique({ where: { shortName: shortName.trim().toUpperCase() } })
    ]);

    if (existingTeamByName) {
      return res.status(400).json({
        success: false,
        message: 'Ce nom d\'équipe est déjà pris'
      });
    }

    if (existingTeamByShortName) {
      return res.status(400).json({
        success: false,
        message: 'Ce nom court est déjà pris'
      });
    }

    // Créer l'équipe et ajouter le créateur comme capitaine
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        shortName: shortName.trim().toUpperCase(),
        avatar: avatar || null,
        game: game.trim(),
        gameMode: gameMode.trim(),
        creatorId: userId,
        members: {
          create: {
            userId: userId,
            role: 'CAPTAIN'
          }
        }
      },
      include: {
        creator: {
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
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        team: {
          id: team.id,
          name: team.name,
          shortName: team.shortName,
          avatar: team.avatar,
          game: team.game,
          gameMode: team.gameMode,
          memberCount: team._count.members,
          myRole: 'CAPTAIN',
          creator: team.creator,
          members: team.members.map(member => ({
            id: member.user.id,
            pseudo: member.user.pseudo,
            avatar: member.user.avatar || member.user.discordAvatar,
            role: member.role,
            joinedAt: member.joinedAt
          })),
          createdAt: team.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur création équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/teams/:id
 * Récupérer les détails d'une équipe
 */
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        creator: {
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
                firstName: true,
                lastName: true,
                avatar: true,
                discordAvatar: true
              }
            }
          },
          orderBy: [
            { role: 'desc' }, // CAPTAIN avant MEMBER
            { joinedAt: 'asc' }
          ]
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe non trouvée'
      });
    }

    // Vérifier si l'utilisateur a accès à cette équipe
    const userMembership = team.members.find(member => member.userId === userId);
    
    if (!userMembership) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé, vous devez faire partie de l\'équipe'
      });
    }

    res.json({
      success: true,
      data: {
        team: {
          id: team.id,
          name: team.name,
          avatar: team.avatar,
          memberCount: team._count.members,
          myRole: userMembership?.role || null,
          creator: team.creator,
          members: team.members.map(member => ({
            id: member.user.id,
            pseudo: member.user.pseudo,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            avatar: member.user.avatar || member.user.discordAvatar,
            role: member.role,
            joinedAt: member.joinedAt
          })),
          createdAt: team.createdAt,
          updatedAt: team.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * PUT /api/teams/:id
 * Modifier une équipe (seulement le créateur/capitaine)
 */
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { name, shortName, avatar, game, gameMode } = req.body;

    // Vérifier que l'équipe existe et que l'utilisateur est capitaine
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: userId }
        }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe non trouvée'
      });
    }

    const userMembership = team.members[0];
    if (!userMembership || userMembership.role !== 'CAPTAIN') {
      return res.status(403).json({
        success: false,
        message: 'Seul le capitaine peut modifier l\'équipe'
      });
    }

    // Validation similaire à la création
    const updateData: any = {};
    
    if (name !== undefined) {
      if (!name || name.trim().length < 3 || name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Le nom doit contenir entre 3 et 50 caractères'
        });
      }
      
      if (name.trim() !== team.name) {
        const existingTeam = await prisma.team.findUnique({
          where: { name: name.trim() }
        });
        if (existingTeam) {
          return res.status(400).json({
            success: false,
            message: 'Ce nom d\'équipe est déjà pris'
          });
        }
      }
      updateData.name = name.trim();
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar || null;
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
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
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        team: {
          id: updatedTeam.id,
          name: updatedTeam.name,
          avatar: updatedTeam.avatar,
          memberCount: updatedTeam._count.members,
          myRole: 'CAPTAIN',
          creator: updatedTeam.creator,
          members: updatedTeam.members.map(member => ({
            id: member.user.id,
            pseudo: member.user.pseudo,
            avatar: member.user.avatar || member.user.discordAvatar,
            role: member.role,
            joinedAt: member.joinedAt
          })),
          createdAt: updatedTeam.createdAt,
          updatedAt: updatedTeam.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur modification équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/teams/:id/invite
 * Inviter un membre dans une équipe
 */
router.post('/:id/invite', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: teamId } = req.params;
    const userId = req.user!.userId;
    const { pseudo, message } = req.body;

    if (!pseudo) {
      return res.status(400).json({
        success: false,
        message: 'Le pseudo de l\'utilisateur à inviter est requis'
      });
    }

    // Vérifier que l'équipe existe et que l'utilisateur est capitaine
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        _count: { select: { members: true } }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe non trouvée'
      });
    }

    const userMembership = team.members.find(member => member.userId === userId);
    if (!userMembership || userMembership.role !== 'CAPTAIN') {
      return res.status(403).json({
        success: false,
        message: 'Seul le capitaine peut inviter des membres'
      });
    }


    // Trouver l'utilisateur à inviter
    const targetUser = await prisma.user.findUnique({
      where: { pseudo: pseudo.trim() }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier que l'utilisateur n'est pas déjà dans l'équipe
    const existingMember = team.members.find(member => member.userId === targetUser.id);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur fait déjà partie de l\'équipe'
      });
    }

    // Vérifier s'il n'y a pas déjà une invitation en attente
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: {
        receiverId_teamId: {
          receiverId: targetUser.id,
          teamId: teamId
        }
      }
    });

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Une invitation est déjà en attente pour cet utilisateur'
      });
    }

    // Créer ou mettre à jour l'invitation
    const invitation = await prisma.teamInvitation.upsert({
      where: {
        receiverId_teamId: {
          receiverId: targetUser.id,
          teamId: teamId
        }
      },
      update: {
        status: 'PENDING',
        message: message || null,
        senderId: userId,
        respondedAt: null
      },
      create: {
        senderId: userId,
        receiverId: targetUser.id,
        teamId: teamId,
        message: message || null
      },
      include: {
        sender: {
          select: {
            pseudo: true,
            avatar: true,
            discordAvatar: true
          }
        },
        team: {
          select: {
            name: true,
            avatar: true
          }
        }
      }
    });

    // Créer une notification pour le destinataire
    try {
      await NotificationService.createTeamInvitationNotification(
        targetUser.id,
        req.user!.pseudo,
        invitation.team.name,
        teamId,
        invitation.id
      );
    } catch (error) {
      console.error('Erreur création notification:', error);
      // Ne pas faire échouer la requête si la notification échoue
    }

    res.status(201).json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          message: invitation.message,
          createdAt: invitation.createdAt,
          sender: invitation.sender,
          team: invitation.team
        }
      }
    });

  } catch (error) {
    console.error('Erreur invitation équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/teams/invitations/received
 * Récupérer les invitations reçues par l'utilisateur
 */
router.get('/invitations/received', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            pseudo: true,
            avatar: true,
            discordAvatar: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            avatar: true,
            _count: {
              select: { members: true }
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
      data: {
        invitations: invitations.map(invitation => ({
          id: invitation.id,
          message: invitation.message,
          createdAt: invitation.createdAt,
          sender: invitation.sender,
          team: {
            ...invitation.team,
            memberCount: invitation.team._count.members
          }
        })),
        total: invitations.length
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération invitations:', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({
      success: false,
      message: 'Erreur de chargement, impossible de charger vos invitations',
      ...(process.env.NODE_ENV === 'development' && { 
        debug: { 
          error: error.message,
          code: error.code 
        }
      })
    });
  }
});

/**
 * POST /api/teams/invitations/:id/respond
 * Répondre à une invitation d'équipe
 */
router.post('/invitations/:id/respond', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: invitationId } = req.params;
    const userId = req.user!.userId;
    const { response } = req.body; // 'ACCEPTED' ou 'DECLINED'

    if (!['ACCEPTED', 'DECLINED'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Réponse invalide. Utilisez ACCEPTED ou DECLINED'
      });
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            _count: { select: { members: true } }
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation non trouvée'
      });
    }

    if (invitation.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas répondre à cette invitation'
      });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cette invitation a déjà reçu une réponse'
      });
    }

    // Si accepté, vérifier les contraintes
    if (response === 'ACCEPTED') {

      // Vérifier que l'utilisateur n'est pas déjà membre
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: userId,
            teamId: invitation.teamId
          }
        }
      });

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'Vous faites déjà partie de cette équipe'
        });
      }
    }

    // Transaction pour mettre à jour l'invitation et créer le membre si accepté
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'invitation
      const updatedInvitation = await tx.teamInvitation.update({
        where: { id: invitationId },
        data: {
          status: response,
          respondedAt: new Date()
        }
      });

      let member = null;
      if (response === 'ACCEPTED') {
        // Ajouter le membre à l'équipe
        member = await tx.teamMember.create({
          data: {
            userId: userId,
            teamId: invitation.teamId,
            role: 'MEMBER'
          }
        });
      }

      return { invitation: updatedInvitation, member };
    });

    // Créer des notifications
    try {
      if (response === 'ACCEPTED') {
        // Notifier le capitaine qu'un nouveau membre a rejoint
        await NotificationService.createTeamInvitationAcceptedNotification(
          invitation.senderId,
          req.user!.pseudo,
          invitation.team.name,
          invitation.teamId
        );

        await NotificationService.createTeamMemberJoinedNotification(
          invitation.team.creatorId,
          req.user!.pseudo,
          invitation.team.name,
          invitation.teamId
        );
      } else {
        // Notifier l'expéditeur que l'invitation a été refusée
        await NotificationService.createTeamInvitationDeclinedNotification(
          invitation.senderId,
          req.user!.pseudo,
          invitation.team.name,
          invitation.teamId
        );
      }

      // Supprimer la notification d'invitation originale
      await NotificationService.deleteInvitationNotifications(invitationId);
    } catch (error) {
      console.error('Erreur création notifications:', error);
      // Ne pas faire échouer la requête
    }

    res.json({
      success: true,
      data: {
        response: response,
        message: response === 'ACCEPTED' ? 'Invitation acceptée ! Bienvenue dans l\'équipe.' : 'Invitation déclinée.'
      }
    });

  } catch (error) {
    console.error('Erreur réponse invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * DELETE /api/teams/:id/members/:memberId
 * Retirer un membre d'une équipe (capitaine seulement)
 */
router.delete('/:id/members/:memberId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: teamId, memberId } = req.params;
    const userId = req.user!.userId;

    // Vérifier que l'équipe existe et que l'utilisateur est capitaine
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe non trouvée'
      });
    }

    const userMembership = team.members.find(member => member.userId === userId);
    if (!userMembership || userMembership.role !== 'CAPTAIN') {
      return res.status(403).json({
        success: false,
        message: 'Seul le capitaine peut retirer des membres'
      });
    }

    // Vérifier que le membre à retirer existe
    const memberToRemove = team.members.find(member => member.id === memberId);
    if (!memberToRemove) {
      return res.status(404).json({
        success: false,
        message: 'Membre non trouvé dans cette équipe'
      });
    }

    // Ne pas permettre au capitaine de se retirer lui-même
    if (memberToRemove.userId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Le capitaine ne peut pas se retirer de l\'équipe. Transférez d\'abord le rôle de capitaine.'
      });
    }

    // Supprimer le membre
    await prisma.teamMember.delete({
      where: { id: memberId }
    });

    res.json({
      success: true,
      data: {
        message: 'Membre retiré de l\'équipe avec succès'
      }
    });

  } catch (error) {
    console.error('Erreur suppression membre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * DELETE /api/teams/:id
 * Dissoudre une équipe (créateur seulement)
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: teamId } = req.params;
    const userId = req.user!.userId;

    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe non trouvée'
      });
    }

    if (team.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Seul le créateur de l\'équipe peut la dissoudre'
      });
    }

    // Supprimer l'équipe (cascade supprimera les membres et invitations)
    await prisma.team.delete({
      where: { id: teamId }
    });

    res.json({
      success: true,
      data: {
        message: 'Équipe dissoute avec succès'
      }
    });

  } catch (error) {
    console.error('Erreur dissolution équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/teams/:id/leave
 * Quitter une équipe (membres seulement, pas le capitaine)
 */
router.post('/:id/leave', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: teamId } = req.params;
    const userId = req.user!.userId;

    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: teamId
        }
      }
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Vous ne faites pas partie de cette équipe'
      });
    }

    if (membership.role === 'CAPTAIN') {
      return res.status(400).json({
        success: false,
        message: 'Le capitaine ne peut pas quitter l\'équipe. Transférez d\'abord le rôle de capitaine ou dissolvez l\'équipe.'
      });
    }

    // Supprimer le membre
    await prisma.teamMember.delete({
      where: { id: membership.id }
    });

    res.json({
      success: true,
      data: {
        message: 'Vous avez quitté l\'équipe avec succès'
      }
    });

  } catch (error) {
    console.error('Erreur quitter équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router;