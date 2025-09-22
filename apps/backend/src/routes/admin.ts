import express from 'express';
import { 
  requireAdminRole, 
  requireAdminOnly,
  getDashboardStats,
  getUsers,
  sanctionUser,
  removeSanction,
  getAdminActions,
  dissolveTeam,
  getTeams
} from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Toutes les routes admin nécessitent une authentification
router.use(authenticateToken);

// Dashboard et statistiques (Admin + Modérateur)
router.get('/dashboard/stats', requireAdminRole, getDashboardStats);

// Gestion des utilisateurs (Admin + Modérateur)
router.get('/users', requireAdminRole, getUsers);
router.post('/users/:userId/sanction', requireAdminRole, sanctionUser);
router.delete('/sanctions/:sanctionId', requireAdminRole, removeSanction);

// Gestion des équipes (Admin + Modérateur)
router.get('/teams', requireAdminRole, getTeams);
router.delete('/teams/:teamId', requireAdminRole, dissolveTeam);

// Historique des actions (Admin + Modérateur)
router.get('/actions', requireAdminRole, getAdminActions);

// Routes réservées aux administrateurs uniquement
// (À ajouter plus tard : gestion des rôles, configuration système, etc.)

export default router;