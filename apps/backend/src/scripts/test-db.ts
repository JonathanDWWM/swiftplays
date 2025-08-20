import { prisma } from '../lib/prisma';

async function testDatabaseConnection() {
  console.log('🔍 Test de connexion à la base de données...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:\/]*@/, ':***@')); // Masque le mot de passe
  
  try {
    // Test 1: Connexion de base
    console.log('\n1. Test de connexion...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connexion OK');

    // Test 2: Test des utilisateurs
    console.log('\n2. Test de récupération utilisateurs...');
    const userCount = await prisma.user.count();
    console.log(`✅ ${userCount} utilisateurs dans la base`);

    // Test 3: Test des équipes
    console.log('\n3. Test de récupération équipes...');
    const teamCount = await prisma.team.count();
    console.log(`✅ ${teamCount} équipes dans la base`);

    // Test 4: Test des invitations
    console.log('\n4. Test de récupération invitations...');
    const invitationCount = await prisma.teamInvitation.count();
    console.log(`✅ ${invitationCount} invitations dans la base`);

    // Test 5: Test d'une requête complexe similaire à celle qui échoue
    console.log('\n5. Test requête complexe...');
    const testUser = await prisma.user.findFirst({
      select: { id: true, pseudo: true }
    });
    
    if (testUser) {
      console.log(`✅ Utilisateur test trouvé: ${testUser.pseudo}`);
      
      // Simuler la requête d'équipes qui échoue
      const teamMemberships = await prisma.teamMember.findMany({
        where: {
          userId: testUser.id
        },
        include: {
          team: {
            include: {
              creator: {
                select: {
                  id: true,
                  pseudo: true,
                  avatar: true,
                  discordAvatar: true
                }
              },
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      pseudo: true,
                      avatar: true,
                      discordAvatar: true
                    }
                  }
                }
              },
              _count: {
                select: {
                  members: true
                }
              }
            }
          }
        },
        orderBy: {
          joinedAt: 'desc'
        }
      });
      
      console.log(`✅ ${teamMemberships.length} équipes trouvées pour ${testUser.pseudo}`);
    } else {
      console.log('ℹ️ Aucun utilisateur trouvé');
    }

  } catch (error: any) {
    console.error('❌ Erreur durant les tests:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Connexion fermée');
  }
}

testDatabaseConnection();