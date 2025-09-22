import { prisma } from '../lib/prisma';

/**
 * Service de nettoyage automatique du Ladder
 * Responsable de la gestion des défis expirés, matchs abandonnés, etc.
 */
export class LadderCleanupService {
  
  /**
   * Marquer les défis expirés comme EXPIRED
   */
  static async expireOldChallenges(): Promise<number> {
    try {
      const now = new Date();
      
      const result = await prisma.challenge.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: {
            lte: now
          }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      if (result.count > 0) {
        console.log(`🧹 [Ladder Cleanup] ${result.count} défi(s) expiré(s) marqué(s) comme EXPIRED`);
      }

      return result.count;
    } catch (error) {
      console.error('❌ [Ladder Cleanup] Erreur lors de l\'expiration des défis:', error);
      return 0;
    }
  }

  /**
   * Annuler les matchs qui n'ont pas eu lieu (2h après l'heure programmée)
   */
  static async cancelAbandonedMatches(): Promise<number> {
    try {
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      // Récupérer les matchs à annuler
      const matchesToCancel = await prisma.match.findMany({
        where: {
          status: 'IN_PROGRESS',
          scheduledAt: {
            lte: twoHoursAgo
          },
          submissions: {
            none: {} // Aucune soumission de résultats
          }
        },
        include: {
          challenge: true
        }
      });

      let canceledCount = 0;

      for (const match of matchesToCancel) {
        await prisma.$transaction(async (tx) => {
          // Annuler le match
          await tx.match.update({
            where: { id: match.id },
            data: { status: 'CANCELLED' }
          });

          // Mettre à jour le challenge associé si il existe
          if (match.challenge) {
            await tx.challenge.update({
              where: { id: match.challenge.id },
              data: { status: 'CANCELLED' }
            });
          }
        });

        canceledCount++;
      }

      if (canceledCount > 0) {
        console.log(`🧹 [Ladder Cleanup] ${canceledCount} match(s) abandonné(s) annulé(s)`);
      }

      return canceledCount;
    } catch (error) {
      console.error('❌ [Ladder Cleanup] Erreur lors de l\'annulation des matchs abandonnés:', error);
      return 0;
    }
  }

  /**
   * Nettoyer les anciens défis et matchs (plus de 7 jours)
   */
  static async cleanupOldData(): Promise<{ challenges: number, matches: number }> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Supprimer les anciens défis terminés/expirés/annulés
      const challengesResult = await prisma.challenge.deleteMany({
        where: {
          status: {
            in: ['EXPIRED', 'CANCELLED', 'COMPLETED']
          },
          createdAt: {
            lte: sevenDaysAgo
          }
        }
      });

      // Supprimer les anciens matchs terminés/annulés (mais pas les COMPLETED pour les stats)
      const matchesResult = await prisma.match.deleteMany({
        where: {
          status: {
            in: ['CANCELLED']
          },
          createdAt: {
            lte: sevenDaysAgo
          }
        }
      });

      if (challengesResult.count > 0 || matchesResult.count > 0) {
        console.log(`🧹 [Ladder Cleanup] Données anciennes supprimées: ${challengesResult.count} défi(s), ${matchesResult.count} match(s)`);
      }

      return {
        challenges: challengesResult.count,
        matches: matchesResult.count
      };
    } catch (error) {
      console.error('❌ [Ladder Cleanup] Erreur lors du nettoyage des anciennes données:', error);
      return { challenges: 0, matches: 0 };
    }
  }

  /**
   * Recalculer les rangs dans le classement
   */
  static async updateRankings(): Promise<void> {
    try {
      // Pour chaque combinaison jeu/mode, recalculer les rangs
      const gameModes = [
        { game: 'FC_26', gameMode: '1v1' }
        // Ajouter d'autres jeux/modes ici plus tard
      ];

      for (const { game, gameMode } of gameModes) {
        // Récupérer tous les joueurs triés par victoires/défaites
        const players = await prisma.ladderPlayer.findMany({
          where: {
            game: game as any,
            gameMode,
            matchesPlayed: {
              gt: 0
            }
          },
          orderBy: [
            { victories: 'desc' },
            { defeats: 'asc' },
            { lastMatchAt: 'desc' }
          ]
        });

        // Mettre à jour les rangs
        for (let i = 0; i < players.length; i++) {
          await prisma.ladderPlayer.update({
            where: { id: players[i].id },
            data: { rank: i + 1 }
          });
        }

        if (players.length > 0) {
          console.log(`🧹 [Ladder Cleanup] Rangs mis à jour pour ${game} ${gameMode}: ${players.length} joueur(s)`);
        }
      }
    } catch (error) {
      console.error('❌ [Ladder Cleanup] Erreur lors de la mise à jour des rangs:', error);
    }
  }

  /**
   * Exécuter toutes les tâches de nettoyage
   */
  static async runAllCleanupTasks(): Promise<void> {
    console.log('🧹 [Ladder Cleanup] Démarrage du nettoyage automatique...');
    
    const startTime = Date.now();
    
    // Exécuter toutes les tâches en parallèle
    const [
      expiredChallenges,
      canceledMatches,
      cleanedData
    ] = await Promise.all([
      this.expireOldChallenges(),
      this.cancelAbandonedMatches(),
      this.cleanupOldData()
    ]);

    // Mettre à jour les rangs (séquentiel car dépendant des données)
    await this.updateRankings();
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ [Ladder Cleanup] Nettoyage terminé en ${duration}ms`);
    console.log(`   • ${expiredChallenges} défi(s) expiré(s)`);
    console.log(`   • ${canceledMatches} match(s) annulé(s)`);
    console.log(`   • ${cleanedData.challenges} ancien(s) défi(s) supprimé(s)`);
    console.log(`   • ${cleanedData.matches} ancien(s) match(s) supprimé(s)`);
  }

  /**
   * Démarrer le service de nettoyage automatique (toutes les 10 minutes)
   */
  static startPeriodicCleanup(): NodeJS.Timeout {
    console.log('🚀 [Ladder Cleanup] Service de nettoyage automatique démarré (intervalle: 10 minutes)');
    
    // Exécuter immédiatement
    this.runAllCleanupTasks();
    
    // Puis toutes les 10 minutes
    return setInterval(() => {
      this.runAllCleanupTasks();
    }, 10 * 60 * 1000); // 10 minutes
  }
}