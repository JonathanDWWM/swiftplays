import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

class SocketService {
  private io: Server;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(io: Server) {
    this.io = io;
    this.initializeSocketHandlers();
  }

  /**
   * Initialiser les gestionnaires Socket.io
   */
  private initializeSocketHandlers() {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Socket connecté: ${socket.id} (User: ${socket.userId})`);

      if (socket.userId) {
        this.addUserSocket(socket.userId, socket.id);
      }

      // Rejoindre des salles spécifiques
      socket.on('join-team', (teamId: string) => {
        socket.join(`team-${teamId}`);
      });

      socket.on('join-match', (matchId: string) => {
        socket.join(`match-${matchId}`);
      });

      // Marquer notifications comme lues en temps réel
      socket.on('mark-notification-read', async (notificationId: string) => {
        try {
          if (socket.userId) {
            await prisma.message.update({
              where: {
                id: notificationId,
                receiverId: socket.userId
              },
              data: { isRead: true }
            });
            
            // Notifier le client que c'est fait
            socket.emit('notification-marked-read', { notificationId });
          }
        } catch (error) {
          console.error('Erreur marquage notification via socket:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Socket déconnecté: ${socket.id}`);
        if (socket.userId) {
          this.removeUserSocket(socket.userId, socket.id);
        }
      });
    });
  }

  /**
   * Middleware d'authentification pour Socket.io
   */
  private async authenticateSocket(socket: any, next: any) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      if (!token) {
        return next(new Error('Token manquant'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Vérifier que l'utilisateur existe toujours
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return next(new Error('Utilisateur inexistant'));
      }

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      console.error('Erreur authentification socket:', error);
      next(new Error('Token invalide'));
    }
  }

  /**
   * Ajouter un socket pour un utilisateur
   */
  private addUserSocket(userId: string, socketId: string) {
    const userSocketIds = this.userSockets.get(userId) || [];
    userSocketIds.push(socketId);
    this.userSockets.set(userId, userSocketIds);
  }

  /**
   * Retirer un socket pour un utilisateur
   */
  private removeUserSocket(userId: string, socketId: string) {
    const userSocketIds = this.userSockets.get(userId) || [];
    const filteredSockets = userSocketIds.filter(id => id !== socketId);
    
    if (filteredSockets.length === 0) {
      this.userSockets.delete(userId);
    } else {
      this.userSockets.set(userId, filteredSockets);
    }
  }

  /**
   * Envoyer une notification à un utilisateur spécifique
   */
  sendNotificationToUser(userId: string, notification: any) {
    const userSocketIds = this.userSockets.get(userId);
    
    if (userSocketIds && userSocketIds.length > 0) {
      userSocketIds.forEach(socketId => {
        this.io.to(socketId).emit('new-notification', notification);
      });
      console.log(`Notification envoyée à ${userSocketIds.length} socket(s) pour l'utilisateur ${userId}`);
      return true;
    }
    
    return false; // Utilisateur non connecté
  }

  /**
   * Envoyer une notification à plusieurs utilisateurs
   */
  sendBulkNotifications(userIds: string[], notification: any) {
    let sentCount = 0;
    
    userIds.forEach(userId => {
      if (this.sendNotificationToUser(userId, notification)) {
        sentCount++;
      }
    });
    
    console.log(`Notification bulk envoyée à ${sentCount}/${userIds.length} utilisateurs connectés`);
    return sentCount;
  }

  /**
   * Envoyer un message à tous les membres d'une équipe
   */
  sendTeamNotification(teamId: string, notification: any, excludeUserId?: string) {
    const teamRoom = `team-${teamId}`;
    
    if (excludeUserId) {
      // Exclure l'expéditeur de la notification
      const userSocketIds = this.userSockets.get(excludeUserId) || [];
      userSocketIds.forEach(socketId => {
        this.io.to(teamRoom).except(socketId).emit('team-notification', notification);
      });
    } else {
      this.io.to(teamRoom).emit('team-notification', notification);
    }
  }

  /**
   * Envoyer un message de chat en temps réel
   */
  sendChatMessage(roomType: 'team' | 'match', roomId: string, message: any) {
    const room = `${roomType}-${roomId}`;
    this.io.to(room).emit('chat-message', message);
  }

  /**
   * Envoyer une mise à jour de match
   */
  sendMatchUpdate(matchId: string, update: any) {
    const matchRoom = `match-${matchId}`;
    this.io.to(matchRoom).emit('match-update', update);
  }

  /**
   * Envoyer un rappel de match aux participants
   */
  async sendMatchReminder(matchId: string, reminderData: any) {
    try {
      // Récupérer les participants du match
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          player1: { include: { user: true } },
          player2: { include: { user: true } }
        }
      });

      if (match && match.player1 && match.player2) {
        const userIds = [match.player1.userId, match.player2.userId];
        
        // Envoyer à la room du match
        this.io.to(`match-${matchId}`).emit('match-reminder', reminderData);
        
        // Envoyer aussi comme notification personnelle
        userIds.forEach(userId => {
          this.sendNotificationToUser(userId, {
            type: 'MATCH_REMINDER',
            data: reminderData
          });
        });
      }
    } catch (error) {
      console.error('Erreur envoi rappel de match:', error);
    }
  }

  /**
   * Obtenir le nombre d'utilisateurs connectés
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Vérifier si un utilisateur est connecté
   */
  isUserConnected(userId: string): boolean {
    const userSockets = this.userSockets.get(userId);
    return userSockets ? userSockets.length > 0 : false;
  }

  /**
   * Obtenir les statistiques de connexion
   */
  getConnectionStats() {
    return {
      connectedUsers: this.userSockets.size,
      totalSockets: Array.from(this.userSockets.values()).reduce((total, sockets) => total + sockets.length, 0),
      rooms: Array.from(this.io.sockets.adapter.rooms.keys())
    };
  }
}

export default SocketService;