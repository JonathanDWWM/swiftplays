<template>
  <div class="ladder-2v2-page">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader title="FC 26 - Ladder 2v2" />

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
            FC 26 - Ladder 2v2
          </h1>
          <p class="page-subtitle">
            Affrontez d'autres équipes en 2v2 et grimpez dans le classement
          </p>
        </div>
      </div>
    </div>

    <!-- Team Status Check -->
    <div v-if="!isLoadingTeam && !hasTeam" class="team-required-message">
      <div class="message-content">
        <Icon name="mdi:account-group" class="message-icon" />
        <div class="message-text">
          <h3>Équipe requise</h3>
          <p>Vous devez faire partie d'une équipe 2v2 pour participer à ce mode de jeu.</p>
        </div>
        <button @click="$router.push('/equipes')" class="create-team-btn">
          <Icon name="mdi:plus-circle" />
          Créer une équipe
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoadingTeam" class="loading-message">
      <Icon name="mdi:loading" class="spin" />
      <span>Vérification de votre équipe...</span>
    </div>

    <!-- Main Content (only shown if user has team) -->
    <div v-else-if="hasTeam">
      <!-- Current Team Info -->
      <div class="team-info-card">
        <div class="team-header">
          <div class="team-avatar">
            <img :src="userTeam.team.avatar || '/images/default-team.png'" :alt="userTeam.team.name" />
          </div>
          <div class="team-details">
            <h3 class="team-name">{{ userTeam.team.name }}</h3>
            <span class="team-short-name">[{{ userTeam.team.shortName }}]</span>
            <p class="team-description">{{ userTeam.team.description || 'Aucune description' }}</p>
            <div class="member-count">
              {{ userTeam.team.members.length }}/{{ userTeam.team.maxMembers }} membres
            </div>
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
              <p class="empty-description">Soyez le premier à créer un défi ! D'autres équipes pourront l'accepter et vous affronter.</p>
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
                      <span>Match d'équipe</span>
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
            <h2>Règlement du Ladder 2v2</h2>
            <p class="rules-intro">Lisez attentivement les règles avant de participer aux matchs d'équipe.</p>
          </div>
          
          <div class="rules-content">
            <div class="rule-section">
              <div class="rule-icon">
                <Icon name="mdi:account-group" />
              </div>
              <div class="rule-content">
                <h3>Éligibilité d'équipe</h3>
                <ul>
                  <li>Faire partie d'une équipe 2v2 active</li>
                  <li>L'équipe doit avoir exactement 2 membres</li>
                  <li>Tous les membres doivent posséder FC 26</li>
                  <li>Respecter les règles de fair-play d'équipe</li>
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
                  <li><strong>Mode :</strong> Saisons/Clubs Pro (2v2)</li>
                  <li><strong>Durée :</strong> 6 minutes par mi-temps</li>
                  <li><strong>Difficulté :</strong> Légende</li>
                  <li><strong>Équipes :</strong> 5 étoiles maximum</li>
                  <li><strong>Assistance :</strong> Manuel uniquement</li>
                </ul>
              </div>
            </div>

            <div class="rule-section">
              <div class="rule-icon">
                <Icon name="mdi:trophy" />
              </div>
              <div class="rule-content">
                <h3>Classement d'équipe</h3>
                <ul>
                  <li><strong>Victoire :</strong> +25 points ELO pour l'équipe</li>
                  <li><strong>Défaite :</strong> -20 points ELO pour l'équipe</li>
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
                <h3>Sanctions d'équipe</h3>
                <ul>
                  <li><strong>Abandon de match :</strong> Défaite + -10 points supplémentaires</li>
                  <li><strong>Membre absent :</strong> Sanctions pour toute l'équipe</li>
                  <li><strong>Tricherie :</strong> Bannissement de l'équipe entière</li>
                  <li><strong>Comportement toxique :</strong> Sanctions modulées pour l'équipe</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Classement -->
        <div v-if="activeTab === 'ranking'" class="ranking-tab">
          <h2>Classement Ladder 2v2</h2>
          
          <div v-if="ranking.length === 0" class="empty-state">
            <Icon name="mdi:podium" class="empty-icon" />
            <h3>Aucun classement disponible</h3>
            <p>Jouez vos premiers matchs d'équipe pour apparaître dans le classement !</p>
          </div>

          <div v-else class="ranking-list">
            <div class="ranking-header">
              <div class="rank-col">#</div>
              <div class="team-col">Équipe</div>
              <div class="stats-col">Victoires</div>
              <div class="stats-col">Défaites</div>
              <div class="stats-col">Ratio</div>
              <div class="stats-col">Matchs</div>
            </div>
            
            <div 
              v-for="team in ranking" 
              :key="team.id"
              :class="['ranking-row', { 'is-me': isMyTeam(team) }]"
            >
              <div class="rank-col">
                <span class="rank-number">{{ team.rank }}</span>
                <Icon 
                  v-if="team.rank === 1" 
                  name="mdi:crown" 
                  class="crown-icon"
                />
              </div>
              <div class="team-col">
                <div class="team-info">
                  <img 
                    :src="team.team?.avatar || '/images/default-team.png'" 
                    :alt="team.team?.name"
                    class="team-avatar"
                  >
                  <span class="team-name">{{ team.team?.name || 'Équipe inconnue' }}</span>
                </div>
              </div>
              <div class="stats-col victories">{{ team.victories }}</div>
              <div class="stats-col defeats">{{ team.defeats }}</div>
              <div class="stats-col ratio">{{ calculateRatio(team) }}%</div>
              <div class="stats-col">{{ team.matchesPlayed }}</div>
            </div>
          </div>
        </div>

        <!-- Tab: Mes Stats -->
        <div v-if="activeTab === 'stats'" class="stats-tab">
          <h2>Statistiques de l'Équipe</h2>
          
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
                <span class="detail-label">Équipe créée le :</span>
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
              <p class="challenge-subtitle">Choisissez un créneau pour votre équipe</p>
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
const selectedGame = ref('FC_26-2v2')
const challenges = ref([])
const ranking = ref([])
const myStats = ref(null)
const hasTeam = ref(false)
const userTeam = ref(null)
const isLoadingTeam = ref(true)

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

