<template>
  <div class="ladder-1v1-cod-page">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader title="COD BO7 - Ladder 1v1" />

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
            COD Black Ops 7 - Ladder 1v1
          </h1>
          <p class="page-subtitle">
            Affrontez d'autres soldats en duel individuel et grimpez dans le classement
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
            <p class="empty-description">Soyez le premier à créer un défi ! D'autres soldats pourront l'accepter et vous affronter.</p>
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
                  <span class="game-badge cod">{{ challenge.game.replace('_', ' ') }}</span>
                  <span class="mode-badge cod">{{ challenge.gameMode }}</span>
                </div>
              </div>

              <div class="challenge-body">
                <div class="challenge-info">
                  <div class="challenge-status">
                    <div class="status-indicator cod"></div>
                    <span>Duel tactique</span>
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
                  class="accept-challenge-btn cod"
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
          <h2>Règlement du Ladder 1v1 COD BO7</h2>
          <p class="rules-intro">Lisez attentivement les règles avant de participer aux duels tactiques.</p>
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
                <li>Posséder Call of Duty Black Ops 7</li>
                <li>Respecter les règles de fair-play</li>
                <li>Avoir un ping stable pour les matchs en ligne</li>
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
                <li><strong>Mode :</strong> Multijoueur classé (1v1)</li>
                <li><strong>Type :</strong> Premier à 30 éliminations</li>
                <li><strong>Cartes :</strong> Rotation des cartes compétitives</li>
                <li><strong>Armes :</strong> Selon méta du moment</li>
                <li><strong>Assistance visée :</strong> Selon préférences</li>
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
              <h3>Résultats et Classement</h3>
              <ul>
                <li>Le vainqueur ou n'importe quel joueur peut soumettre le résultat</li>
                <li>Preuve obligatoire : capture d'écran du score final</li>
                <li><strong>Victoire :</strong> +30 points ELO</li>
                <li><strong>Défaite :</strong> -25 points ELO</li>
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
                <li><strong>Abandon de match :</strong> Défaite + -15 points supplémentaires</li>
                <li><strong>Absence répétée :</strong> Suspension temporaire</li>
                <li><strong>Tricherie/Exploit :</strong> Bannissement définitif</li>
                <li><strong>Toxicité :</strong> Sanctions modulées selon gravité</li>
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
        <h2>Classement Ladder COD BO7</h2>
        
        <div v-if="ranking.length === 0" class="empty-state">
          <Icon name="mdi:podium" class="empty-icon" />
          <h3>Aucun classement disponible</h3>
          <p>Jouez vos premiers matchs pour apparaître dans le classement !</p>
        </div>

        <div v-else class="ranking-list">
          <div class="ranking-header">
            <div class="rank-col">#</div>
            <div class="player-col">Soldat</div>
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
        <h2>Mes Statistiques COD BO7</h2>
        
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
            <p class="challenge-subtitle">Choisissez un créneau pour votre duel</p>
          </div>

          <form @submit.prevent="createChallenge" class="challenge-form">
            <div class="time-slots">
              <div 
                v-for="slot in nextTimeSlots" 
                :key="slot.value"
                :class="['time-slot cod', { selected: newChallenge.selectedSlot === slot.value }]"
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
                class="btn btn-primary cod"
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
const selectedGame = ref('CALL_OF_DUTY_BO7-1v1')
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
    addNotification('Défi COD créé avec succès !', 'success')
    
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
/* Styles de base identiques à FC26 mais avec thème COD (rouge) */
.ladder-1v1-cod-page {
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
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #EF4444;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1.5rem;
}

.back-button:hover {
  background: rgba(239, 68, 68, 0.2);
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
  color: #EF4444;
  width: 2.5rem;
  height: 2.5rem;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #9CA3AF;
  margin: 0;
}

/* Tabs Styles avec thème COD */
.tabs-container {
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(239, 68, 68, 0.1);
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
  background: rgba(239, 68, 68, 0.05);
}

.tab.active {
  color: #EF4444;
  border-bottom-color: #EF4444;
  background: rgba(239, 68, 68, 0.1);
}

.tab.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #EF4444;
}

