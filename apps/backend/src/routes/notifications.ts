import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ===========================
// ROUTES NOTIFICATIONS
// ===========================

// Récupérer les notifications de l'utilisateur
router.get('/', authenticateToken, getUserNotifications);

// Récupérer le nombre de notifications non lues
router.get('/unread-count', authenticateToken, getUnreadCount);

// Marquer toutes les notifications comme lues
router.post('/mark-all-read', authenticateToken, markAllNotificationsAsRead);

// Marquer une notification comme lue
router.post('/:notificationId/read', authenticateToken, markNotificationAsRead);

// Supprimer une notification
router.delete('/:notificationId', authenticateToken, deleteNotification);

// ===========================
// ROUTES PRÉFÉRENCES
// ===========================

// Récupérer les préférences de notification
router.get('/settings', authenticateToken, getNotificationSettings);

// Mettre à jour les préférences de notification
router.put('/settings', authenticateToken, updateNotificationSettings);

export default router;