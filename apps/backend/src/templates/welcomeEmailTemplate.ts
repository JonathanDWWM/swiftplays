interface WelcomeEmailData {
    pseudo: string;
    firstName?: string;
}

export const welcomeEmailTemplate = (data: WelcomeEmailData): string => {
    const { pseudo, firstName } = data;
    const displayName = firstName ? firstName : pseudo;

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur SwiftPlays</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f8f9fa;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                border-radius: 12px;
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #3B82D6 0%, #1e40af 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            
            .logo {
                font-size: 32px;
                font-weight: 900;
                margin-bottom: 10px;
                letter-spacing: -1px;
            }
            
            .header-subtitle {
                font-size: 18px;
                opacity: 0.9;
                font-weight: 300;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .welcome-message {
                font-size: 24px;
                font-weight: 700;
                color: #0A0A0A;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .intro-text {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 30px;
                text-align: center;
                line-height: 1.7;
            }
            
            .features-section {
                background-color: #f8fafc;
                border-radius: 12px;
                padding: 30px;
                margin: 30px 0;
            }
            
            .features-title {
                font-size: 20px;
                font-weight: 700;
                color: #0A0A0A;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .feature-list {
                list-style: none;
                padding: 0;
            }
            
            .feature-item {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                font-size: 16px;
                color: #4a5568;
            }
            
            .feature-icon {
                width: 24px;
                height: 24px;
                background-color: #3B82D6;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                color: white;
                font-weight: bold;
                font-size: 14px;
            }
            
            .cta-section {
                text-align: center;
                margin: 40px 0;
            }
            
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #3B82D6 0%, #1e40af 100%);
                color: white;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 16px;
                transition: transform 0.2s ease;
                box-shadow: 0 4px 12px rgba(59, 130, 214, 0.3);
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(59, 130, 214, 0.4);
            }
            
            .footer {
                background-color: #0A0A0A;
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .footer-content {
                margin-bottom: 20px;
            }
            
            .footer-text {
                font-size: 14px;
                opacity: 0.8;
                margin-bottom: 10px;
            }
            
            .footer-logo {
                font-size: 20px;
                font-weight: 700;
                color: #3B82D6;
                margin-bottom: 15px;
            }
            
            .social-links {
                margin-top: 20px;
            }
            
            .social-link {
                display: inline-block;
                margin: 0 10px;
                color: #3B82D6;
                text-decoration: none;
                font-size: 14px;
                padding: 8px 16px;
                border: 1px solid #3B82D6;
                border-radius: 6px;
                transition: all 0.2s ease;
            }
            
            .social-link:hover {
                background-color: #3B82D6;
                color: white;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 0;
                    border-radius: 0;
                }
                
                .header,
                .content,
                .footer {
                    padding: 30px 20px;
                }
                
                .welcome-message {
                    font-size: 20px;
                }
                
                .features-section {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <!-- Header -->
            <div class="header">
                <div class="logo">SwiftPlays</div>
                <div class="header-subtitle">Plateforme de Gaming Compétitif</div>
            </div>
            
            <!-- Content -->
            <div class="content">
                <h1 class="welcome-message">Bienvenue ${displayName} ! 🎮</h1>
                
                <p class="intro-text">
                    Félicitations ! Ton compte <strong>${pseudo}</strong> a été créé avec succès sur SwiftPlays.
                    Tu fais maintenant partie de notre communauté de gamers passionnés !
                </p>
                
                <div class="features-section">
                    <h2 class="features-title">Ce qui t'attend sur SwiftPlays :</h2>
                    <ul class="feature-list">
                        <li class="feature-item">
                            <div class="feature-icon">🏆</div>
                            Participe à des tournois épiques et remporte des prix
                        </li>
                        <li class="feature-item">
                            <div class="feature-icon">👥</div>
                            Forme ou rejoins une équipe avec tes amis
                        </li>
                        <li class="feature-item">
                            <div class="feature-icon">📊</div>
                            Suis tes statistiques et progresse constamment
                        </li>
                        <li class="feature-item">
                            <div class="feature-icon">🎯</div>
                            Défie d'autres joueurs dans des matchs classés
                        </li>
                        <li class="feature-item">
                            <div class="feature-icon">💬</div>
                            Connecte-toi avec la communauté gaming
                        </li>
                    </ul>
                </div>
                
                <div class="cta-section">
                    <a href="#" class="cta-button">Commencer à jouer maintenant</a>
                </div>
                
                <p class="intro-text">
                    Si tu as des questions ou besoin d'aide, notre équipe de support est toujours là pour t'accompagner.
                    Prêt à dominer les classements ? 🚀
                </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="footer-content">
                    <div class="footer-logo">SwiftPlays</div>
                    <p class="footer-text">La plateforme ultime pour les gamers compétitifs</p>
                    <p class="footer-text">Merci de faire partie de notre communauté !</p>
                </div>
                
                <div class="social-links">
                    <a href="#" class="social-link">Discord</a>
                    <a href="#" class="social-link">Twitter</a>
                    <a href="#" class="social-link">Support</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};