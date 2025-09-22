import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';
import { ConversationType, ChatMessageType } from '@prisma/client';

// Import du service chat socket - géré via une variable globale
let chatSocketService: any = null;

// Fonction pour initialiser le service chat
export const setChatSocketService = (service: any) => {
  chatSocketService = service;
};

/**
 * Récupérer toutes les conversations d'un utilisateur
 */
export const getConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

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
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true
              }
            }
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                pseudo: true
              }
            }
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });

    // Calculer les messages non-lus pour chaque conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conv) => {
        const currentMember = conv.members.find(m => m.userId === userId);
        const unreadCount = currentMember?.lastReadAt 
          ? await prisma.chatMessage.count({
              where: {
                conversationId: conv.id,
                createdAt: {
                  gt: currentMember.lastReadAt
                },
                senderId: {
                  not: userId // Ne pas compter ses propres messages
                }
              }
            })
          : conv._count.messages;

        return {
          ...conv,
          unreadCount,
          lastMessage: conv.messages[0] || null
        };
      })
    );

    res.json({
      success: true,
      data: conversationsWithUnreadCount
    });

  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des conversations'
    });
  }
};

/**
 * Récupérer les messages d'une conversation
 */
export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Vérifier que l'utilisateur est membre de la conversation
    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
        isActive: true
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette conversation'
      });
    }

    const offset = (Number(page) - 1) * Number(limit);

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        isDeleted: false
      },
      include: {
        sender: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                pseudo: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: Number(limit)
    });

    const total = await prisma.chatMessage.count({
      where: {
        conversationId,
        isDeleted: false
      }
    });

    res.json({
      success: true,
      data: messages.reverse(), // Inverser pour afficher du plus ancien au plus récent
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des messages'
    });
  }
};

/**
 * Envoyer un message dans une conversation
 */
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { conversationId } = req.params;
    const { content, type = 'TEXT', replyToId } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du message ne peut pas être vide'
      });
    }

    // Vérifier que l'utilisateur est membre actif de la conversation
    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
        isActive: true
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à envoyer des messages dans cette conversation'
      });
    }

    // Vérifier que l'utilisateur n'est pas mute
    if (member.mutedUntil && member.mutedUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Vous êtes temporairement muet dans cette conversation'
      });
    }

    // Vérifier le message de réponse s'il existe
    if (replyToId) {
      const replyMessage = await prisma.chatMessage.findFirst({
        where: {
          id: replyToId,
          conversationId
        }
      });

      if (!replyMessage) {
        return res.status(400).json({
          success: false,
          message: 'Message de réponse introuvable'
        });
      }
    }

    // Transaction pour créer le message et mettre à jour la conversation
    const result = await prisma.$transaction(async (tx) => {
      // Créer le message
      const message = await tx.chatMessage.create({
        data: {
          content: content.trim(),
          type: type as ChatMessageType,
          conversationId,
          senderId: userId,
          replyToId: replyToId || undefined
        },
        include: {
          sender: {
            select: {
              id: true,
              pseudo: true,
              avatar: true
            }
          },
          replyTo: {
            include: {
              sender: {
                select: {
                  pseudo: true
                }
              }
            }
          }
        }
      });

      // Mettre à jour l'activité de la conversation
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastActivity: new Date() }
      });

      return message;
    });

    // Diffuser le message via Socket.io
    if (chatSocketService) {
      chatSocketService.broadcastNewMessage(conversationId, result);
    }

    res.json({
      success: true,
      data: result,
      message: 'Message envoyé avec succès'
    });

  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'envoi du message'
    });
  }
};

/**
 * Marquer les messages comme lus
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { conversationId } = req.params;

    // Vérifier que l'utilisateur est membre de la conversation
    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId,
        isActive: true
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette conversation'
      });
    }

    // Mettre à jour la date de dernière lecture
    await prisma.conversationMember.update({
      where: { id: member.id },
      data: { lastReadAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Messages marqués comme lus'
    });

  } catch (error) {
    console.error('Erreur marquer comme lu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Créer une conversation directe (message privé)
 */
