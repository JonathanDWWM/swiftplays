import { Request } from 'express';
import { User } from '@prisma/client';
import { JWTPayload } from '../utils/jwt';

// Données d'inscription
export interface RegisterRequest {
    email: string;
    password: string;
    pseudo: string;
    firstName?: string;
    lastName?: string;
}

// Données de connexion
export interface LoginRequest {
    email: string;
    password: string;
}

// Utilisateur sans mot de passe (pour les réponses)
export type SafeUser = Omit<User, 'password'>;

// Réponse d'authentification
export interface AuthResponse {
    success: boolean;
    message: string;
    user?: SafeUser;
    tokens?: {
        accessToken: string;
        refreshToken: string;
    };
}

// Requête Express avec utilisateur authentifié
export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}

// Réponse d'erreur standardisée
export interface ErrorResponse {
    success: false;
    message: string;
    errors?: string[];
}