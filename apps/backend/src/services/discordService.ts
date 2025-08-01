import axios from 'axios';

interface DiscordTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    email: string;
    verified: boolean;
}

class DiscordService {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.DISCORD_CLIENT_ID || '';
        this.clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
        this.redirectUri = process.env.DISCORD_REDIRECT_URI || '';
    }

    /**
     * Génère l'URL d'autorisation Discord
     */
    getAuthorizationUrl(): string {
        const baseUrl = 'https://discord.com/api/oauth2/authorize';
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: 'identify email',
            state: Math.random().toString(36).substring(2, 15) // Protection CSRF basique
        });

        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Échange le code d'autorisation contre un token d'accès
     */
    async exchangeCodeForToken(code: string): Promise<DiscordTokenResponse> {
        try {
            const response = await axios.post('https://discord.com/api/oauth2/token', 
                new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.redirectUri,
                }), 
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Erreur échange code Discord:', error);
            throw new Error('Impossible d\'échanger le code Discord');
        }
    }

    /**
     * Récupère les informations utilisateur Discord
     */
    async getUserInfo(accessToken: string): Promise<DiscordUser> {
        try {
            const response = await axios.get('https://discord.com/api/v10/users/@me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error) {
            console.error('Erreur récupération utilisateur Discord:', error);
            throw new Error('Impossible de récupérer les informations utilisateur Discord');
        }
    }

    /**
     * Construit l'URL de l'avatar Discord
     */
    getAvatarUrl(userId: string, avatarHash: string | null): string | null {
        if (!avatarHash) return null;
        return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=256`;
    }

    /**
     * Formate le nom d'utilisateur Discord
     */
    formatDiscordUsername(username: string, discriminator: string): string {
        // Discord a supprimé les discriminators pour la plupart des utilisateurs
        return discriminator === '0' ? username : `${username}#${discriminator}`;
    }
}

export const discordService = new DiscordService();