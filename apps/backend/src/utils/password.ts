import bcrypt from 'bcryptjs';

/**
 * Hash un mot de passe avec bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 12; // Sécurité élevée
    return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare un mot de passe en clair avec un hash
 */
export const comparePassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
};

/**
 * Valide la force d'un mot de passe
 * Règles : 8 caractères minimum, au moins 1 majuscule, 1 chiffre
 */
export const validatePasswordStrength = (password: string): {
    isValid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    // Longueur minimum
    if (password.length < 8) {
        errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Au moins une majuscule
    if (!/[A-Z]/.test(password)) {
        errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    // Au moins un chiffre
    if (!/[0-9]/.test(password)) {
        errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};