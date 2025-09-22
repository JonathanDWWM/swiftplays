<template>
  <div class="cod-bo7-modes-page">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader title="Call of Duty BO7 - Modes Ladder" />

      <!-- Page Content -->
      <main class="page-content">
        <div class="content-container">
          <!-- Header -->
          <div class="game-header">
            <button @click="$router.back()" class="back-button">
              <Icon name="mdi:arrow-left" />
              Retour
            </button>
            
            <div class="game-info">
              <div class="game-cover">
                <img src="/cod-bo7-cover.png" alt="COD BO7" class="cover-image">
              </div>
              
              <div class="game-details">
                <h1 class="game-title">Call of Duty Black Ops 7</h1>
                <p class="game-subtitle">Modes de compétition disponibles</p>
                
                <div class="game-stats">
                  <div class="stat">
                    <span class="stat-number">{{ gameStats.totalPlayers }}</span>
                    <span class="stat-label">Joueurs inscrits</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">{{ gameStats.activeMatches }}</span>
                    <span class="stat-label">Matchs actifs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modes Section -->
          <div class="modes-section">
            <h2 class="section-title">Modes Disponibles</h2>
            
            <div class="modes-grid">
              <!-- 1v1 Mode -->
              <div class="mode-card available" @click="navigateToMode('1v1')">
                <div class="mode-icon">
                  <Icon name="mdi:account-circle" />
                  <span class="vs-text">VS</span>
                  <Icon name="mdi:account-circle" />
                </div>
                
                <div class="mode-content">
                  <h3 class="mode-title">1v1</h3>
                  <p class="mode-description">
                    Affrontez d'autres joueurs en duel individuel sur les meilleures cartes
                  </p>
                  
                  <div class="mode-stats">
                    <div class="mode-stat">
                      <span class="stat-value">{{ modeStats['1v1']?.players || 0 }}</span>
                      <span class="stat-name">Joueurs</span>
                    </div>
                    <div class="mode-stat">
                      <span class="stat-value">{{ modeStats['1v1']?.matches || 0 }}</span>
                      <span class="stat-name">Matchs aujourd'hui</span>
                    </div>
                  </div>
                  
                  <div class="mode-status">
                    <span class="status-badge active">Disponible</span>
                  </div>
                </div>
                
                <div class="mode-arrow">
                  <Icon name="mdi:chevron-right" />
                </div>
              </div>

              <!-- 2v2 Mode -->
              <div class="mode-card available" @click="navigateToMode('2v2')">
                <div class="mode-icon">
                  <Icon name="mdi:account-group" />
                  <span class="vs-text">VS</span>
                  <Icon name="mdi:account-group" />
                </div>
                
                <div class="mode-content">
                  <h3 class="mode-title">2v2</h3>
                  <p class="mode-description">
                    Formez un duo et dominez les cartes en mode coopératif
                  </p>
                  
                  <div class="mode-stats">
                    <div class="mode-stat">
                      <span class="stat-value">{{ modeStats['2v2']?.players || 0 }}</span>
                      <span class="stat-name">Équipes</span>
                    </div>
                    <div class="mode-stat">
                      <span class="stat-value">{{ modeStats['2v2']?.matches || 0 }}</span>
                      <span class="stat-name">Matchs aujourd'hui</span>
                    </div>
                  </div>
                  
                  <div class="mode-status">
                    <span class="status-badge active">Disponible</span>
                  </div>
                </div>
                
                <div class="mode-arrow">
                  <Icon name="mdi:chevron-right" />
                </div>
              </div>

              <!-- 4v4 Équipes Mode -->
              <div class="mode-card available" @click="navigateToMode('4v4')">
                <div class="mode-icon">
                  <Icon name="mdi:account-multiple" />
                  <span class="vs-text">VS</span>
                  <Icon name="mdi:account-multiple" />
                </div>
                
                <div class="mode-content">
                  <h3 class="mode-title">4v4</h3>
                  <p class="mode-description">
                    Formez une escouade complète et affrontez d'autres équipes tactiques
                  </p>
                  
                  <div class="mode-stats">
                    <div class="mode-stat">
                      <span class="stat-value">{{ modeStats['4v4']?.players || 0 }}</span>
                      <span class="stat-name">Escouades</span>
                    </div>
                    <div class="mode-stat">
                      <span class="stat-value">{{ modeStats['4v4']?.matches || 0 }}</span>
                      <span class="stat-name">Matchs aujourd'hui</span>
                    </div>
                  </div>
                  
                  <div class="mode-status">
                    <span class="status-badge active">Disponible</span>
                  </div>
                </div>
                
                <div class="mode-arrow">
                  <Icon name="mdi:chevron-right" />
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Stats Section -->
          <div class="quick-stats-section">
            <h2 class="section-title">Statistiques du Jour</h2>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">
                  <Icon name="mdi:sword-cross" />
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ dailyStats.challengesCreated }}</div>
                  <div class="stat-label">Défis créés</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">
                  <Icon name="mdi:trophy" />
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ dailyStats.matchesCompleted }}</div>
                  <div class="stat-label">Matchs terminés</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">
                  <Icon name="mdi:account-multiple" />
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ dailyStats.activePlayers }}</div>
                  <div class="stat-label">Joueurs actifs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from '~/components/Sidebar.vue'
