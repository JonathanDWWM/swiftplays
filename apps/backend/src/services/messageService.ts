import { MessageType, MessageCategory, Priority } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface CreateMessageData {
  receiverId: string;
  senderId?: string;
  type: MessageType;
  category?: MessageCategory;
  title: string;
  content: string;
  actions?: any;
  data?: any;
  priority?: Priority;
  expiresAt?: Date;
}

interface MessageAction {
  id: string;
  label: string;
  type: 'success' | 'danger' | 'info' | 'warning';
  endpoint: string;
  payload: any;
}

/**
 * Service pour créer et gérer les messages unifié
 */
export class MessageService {
  /**
   * Créer un nouveau message
   */
  static async createMessage({
    receiverId,
    senderId = undefined,
    type,
    category = 'NOTIFICATION',
    title,
    content,
    actions = undefined,
    data = undefined,
    priority = 'NORMAL',
    expiresAt = undefined
  }: CreateMessageData) {
    try {
      const message = await prisma.message.create({
        data: {
          receiverId,
          senderId,
          type,
          category,
          title,
          content,
          actions,
          data,
          priority,
          expiresAt
        },
        include: {
          sender: {
            select: {
              id: true,
              pseudo: true,
              avatar: true,
              discordAvatar: true
            }
          }
        }
      });

      return message;
    } catch (error) {
      console.error('Erreur création message:', error);
      throw error;
    }
  }


  /**
   * Marquer un message comme lu
   */
  static async markAsRead(messageId: string, userId: string) {
    return prisma.message.updateMany({
      where: {
        id: messageId,
        receiverId: userId
      },
      data: {
        isRead: true
      }
    });
  }

  /**
   * Marquer tous les messages comme lus
   */
  static async markAllAsRead(userId: string) {
    return prisma.message.updateMany({
      where: {
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  }

  /**
   * Supprimer un message
   */
  static async deleteMessage(messageId: string, userId: string) {
    return prisma.message.deleteMany({
      where: {
        id: messageId,
        receiverId: userId
      }
    });
  }

  /**
   * Compter les messages non lus
   */
  static async getUnreadCount(userId: string) {
    return prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
  }

  /**
   * Récupérer les messages d'un utilisateur
   */
  static async getMessages(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      category?: MessageCategory;
      unreadOnly?: boolean;
    } = {}
  ) {
    const { limit = 20, offset = 0, category, unreadOnly = false } = options;

    const whereClause: any = { receiverId: userId };
    
    if (category) {
      whereClause.category = category;
    }
    
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    return prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            pseudo: true,
            avatar: true,
            discordAvatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });
  }
}