import { prisma } from '../lib/prisma';
import { MessageType, MessageCategory, Priority } from '@prisma/client';
import { emailService } from './emailService';

let socketService: any = null;

// Fonction pour définir le service Socket
export const setSocketService = (service: any) => {
  socketService = service;
};

interface NotificationData {
  type: MessageType;
  category: MessageCategory;
  title: string;
  content: string;
  priority?: Priority;
  actions?: any;
  data?: any;
  expiresAt?: Date;
  senderId?: string;
}

class NotificationService {
  
  /**
   * Créer une notification pour un utilisateur spécifique
   */
  async createNotification(userId: string, notificationData: NotificationData) {
    try {
      // Récupérer les préférences de notification de l'utilisateur
      const settings = await this.getUserNotificationSettings(userId);
      
      // Vérifier si l'utilisateur accepte ce type de notification
      if (!this.shouldSendNotification(settings, notificationData.type)) {
        console.log(`Notification ${notificationData.type} ignorée pour l'utilisateur ${userId} (préférences)`);
        return null;
      }

      // Créer la notification en base
      const notification = await prisma.message.create({
        data: {
          type: notificationData.type,
          category: notificationData.category,
          title: notificationData.title,
          content: notificationData.content,
          priority: notificationData.priority || Priority.NORMAL,
          actions: notificationData.actions,
          data: notificationData.data,
          expiresAt: notificationData.expiresAt,
          senderId: notificationData.senderId,
          receiverId: userId
        },
        include: {
          sender: {
            select: {
              pseudo: true,
              avatar: true,
              discordAvatar: true
            }
          }
        }
      });

      // Envoyer email si activé
      if (settings.enableEmailNotifications && this.shouldSendEmail(notificationData.type)) {
        await this.sendEmailNotification(userId, notification);
      }

      // Envoyer notification temps réel via Socket.io
      if (socketService) {
        socketService.sendNotificationToUser(userId, {
          id: notification.id,
          type: notification.type,
          category: notification.category,
          title: notification.title,
          content: notification.content,
          priority: notification.priority,
          actions: notification.actions,
          data: notification.data,
          createdAt: notification.createdAt,
          sender: notification.sender
        });
      }

      return notification;
    } catch (error) {
      console.error('Erreur création notification:', error);
      throw error;
    }
  }

