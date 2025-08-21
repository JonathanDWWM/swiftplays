-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "TeamMemberRole" AS ENUM ('CAPTAIN', 'CO_CAPTAIN', 'MEMBER', 'SUBSTITUTE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterEnum (ajout du type TEAM_INVITATION)
ALTER TYPE "MessageType" ADD VALUE 'TEAM_INVITATION';

-- CreateTable
CREATE TABLE IF NOT EXISTS "team_members" (
    "id" TEXT NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'MEMBER',
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (si n'existe pas déjà)
DO $$ BEGIN
    CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- AddForeignKey (si n'existe pas déjà)
DO $$ BEGIN
    ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (si n'existe pas déjà)
DO $$ BEGIN
    ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;