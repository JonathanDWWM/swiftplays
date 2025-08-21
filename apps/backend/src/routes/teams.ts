import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createTeam,
  getMyTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  upload
} from '../controllers/teamController';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * POST /api/teams
 * Créer une nouvelle équipe
 */
router.post('/', upload.single('avatar'), createTeam);

/**
 * GET /api/teams/my
 * Récupérer toutes les équipes de l'utilisateur connecté
 */
router.get('/my', getMyTeams);

/**
 * GET /api/teams/:id
 * Récupérer une équipe par son ID
 */
router.get('/:id', getTeamById);

/**
 * PUT /api/teams/:id
 * Mettre à jour une équipe
 */
router.put('/:id', upload.single('avatar'), updateTeam);

/**
 * DELETE /api/teams/:id
 * Supprimer une équipe
 */
router.delete('/:id', deleteTeam);

export default router;