import { Router } from 'express';
import { register, login, refreshToken, getMe, logout, updateProfile, changePassword } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import discordAuthRoutes from './discordAuth';

const router = Router();

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', validateRegister, register);

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
router.post('/login', validateLogin, login);

/**
 * POST /api/auth/refresh
 * Renouvellement du token d'accès
 */
router.post('/refresh', refreshToken);

/**
 * GET /api/auth/me
 * Récupérer les informations de l'utilisateur connecté
 */
router.get('/me', authenticateToken, getMe);

/**
 * POST /api/auth/logout
 * Déconnexion (côté client principalement)
 */
router.post('/logout', logout);

/**
 * PUT /api/auth/profile
 * Mise à jour du profil utilisateur
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * PUT /api/auth/password
 * Changement de mot de passe
 */
router.put('/password', authenticateToken, changePassword);

/**
 * Routes Discord OAuth
 */
router.use('/', discordAuthRoutes);

export default router;