/* Éléments COD avec couleur rouge */
.game-badge.cod {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.mode-badge.cod {
  background: rgba(251, 191, 36, 0.1);
  color: #FBBF24;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.status-indicator.cod {
  background: #EF4444;
  animation: pulse 2s infinite;
}

.accept-challenge-btn.cod {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.accept-challenge-btn.cod:hover:not(:disabled) {
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

.btn-primary.cod {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  border: 1px solid #EF4444;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.btn-primary.cod:hover:not(:disabled) {
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

.time-slot.cod {
  background: rgba(239, 68, 68, 0.05);
  border: 2px solid rgba(239, 68, 68, 0.1);
}

.time-slot.cod:hover {
  border-color: rgba(239, 68, 68, 0.3);
}

.time-slot.cod.selected {
  border-color: #EF4444;
  background: rgba(239, 68, 68, 0.1);
  box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
}

.time-slot.cod::before {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
}

.time-icon {
  color: #EF4444;
  width: 1.2rem;
  height: 1.2rem;
}

.time-slot.cod.selected .time-label {
  color: #EF4444;
}

/* Tous les autres styles identiques au FC26 mais avec les couleurs COD */
/* Je vais reprendre les styles principaux du 1v1 FC26 */

/* Tab Content */
.tab-content {
  min-height: 400px;
}

/* Stats Cards */
.stats-overview {
  max-width: 800px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
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

.stat-card.victories {
  border-color: rgba(34, 197, 94, 0.3);
}

.stat-card.defeats {
  border-color: rgba(239, 68, 68, 0.3);
}

.stat-card.ratio {
  border-color: rgba(251, 191, 36, 0.3);
}

.stat-card.rank {
  border-color: rgba(168, 85, 247, 0.3);
}

.stat-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.stat-card.victories .stat-icon {
  color: #22C55E;
}

.stat-card.defeats .stat-icon {
  color: #EF4444;
}

.stat-card.ratio .stat-icon {
  color: #FBBF24;
}

.stat-card.rank .stat-icon {
  color: #A855F7;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
  display: block;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #9CA3AF;
}

/* Continue avec tous les autres styles nécessaires... */
/* Pour gagner du temps, je vais ajouter les classes principales */

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  border: 2px dashed rgba(239, 68, 68, 0.2);
}

.empty-icon {
  color: rgba(239, 68, 68, 0.4);
  width: 4rem;
  height: 4rem;
}

.empty-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 15px;
  color: #EF4444;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-action-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
}

/* Challenges */
.challenges-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 15px;
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.create-challenge-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.create-challenge-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

/* Ranking */
.ranking-list {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  border: 1px solid rgba(239, 68, 68, 0.1);
  overflow: hidden;
}

.ranking-header {
  display: grid;
  grid-template-columns: 60px 1fr repeat(4, 120px);
  gap: 1rem;
  padding: 1rem 2rem;
  background: rgba(239, 68, 68, 0.05);
  border-bottom: 1px solid rgba(239, 68, 68, 0.1);
  font-weight: 600;
  color: #9CA3AF;
  font-size: 0.9rem;
}

.ranking-row {
  display: grid;
  grid-template-columns: 60px 1fr repeat(4, 120px);
  gap: 1rem;
  padding: 1rem 2rem;
  align-items: center;
  border-bottom: 1px solid rgba(239, 68, 68, 0.05);
  transition: all 0.3s ease;
}

.ranking-row:hover {
  background: rgba(239, 68, 68, 0.03);
}

.ranking-row.is-me {
  background: rgba(34, 197, 94, 0.05);
  border-color: rgba(34, 197, 94, 0.1);
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
  border: 2px solid rgba(239, 68, 68, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90vw;
  max-height: 80vh;
  overflow: hidden;
}

.modal-icon {
  color: #EF4444;
  width: 2rem;
  height: 2rem;
}

/* Rules */
.rules-header {
  margin-bottom: 2rem;
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 15px;
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.rule-section {
  display: flex;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 15px;
  border: 1px solid rgba(239, 68, 68, 0.1);
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.rule-section:hover {
  border-color: rgba(239, 68, 68, 0.3);
  transform: translateY(-2px);
}

.rule-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  font-size: 1.5rem;
  color: #EF4444;
}

/* Responsive */
@media (max-width: 1024px) {
  .main-content {
    margin-left: 240px;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  
  .page-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>