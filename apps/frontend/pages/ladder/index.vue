<template>
  <div class="ladder-selection-page">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader title="Ladder" />

      <!-- Page Content -->
      <main class="page-content">
        <div class="content-container">
          <!-- Header -->
          <div class="ladder-header">
            <div class="header-content">
              <div class="title-section">
                <h1 class="page-title">
                  <Icon name="mdi:trophy" class="title-icon" />
                  Ladder
                </h1>
                <p class="page-subtitle">
                  Choisissez votre jeu et défiez d'autres joueurs dans le mode compétitif
                </p>
              </div>
            </div>
          </div>

          <!-- Games Selection -->
          <div class="games-section">
            <h2 class="section-title">Jeux Disponibles</h2>
            
            <div class="games-grid">
              <!-- FC 26 Game Card -->
              <div class="game-card fc26" @click="navigateToGame('fc26')">
                <div class="game-cover">
                  <img src="/fifa25-cover.png" alt="FC26" class="cover-image">
                  <div class="game-overlay">
                    <div class="game-content">
                      <div class="game-header">
                        <Icon name="mdi:soccer" class="game-icon" />
                        <h3 class="game-title">FC 26</h3>
                      </div>
                      
                      <div class="game-stats">
                        <div class="stat">
                          <span class="stat-number">{{ gameStats.fc26.ongoingMatches }}</span>
                          <span class="stat-label">Matchs en cours</span>
                        </div>
                      </div>
                      
                      <div class="game-status">
                        <span class="status-badge active">Disponible</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Call of Duty BO7 Game Card -->
              <div class="game-card cod-bo7" @click="navigateToGame('cod-bo7')">
                <div class="game-cover">
                  <img src="/blackops6-cover.png" alt="Call of Duty BO7" class="cover-image">
                  <div class="game-overlay">
                    <div class="game-content">
                      <div class="game-header">
                        <Icon name="mdi:pistol" class="game-icon" />
                        <h3 class="game-title">Call of Duty BO7</h3>
                      </div>
                      
                      <div class="game-stats">
                        <div class="stat">
                          <span class="stat-number">{{ gameStats.codBo7.ongoingMatches }}</span>
                          <span class="stat-label">Matchs en cours</span>
                        </div>
                      </div>
                      
                      <div class="game-status">
                        <span class="status-badge coming-soon">Bientôt disponible</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="activity-section" v-if="recentActivity.length > 0">
            <h2 class="section-title">Activité Récente</h2>
            
            <div class="activity-list">
              <div 
                v-for="activity in recentActivity" 
                :key="activity.id"
                class="activity-item"
              >
                <div class="activity-icon">
                  <Icon :name="getActivityIcon(activity.type)" />
                </div>
                <div class="activity-content">
                  <p class="activity-text">{{ activity.message }}</p>
                  <span class="activity-time">{{ formatDateTime(activity.createdAt) }}</span>
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
  fc26: {
    activePlayers: 0,
    ongoingMatches: 0
  },
  codBo7: {
    activePlayers: 0,
    ongoingMatches: 0
  }
})

const recentActivity = ref([])

// Méthodes
const navigateToGame = (gameId) => {
  if (gameId === 'fc26') {
    navigateTo('/ladder/fc26')
  } else if (gameId === 'cod-bo7') {
    // Pour l'instant, afficher un message
    const { addNotification } = useNotifications()
    addNotification('Call of Duty BO7 sera bientôt disponible !', 'info')
  }
}

const getActivityIcon = (type) => {
  const icons = {
    'match_completed': 'mdi:trophy',
    'challenge_created': 'mdi:sword-cross',
    'ranking_updated': 'mdi:podium'
  }
  return icons[type] || 'mdi:information'
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadGameStats = async () => {
  try {
    const response = await $fetch('/api/ladder/stats/games', {
      headers: {
        Authorization: `Bearer ${useAuth().token.value}`
      }
    })
    if (response.success) {
      gameStats.value = response.data
    }
  } catch (error) {
    console.error('Erreur chargement stats jeux:', error)
  }
}

const loadRecentActivity = async () => {
  try {
    const response = await $fetch('/api/ladder/activity/recent', {
      headers: {
        Authorization: `Bearer ${useAuth().token.value}`
      }
    })
    if (response.success) {
      recentActivity.value = response.data.slice(0, 5) // Limiter à 5 éléments
    }
  } catch (error) {
    console.error('Erreur chargement activité:', error)
  }
}

// Chargement initial
onMounted(() => {
  loadGameStats()
  loadRecentActivity()
})
</script>

<style scoped>
.ladder-selection-page {
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

.ladder-header {
  margin-bottom: 3rem;
}

.header-content {
  text-align: center;
}

.title-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0;
}

.title-icon {
  color: #3B82D6;
  width: 3rem;
  height: 3rem;
}

.page-subtitle {
  font-size: 1.2rem;
  color: #9CA3AF;
  margin: 0;
}

.games-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 2rem;
  text-align: center;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  justify-items: center;
}

.game-card {
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid rgba(59, 130, 214, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  width: 100%;
  max-width: 450px;
  position: relative;
  height: 300px;
}

.game-card:hover {
  transform: translateY(-10px);
  border-color: #3B82D6;
  box-shadow: 0 20px 40px rgba(59, 130, 214, 0.2);
}

.game-cover {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.game-card:hover .cover-image {
  transform: scale(1.1);
}

.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.6) 70%,
    rgba(0, 0, 0, 0.9) 100%
  );
  display: flex;
  align-items: flex-end;
  padding: 1.5rem;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.game-content {
  width: 100%;
  color: white;
}

.game-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.game-icon {
  color: #3B82D6;
  width: 1.5rem;
  height: 1.5rem;
}


.game-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.game-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #3B82D6;
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.game-status {
  display: flex;
  justify-content: flex-start;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.3);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.5);
}

.status-badge.coming-soon {
  background: rgba(251, 191, 36, 0.3);
  color: #FBBF24;
  border: 1px solid rgba(251, 191, 36, 0.5);
}

.activity-section {
  margin-bottom: 2rem;
}

.activity-list {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid rgba(59, 130, 214, 0.1);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  color: #3B82D6;
  width: 24px;
  height: 24px;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: #f8fafc;
  margin: 0 0 0.25rem 0;
}

.activity-time {
  color: #9CA3AF;
  font-size: 0.9rem;
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
  
  .games-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
}
</style>