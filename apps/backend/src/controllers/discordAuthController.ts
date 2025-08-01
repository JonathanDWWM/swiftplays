import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateTokenPair } from '../utils/jwt';
import { discordService } from '../services/discordService';
import { emailService } from '../services/emailService';

const prisma = new PrismaClient();

/**
 * Redirige vers Discord pour l'authentification
 */
export const initiateDiscordAuth = async (req: Request, res: Response): Promise<void> => {
    try {
        const authUrl = discordService.getAuthorizationUrl();
        res.redirect(authUrl);
    } catch (error) {
        console.error('Erreur initiation auth Discord:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'initiation de l\'authentification Discord'
        });
    }
};

/**
 * Gère le callback Discord OAuth
 */
export const handleDiscordCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, error: discordError } = req.query;

        // Vérifier s'il y a une erreur de Discord
        if (discordError) {
            console.error('Erreur Discord OAuth:', discordError);
            res.redirect(`${process.env.CORS_ORIGIN}/connexion?error=discord_cancelled`);
            return;
        }

        // Vérifier la présence du code
        if (!code || typeof code !== 'string') {
            res.redirect(`${process.env.CORS_ORIGIN}/connexion?error=discord_no_code`);
            return;
        }

        // Échanger le code contre un token
        const tokenData = await discordService.exchangeCodeForToken(code);
        
        // Récupérer les infos utilisateur Discord
        const discordUser = await discordService.getUserInfo(tokenData.access_token);

        // Vérifier si l'utilisateur existe déjà (par Discord ID)
        let user = await prisma.user.findUnique({
            where: { discordId: discordUser.id }
        });

        if (user) {
            // Utilisateur existant - mettre à jour les infos Discord
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    discordUsername: discordService.formatDiscordUsername(discordUser.username, discordUser.discriminator),
                    discordAvatar: discordService.getAvatarUrl(discordUser.id, discordUser.avatar),
                    isVerified: discordUser.verified,
                    updatedAt: new Date()
                }
            });
        } else {
            // Vérifier si un compte avec cet email existe déjà
            const existingEmailUser = await prisma.user.findUnique({
                where: { email: discordUser.email }
            });

            if (existingEmailUser) {
                // Lier le compte Discord au compte email existant
                user = await prisma.user.update({
                    where: { id: existingEmailUser.id },
                    data: {
                        discordId: discordUser.id,
                        discordUsername: discordService.formatDiscordUsername(discordUser.username, discordUser.discriminator),
                        discordAvatar: discordService.getAvatarUrl(discordUser.id, discordUser.avatar),
                        accountType: 'HYBRID',
                        isVerified: discordUser.verified || existingEmailUser.isVerified,
                        // Utiliser l'avatar Discord si pas d'avatar existant
                        avatar: existingEmailUser.avatar || discordService.getAvatarUrl(discordUser.id, discordUser.avatar),
                        updatedAt: new Date()
                    }
                });
            } else {
                // Créer un nouveau compte Discord
                user = await prisma.user.create({
                    data: {
                        email: discordUser.email,
                        pseudo: discordUser.username, // Utiliser le nom Discord comme pseudo
                        discordId: discordUser.id,
                        discordUsername: discordService.formatDiscordUsername(discordUser.username, discordUser.discriminator),
                        discordAvatar: discordService.getAvatarUrl(discordUser.id, discordUser.avatar),
                        avatar: discordService.getAvatarUrl(discordUser.id, discordUser.avatar),
                        accountType: 'DISCORD',
                        isVerified: discordUser.verified
                    }
                });

                // Envoyer email de bienvenue (en arrière-plan)
                emailService.sendWelcomeEmail({
                    email: user.email,
                    pseudo: user.pseudo,
                    firstName: user.firstName || undefined
                }).catch(error => {
                    console.error('Erreur envoi email bienvenue Discord:', error);
                });
            }
        }

        // Générer les tokens JWT
        const tokens = generateTokenPair({
            userId: user.id,
            email: user.email,
            pseudo: user.pseudo,
            role: user.role
        });

        // Rediriger vers le frontend avec les tokens
        const redirectUrl = `${process.env.CORS_ORIGIN}/auth/discord/success?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;
        res.redirect(redirectUrl);

    } catch (error) {
        console.error('Erreur callback Discord:', error);
        res.redirect(`${process.env.CORS_ORIGIN}/connexion?error=discord_error`);
    }
};

/**
 * Endpoint pour obtenir l'URL d'auth Discord (pour les appels AJAX)
 */
export const getDiscordAuthUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const authUrl = discordService.getAuthorizationUrl();
        res.json({
            success: true,
            authUrl
        });
    } catch (error) {
        console.error('Erreur génération URL Discord:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération de l\'URL d\'authentification Discord'
        });
    }
};