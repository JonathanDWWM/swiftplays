import { Request, Response, NextFunction } from 'express';
import { validatePasswordStrength } from '../utils/password';
import { ErrorResponse } from '../types/auth';

/**
 * Valide un email
 */
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Valide un pseudo (3-20 caractères, alphanumérique + underscore)
 */
const isValidPseudo = (pseudo: string): boolean => {
    const pseudoRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return pseudoRegex.test(pseudo);
};

/**
 * Middleware de validation pour l'inscription
 */
export const validateRegister = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { email, password, pseudo, firstName, lastName } = req.body;
    const errors: string[] = [];

    // Vérification des champs obligatoires
    if (!email) {
        errors.push('L\'email est obligatoire');
    } else if (!isValidEmail(email)) {
        errors.push('Format d\'email invalide');
    }

    if (!password) {
        errors.push('Le mot de passe est obligatoire');
    } else {
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            errors.push(...passwordValidation.errors);
        }
    }

    if (!pseudo) {
        errors.push('Le pseudo est obligatoire');
    } else if (!isValidPseudo(pseudo)) {
        errors.push('Le pseudo doit contenir entre 3 et 20 caractères (lettres, chiffres, underscore uniquement)');
    }

    // Validation optionnelle des noms
    if (firstName && (firstName.length < 2 || firstName.length > 50)) {
        errors.push('Le prénom doit contenir entre 2 et 50 caractères');
    }

    if (lastName && (lastName.length < 2 || lastName.length > 50)) {
        errors.push('Le nom doit contenir entre 2 et 50 caractères');
    }

    // Si des erreurs, renvoyer la réponse d'erreur
    if (errors.length > 0) {
        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Données d\'inscription invalides',
            errors
        };
        res.status(400).json(errorResponse);
        return;
    }

    // Nettoyer les données
    req.body.email = email.toLowerCase().trim();
    req.body.pseudo = pseudo.trim();
    if (firstName) req.body.firstName = firstName.trim();
    if (lastName) req.body.lastName = lastName.trim();

    next();
};

/**
 * Middleware de validation pour la connexion
 */
export const validateLogin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { email, password } = req.body;
    const errors: string[] = [];

    if (!email) {
        errors.push('L\'email est obligatoire');
    } else if (!isValidEmail(email)) {
        errors.push('Format d\'email invalide');
    }

    if (!password) {
        errors.push('Le mot de passe est obligatoire');
    }

    if (errors.length > 0) {
        const errorResponse: ErrorResponse = {
            success: false,
            message: 'Données de connexion invalides',
            errors
        };
        res.status(400).json(errorResponse);
        return;
    }

    // Nettoyer l'email
    req.body.email = email.toLowerCase().trim();

    next();
};