export const createDirectConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'ID de l\'utilisateur cible requis'
      });
    }

    if (targetUserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de créer une conversation avec soi-même'
      });
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, pseudo: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Vérifier si une conversation directe existe déjà entre ces deux utilisateurs
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: ConversationType.DIRECT,
        members: {
          every: {
            userId: { in: [userId, targetUserId] },
            isActive: true
          }
        }
      },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (existingConversation && existingConversation.members.length === 2) {
      return res.json({
        success: true,
        data: existingConversation,
        message: 'Conversation existante trouvée'
      });
    }

    // Créer nouvelle conversation directe
    const conversation = await prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        members: {
          create: [
            { userId },
            { userId: targetUserId }
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    // Notifier les participants via Socket.io
    if (chatSocketService) {
      chatSocketService.notifyNewConversation([userId, targetUserId], conversation);
    }

    res.json({
      success: true,
      data: conversation,
      message: 'Conversation créée avec succès'
    });

  } catch (error) {
    console.error('Erreur création conversation directe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la conversation'
    });
  }
};

/**
 * Récupérer ou créer la conversation d'équipe
 */
export const getOrCreateTeamConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { teamId } = req.params;

    // Vérifier que l'utilisateur est membre de l'équipe
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    if (!teamMember) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas membre de cette équipe'
      });
    }

    // Chercher conversation d'équipe existante
    let conversation = await prisma.conversation.findFirst({
      where: {
        teamId,
        type: ConversationType.TEAM
      },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true
              }
            }
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Créer la conversation d'équipe si elle n'existe pas
    if (!conversation) {
      // Récupérer tous les membres de l'équipe
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId }
      });

      conversation = await prisma.conversation.create({
        data: {
          type: ConversationType.TEAM,
          title: `Chat équipe ${teamMember.team.name}`,
          teamId,
          members: {
            create: teamMembers.map(member => ({
              userId: member.userId
            }))
          }
        },
        include: {
          members: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  pseudo: true,
                  avatar: true
                }
              }
            }
          },
          team: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });
    } else {
      // Ajouter l'utilisateur actuel s'il n'est pas encore membre de la conversation
      const isMember = conversation.members.some(member => member.userId === userId);
      if (!isMember) {
        await prisma.conversationMember.create({
          data: {
            conversationId: conversation.id,
            userId
          }
        });

        // Recharger la conversation avec le nouveau membre
        conversation = await prisma.conversation.findUniqueOrThrow({
          where: { id: conversation.id },
          include: {
            members: {
              where: { isActive: true },
              include: {
                user: {
                  select: {
                    id: true,
                    pseudo: true,
                    avatar: true
                  }
                }
              }
            },
            team: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        });
      }
    }

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('Erreur conversation équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la conversation d\'équipe'
    });
  }
};

/**
 * Supprimer un message (soft delete)
 */
export const deleteMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { messageId } = req.params;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message introuvable'
      });
    }

    // Seul l'auteur ou un admin peut supprimer un message
    if (message.senderId !== userId) {
      // TODO: Vérifier si l'utilisateur est admin/modérateur de la conversation
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que vos propres messages'
      });
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: '[Message supprimé]'
      }
    });

    // Notifier la suppression via Socket.io
    if (chatSocketService) {
      chatSocketService.broadcastMessageDeleted(message.conversationId, messageId);
    }

    res.json({
      success: true,
      message: 'Message supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du message'
    });
  }
};

/**
 * Modifier un message
 */
export const editMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du message ne peut pas être vide'
      });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message introuvable'
      });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que vos propres messages'
      });
    }

    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier un message supprimé'
      });
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            pseudo: true,
            avatar: true
          }
        }
      }
    });

    // Diffuser la modification via Socket.io
    if (chatSocketService) {
      chatSocketService.broadcastMessageEdited(message.conversationId, updatedMessage);
    }

    res.json({
      success: true,
      data: updatedMessage,
      message: 'Message modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur modification message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification du message'
    });
  }
};