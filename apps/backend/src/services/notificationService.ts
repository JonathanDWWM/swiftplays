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
   * Créer une notification d'invitation d'équipe
   */
  static async createTeamInvitationNotification(
    receiverId: string,
    senderPseudo: string,
    teamName: string,
    teamId: string,
    invitationId: string
  ) {
    return this.createNotification({
      userId: receiverId,
      type: 'TEAM_INVITATION',
      title: 'Nouvelle invitation d\'équipe',
      message: `${senderPseudo} vous invite à rejoindre l'équipe "${teamName}"`,
      data: {
        teamId,
        teamName,
        senderPseudo,
        invitationId
      }
    });
  }

  /**
   * Créer une notification d'invitation acceptée
   */
  static async createTeamInvitationAcceptedNotification(
    senderId: string,
    accepterPseudo: string,
    teamName: string,
    teamId: string
  ) {
    return this.createNotification({
      userId: senderId,
      type: 'TEAM_INVITATION_ACCEPTED',
      title: 'Invitation acceptée',
      message: `${accepterPseudo} a accepté votre invitation à rejoindre "${teamName}"`,
      data: {
        teamId,
        teamName,
        accepterPseudo
      }
    });
  }

  /**
   * Créer une notification d'invitation refusée
   */
  static async createTeamInvitationDeclinedNotification(
    senderId: string,
    declinerPseudo: string,
    teamName: string,
    teamId: string
  ) {
    return this.createNotification({
      userId: senderId,
      type: 'TEAM_INVITATION_DECLINED',
      title: 'Invitation refusée',
      message: `${declinerPseudo} a refusé votre invitation à rejoindre "${teamName}"`,
      data: {
        teamId,
        teamName,
        declinerPseudo
      }
    });
  }

  /**
   * Créer une notification de nouveau membre dans l'équipe
   */
  static async createTeamMemberJoinedNotification(
    captainId: string,
    newMemberPseudo: string,
    teamName: string,
    teamId: string
  ) {
    return this.createNotification({
      userId: captainId,
      type: 'TEAM_MEMBER_JOINED',
      title: 'Nouveau membre d\'équipe',
      message: `${newMemberPseudo} a rejoint votre équipe "${teamName}"`,
      data: {
        teamId,
        teamName,
        newMemberPseudo
      }
    });
  }

  /**
   * Créer une notification de membre qui quitte l'équipe
   */
  static async createTeamMemberLeftNotification(
    captainId: string,
    leftMemberPseudo: string,
    teamName: string,
    teamId: string
  ) {
    return this.createNotification({
      userId: captainId,
      type: 'TEAM_MEMBER_LEFT',
      title: 'Membre a quitté l\'équipe',
      message: `${leftMemberPseudo} a quitté votre équipe "${teamName}"`,
      data: {
        teamId,
        teamName,
        leftMemberPseudo
      }
    });
  }

  /**
   * Créer des notifications d'équipe dissoute pour tous les membres
   */
  static async createTeamDissolvedNotifications(
    memberIds: string[],
    teamName: string,
    captainPseudo: string
  ) {
    const notifications = memberIds.map(memberId => 
      this.createNotification({
        userId: memberId,
        type: 'TEAM_DISSOLVED',
        title: 'Équipe dissoute',
        message: `L'équipe "${teamName}" a été dissoute par ${captainPseudo}`,
        data: {
          teamName,
          captainPseudo
        }
      })
    );

    return Promise.all(notifications);
  }

  /**
   * Supprimer toutes les notifications liées à une invitation
   */
  static async deleteInvitationNotifications(invitationId: string) {
    return prisma.notification.deleteMany({
      where: {
        data: {
          path: ['invitationId'],
          equals: invitationId
        }
      }
    });
  }
}