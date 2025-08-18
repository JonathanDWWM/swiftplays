import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// Import des routes
import authRoutes from './routes/auth';
import discordAuthRoutes from './routes/discordAuth';

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

// Initialiser Prisma
const prisma = new PrismaClient();

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

// Futures routes API
// app.use('/api/users', userRoutes);
// app.use('/api/teams', teamRoutes);
// app.use('/api/matches', matchRoutes);

// Socket.io pour le temps réel
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Event de test pour l'authentification temps réel
    socket.on('authenticate', (data) => {
        console.log('🔐 Client authentication attempt:', data);
        // TODO: Implémenter l'auth Socket.io plus tard
    });

    // Rejoindre une room (équipe, match, etc.)
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`📡 Client ${socket.id} joined room: ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

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

    // Fermer les connexions Prisma
    await prisma.$disconnect();

    // Fermer le serveur HTTP
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});

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
    console.log('========================================');
});