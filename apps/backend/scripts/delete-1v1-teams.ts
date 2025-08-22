import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function delete1v1Teams() {
  try {
    console.log('🔍 Recherche des équipes 1v1...');
    
    // Récupérer toutes les équipes 1v1
    const teamsToDelete = await prisma.team.findMany({
      where: {
        gameMode: '1v1'
      },
      include: {
        owner: {
          select: {
            pseudo: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                pseudo: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 ${teamsToDelete.length} équipe(s) 1v1 trouvée(s)`);

    if (teamsToDelete.length === 0) {
      console.log('✅ Aucune équipe 1v1 à supprimer');
      return;
    }

    // Afficher les équipes qui vont être supprimées
    console.log('\n📋 Équipes qui vont être supprimées :');
    teamsToDelete.forEach(team => {
      console.log(`- ${team.name} (${team.game} ${team.gameMode}) - Propriétaire: ${team.owner.pseudo}`);
    });

    console.log('\n🗑️ Suppression des équipes 1v1...');

    // Supprimer toutes les équipes 1v1 (les membres seront supprimés automatiquement grâce à onDelete: Cascade)
    const deleteResult = await prisma.team.deleteMany({
      where: {
        gameMode: '1v1'
      }
    });

    console.log(`✅ ${deleteResult.count} équipe(s) 1v1 supprimée(s) avec succès !`);
    console.log('ℹ️ Les compétitions individuelles 1v1 seront maintenant gérées par le système Ladder');

  } catch (error) {
    console.error('❌ Erreur lors de la suppression des équipes 1v1:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
delete1v1Teams();