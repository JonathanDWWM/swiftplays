import { Router } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { authenticateToken } from '../middleware/auth';
import { MessageService } from '../services/messageService';
import { prisma } from '../lib/prisma';

const router = Router();

// Import pour accéder aux informations utilisateur dans les actions
import { User } from '@prisma/client';

/**
 * GET /api/messages
 * Récupérer les messages de l'utilisateur connecté
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { 
      limit = 20, 
      offset = 0, 
      category, 
      unreadOnly = false 
    } = req.query;

    const messages = await MessageService.getMessages(userId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      category: category as any,
      unreadOnly: unreadOnly === 'true'
    });

    const unreadCount = await MessageService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        messages: messages.map(message => ({
          id: message.id,
          type: message.type,
          category: message.category,
          title: message.title,
          content: message.content,
          actions: message.actions,
          data: message.data,
          isRead: message.isRead,
          priority: message.priority,
          sender: message.sender,
          createdAt: message.createdAt,
          expiresAt: message.expiresAt
        })),
        unreadCount,
        total: messages.length
      }
    });

  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/messages/unread-count
 * Récupérer uniquement le nombre de messages non lus
 */
router.get('/unread-count', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const unreadCount = await MessageService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error('Erreur comptage messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/messages/:id/read
 * Marquer un message comme lu
 */
router.post('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const message = await prisma.message.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    if (message.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce message'
      });
    }

    await MessageService.markAsRead(id, userId);

    res.json({
      success: true,
      data: {
        message: 'Message marqué comme lu'
      }
    });

  } catch (error) {
    console.error('Erreur marquage message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/messages/mark-all-read
 * Marquer tous les messages comme lus
 */
router.post('/mark-all-read', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    await MessageService.markAllAsRead(userId);

    res.json({
      success: true,
      data: {
        message: 'Tous les messages ont été marqués comme lus'
      }
    });

  } catch (error) {
    console.error('Erreur marquage tous messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * DELETE /api/messages/:id
 * Supprimer un message
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const message = await prisma.message.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    if (message.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce message'
      });
    }

    await MessageService.deleteMessage(id, userId);

    res.json({
      success: true,
      data: {
        message: 'Message supprimé'
      }
    });

  } catch (error) {
    console.error('Erreur suppression message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/messages/:id/action
 * Exécuter une action sur un message (accepter/refuser invitation, etc.)
 */
router.post('/:id/action', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const userId = req.user!.userId;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action requise'
      });
    }

    const message = await prisma.message.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    if (message.receiverId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce message'
      });
    }

    // Traitement selon le type de message
    // Plus de gestion d'équipes pour le moment

    res.status(400).json({
      success: false,
      message: 'Action non supportée pour ce type de message'
    });

  } catch (error) {
    console.error('Erreur action message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});


export default router;