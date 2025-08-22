<template>
  <div class="ladder-1v1-page">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader title="FC 26 - Ladder 1v1" />

      <!-- Page Content -->
      <main class="page-content">
        <div class="content-container">
    <!-- Header avec sélecteur de jeu -->
    <div class="ladder-header">
      <div class="header-content">
        <div class="title-section">
          <button @click="$router.back()" class="back-button">
            <Icon name="mdi:arrow-left" />
            Retour aux modes
          </button>
          
          <h1 class="page-title">
            <Icon name="mdi:trophy" class="title-icon" />
            FC 26 - Ladder 1v1
          </h1>
          <p class="page-subtitle">
            Défiez d'autres joueurs et grimpez dans le classement
          </p>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="tabs-container">
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'ranking' }]"
          @click="activeTab = 'ranking'"
        >
          <Icon name="mdi:podium" />
          Classement
        </button>
        <button 
          :class="['tab', { active: activeTab === 'challenges' }]"
          @click="activeTab = 'challenges'"
        >
          <Icon name="mdi:sword-cross" />
          Défis Disponibles
        </button>
        <button 
          :class="['tab', { active: activeTab === 'rules' }]"
          @click="activeTab = 'rules'"
        >
          <Icon name="mdi:book-open-page-variant" />
          Règlement
        </button>
        <button 
          :class="['tab', { active: activeTab === 'stats' }]"
          @click="activeTab = 'stats'"
        >
          <Icon name="mdi:chart-box" />
          Mes Stats
        </button>
      </div>
    </div>

    <!-- Contenu principal selon l'onglet actif -->
    <div class="tab-content">
      <!-- Tab: Défis Disponibles -->
      <div v-if="activeTab === 'challenges'" class="challenges-tab">
        <div class="challenges-header">
          <div class="header-content">
            <h2 class="section-title">
              <Icon name="mdi:sword-cross" class="section-icon" />
              Défis Disponibles
            </h2>
            <p class="section-subtitle">Acceptez un défi pour commencer un match immédiatement</p>
          </div>
          <button @click="showCreateChallengeModal = true" class="create-challenge-btn">
            <Icon name="mdi:plus-circle" />
            <span>Créer un Défi</span>
          </button>
        </div>

        <div class="challenges-content">
          <div v-if="challenges.length === 0" class="empty-state">
            <div class="empty-icon-container">
              <Icon name="mdi:sword-cross" class="empty-icon" />
            </div>
            <h3 class="empty-title">Aucun défi disponible</h3>
            <p class="empty-description">Soyez le premier à créer un défi ! D'autres joueurs pourront l'accepter et vous affronter.</p>
            <button @click="showCreateChallengeModal = true" class="empty-action-btn">
              <Icon name="mdi:plus-circle" />
              Créer le Premier Défi
            </button>
          </div>
          
          <div v-else class="challenges-grid">
            <div 
              v-for="challenge in challenges" 
              :key="challenge.id"
              class="challenge-card"
            >
              <div class="challenge-header">
                <div class="challenge-time-badge">
                  <Icon name="mdi:clock-outline" class="time-icon" />
                  <span class="time-text">{{ formatDateTime(challenge.scheduledAt) }}</span>
                </div>
                <div class="challenge-game-info">
                  <span class="game-badge">{{ challenge.game.replace('_', ' ') }}</span>
                  <span class="mode-badge">{{ challenge.gameMode }}</span>
                </div>
              </div>

              <div class="challenge-body">
                <div class="challenge-info">
                  <div class="challenge-status">
                    <div class="status-indicator"></div>
                    <span>Match rapide</span>
                  </div>
                  <div v-if="challenge.message" class="challenge-message">
                    <Icon name="mdi:message-text" class="message-icon" />
                    <span>"{{ challenge.message }}"</span>
                  </div>
                  <div class="challenge-timing">
                    <Icon name="mdi:timer-sand" class="timing-icon" />
                    <span>{{ getTimeUntilMatch(challenge.scheduledAt) }}</span>
                  </div>
                </div>
              </div>

              <div class="challenge-footer">
                <button 
                  @click="acceptChallenge(challenge.id)"
                  :disabled="isAccepting"
                  class="accept-challenge-btn"
                >
                  <Icon v-if="isAccepting" name="mdi:loading" class="spin" />
                  <Icon v-else name="mdi:sword-cross" />
                  <span>{{ isAccepting ? 'Acceptation...' : 'Accepter le Défi' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Règlement -->
      <div v-if="activeTab === 'rules'" class="rules-tab">
        <div class="rules-header">
          <h2>Règlement du Ladder 1v1</h2>
          <p class="rules-intro">Lisez attentivement les règles avant de participer aux matchs.</p>
        </div>
        
        <div class="rules-content">
          <div class="rule-section">
            <div class="rule-icon">
              <Icon name="mdi:account-check" />
            </div>
            <div class="rule-content">
              <h3>Éligibilité</h3>
              <ul>
                <li>Avoir un compte SwiftPlays vérifié</li>
                <li>Posséder FC 26 et être capable de jouer en ligne</li>
                <li>Respecter les règles de fair-play</li>
              </ul>
            </div>
          </div>

          <div class="rule-section">
            <div class="rule-icon">
              <Icon name="mdi:gamepad-variant" />
            </div>
            <div class="rule-content">
              <h3>Format des Matchs</h3>
              <ul>
                <li><strong>Mode :</strong> Saisons/Clubs Pro (1v1)</li>
                <li><strong>Durée :</strong> 6 minutes par mi-temps</li>
                <li><strong>Difficulté :</strong> Légende</li>
                <li><strong>Équipes :</strong> 5 étoiles maximum</li>
                <li><strong>Assistance :</strong> Manuel uniquement</li>
              </ul>
            </div>
          </div>

          <div class="rule-section">
            <div class="rule-icon">
              <Icon name="mdi:calendar-clock" />
            </div>
            <div class="rule-content">
              <h3>Programmation</h3>
              <ul>
                <li>Les défis peuvent être créés jusqu'à 2 jours à l'avance</li>
                <li>Créneaux disponibles de 8h à 23h45 (par quarts d'heure)</li>
                <li>Annulation possible jusqu'à 1h avant le match</li>
                <li>Absence sans préavis = défaite automatique</li>
              </ul>
            </div>
          </div>

          <div class="rule-section">
            <div class="rule-icon">
              <Icon name="mdi:trophy" />
            </div>
            <div class="rule-content">
              <h3>Résultats</h3>
              <ul>
                <li>Le vainqueur ou n'importe quel joueur peut soumettre le résultat</li>
                <li>Preuve obligatoire : capture d'écran du score final</li>
                <li>Contestation possible dans les 24h après soumission</li>
                <li>Les modérateurs tranchent en cas de litige</li>
              </ul>
            </div>
          </div>

          <div class="rule-section">
            <div class="rule-icon">
              <Icon name="mdi:podium" />
            </div>
            <div class="rule-content">
              <h3>Classement</h3>
              <ul>
                <li><strong>Victoire :</strong> +25 points ELO</li>
                <li><strong>Défaite :</strong> -20 points ELO</li>
                <li>Le classement se met à jour en temps réel</li>
                <li>Minimum 5 matchs pour apparaître au classement</li>
              </ul>
            </div>
          </div>

          <div class="rule-section warning">
            <div class="rule-icon">
              <Icon name="mdi:alert" />
            </div>
            <div class="rule-content">
              <h3>Sanctions</h3>
              <ul>
                <li><strong>Abandon de match :</strong> Défaite + -10 points supplémentaires</li>
                <li><strong>Absence répétée :</strong> Suspension temporaire</li>
                <li><strong>Tricherie :</strong> Bannissement définitif</li>
                <li><strong>Comportement toxique :</strong> Sanctions modulées</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="rules-footer">
          <div class="contact-info">
            <Icon name="mdi:help-circle" />
            <p>Des questions ? Contactez les modérateurs sur Discord</p>
          </div>
        </div>
      </div>

      <!-- Tab: Classement -->
      <div v-if="activeTab === 'ranking'" class="ranking-tab">
        <h2>Classement Ladder</h2>
        
        <div v-if="ranking.length === 0" class="empty-state">
          <Icon name="mdi:podium" class="empty-icon" />
          <h3>Aucun classement disponible</h3>
          <p>Jouez vos premiers matchs pour apparaître dans le classement !</p>
        </div>

        <div v-else class="ranking-list">
          <div class="ranking-header">
            <div class="rank-col">#</div>
            <div class="player-col">Joueur</div>
            <div class="stats-col">Victoires</div>
            <div class="stats-col">Défaites</div>
            <div class="stats-col">Ratio</div>
            <div class="stats-col">Matchs</div>
          </div>
          
          <div 
            v-for="player in ranking" 
            :key="player.id"
            :class="['ranking-row', { 'is-me': isMyPlayer(player) }]"
          >
            <div class="rank-col">
              <span class="rank-number">{{ player.rank }}</span>
              <Icon 
                v-if="player.rank === 1" 
                name="mdi:crown" 
                class="crown-icon"
              />
            </div>
            <div class="player-col">
              <div class="player-info">
                <img 
                  :src="getPlayerAvatar(player.user)" 
                  :alt="player.user.pseudo"
                  class="player-avatar"
                >
                <span class="player-name">{{ player.user.pseudo }}</span>
              </div>
            </div>
            <div class="stats-col victories">{{ player.victories }}</div>
            <div class="stats-col defeats">{{ player.defeats }}</div>
            <div class="stats-col ratio">{{ calculateRatio(player) }}%</div>
            <div class="stats-col">{{ player.matchesPlayed }}</div>
          </div>
        </div>
      </div>

      <!-- Tab: Mes Stats -->
      <div v-if="activeTab === 'stats'" class="stats-tab">
        <h2>Mes Statistiques</h2>
        
        <div v-if="myStats" class="stats-overview">
          <div class="stats-cards">
            <div class="stat-card victories">
              <Icon name="mdi:trophy" class="stat-icon" />
              <div class="stat-content">
                <div class="stat-number">{{ myStats.victories }}</div>
                <div class="stat-label">Victoires</div>
              </div>
            </div>
            
            <div class="stat-card defeats">
              <Icon name="mdi:close-circle" class="stat-icon" />
              <div class="stat-content">
                <div class="stat-number">{{ myStats.defeats }}</div>
                <div class="stat-label">Défaites</div>
              </div>
            </div>
            
            <div class="stat-card ratio">
              <Icon name="mdi:percent" class="stat-icon" />
              <div class="stat-content">
                <div class="stat-number">{{ calculateRatio(myStats) }}%</div>
                <div class="stat-label">Taux de Victoire</div>
              </div>
            </div>
            
            <div class="stat-card rank">
              <Icon name="mdi:podium" class="stat-icon" />
              <div class="stat-content">
                <div class="stat-number">#{{ myStats.rank || 'N/A' }}</div>
                <div class="stat-label">Classement</div>
              </div>
            </div>
          </div>
          
          <div class="stats-details">
            <div class="detail-item">
              <span class="detail-label">Total de matchs joués :</span>
              <span class="detail-value">{{ myStats.matchesPlayed }}</span>
            </div>
            <div v-if="myStats.lastMatchAt" class="detail-item">
              <span class="detail-label">Dernier match :</span>
              <span class="detail-value">{{ formatDateTime(myStats.lastMatchAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Membre depuis :</span>
              <span class="detail-value">{{ formatDateTime(myStats.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Créer un Défi -->
    <div v-if="showCreateChallengeModal" class="modal-overlay" @click="closeCreateChallengeModal">
      <div class="modal create-challenge-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <Icon name="mdi:sword-cross" class="modal-icon" />
            <h3>Créer un Nouveau Défi</h3>
          </div>
          <button @click="closeCreateChallengeModal" class="modal-close">
            <Icon name="mdi:close" />
          </button>
        </div>
        
        <div class="modal-content">
          <div class="challenge-info">
            <p class="challenge-subtitle">Choisissez un créneau</p>
          </div>

          <form @submit.prevent="createChallenge" class="challenge-form">
            <div class="time-slots">
              <div 
                v-for="slot in nextTimeSlots" 
                :key="slot.value"
                :class="['time-slot', { selected: newChallenge.selectedSlot === slot.value }]"
                @click="newChallenge.selectedSlot = slot.value"
              >
                <div class="time-display">
                  <Icon name="mdi:clock-outline" class="time-icon" />
                  <span class="time-text">{{ slot.display }}</span>
                </div>
                <div class="time-label">{{ slot.label }}</div>
              </div>
            </div>
            
            <div class="modal-actions">
              <button type="button" @click="closeCreateChallengeModal" class="btn btn-secondary">
                <Icon name="mdi:close" />
                Annuler
              </button>
              <button 
                type="submit" 
                :disabled="isCreatingChallenge || !newChallenge.selectedSlot" 
                class="btn btn-primary"
              >
                <Icon v-if="isCreatingChallenge" name="mdi:loading" class="spin" />
                <Icon v-else name="mdi:sword-cross" />
                {{ isCreatingChallenge ? 'Création...' : 'Créer le Défi' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>


    <!-- Notifications Toast -->
    <NotificationToast />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '~/components/Sidebar.vue'
import AppHeader from '~/components/AppHeader.vue'
import NotificationToast from '~/components/NotificationToast.vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: 'auth',
  layout: false
})

// État réactif
const activeTab = ref('ranking')
const selectedGame = ref('FC_26-1v1')
const challenges = ref([])
const ranking = ref([])
const myStats = ref(null)

// État des modals
const showCreateChallengeModal = ref(false)

// État du formulaire de défi
const newChallenge = ref({
  selectedSlot: ''
})

// État de chargement
const isCreatingChallenge = ref(false)
const isAccepting = ref(false)

// Calculs
const nextTimeSlots = computed(() => {
  const now = new Date()
  const slots = []
  
  // Arrondir au quart d'heure supérieur
  const currentMinutes = now.getMinutes()
  const nextQuarter = Math.ceil(currentMinutes / 15) * 15
  
  const startTime = new Date(now)
  startTime.setMinutes(nextQuarter, 0, 0)
  
  // Si on dépasse l'heure, passer à l'heure suivante
  if (nextQuarter >= 60) {
    startTime.setHours(startTime.getHours() + 1, 0, 0, 0)
  }
  
  // Générer les 5 prochains créneaux de 15 minutes
  for (let i = 0; i < 5; i++) {
    const slotTime = new Date(startTime)
    slotTime.setMinutes(startTime.getMinutes() + (i * 15))
    
    const timeString = slotTime.toTimeString().slice(0, 5) // HH:MM
    const isToday = slotTime.toDateString() === now.toDateString()
    const isTomorrow = slotTime.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()
    
    let label = ''
    if (isToday) {
      label = `Aujourd'hui`
    } else if (isTomorrow) {
      label = `Demain`
    } else {
      label = slotTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    }
    
    slots.push({
      value: slotTime.toISOString(),
      display: timeString,
      label: label,
      fullDate: slotTime
    })
  }
  
  return slots
})

// Méthodes utilitaires
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

const getPlayerAvatar = (user) => {
  return user?.discordAvatar || user?.avatar || '/images/default-avatar.png'
}

const calculateRatio = (player) => {
  if (player.matchesPlayed === 0) return 0
  return Math.round((player.victories / player.matchesPlayed) * 100)
}

const isMyPlayer = (player) => {
  const authStore = useAuthStore()
  return player.user.id === authStore.user?.id
}

const getTimeUntilMatch = (scheduledAt) => {
  const now = new Date()
  const matchTime = new Date(scheduledAt)
  const diffMs = matchTime.getTime() - now.getTime()
  
  if (diffMs <= 0) return 'Match imminent'
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  
  if (diffHours > 0) {
    return `Dans ${diffHours}h ${diffMinutes % 60}min`
  } else {
    return `Dans ${diffMinutes} minutes`
  }
}

// Méthodes API
const loadChallenges = async () => {
  try {
    const [game, gameMode] = selectedGame.value.split('-')
    const { public: { apiBase } } = useRuntimeConfig()
    
    const response = await $fetch(`${apiBase}/api/ladder/challenges`, {
      method: 'GET',
      params: { game, gameMode },
      headers: {
        Authorization: `Bearer ${useAuthStore().accessToken}`
      }
    })
    challenges.value = response.data || []
  } catch (error) {
    console.error('Erreur chargement défis:', error)
  }
}


const loadRanking = async () => {
  try {
    const [game, gameMode] = selectedGame.value.split('-')
    const { public: { apiBase } } = useRuntimeConfig()
    
    const response = await $fetch(`${apiBase}/api/ladder/ranking`, {
      method: 'GET',
      params: { game, gameMode, limit: 50 },
      headers: {
        Authorization: `Bearer ${useAuthStore().accessToken}`
      }
    })
    ranking.value = response.data || []
  } catch (error) {
    console.error('Erreur chargement classement:', error)
  }
}

const loadMyStats = async () => {
  try {
    const [game, gameMode] = selectedGame.value.split('-')
    const { public: { apiBase } } = useRuntimeConfig()
    
    const response = await $fetch(`${apiBase}/api/ladder/stats`, {
      method: 'GET',
      params: { game, gameMode },
      headers: {
        Authorization: `Bearer ${useAuthStore().accessToken}`
      }
    })
    myStats.value = response.data || null
  } catch (error) {
    console.error('Erreur chargement stats:', error)
  }
}

// Actions
const onGameChange = () => {
  loadChallenges()
  loadRanking()
  loadMyStats()
}

const createChallenge = async () => {
  if (isCreatingChallenge.value || !newChallenge.value.selectedSlot) return
  
  try {
    isCreatingChallenge.value = true
    
    const [game, gameMode] = selectedGame.value.split('-')
    const { public: { apiBase } } = useRuntimeConfig()
    
    await $fetch(`${apiBase}/api/ladder/challenges`, {
      method: 'POST',
      body: {
        game,
        gameMode,
        scheduledAt: newChallenge.value.selectedSlot
      },
      headers: {
        Authorization: `Bearer ${useAuthStore().accessToken}`
      }
    })
    
    // Recharger les défis et fermer le modal
    await loadChallenges()
    closeCreateChallengeModal()
    
    // Notification de succès
    const { addNotification } = useNotifications()
    addNotification('Défi créé avec succès !', 'success')
    
  } catch (error) {
    console.error('Erreur création défi:', error)
    const { addNotification } = useNotifications()
    addNotification(error.data?.message || 'Erreur lors de la création du défi', 'error')
  } finally {
    isCreatingChallenge.value = false
  }
}

const acceptChallenge = async (challengeId) => {
  if (isAccepting.value) return
  
  try {
    isAccepting.value = true
    
    const { public: { apiBase } } = useRuntimeConfig()
    
    const response = await $fetch(`${apiBase}/api/ladder/challenges/${challengeId}/accept`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${useAuthStore().accessToken}`
      }
    })
    
    // Recharger les données
    await loadChallenges()
    
    // Notification de succès
    const { addNotification } = useNotifications()
    addNotification(response.message || 'Défi accepté !', 'success')
    
  } catch (error) {
    console.error('Erreur acceptation défi:', error)
    const { addNotification } = useNotifications()
    addNotification(error.data?.message || 'Erreur lors de l\'acceptation du défi', 'error')
  } finally {
    isAccepting.value = false
  }
}

// Fermeture des modals
const closeCreateChallengeModal = () => {
  showCreateChallengeModal.value = false
  newChallenge.value = { selectedSlot: '' }
}

// Chargement initial
onMounted(() => {
  loadChallenges()
  loadRanking()
  loadMyStats()
})
</script>

<style scoped>
.ladder-1v1-page {
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

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 214, 0.1);
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 8px;
  color: #3B82D6;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1.5rem;
}

.back-button:hover {
  background: rgba(59, 130, 214, 0.2);
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
}

/* Header Styles */
.ladder-header {
  margin-bottom: 2rem;
}

.title-section {
  text-align: center;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 0 0 1rem 0;
}

.title-icon {
  color: #3B82D6;
  width: 2.5rem;
  height: 2.5rem;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #9CA3AF;
  margin: 0;
}

/* Tabs Styles */
.tabs-container {
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  color: #9CA3AF;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  position: relative;
}

.tab:hover {
  color: #f8fafc;
  background: rgba(59, 130, 214, 0.05);
}

.tab.active {
  color: #3B82D6;
  border-bottom-color: #3B82D6;
  background: rgba(59, 130, 214, 0.1);
}

.tab.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #3B82D6;
}

/* Tab Content */
.tab-content {
  min-height: 400px;
}

/* Rules Tab Styles */
.rules-tab {
  max-width: 800px;
}

.rules-header {
  margin-bottom: 2rem;
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 15px;
  border: 1px solid rgba(59, 130, 214, 0.1);
}

.rules-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.5rem 0;
}

.rules-intro {
  font-size: 1.1rem;
  color: #9CA3AF;
  margin: 0;
}

.rules-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rule-section {
  display: flex;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 15px;
  border: 1px solid rgba(59, 130, 214, 0.1);
  transition: all 0.3s ease;
}

.rule-section:hover {
  border-color: rgba(59, 130, 214, 0.3);
  transform: translateY(-2px);
}

.rule-section.warning {
  border-color: rgba(251, 191, 36, 0.3);
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}

.rule-section.warning:hover {
  border-color: rgba(251, 191, 36, 0.5);
}

.rule-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 214, 0.1);
  border-radius: 50%;
  font-size: 1.5rem;
  color: #3B82D6;
}

.rule-section.warning .rule-icon {
  background: rgba(251, 191, 36, 0.1);
  color: #FBBF24;
}

.rule-content h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 1rem 0;
}

.rule-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rule-content li {
  padding: 0.5rem 0;
  color: #9CA3AF;
  border-bottom: 1px solid rgba(59, 130, 214, 0.05);
  position: relative;
  padding-left: 1.5rem;
}

.rule-content li:last-child {
  border-bottom: none;
}

.rule-content li::before {
  content: '•';
  color: #3B82D6;
  position: absolute;
  left: 0;
  font-weight: bold;
}

.rule-content li strong {
  color: #f8fafc;
}

.rules-footer {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(59, 130, 214, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(59, 130, 214, 0.1);
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
}

.contact-info p {
  color: #9CA3AF;
  margin: 0;
}

.contact-info svg {
  color: #3B82D6;
  width: 1.5rem;
  height: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .tabs {
    justify-content: flex-start;
  }
  
  .tab {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
  }
  
  .rule-section {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .rules-header {
    padding: 1.5rem;
  }
  
  .page-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.modal {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  border: 2px solid rgba(59, 130, 214, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90vw;
  max-height: 80vh;
  overflow: hidden;
}

.create-challenge-modal {
  max-width: 600px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-icon {
  color: #3B82D6;
  width: 2rem;
  height: 2rem;
}

.modal-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.modal-close {
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #DC2626;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: rgba(220, 38, 38, 0.2);
  transform: scale(1.1);
}

.modal-content {
  padding: 1rem 2rem 2rem 2rem;
}

.challenge-info {
  text-align: center;
  margin-bottom: 2rem;
}

.challenge-subtitle {
  color: #9CA3AF;
  font-size: 1rem;
  margin: 0;
}

.challenge-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
}

.time-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem;
  background: rgba(59, 130, 214, 0.05);
  border: 2px solid rgba(59, 130, 214, 0.1);
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.time-slot::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 214, 0.1) 0%, rgba(59, 130, 214, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.time-slot:hover {
  border-color: rgba(59, 130, 214, 0.3);
  transform: translateY(-5px);
}

.time-slot:hover::before {
  opacity: 1;
}

.time-slot.selected {
  border-color: #3B82D6;
  background: rgba(59, 130, 214, 0.1);
  box-shadow: 0 10px 30px rgba(59, 130, 214, 0.3);
}

.time-slot.selected::before {
  opacity: 1;
}

.time-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 1;
}

.time-icon {
  color: #3B82D6;
  width: 1.2rem;
  height: 1.2rem;
}

.time-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f8fafc;
}

.time-label {
  font-size: 0.8rem;
  color: #9CA3AF;
  position: relative;
  z-index: 1;
}

.time-slot.selected .time-label {
  color: #3B82D6;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 0.9rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-secondary {
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.3);
  color: #9CA3AF;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(107, 114, 128, 0.2);
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, #3B82D6 0%, #1E40AF 100%);
  border: 1px solid #3B82D6;
  color: white;
  box-shadow: 0 4px 15px rgba(59, 130, 214, 0.3);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 8px 25px rgba(59, 130, 214, 0.4);
  transform: translateY(-2px);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Modal */
@media (max-width: 768px) {
  .modal {
    width: 95vw;
    margin: 1rem;
  }
  
  .modal-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
  }
  
  .modal-content {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
  }
  
  .time-slots {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .time-slot {
    padding: 1rem 0.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

/* Challenges Tab Styles */
.challenges-tab {
  max-width: 1000px;
}

.challenges-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 15px;
  border: 1px solid rgba(59, 130, 214, 0.1);
}

.header-content {
  flex: 1;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 2rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.5rem 0;
}

.section-icon {
  color: #3B82D6;
  width: 2rem;
  height: 2rem;
}

.section-subtitle {
  color: #9CA3AF;
  font-size: 1rem;
  margin: 0;
}

.create-challenge-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #3B82D6 0%, #1E40AF 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 214, 0.3);
}

.create-challenge-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 214, 0.4);
}

.challenges-content {
  min-height: 400px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  border: 2px dashed rgba(59, 130, 214, 0.2);
}

.empty-icon-container {
  margin-bottom: 2rem;
}

.empty-icon {
  color: rgba(59, 130, 214, 0.4);
  width: 4rem;
  height: 4rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 1rem 0;
}

.empty-description {
  color: #9CA3AF;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 2rem 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.empty-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: rgba(59, 130, 214, 0.1);
  border: 2px solid rgba(59, 130, 214, 0.3);
  border-radius: 15px;
  color: #3B82D6;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-action-btn:hover {
  background: rgba(59, 130, 214, 0.2);
  border-color: rgba(59, 130, 214, 0.5);
  transform: translateY(-2px);
}

/* Challenges Grid */
.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.challenge-card {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  border: 1px solid rgba(59, 130, 214, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.challenge-card:hover {
  border-color: rgba(59, 130, 214, 0.3);
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(59, 130, 214, 0.1);
}

.challenge-header {
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.challenge-time-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 214, 0.1);
  border-radius: 25px;
  border: 1px solid rgba(59, 130, 214, 0.2);
}

.time-icon {
  color: #3B82D6;
  width: 1rem;
  height: 1rem;
}

.time-text {
  color: #f8fafc;
  font-weight: 500;
  font-size: 0.9rem;
}

.challenge-game-info {
  display: flex;
  gap: 0.5rem;
}

.game-badge, .mode-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
}

.game-badge {
  background: rgba(34, 197, 94, 0.1);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.mode-badge {
  background: rgba(251, 191, 36, 0.1);
  color: #FBBF24;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.challenge-body {
  padding: 1rem 1.5rem 1.5rem 1.5rem;
}

.challenge-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.challenge-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9CA3AF;
  font-size: 0.9rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  background: #22C55E;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.challenge-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 214, 0.05);
  border-radius: 10px;
  border-left: 3px solid #3B82D6;
}

.message-icon {
  color: #3B82D6;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.challenge-message span {
  color: #f8fafc;
  font-style: italic;
  font-size: 0.9rem;
}

.challenge-timing {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #FBBF24;
  font-weight: 500;
}

.timing-icon {
  width: 1rem;
  height: 1rem;
}

.challenge-footer {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.accept-challenge-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
}

.accept-challenge-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
}

.accept-challenge-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive Challenges */
@media (max-width: 768px) {
  .challenges-header {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
  
  .challenges-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .challenge-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .challenge-game-info {
    justify-content: center;
  }
}
</style>

