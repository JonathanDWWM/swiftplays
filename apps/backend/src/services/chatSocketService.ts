import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  user?: User;
}

class ChatSocketService {
  private io: Server;
  private connectedUsers = new Map<string, string[]>(); // userId -> socketIds[]

  constructor(io: Server) {
    this.io = io;
    this.setupChatNamespace();
  }

  private setupChatNamespace() {
    // Namespace pour le chat
    const chatNamespace = this.io.of('/chat');

    // Middleware d'authentification pour le namespace chat
    chatNamespace.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Token manquant'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });

        if (!user) {
          return next(new Error('Utilisateur introuvable'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Token invalide'));
      }
    });

    // Gestion des connexions chat
    chatNamespace.on('connection', (socket: AuthenticatedSocket) => {
      this.handleChatConnection(socket);
    });
  }

  private async handleChatConnection(socket: AuthenticatedSocket) {
    const userId = socket.user!.id;
    console.log(`🔗 Chat: Utilisateur ${socket.user!.pseudo} connecté (${socket.id})`);

    // Ajouter l'utilisateur à la liste des connectés
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, []);
    }
    this.connectedUsers.get(userId)!.push(socket.id);

    // Rejoindre les salles des conversations de l'utilisateur
    await this.joinUserConversations(socket);

    // Écouter les événements de chat
    this.setupChatEventListeners(socket);

    // Gérer la déconnexion
    socket.on('disconnect', () => {
      this.handleChatDisconnection(socket);
    });
  }

  private async joinUserConversations(socket: AuthenticatedSocket) {
    try {
      const userId = socket.user!.id;

      // Récupérer toutes les conversations actives de l'utilisateur
      const conversations = await prisma.conversation.findMany({
        where: {
          members: {
            some: {
              userId,
              isActive: true
            }
          },
          isActive: true
        },
        select: { id: true }
      });

      // Rejoindre chaque salle de conversation
      for (const conv of conversations) {
        socket.join(`conversation:${conv.id}`);
      }

      console.log(`📋 Chat: ${socket.user!.pseudo} a rejoint ${conversations.length} conversations`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux conversations:', error);
    }
  }

  private setupChatEventListeners(socket: AuthenticatedSocket) {
    const userId = socket.user!.id;

    // Rejoindre une conversation spécifique
    socket.on('join-conversation', async (conversationId: string) => {
      try {
        // Vérifier que l'utilisateur est membre de cette conversation
        const member = await prisma.conversationMember.findFirst({
          where: {
            conversationId,
            userId,
            isActive: true
          }
        });

        if (member) {
          socket.join(`conversation:${conversationId}`);
          console.log(`💬 ${socket.user!.pseudo} a rejoint la conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Erreur join conversation:', error);
      }
    });

    // Quitter une conversation
    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`👋 ${socket.user!.pseudo} a quitté la conversation ${conversationId}`);
    });

    // Utilisateur en train de taper
    socket.on('typing-start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId: socket.user!.id,
        pseudo: socket.user!.pseudo,
        conversationId
      });
    });

    // Utilisateur a arrêté de taper
    socket.on('typing-stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', {
        userId: socket.user!.id,
        conversationId
      });
    });

    // Messages lus
    socket.on('messages-read', async (conversationId: string) => {
      try {
        // Mettre à jour la base de données
        await prisma.conversationMember.updateMany({
          where: {
            conversationId,
            userId
          },
          data: {
            lastReadAt: new Date()
          }
        });

        // Notifier les autres membres
        socket.to(`conversation:${conversationId}`).emit('messages-read-by', {
          userId: socket.user!.id,
          conversationId,
          readAt: new Date()
        });
      } catch (error) {
        console.error('Erreur messages lus:', error);
      }
    });
  }

  private handleChatDisconnection(socket: AuthenticatedSocket) {
    const userId = socket.user!.id;
    console.log(`❌ Chat: ${socket.user!.pseudo} déconnecté (${socket.id})`);

    // Retirer de la liste des connectés
    if (this.connectedUsers.has(userId)) {
      const socketIds = this.connectedUsers.get(userId)!;
      const index = socketIds.indexOf(socket.id);
      if (index > -1) {
        socketIds.splice(index, 1);
        if (socketIds.length === 0) {
          this.connectedUsers.delete(userId);
        }
      }
    }
  }

  // Envoyer un nouveau message à tous les membres d'une conversation
  public async broadcastNewMessage(conversationId: string, message: any) {
    try {
      const chatNamespace = this.io.of('/chat');
      chatNamespace.to(`conversation:${conversationId}`).emit('new-message', message);
      
      console.log(`📨 Message diffusé dans conversation ${conversationId}`);
    } catch (error) {
      console.error('Erreur broadcast message:', error);
    }
  }

  // Notifier qu'un message a été modifié
  public async broadcastMessageEdited(conversationId: string, message: any) {
    try {
      const chatNamespace = this.io.of('/chat');
      chatNamespace.to(`conversation:${conversationId}`).emit('message-edited', message);
    } catch (error) {
      console.error('Erreur broadcast message édité:', error);
    }
  }

  // Notifier qu'un message a été supprimé
  public async broadcastMessageDeleted(conversationId: string, messageId: string) {
    try {
      const chatNamespace = this.io.of('/chat');
      chatNamespace.to(`conversation:${conversationId}`).emit('message-deleted', {
        messageId,
        conversationId
      });
    } catch (error) {
      console.error('Erreur broadcast message supprimé:', error);
    }
  }

  // Notifier les membres qu'une nouvelle conversation a été créée
  public async notifyNewConversation(userIds: string[], conversation: any) {
    try {
      const chatNamespace = this.io.of('/chat');
      
      for (const userId of userIds) {
        if (this.connectedUsers.has(userId)) {
          const socketIds = this.connectedUsers.get(userId)!;
          for (const socketId of socketIds) {
            const socket = chatNamespace.sockets.get(socketId);
            if (socket) {
              socket.join(`conversation:${conversation.id}`);
              socket.emit('new-conversation', conversation);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur notification nouvelle conversation:', error);
    }
  }

  // Récupérer les utilisateurs en ligne
  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Vérifier si un utilisateur est en ligne
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

export default ChatSocketService;