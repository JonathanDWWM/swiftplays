import { Router } from 'express';
import {
    initiateDiscordAuth,
    handleDiscordCallback,
    getDiscordAuthUrl
} from '../controllers/discordAuthController';

const router = Router();

// GET /api/auth/discord - Initie l'authentification Discord
router.get('/discord', initiateDiscordAuth);

// GET /api/auth/discord/callback - Callback Discord OAuth
router.get('/discord/callback', handleDiscordCallback);

// GET /api/auth/discord/url - Obtient l'URL d'auth Discord (pour AJAX)
router.get('/discord/url', getDiscordAuthUrl);

export default router;