import { prisma } from '../lib/prisma';
import { notificationService } from './notificationService';

class SanctionCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Démarrer le service de nettoyage automatique
   */
  start() {
    // Nettoyer toutes les 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSanctions();
    }, 5 * 60 * 1000);

    console.log('🧹 Service de nettoyage des sanctions démarré');
    
    // Nettoyage initial
    this.cleanupExpiredSanctions();
  }

  /**
   * Arrêter le service
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Service de nettoyage des sanctions arrêté');
    }
  }

  /**
   * Nettoyer les sanctions expirées
   */
  private async cleanupExpiredSanctions() {
    try {
      const now = new Date();
      
      // Trouver les sanctions expirées qui sont encore actives
      const expiredSanctions = await prisma.userSanction.findMany({
        where: {
          isActive: true,
          expiresAt: {
            lte: now
          }
        },
        include: {
          user: { select: { id: true, pseudo: true } }
        }
      });

      if (expiredSanctions.length > 0) {
        console.log(`🧹 Nettoyage de ${expiredSanctions.length} sanctions expirées`);

        // Désactiver toutes les sanctions expirées
        await prisma.userSanction.updateMany({
          where: {
            isActive: true,
            expiresAt: {
              lte: now
            }
          },
          data: {
            isActive: false
          }
        });

        // Notifier les utilisateurs que leur sanction a expiré
        for (const sanction of expiredSanctions) {
          try {
            await notificationService.createNotification(sanction.user.id, {
              type: 'SYSTEM_UPDATE' as any,
              category: 'SYSTEM' as any,
              title: '✅ Sanction expirée',
              content: `Votre sanction temporaire a expiré. Vous retrouvez l'accès complet à la plateforme.`,
              priority: 'NORMAL' as any,
              data: {
                sanctionExpired: true,
                sanctionType: sanction.type
              }
            });
          } catch (notifError) {
            console.error(`Erreur notification expiration sanction pour ${sanction.user.pseudo}:`, notifError);
          }
        }
      }
    } catch (error) {
      console.error('Erreur nettoyage sanctions expirées:', error);
    }
  }

  /**
   * Vérifier si un utilisateur a une sanction active
   */
  async hasActiveSanction(userId: string, sanctionTypes?: string[]): Promise<boolean> {
    const where: any = {
      userId,
      isActive: true
    };

    if (sanctionTypes && sanctionTypes.length > 0) {
      where.type = { in: sanctionTypes };
    }

    const activeSanction = await prisma.userSanction.findFirst({
      where
    });

    return !!activeSanction;
  }

  /**
   * Récupérer les sanctions actives d'un utilisateur
   */
  async getActiveSanctions(userId: string) {
    return await prisma.userSanction.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        adminUser: { select: { pseudo: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Vérifier si un utilisateur est banni
   */
  async isUserBanned(userId: string): Promise<boolean> {
    return await this.hasActiveSanction(userId, ['PERMANENT_BAN', 'TEMPORARY_BAN']);
  }

  /**
   * Vérifier si un utilisateur est mute du chat
   */
  async isUserMuted(userId: string): Promise<boolean> {
    return await this.hasActiveSanction(userId, ['CHAT_MUTE']);
  }
}

export const sanctionCleanupService = new SanctionCleanupService();