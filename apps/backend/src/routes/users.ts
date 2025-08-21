import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * GET /api/users/search?q=
 * Rechercher des utilisateurs par pseudo (autocompletion)
 */
router.get('/search', async (req: AuthenticatedRequest, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Rechercher les utilisateurs dont le pseudo commence par la requête
    const users = await prisma.user.findMany({
      where: {
        pseudo: {
          startsWith: q,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        pseudo: true,
        firstName: true,
        lastName: true,
        avatar: true,
        discordAvatar: true,
        accountType: true
      },
      take: 10, // Limiter à 10 résultats
      orderBy: {
        pseudo: 'asc'
      }
    });

    res.json({
      success: true,
      data: users
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
 * GET /api/users/:pseudo
 * Récupérer les informations publiques d'un joueur par son pseudo
 */
router.get('/:pseudo', async (req: AuthenticatedRequest, res) => {
  try {
    const { pseudo } = req.params;

    // Trouver l'utilisateur par pseudo
    const user = await prisma.user.findUnique({
      where: { pseudo },
      select: {
        id: true,
        pseudo: true,
        firstName: true,
        lastName: true,
        avatar: true,
        discordAvatar: true,
        accountType: true,
        createdAt: true,
        // Exclure les informations sensibles (email, password, etc.)
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Joueur introuvable'
      });
    }

    // Récupérer les équipes du joueur (owned + member)
    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        name: true,
        shortName: true,
        avatar: true,
        game: true,
        gameMode: true,
        maxMembers: true,
        createdAt: true
      }
    });

    const memberTeams = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
            avatar: true,
            game: true,
            gameMode: true,
            maxMembers: true,
            createdAt: true
          }
        }
      }
    });

    // Combiner les équipes (owned + member) avec les rôles
    const teams = [
      // Équipes dont il est propriétaire (rôle CAPTAIN)
      ...ownedTeams.map(team => ({
        team,
        role: 'CAPTAIN',
        joinedAt: team.createdAt
      })),
      // Équipes dont il est membre
      ...memberTeams.map(membership => ({
        team: membership.team,
        role: membership.role,
        joinedAt: membership.joinedAt
      }))
    ];

    res.json({
      success: true,
      data: {
        user,
        teams
      }
    });

  } catch (error) {
    console.error('Erreur récupération profil joueur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router;