import AppHeader from '~/components/AppHeader.vue'

definePageMeta({
  middleware: 'auth',
  layout: false
})

// État réactif
const gameStats = ref({
  totalPlayers: 0,
  activeMatches: 0
})

const modeStats = ref({
  '1v1': {
    players: 0,
    matches: 0
  },
  '2v2': {
    players: 0,
    matches: 0
  },
  '4v4': {
    players: 0,
    matches: 0
  }
})

const dailyStats = ref({
  challengesCreated: 0,
  matchesCompleted: 0,
  activePlayers: 0
})

// Méthodes
const navigateToMode = (mode) => {
  if (mode === '1v1') {
    navigateTo('/ladder/cod-bo7/1v1')
  } else if (mode === '2v2') {
    navigateTo('/ladder/cod-bo7/2v2')
  } else if (mode === '4v4') {
    navigateTo('/ladder/cod-bo7/4v4')
  }
}

const loadGameStats = async () => {
  try {
    const response = await $fetch('/api/ladder/stats/cod-bo7', {
      headers: {
        Authorization: `Bearer ${useAuth().token.value}`
      }
    })
    if (response.success) {
      gameStats.value = response.data.gameStats
      modeStats.value = response.data.modeStats
      dailyStats.value = response.data.dailyStats
    }
  } catch (error) {
    console.error('Erreur chargement stats COD BO7:', error)
    // Valeurs par défaut en cas d'erreur - vraies stats (zéro pour un site neuf)
    gameStats.value = { totalPlayers: 0, activeMatches: 0 }
    modeStats.value = { 
      '1v1': { players: 0, matches: 0 },
      '2v2': { players: 0, matches: 0 },
      '4v4': { players: 0, matches: 0 }
    }
    dailyStats.value = { challengesCreated: 0, matchesCompleted: 0, activePlayers: 0 }
  }
}

// Chargement initial
onMounted(() => {
  loadGameStats()
})
</script>

<style scoped>
.cod-bo7-modes-page {
  display: flex;
  min-height: 100vh;
  background: #0f0f0f;
  color: #f8fafc;
}

.main-content {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
  padding: 2rem;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
}

.game-header {
  margin-bottom: 3rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #EF4444;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 2rem;
}

.back-button:hover {
  background: rgba(239, 68, 68, 0.2);
}

.game-info {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  border: 2px solid rgba(239, 68, 68, 0.1);
}

.game-cover {
  width: 120px;
  height: 120px;
  border-radius: 15px;
  overflow: hidden;
  flex-shrink: 0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.game-details {
  flex: 1;
}

.game-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.5rem 0;
}

.game-subtitle {
  font-size: 1.1rem;
  color: #9CA3AF;
  margin: 0 0 1.5rem 0;
}

.game-stats {
  display: flex;
  gap: 3rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #EF4444;
}

.stat-label {
  font-size: 0.9rem;
  color: #9CA3AF;
}

.modes-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 2rem;
}

.modes-grid {
  display: grid;
  gap: 1.5rem;
}

.mode-card {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 15px;
  border: 2px solid rgba(239, 68, 68, 0.1);
  transition: all 0.3s ease;
}

.mode-card.available {
  cursor: pointer;
}

.mode-card.available:hover {
  border-color: #EF4444;
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(239, 68, 68, 0.2);
}

.mode-icon {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 2rem;
  color: #EF4444;
  flex-shrink: 0;
}

.vs-text {
  font-size: 1rem;
  font-weight: 600;
  color: #9CA3AF;
}

.mode-content {
  flex: 1;
}

.mode-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.5rem 0;
}

.mode-description {
  color: #9CA3AF;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.mode-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.mode-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #EF4444;
}

.stat-name {
  font-size: 0.8rem;
  color: #9CA3AF;
}

.mode-status {
  display: flex;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22C55E;
  border: 1px solid #22C55E;
}

.mode-arrow {
  color: #EF4444;
  font-size: 1.5rem;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mode-card.available:hover .mode-arrow {
  opacity: 1;
}

.quick-stats-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 15px;
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.stat-icon {
  color: #EF4444;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
  display: block;
}

.stat-label {
  font-size: 0.9rem;
  color: #9CA3AF;
}

@media (max-width: 1024px) {
  .main-content {
    margin-left: 240px;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  
  .game-info {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .game-stats {
    justify-content: center;
  }
  
  .mode-card {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .mode-stats {
    justify-content: center;
  }
}
</style>