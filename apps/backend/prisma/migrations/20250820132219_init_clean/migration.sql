-- CreateEnum (si n'existe pas déjà)
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'MODERATOR', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (si n'existe pas déjà)  
DO $$ BEGIN
    CREATE TYPE "AccountType" AS ENUM ('EMAIL', 'DISCORD', 'HYBRID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (si n'existe pas déjà)
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (si n'existe pas déjà)
DO $$ BEGIN
    CREATE TYPE "MessageType" AS ENUM ('SYSTEM_WELCOME', 'SYSTEM_UPDATE', 'SYSTEM_MAINTENANCE', 'MATCH_CHALLENGE', 'MATCH_RESULT', 'TOURNAMENT_INVITE', 'PRIVATE_MESSAGE', 'LOBBY_INVITE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (si n'existe pas déjà)
DO $$ BEGIN
    CREATE TYPE "MessageCategory" AS ENUM ('NOTIFICATION', 'INVITATION', 'SYSTEM', 'PRIVATE', 'LOBBY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (si n'existe pas déjà)
DO $$ BEGIN
    CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable (si n'existe pas déjà)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "pseudo" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "discordId" TEXT,
    "discordUsername" TEXT,
    "discordAvatar" TEXT,
    "accountType" "AccountType" NOT NULL DEFAULT 'EMAIL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable (si n'existe pas déjà)
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable (si n'existe pas déjà)
CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "category" "MessageCategory" NOT NULL DEFAULT 'NOTIFICATION',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actions" JSONB,
    "data" JSONB,
    "senderId" TEXT,
    "receiverId" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (si n'existe pas déjà)
DO $$ BEGIN
    CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex (si n'existe pas déjà)
DO $$ BEGIN
    CREATE UNIQUE INDEX "users_pseudo_key" ON "users"("pseudo");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex (si n'existe pas déjà)
DO $$ BEGIN
    CREATE UNIQUE INDEX "users_discordId_key" ON "users"("discordId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex (si n'existe pas déjà)
DO $$ BEGIN
    CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex (si n'existe pas déjà)
DO $$ BEGIN
    CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex (si n'existe pas déjà)
DO $$ BEGIN
    CREATE INDEX "messages_receiverId_isRead_idx" ON "messages"("receiverId", "isRead");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex (si n'existe pas déjà)
DO $$ BEGIN
    CREATE INDEX "messages_receiverId_createdAt_idx" ON "messages"("receiverId", "createdAt");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex (si n'existe pas déjà)
DO $$ BEGIN
    CREATE INDEX "messages_receiverId_category_idx" ON "messages"("receiverId", "category");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- AddForeignKey (si n'existe pas déjà)
DO $$ BEGIN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (si n'existe pas déjà)
DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (si n'existe pas déjà)
DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;