const calculateRatio = (player) => {
  if (player.matchesPlayed === 0) return 0
  return Math.round((player.victories / player.matchesPlayed) * 100)
}

const isMyTeam = (team) => {
  return userTeam.value && team.id === userTeam.value.team.id
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

// Méthodes pour vérifier l'équipe
const checkUserTeam = async () => {
  try {
    const { public: { apiBase } } = useRuntimeConfig()
    const response = await $fetch(`${apiBase}/api/teams/my`, {
      headers: {
        Authorization: `Bearer ${useAuthStore().accessToken}`
      }
    })
    
    // Chercher une équipe 2v2 pour FC_26
    const team2v2 = response.data?.find(team => 
      team.game === 'FC_26' && 
      team.gameMode === '2v2'
    )
    
    if (team2v2) {
      hasTeam.value = true
      userTeam.value = { team: team2v2 }
    } else {
      hasTeam.value = false
    }
  } catch (error) {
    console.error('Erreur vérification équipe:', error)
    hasTeam.value = false
  } finally {
    isLoadingTeam.value = false
  }
}

// Méthodes API
const loadChallenges = async () => {
  if (!hasTeam.value) return
  
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
    const { addNotification } = useNotifications()
    addNotification(error.data?.message || 'Erreur lors du chargement des défis', 'error')
  }
}

const loadRanking = async () => {
  if (!hasTeam.value) return
  
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
  if (!hasTeam.value) return
  
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
    addNotification('Défi d\'équipe créé avec succès !', 'success')
    
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
onMounted(async () => {
  await checkUserTeam()
  if (hasTeam.value) {
    loadChallenges()
    loadRanking()
    loadMyStats()
  }
})
</script>

<style scoped>
/* Reprendre les mêmes styles que 1v1.vue mais avec quelques adaptations pour les équipes */
.ladder-2v2-page {
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

/* Team Required Message */
.team-required-message {
  margin: 2rem 0;
  padding: 3rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  border: 2px dashed rgba(251, 191, 36, 0.3);
  text-align: center;
}

.message-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.message-icon {
  color: #FBBF24;
  width: 4rem;
  height: 4rem;
}

.message-text h3 {
  font-size: 1.5rem;
  color: #f8fafc;
  margin: 0 0 0.5rem 0;
}

.message-text p {
  color: #9CA3AF;
  margin: 0;
  font-size: 1rem;
}

.create-team-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #3B82D6 0%, #1E40AF 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 214, 0.3);
}

.create-team-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 214, 0.4);
}

/* Loading Message */
.loading-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  border: 2px solid rgba(59, 130, 214, 0.2);
  margin: 2rem 0;
  color: #9CA3AF;
  font-size: 1rem;
}

/* Team Info Card */
.team-info-card {
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  border: 2px solid rgba(34, 197, 94, 0.2);
}

.team-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.team-avatar {
  width: 80px;
  height: 80px;
  border-radius: 15px;
  overflow: hidden;
  flex-shrink: 0;
}

.team-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.team-details {
  flex: 1;
}

.team-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.25rem 0;
}

.team-short-name {
  color: #3B82D6;
  font-weight: 600;
  font-size: 1rem;
}

.team-description {
  color: #9CA3AF;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.member-count {
  color: #22C55E;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Réutiliser les styles du 1v1.vue pour le reste */
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

/* Tabs et autres styles identiques au 1v1.vue */
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

/* Continue avec les mêmes styles que dans 1v1.vue... */
/* Je vais copier tous les autres styles nécessaires */

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
  border: 1px solid rgba(59, 130, 214, 0.1);
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
  
  .team-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Réutiliser les styles des modals, challenges, etc. du fichier 1v1.vue */
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

/* Challenges */
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

/* Ranking */
.ranking-list {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  border: 1px solid rgba(59, 130, 214, 0.1);
  overflow: hidden;
}

.ranking-header {
  display: grid;
  grid-template-columns: 60px 1fr repeat(4, 120px);
  gap: 1rem;
  padding: 1rem 2rem;
  background: rgba(59, 130, 214, 0.05);
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
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
  border-bottom: 1px solid rgba(59, 130, 214, 0.05);
  transition: all 0.3s ease;
}

.ranking-row:hover {
  background: rgba(59, 130, 214, 0.03);
}

.ranking-row.is-me {
  background: rgba(34, 197, 94, 0.05);
  border-color: rgba(34, 197, 94, 0.1);
}

.rank-col {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: #f8fafc;
}

.crown-icon {
  color: #FBBF24;
  width: 1.2rem;
  height: 1.2rem;
}

.team-col {
  display: flex;
  align-items: center;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.team-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.team-name {
  font-weight: 600;
  color: #f8fafc;
}

.stats-col {
  font-weight: 600;
  color: #f8fafc;
  text-align: center;
}

.stats-col.victories {
  color: #22C55E;
}

.stats-col.defeats {
  color: #EF4444;
}

.stats-col.ratio {
  color: #FBBF24;
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

/* Rules Tab */
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
</style>