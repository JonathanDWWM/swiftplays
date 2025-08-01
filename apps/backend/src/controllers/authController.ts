import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokenPair, verifyRefreshToken, generateAccessToken } from '../utils/jwt';
import { RegisterRequest, LoginRequest, AuthResponse, AuthenticatedRequest, ErrorResponse } from '../types/auth';
import { emailService } from '../services/emailService';

const prisma = new PrismaClient();

/**
 * Inscription d'un nouvel utilisateur
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, pseudo, firstName, lastName }: RegisterRequest = req.body;

        // Hasher le mot de passe
        const hashedPassword = await hashPassword(password);

        // Créer l'utilisateur en base
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                pseudo,
                firstName: firstName || null,
                lastName: lastName || null,
            }
        });

        // Retirer le mot de passe de la réponse
        const { password: _, ...user } = newUser;

        // Générer les tokens JWT
        const tokens = generateTokenPair({
            userId: user.id,
            email: user.email,
            pseudo: user.pseudo,
            role: user.role
        });

        // Envoyer l'email de bienvenue (sans bloquer la réponse)
        emailService.sendWelcomeEmail({
            email: user.email,
            pseudo: user.pseudo,
            firstName: user.firstName || undefined
        }).catch(error => {
            console.error('Erreur envoi email de bienvenue:', error);
        });

        const response: AuthResponse = {
            success: true,
            message: 'Inscription réussie ! Bienvenue sur SwiftPlays !',
            user,
            tokens
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('Erreur inscription:', error);

        // Gestion des erreurs Prisma (email ou pseudo déjà utilisé)
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const target = error.meta?.target as string[];
                let message = 'Données déjà utilisées';

                if (target?.includes('email')) {
                    message = 'Cette adresse email est déjà utilisée';
                } else if (target?.includes('pseudo')) {
                    message = 'Ce pseudo est déjà pris';
                }

                const errorResponse: ErrorResponse = {
                    success: false,
                    message
                };
                res.status(409).json(errorResponse);
                return;
            }
        }

        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Erreur interne du serveur'
        };
        res.status(500).json(errorResponse);
    }
};

/**
 * Connexion d'un utilisateur
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password }: LoginRequest = req.body;

        // Chercher l'utilisateur par email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Email ou mot de passe incorrect'
            };
            res.status(401).json(errorResponse);
            return;
        }

        // Vérifier le mot de passe
        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Email ou mot de passe incorrect'
            };
            res.status(401).json(errorResponse);
            return;
        }

        // Générer les tokens JWT
        const tokens = generateTokenPair({
            userId: user.id,
            email: user.email,
            pseudo: user.pseudo,
            role: user.role
        });

        // Réponse sans le mot de passe
        const { password: _, ...userResponse } = user;

        const response: AuthResponse = {
            success: true,
            message: `Bienvenue ${user.pseudo} ! Connexion réussie.`,
            user: userResponse,
            tokens
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Erreur connexion:', error);

        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Erreur interne du serveur'
        };
        res.status(500).json(errorResponse);
    }
};

/**
 * Refresh du token d'accès
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Refresh token manquant'
            };
            res.status(401).json(errorResponse);
            return;
        }

        // Vérifier le refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Récupérer les infos utilisateur
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                pseudo: true,
                role: true
            }
        });

        if (!user) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Utilisateur non trouvé'
            };
            res.status(401).json(errorResponse);
            return;
        }

        // Générer un nouveau token d'accès
        const newAccessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            pseudo: user.pseudo,
            role: user.role
        });

        const response = {
            success: true,
            message: 'Token renouvelé',
            accessToken: newAccessToken
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Erreur refresh token:', error);

        const errorResponse: ErrorResponse = {
            success: false,
            message: error instanceof Error ? error.message : 'Refresh token invalide'
        };
        res.status(401).json(errorResponse);
    }
};

/**
 * Récupérer les informations de l'utilisateur connecté
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Utilisateur non authentifié'
            };
            res.status(401).json(errorResponse);
            return;
        }

        // Récupérer les infos complètes depuis la base
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                pseudo: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Utilisateur non trouvé'
            };
            res.status(404).json(errorResponse);
            return;
        }

        const response = {
            success: true,
            message: 'Informations utilisateur récupérées',
            user
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Erreur getMe:', error);

        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Erreur interne du serveur'
        };
        res.status(500).json(errorResponse);
    }
};

/**
 * Déconnexion (côté client principalement)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
    // Note: Avec JWT, la déconnexion se fait principalement côté client
    // en supprimant les tokens du localStorage/cookies

    const response = {
        success: true,
        message: 'Déconnexion réussie'
    };

    res.status(200).json(response);
};