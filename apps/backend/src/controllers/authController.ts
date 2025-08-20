import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokenPair, verifyRefreshToken, generateAccessToken } from '../utils/jwt';
import { RegisterRequest, LoginRequest, AuthResponse, AuthenticatedRequest, ErrorResponse } from '../types/auth';
import { emailService } from '../services/emailService';
import { prisma } from '../lib/prisma';

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

        // Vérifier que l'utilisateur a un mot de passe (pas un compte Discord only)
        if (!user.password) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Ce compte utilise Discord pour se connecter'
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

/**
 * Mise à jour du profil utilisateur
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Utilisateur non authentifié'
            };
            res.status(401).json(errorResponse);
            return;
        }

        const { pseudo, email, firstName, lastName } = req.body;

        // Validation des données
        if (!pseudo || pseudo.length < 3) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Le pseudo doit contenir au moins 3 caractères'
            };
            res.status(400).json(errorResponse);
            return;
        }

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Format d\'email invalide'
            };
            res.status(400).json(errorResponse);
            return;
        }

        // Vérifier si le pseudo est déjà pris par un autre utilisateur
        const existingUserByPseudo = await prisma.user.findUnique({
            where: { pseudo }
        });

        if (existingUserByPseudo && existingUserByPseudo.id !== req.user.userId) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Ce pseudo est déjà utilisé par un autre utilisateur'
            };
            res.status(409).json(errorResponse);
            return;
        }

        // Vérifier si l'email est déjà pris par un autre utilisateur
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUserByEmail && existingUserByEmail.id !== req.user.userId) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Cette adresse email est déjà utilisée par un autre utilisateur'
            };
            res.status(409).json(errorResponse);
            return;
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                pseudo,
                email,
                firstName: firstName || null,
                lastName: lastName || null,
                updatedAt: new Date()
            },
            select: {
                id: true,
                email: true,
                pseudo: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
                isVerified: true,
                accountType: true,
                discordId: true,
                discordUsername: true,
                discordAvatar: true,
                createdAt: true,
                updatedAt: true
            }
        });

        const response = {
            success: true,
            message: 'Profil mis à jour avec succès',
            user: updatedUser
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);

        // Gestion des erreurs Prisma
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
 * Changement de mot de passe
 */
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Utilisateur non authentifié'
            };
            res.status(401).json(errorResponse);
            return;
        }

        const { currentPassword, newPassword } = req.body;

        // Validation des données
        if (!currentPassword || !newPassword) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Mot de passe actuel et nouveau mot de passe requis'
            };
            res.status(400).json(errorResponse);
            return;
        }

        if (newPassword.length < 8) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
            };
            res.status(400).json(errorResponse);
            return;
        }

        // Récupérer l'utilisateur avec son mot de passe
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId }
        });

        if (!user) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Utilisateur non trouvé'
            };
            res.status(404).json(errorResponse);
            return;
        }

        // Vérifier que l'utilisateur peut changer son mot de passe (pas un compte Discord only)
        if (user.accountType === 'DISCORD') {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Les comptes Discord ne peuvent pas changer de mot de passe'
            };
            res.status(400).json(errorResponse);
            return;
        }

        if (!user.password) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Aucun mot de passe défini pour ce compte'
            };
            res.status(400).json(errorResponse);
            return;
        }

        // Vérifier le mot de passe actuel
        const isValidCurrentPassword = await comparePassword(currentPassword, user.password);

        if (!isValidCurrentPassword) {
            const errorResponse: ErrorResponse = {
                success: false,
                message: 'Mot de passe actuel incorrect'
            };
            res.status(401).json(errorResponse);
            return;
        }

        // Hasher le nouveau mot de passe
        const hashedNewPassword = await hashPassword(newPassword);

        // Mettre à jour le mot de passe
        await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                password: hashedNewPassword,
                updatedAt: new Date()
            }
        });

        const response = {
            success: true,
            message: 'Mot de passe changé avec succès'
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);

        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Erreur interne du serveur'
        };
        res.status(500).json(errorResponse);
    }
};