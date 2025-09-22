import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from './lib/prisma';
import { LadderCleanupService } from './services/ladderCleanupService';
import { sanctionCleanupService } from './services/sanctionCleanupService';
import SocketService from './services/socketService';
import ChatSocketService from './services/chatSocketService';
import { setSocketService } from './services/notificationService';
import { setChatSocketService } from './controllers/chatController';

// Import des routes
import authRoutes from './routes/auth';
import discordAuthRoutes from './routes/discordAuth';
import searchRoutes from './routes/search';
import teamsRoutes from './routes/teams';
import teamInvitationsRoutes from './routes/teamInvitations';
import usersRoutes from './routes/users';
import notificationsRoutes from './routes/notifications';
import messagesRoutes from './routes/messages';
import ladderRoutes from './routes/ladder';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';
import chatRoutes from './routes/chat';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});


const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' })); // Augmenté pour les uploads futurs
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques pour les uploads
app.use('/uploads', express.static('uploads'));

// Routes de base
app.get('/', (req, res) => {
    res.json({
        message: 'SwiftPlays API is running!',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        features: {
            authentication: true,
            realTime: true,
            database: true
        }
    });
});

app.get('/health', async (req, res) => {
    try {
        // Test de connexion à la base de données
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: 'Connected',
            services: {
                api: 'Running',
                websocket: 'Running',
                database: 'Connected'
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            database: 'Disconnected',
            error: 'Database connection failed'
        });
    }
});

// Routes API - Authentification
app.use('/api/auth', authRoutes);
app.use('/api/auth', discordAuthRoutes);

// Routes API - Recherche
app.use('/api/search', searchRoutes);

// Routes API - Équipes
app.use('/api/teams', teamsRoutes);
app.use('/api/teams', teamInvitationsRoutes);

// Routes API - Utilisateurs
app.use('/api/users', usersRoutes);

// Routes API - Notifications
app.use('/api/notifications', notificationsRoutes);

// Routes API - Messages (nouveau système unifié)
app.use('/api/messages', messagesRoutes);

// Routes API - Ladder (système de compétition individuelle)
app.use('/api/ladder', ladderRoutes);

// Routes API - Upload de fichiers
app.use('/api/upload', uploadRoutes);

// Routes API - Administration
app.use('/api/admin', adminRoutes);

// Routes API - Chat temps réel
app.use('/api/chat', chatRoutes);

// Initialiser les services Socket.io
const socketService = new SocketService(io);
const chatSocketService = new ChatSocketService(io);
setSocketService(socketService);
setChatSocketService(chatSocketService);

// Export pour utilisation dans les contrôleurs
export { chatSocketService };

// Gestionnaire d'erreurs global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('🚨 Global error handler:', err);

    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Erreur interne du serveur'
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// Route 404 supprimée temporairement - cause des problèmes avec path-to-regexp
// On la rajoutera plus tard une fois tout stabilisé

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', async () => {
    console.log('🔄 Arrêt du serveur en cours...');

    // Arrêter le service de nettoyage
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        console.log('🧹 Service de nettoyage automatique arrêté');
    }

    // Fermer les connexions Prisma
    await prisma.$disconnect();

    // Fermer le serveur HTTP
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});

// Variable pour stocker l'intervalle de nettoyage
let cleanupInterval: NodeJS.Timeout;

// Démarrer le serveur
server.listen(PORT, () => {
    console.log('🚀 SwiftPlays API Server Started!');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔐 Authentication: Enabled`);
    console.log(`⚡ WebSocket: Enabled`);
    console.log(`💾 Database: PostgreSQL + Prisma`);
    console.log('');
    console.log('📋 Available API Endpoints:');
    console.log('   GET  / - API Status');
    console.log('   GET  /health - Health Check');
    console.log('   POST /api/auth/register - User Registration');
    console.log('   POST /api/auth/login - User Login');
    console.log('   POST /api/auth/refresh - Refresh Token');
    console.log('   GET  /api/auth/me - Get User Profile');
    console.log('   POST /api/auth/logout - User Logout');
    console.log('   GET  /api/search/users - Search Users');
    console.log('   GET  /api/search/users/:pseudo - Get Public Profile');
    console.log('   POST /api/teams - Create Team');
    console.log('   GET  /api/teams/my - Get My Teams');
    console.log('   GET  /api/teams/:id - Get Team by ID');
    console.log('   PUT  /api/teams/:id - Update Team');
    console.log('   DELETE /api/teams/:id - Delete Team');
    console.log('   GET  /api/notifications - Get Notifications');
    console.log('   GET  /api/notifications/unread-count - Get Unread Count');
    console.log('   POST /api/notifications/:id/read - Mark as Read');
    console.log('   POST /api/notifications/mark-all-read - Mark All Read');
    console.log('   🏆 LADDER SYSTEM:');
    console.log('   POST /api/ladder/challenges - Create Challenge');
    console.log('   GET  /api/ladder/challenges - Get Available Challenges');
    console.log('   POST /api/ladder/challenges/:id/accept - Accept Challenge');
    console.log('   GET  /api/ladder/matches/my - Get My Matches');
    console.log('   POST /api/ladder/matches/:id/result - Submit Match Result');
    console.log('   GET  /api/ladder/ranking - Get Ladder Ranking');
    console.log('   GET  /api/ladder/stats - Get Player Stats');
    console.log('========================================');
    
    // Démarrer le service de nettoyage automatique
    cleanupInterval = LadderCleanupService.startPeriodicCleanup();
    
    // Démarrer le service de nettoyage des sanctions
    sanctionCleanupService.start();
});