import jwt from 'jsonwebtoken';

export interface JWTPayload {
    userId: string;
    email: string;
    pseudo: string;
    role: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

/**
 * Génère un token d'accès (courte durée)
 */
export const generateAccessToken = (payload: JWTPayload): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET non défini dans les variables d\'environnement');
    }

    return jwt.sign(payload, secret, {
        expiresIn: '15m', // 15 minutes
        issuer: 'swiftplays-api',
        audience: 'swiftplays-client'
    });
};

/**
 * Génère un token de refresh (longue durée)
 */
export const generateRefreshToken = (userId: string): string => {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
        throw new Error('JWT_REFRESH_SECRET non défini dans les variables d\'environnement');
    }

    return jwt.sign(
        { userId, type: 'refresh' },
        secret,
        {
            expiresIn: '7d', // 7 jours
            issuer: 'swiftplays-api',
            audience: 'swiftplays-client'
        }
    );
};

/**
 * Génère une paire de tokens (access + refresh)
 */
export const generateTokenPair = (user: JWTPayload): TokenPair => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.userId);

    return {
        accessToken,
        refreshToken
    };
};

/**
 * Vérifie et décode un token d'accès
 */
export const verifyAccessToken = (token: string): JWTPayload => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET non défini');
    }

    try {
        const decoded = jwt.verify(token, secret, {
            issuer: 'swiftplays-api',
            audience: 'swiftplays-client'
        }) as JWTPayload;

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Token expiré');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Token invalide');
        }
        throw new Error('Erreur de vérification du token');
    }
};

/**
 * Vérifie et décode un refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string; type: string } => {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
        throw new Error('JWT_REFRESH_SECRET non défini');
    }

    try {
        const decoded = jwt.verify(token, secret, {
            issuer: 'swiftplays-api',
            audience: 'swiftplays-client'
        }) as { userId: string; type: string };

        if (decoded.type !== 'refresh') {
            throw new Error('Type de token invalide');
        }

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token expiré');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Refresh token invalide');
        }
        throw new Error('Erreur de vérification du refresh token');
    }
};