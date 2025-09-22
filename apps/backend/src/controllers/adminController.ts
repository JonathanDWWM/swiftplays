import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';
import { AdminActionType, SanctionType, Role } from '@prisma/client';
import { notificationService } from '../services/notificationService';

/**
 * Middleware pour vérifier les permissions d'admin/modérateur
 */
export const requireAdminRole = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (!req.user || !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Permissions administrateur requises.'
    });
  }
  next();
};

/**
 * Middleware pour vérifier les permissions d'admin uniquement
 */
export const requireAdminOnly = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Permissions administrateur requises.'
    });
  }
  next();
};

/**
 * Obtenir les statistiques du dashboard admin
 */
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Statistiques utilisateurs
    const totalUsers = await prisma.user.count();
    const newUsersToday = await prisma.user.count({
      where: { createdAt: { gte: yesterday } }
    });
    const bannedUsers = await prisma.userSanction.count({
      where: { 
        type: { in: ['PERMANENT_BAN', 'TEMPORARY_BAN'] },
        isActive: true
      }
    });

    // Statistiques équipes
    const totalTeams = await prisma.team.count();
    const newTeamsThisWeek = await prisma.team.count({
      where: { createdAt: { gte: lastWeek } }
    });

    // Statistiques activité
    const activeChallenges = await prisma.challenge.count({
      where: { status: 'PENDING' }
    });
    const activeMatches = await prisma.match.count({
      where: { status: { in: ['IN_PROGRESS', 'AWAITING_RESULTS'] } }
    });

    // Actions admin récentes
    const recentAdminActions = await prisma.adminAction.count({
      where: { createdAt: { gte: yesterday } }
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          banned: bannedUsers
        },
        teams: {
          total: totalTeams,
          newThisWeek: newTeamsThisWeek
        },
        activity: {
          activeChallenges,
          activeMatches
        },
        moderation: {
          recentActions: recentAdminActions
        }
      }
    });
  } catch (error) {
    console.error('Erreur récupération stats admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer la liste des utilisateurs avec filtres et pagination
 */
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '', 
      banned = '' 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    // Construction des filtres
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { pseudo: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (role && role !== 'ALL') {
      whereClause.role = role;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        sanctionsReceived: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        ownedTeams: {
          select: { id: true, name: true }
        },
        teamMemberships: {
          include: { team: { select: { name: true } } }
        },
        _count: {
          select: { 
            adminActionsReceived: true,
            sanctionsReceived: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    const total = await prisma.user.count({ where: whereClause });

    // Filtrer par statut de ban si demandé
    let filteredUsers = users;
    if (banned === 'true') {
      filteredUsers = users.filter(user => 
        user.sanctionsReceived.some(s => 
          s.isActive && ['PERMANENT_BAN', 'TEMPORARY_BAN'].includes(s.type)
        )
      );
    } else if (banned === 'false') {
      filteredUsers = users.filter(user => 
        !user.sanctionsReceived.some(s => 
          s.isActive && ['PERMANENT_BAN', 'TEMPORARY_BAN'].includes(s.type)
        )
      );
    }

    res.json({
      success: true,
      data: filteredUsers.map(user => ({
        ...user,
        password: undefined, // Ne jamais renvoyer le mot de passe
        isBanned: user.sanctionsReceived.some(s => 
          s.isActive && ['PERMANENT_BAN', 'TEMPORARY_BAN'].includes(s.type)
        ),
        activeSanctions: user.sanctionsReceived.filter(s => s.isActive)
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Appliquer une sanction à un utilisateur
 */
export const sanctionUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { type, reason, duration } = req.body;
    const adminId = req.user!.userId;

    // Vérifications
    if (!userId || !type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'UserId, type et raison sont requis'
      });
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Empêcher les modérateurs de sanctionner les admins
    if (req.user!.role === 'MODERATOR' && targetUser.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas sanctionner un administrateur'
      });
    }

    // Calculer la date d'expiration si durée spécifiée
    let expiresAt: Date | null = null;
    if (duration && type !== SanctionType.PERMANENT_BAN) {
      expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    }

    // Transaction pour créer la sanction et logger l'action
    const result = await prisma.$transaction(async (tx) => {
      // Désactiver les sanctions actives du même type
      await tx.userSanction.updateMany({
        where: {
          userId,
          type,
          isActive: true
        },
        data: { isActive: false }
      });

      // Créer la nouvelle sanction
      const sanction = await tx.userSanction.create({
        data: {
          type,
          reason,
          duration,
          expiresAt,
          userId,
          adminUserId: adminId
        },
        include: {
          user: { select: { pseudo: true, email: true } },
          adminUser: { select: { pseudo: true } }
        }
      });

      // Logger l'action admin
      await tx.adminAction.create({
        data: {
          type: type === SanctionType.PERMANENT_BAN ? AdminActionType.USER_BAN : AdminActionType.USER_WARN,
          description: `${type}: ${reason}`,
          targetUserId: userId,
          adminUserId: adminId,
          metadata: { sanctionType: type, duration, reason }
        }
      });

      return sanction;
    });

    // Envoyer notification à l'utilisateur sanctionné
    try {
      let notificationTitle = 'Sanction appliquée';
      let notificationContent = `Vous avez reçu une sanction : ${reason}`;
      
      switch (type) {
        case SanctionType.WARNING:
          notificationTitle = '⚠️ Avertissement reçu';
          break;
        case SanctionType.TEMPORARY_BAN:
          notificationTitle = '🚫 Bannissement temporaire';
          notificationContent = `Vous êtes banni temporairement pour ${duration}h. Raison : ${reason}`;
          break;
        case SanctionType.PERMANENT_BAN:
          notificationTitle = '🚫 Bannissement permanent';
          notificationContent = `Votre compte a été banni définitivement. Raison : ${reason}`;
          break;
        case SanctionType.CHAT_MUTE:
          notificationTitle = '🔇 Chat restreint';
          notificationContent = `Votre accès au chat est restreint pour ${duration}h. Raison : ${reason}`;
          break;
      }

      await notificationService.createNotification(userId, {
        type: 'SYSTEM_UPDATE' as any,
        category: 'SYSTEM' as any,
        title: notificationTitle,
        content: notificationContent,
        priority: 'HIGH' as any,
        data: {
          sanctionType: type,
          reason,
          duration,
          expiresAt
        }
      });
    } catch (notifError) {
      console.error('Erreur notification sanction:', notifError);
    }

    res.json({
      success: true,
      data: result,
      message: `Sanction appliquée avec succès à ${targetUser.pseudo}`
    });
  } catch (error) {
    console.error('Erreur application sanction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Lever une sanction d'un utilisateur
 */
export const removeSanction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sanctionId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.userId;

    // Récupérer la sanction
    const sanction = await prisma.userSanction.findUnique({
      where: { id: sanctionId },
      include: { user: { select: { pseudo: true } } }
    });

    if (!sanction) {
      return res.status(404).json({
        success: false,
        message: 'Sanction introuvable'
      });
    }

    if (!sanction.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cette sanction n\'est plus active'
      });
    }

    // Transaction pour désactiver la sanction et logger l'action
    await prisma.$transaction(async (tx) => {
      // Désactiver la sanction
      await tx.userSanction.update({
        where: { id: sanctionId },
        data: { isActive: false }
      });

      // Logger l'action admin
      await tx.adminAction.create({
        data: {
          type: AdminActionType.USER_UNBAN,
          description: `Sanction levée: ${reason || 'Aucune raison spécifiée'}`,
          targetUserId: sanction.userId,
          adminUserId: adminId,
          metadata: { originalSanctionType: sanction.type, reason }
        }
      });
    });

    // Notification à l'utilisateur
    try {
      await notificationService.createNotification(sanction.userId, {
        type: 'SYSTEM_UPDATE' as any,
        category: 'SYSTEM' as any,
        title: '✅ Sanction levée',
        content: `Une sanction a été levée de votre compte. ${reason ? `Motif : ${reason}` : ''}`,
        priority: 'NORMAL' as any,
        data: {
          sanctionLifted: true,
          reason
        }
      });
    } catch (notifError) {
      console.error('Erreur notification levée sanction:', notifError);
    }

    res.json({
      success: true,
      message: `Sanction levée pour ${sanction.user.pseudo}`
    });
  } catch (error) {
    console.error('Erreur levée sanction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer l'historique des actions admin
 */
export const getAdminActions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, adminId = '', targetUserId = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (adminId) whereClause.adminUserId = adminId;
    if (targetUserId) whereClause.targetUserId = targetUserId;

    const actions = await prisma.adminAction.findMany({
      where: whereClause,
      include: {
        adminUser: { select: { pseudo: true, role: true } },
        targetUser: { select: { pseudo: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    const total = await prisma.adminAction.count({ where: whereClause });

    res.json({
      success: true,
      data: actions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération actions admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer toutes les équipes pour l'admin
 */
export const getTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        owner: {
          select: {
            id: true,
            pseudo: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true
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
    console.error('Erreur récupération équipes admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des équipes'
    });
  }
};

/**
 * Dissoudre une équipe (action admin)
 */
export const dissolveTeam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.userId;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: { select: { pseudo: true } },
        members: { include: { user: { select: { id: true, pseudo: true } } } }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Équipe introuvable'
      });
    }

    // Transaction pour supprimer l'équipe et logger l'action
    await prisma.$transaction(async (tx) => {
      // Supprimer l'équipe (cascade supprimera les membres)
      await tx.team.delete({ where: { id: teamId } });

      // Logger l'action admin
      await tx.adminAction.create({
        data: {
          type: AdminActionType.TEAM_DISSOLVE,
          description: `Équipe "${team.name}" dissoute: ${reason || 'Aucune raison spécifiée'}`,
          adminUserId: adminId,
          metadata: { teamName: team.name, reason }
        }
      });
    });

    // Notifier tous les membres de l'équipe
    const memberIds = team.members.map(m => m.user.id);
    if (memberIds.length > 0) {
      try {
        await notificationService.createBulkNotifications(memberIds, {
          type: 'TEAM_DISBANDED' as any,
          category: 'NOTIFICATION' as any,
          title: '💥 Équipe dissoute',
          content: `Votre équipe "${team.name}" a été dissoute par un administrateur. ${reason ? `Raison : ${reason}` : ''}`,
          priority: 'HIGH' as any,
          data: {
            teamName: team.name,
            reason,
            dissolvedByAdmin: true
          }
        });
      } catch (notifError) {
        console.error('Erreur notifications dissolution équipe:', notifError);
      }
    }

    res.json({
      success: true,
      message: `Équipe "${team.name}" dissoute avec succès`
    });
  } catch (error) {
    console.error('Erreur dissolution équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};