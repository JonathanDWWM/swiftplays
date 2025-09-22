import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  createDirectConversation,
  getOrCreateTeamConversation,
  deleteMessage,
  editMessage
} from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Toutes les routes chat nécessitent une authentification
router.use(authenticateToken);

// Routes conversations
router.get('/conversations', getConversations);
router.post('/conversations/direct', createDirectConversation);
router.get('/conversations/team/:teamId', getOrCreateTeamConversation);

// Routes messages
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.patch('/conversations/:conversationId/read', markAsRead);

// Routes gestion messages
router.delete('/messages/:messageId', deleteMessage);
router.patch('/messages/:messageId', editMessage);

export default router;