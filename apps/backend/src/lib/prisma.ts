import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error', 'warn'],
  errorFormat: 'pretty',
});

// Test de connexion au démarrage
prisma.$connect()
  .then(() => {
    console.log('✅ [Prisma] Connexion à la base de données établie');
  })
  .catch((error) => {
    console.error('❌ [Prisma] Erreur de connexion à la base de données:', error);
    console.error('Détails:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Déconnexion propre
process.on('beforeExit', async () => {
  console.log('🔌 [Prisma] Fermeture de la connexion...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('🔌 [Prisma] Fermeture forcée de la connexion...');
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };