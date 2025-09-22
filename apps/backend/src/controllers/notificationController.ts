import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { notificationService } from '../services/notificationService';
import { MessageCategory } from '@prisma/client';

/**
 * Récupérer les notifications de l'utilisateur connecté
 */
export const getUserNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { 
      page = '1', 
      limit = '20', 
      unreadOnly = 'false',
      category 
    } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      unreadOnly: unreadOnly === 'true',
      category: category as MessageCategory | undefined
    };

    const result = await notificationService.getUserNotifications(userId, options);

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Marquer une notification comme lue
 */
export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { notificationId } = req.params;

    await notificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });
  } catch (error) {
    console.error('Erreur marquage notification lue:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Notification introuvable'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Marquer toutes les notifications comme lues
 */
export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `${result.count} notifications marquées comme lues`
    });
  } catch (error) {
    console.error('Erreur marquage toutes notifications lues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer le nombre de notifications non lues
 */
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Erreur comptage notifications non lues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Supprimer une notification
 */
export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { notificationId } = req.params;

    await notificationService.deleteNotification(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification supprimée'
    });
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Notification introuvable'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer les préférences de notification de l'utilisateur
 */
export const getNotificationSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const settings = await notificationService.getUserNotificationSettings(userId);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Erreur récupération préférences notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Mettre à jour les préférences de notification
 */
export const updateNotificationSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const updates = req.body;

    // Validation des champs autorisés
    const allowedFields = [
      'enableWebNotifications',
      'enableEmailNotifications',
      'enablePushNotifications',
      'teamInvitations',
      'teamUpdates',
      'teamChat',
      'challengeReceived',
      'challengeAccepted',
      'matchReminders',
      'matchResults',
      'matchDisputes',
      'systemMessages',
      'achievements',
      'onboardingGuides',
      'privateMessages',
      'socialUpdates',
      'friendRequests',
      'quietHoursEnabled',
      'quietHoursStart',
      'quietHoursEnd',
      'quietHoursTimezone'
    ];

    const filteredUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        // Validation des types pour les champs booléens
        if (key.includes('quiet') && key !== 'quietHoursEnabled') {
          filteredUpdates[key] = value; // Strings pour heures
        } else if (typeof value === 'boolean') {
          filteredUpdates[key] = value;
        }
      }
    }

    const settings = await notificationService.updateNotificationSettings(userId, filteredUpdates);

    res.json({
      success: true,
      data: settings,
      message: 'Préférences de notification mises à jour'
    });
  } catch (error) {
    console.error('Erreur mise à jour préférences notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};