  /**
   * Créer des notifications pour plusieurs utilisateurs
   */
  async createBulkNotifications(userIds: string[], notificationData: NotificationData) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.createNotification(userId, notificationData))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`${successful}/${userIds.length} notifications envoyées avec succès`);
    
    return results;
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getUserNotifications(userId: string, options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    category?: MessageCategory;
  } = {}) {
    const { page = 1, limit = 20, unreadOnly = false, category } = options;
    const offset = (page - 1) * limit;

    const whereClause: any = {
      receiverId: userId
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (category) {
      whereClause.category = category;
    }

    const notifications = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            pseudo: true,
            avatar: true,
            discordAvatar: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit
    });

    const total = await prisma.message.count({ where: whereClause });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string, userId: string) {
    return await prisma.message.update({
      where: {
        id: notificationId,
        receiverId: userId
      },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId: string) {
    return await prisma.message.updateMany({
      where: {
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Compter les notifications non lues
   */
  async getUnreadCount(userId: string) {
    return await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    return await prisma.message.delete({
      where: {
        id: notificationId,
        receiverId: userId
      }
    });
  }

  /**
   * Récupérer ou créer les préférences de notification d'un utilisateur
   */
  async getUserNotificationSettings(userId: string) {
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Créer les préférences par défaut
      settings = await prisma.notificationSettings.create({
        data: { userId }
      });
    }

    return settings;
  }

  /**
   * Mettre à jour les préférences de notification
   */
  async updateNotificationSettings(userId: string, updates: any) {
    return await prisma.notificationSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...updates
      },
      update: updates
    });
  }

  /**
   * Vérifier si l'utilisateur accepte ce type de notification
   */
  private shouldSendNotification(settings: any, type: MessageType): boolean {
    const typeMapping: { [key in MessageType]?: keyof typeof settings } = {
      // Équipes
      TEAM_INVITATION: 'teamInvitations',
      TEAM_INVITATION_ACCEPTED: 'teamUpdates',
      TEAM_INVITATION_DECLINED: 'teamUpdates',
      TEAM_MEMBER_JOINED: 'teamUpdates',
      TEAM_MEMBER_LEFT: 'teamUpdates',
      TEAM_ROLE_CHANGED: 'teamUpdates',
      TEAM_DISBANDED: 'teamUpdates',
      TEAM_CHAT_MESSAGE: 'teamChat',
      
      // Défis et matchs
      CHALLENGE_RECEIVED: 'challengeReceived',
      CHALLENGE_ACCEPTED: 'challengeAccepted',
      CHALLENGE_DECLINED: 'challengeAccepted',
      CHALLENGE_EXPIRED: 'challengeReceived',
      MATCH_REMINDER: 'matchReminders',
      MATCH_STARTED: 'matchResults',
      MATCH_RESULT_SUBMITTED: 'matchResults',
      MATCH_RESULT_CONFIRMED: 'matchResults',
      MATCH_RESULT_DISPUTED: 'matchDisputes',
      MATCH_DISPUTE_RESOLVED: 'matchDisputes',
      
      // Système
      SYSTEM_WELCOME: 'systemMessages',
      SYSTEM_UPDATE: 'systemMessages',
      SYSTEM_MAINTENANCE: 'systemMessages',
      ONBOARDING_GUIDE: 'onboardingGuides',
      FIRST_TEAM_CREATED: 'achievements',
      FIRST_CHALLENGE_CREATED: 'achievements',
      ACHIEVEMENT_UNLOCKED: 'achievements',
      
      // Social
      PRIVATE_MESSAGE: 'privateMessages',
      FRIEND_REQUEST: 'friendRequests'
    };

    const settingKey = typeMapping[type];
    if (!settingKey) {
      return true; // Par défaut, autoriser si pas de mapping
    }

    return settings[settingKey] === true;
  }

  /**
   * Vérifier si ce type de notification doit envoyer un email
   */
  private shouldSendEmail(type: MessageType): boolean {
    // Emails seulement pour les événements TRÈS IMPORTANTS
    const emailTypes: MessageType[] = [
      'SYSTEM_WELCOME' as MessageType,           // Bienvenue après inscription
      'TEAM_INVITATION' as MessageType,          // Invitation à rejoindre une équipe
      'MATCH_RESULT_CONFIRMED' as MessageType,   // Résultat de match validé (victoire/défaite)
      'ACHIEVEMENT_UNLOCKED' as MessageType      // Achievements importants
    ];
    
    return emailTypes.includes(type);
  }

  /**
   * Envoyer notification par email
   */
  private async sendEmailNotification(userId: string, notification: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, pseudo: true }
      });

      if (!user?.email) return;

      const emailData = {
        to: user.email,
        subject: `SwiftPlays - ${notification.title}`,
        html: this.generateEmailTemplate(notification, user.pseudo)
      };

      // Note: Pour l'instant, utilisons sendWelcomeEmail comme base
      // TODO: Ajouter une méthode générique sendEmail au service
      console.log('Email notification à envoyer:', emailData);
    } catch (error) {
      console.error('Erreur envoi email notification:', error);
    }
  }

  /**
   * Générer template email pour notification
   */
  private generateEmailTemplate(notification: any, pseudo: string): string {
    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">SwiftPlays</h1>
        </div>
        
        <div style="padding: 20px; background: #f8fafc;">
          <h2 style="color: #3B82D6;">${notification.title}</h2>
          <p>Salut ${pseudo},</p>
          <p>${notification.content}</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="https://swiftplays.fr/notifications" 
               style="background: #3B82D6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Voir sur SwiftPlays
            </a>
          </div>
          
          <p style="color: #666; font-size: 0.9em;">
            Tu peux modifier tes préférences de notification dans les paramètres de ton compte.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Nettoyer les anciennes notifications expirées
   */
  async cleanupExpiredNotifications() {
    const result = await prisma.message.deleteMany({
      where: {
        expiresAt: {
          lte: new Date()
        }
      }
    });

    console.log(`${result.count} notifications expirées supprimées`);
    return result;
  }
}

export const notificationService = new NotificationService();