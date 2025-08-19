import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/search/users
 * Recherche d'utilisateurs par pseudo
 */
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    // Validation de la query
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Paramètre de recherche requis'
      });
    }

    const searchQuery = q.trim();

    // Recherche minimum 2 caractères
    if (searchQuery.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La recherche doit contenir au moins 2 caractères'
      });
    }

    // Recherche dans la base de données
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            pseudo: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          },
          {
            firstName: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          },
          {
            lastName: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        pseudo: true,
        firstName: true,
        lastName: true,
        avatar: true,
        discordAvatar: true,
        accountType: true,
        createdAt: true
      },
      take: 10, // Limiter à 10 résultats
      orderBy: [
        {
          pseudo: 'asc'
        }
      ]
    });

    // Formater les résultats pour l'API
    const formattedUsers = users.map(user => ({
      id: user.id,
      pseudo: user.pseudo,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar || user.discordAvatar,
      accountType: user.accountType,
      joinedAt: user.createdAt
    }));

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        total: formattedUsers.length,
        query: searchQuery
      }
    });

  } catch (error) {
    console.error('Erreur recherche utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/search/users/:pseudo
 * Récupérer un utilisateur spécifique par pseudo (pour profil public)
 */
router.get('/users/:pseudo', authenticateToken, async (req, res) => {
  try {
    const { pseudo } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        pseudo: pseudo
      },
      select: {
        id: true,
        pseudo: true,
        firstName: true,
        lastName: true,
        avatar: true,
        discordAvatar: true,
        accountType: true,
        createdAt: true,
        // TODO: Ajouter stats quand les modèles équipes/tournois seront créés
        // _count: {
        //   select: {
        //     teamMemberships: true,
        //     tournaments: true
        //   }
        // }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Formater pour l'API publique
    const publicProfile = {
      id: user.id,
      pseudo: user.pseudo,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar || user.discordAvatar,
      accountType: user.accountType,
      joinedAt: user.createdAt,
      // TODO: Ajouter les stats
      stats: {
        teams: 0, // user._count?.teamMemberships || 0,
        tournaments: 0, // user._count?.tournaments || 0,
        wins: 0, // À calculer plus tard
        losses: 0 // À calculer plus tard
      }
    };

    res.json({
      success: true,
      data: publicProfile
    });

  } catch (error) {
    console.error('Erreur récupération profil public:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router;