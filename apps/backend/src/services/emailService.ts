import nodemailer from 'nodemailer';
import { welcomeEmailTemplate } from '../templates/welcomeEmailTemplate';

interface EmailConfig {
    service: string;
    auth: {
        user: string;
        pass: string;
    };
}

interface WelcomeEmailData {
    email: string;
    pseudo: string;
    firstName?: string;
}

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        const config: EmailConfig = {
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER || '',
                pass: process.env.EMAIL_PASS || ''
            }
        };

        this.transporter = nodemailer.createTransport(config);
    }

    /**
     * Envoie un email de bienvenue après inscription
     */
    async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
        try {
            const { email, pseudo, firstName } = data;
            
            const mailOptions = {
                from: {
                    name: 'SwiftPlays',
                    address: process.env.EMAIL_USER || 'no-reply@swiftplays.com'
                },
                to: email,
                subject: '🎮 Bienvenue sur SwiftPlays !',
                html: welcomeEmailTemplate({ pseudo, firstName })
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email de bienvenue envoyé:', result.messageId);
            return true;
        } catch (error) {
            console.error('Erreur envoi email de bienvenue:', error);
            return false;
        }
    }

    /**
     * Vérifie la configuration de l'email
     */
    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('Configuration email valide');
            return true;
        } catch (error) {
            console.error('Erreur configuration email:', error);
            return false;
        }
    }
}

export const emailService = new EmailService();