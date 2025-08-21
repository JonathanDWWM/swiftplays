-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "Game" AS ENUM ('FC_26', 'CALL_OF_DUTY_BO7');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable (si n'existe pas déjà)
CREATE TABLE IF NOT EXISTS "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "game" "Game" NOT NULL,
    "gameMode" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (si n'existe pas déjà)
DO $$ BEGIN
    CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex (si n'existe pas déjà)
DO $$ BEGIN
    CREATE UNIQUE INDEX "teams_shortName_key" ON "teams"("shortName");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- AddForeignKey (si n'existe pas déjà)
DO $$ BEGIN
    ALTER TABLE "teams" ADD CONSTRAINT "teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
