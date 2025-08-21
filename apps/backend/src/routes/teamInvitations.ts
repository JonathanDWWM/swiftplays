import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  invitePlayer,
  acceptInvitation,
  declineInvitation,
  getTeamInvitations
} from '../controllers/teamInvitationController';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * POST /api/teams/:teamId/invite
 * Inviter un joueur dans une équipe
 */
router.post('/:teamId/invite', invitePlayer);

/**
 * GET /api/teams/:teamId/invitations
 * Récupérer les invitations en attente pour une équipe
 */
router.get('/:teamId/invitations', getTeamInvitations);

/**
 * POST /api/teams/invitations/:teamId/accept
 * Accepter une invitation d'équipe
 */
router.post('/invitations/:teamId/accept', acceptInvitation);

/**
 * POST /api/teams/invitations/:teamId/decline
 * Refuser une invitation d'équipe
 */
router.post('/invitations/:teamId/decline', declineInvitation);

export default router;