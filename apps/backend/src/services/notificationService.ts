import { NotificationType } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

/**
 * Service pour créer et gérer les notifications
 */
export class NotificationService {
  /**
   * Créer une nouvelle notification
   */
  static async createNotification({
    userId,
    type,
    title,
    message,
    data = null
  }: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data
        }
      });

      return notification;
    } catch (error) {
      console.error('Erreur création notification:', error);
      throw error;
    }
  }

  /**
   * Créer une notification système
   */
  static async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ) {
    return this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      data
    });
  }
}