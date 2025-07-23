import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticatedRequest, ErrorResponse } from '../types/auth';

/**
 * Middleware de protection des routes - Vérifie le token JWT
 */
export const authenticateToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    // Récupérer le token depuis l'header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7) // Supprimer "Bearer "
        : null;

    if (!token) {
        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Token d\'authentification manquant'
        };
        res.status(401).json(errorResponse);
        return;
    }

    try {
        // Vérifier et décoder le token
        const decoded = verifyAccessToken(token);

        // Ajouter les infos utilisateur à la requête
        req.user = decoded;

        next();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Token invalide';

        const errorResponse: ErrorResponse = {
            success: false,
            message: errorMessage
        };

        // Status 401 pour token expiré ou invalide
        res.status(401).json(errorResponse);
        return;
    }
};

/**
 * Middleware pour vérifier le rôle administrateur
 */
export const requireAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Utilisateur non authentifié'
        };
        res.status(401).json(errorResponse);
        return;
    }

    if (req.user.role !== 'ADMIN') {
        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Accès refusé - Droits administrateur requis'
        };
        res.status(403).json(errorResponse);
        return;
    }

    next();
};

/**
 * Middleware pour vérifier le rôle modérateur ou administrateur
 */
export const requireModerator = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Utilisateur non authentifié'
        };
        res.status(401).json(errorResponse);
        return;
    }

    if (!['ADMIN', 'MODERATOR'].includes(req.user.role)) {
        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Accès refusé - Droits de modération requis'
        };
        res.status(403).json(errorResponse);
        return;
    }

    next();
};