<template>
  <div class="ladder-2v2-cod-page">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader title="COD BO7 - Ladder 2v2" />

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
            COD Black Ops 7 - Ladder 2v2
          </h1>
          <p class="page-subtitle">
            Formez un duo tactique et dominez les cartes en coopération
          </p>
        </div>
      </div>
    </div>

    <!-- Team Status Check -->
    <div v-if="!hasTeam" class="team-required-message">
      <div class="message-content">
        <Icon name="mdi:account-group" class="message-icon" />
        <div class="message-text">
          <h3>Escouade requise</h3>
          <p>Vous devez faire partie d'une escouade 2v2 COD pour participer à ce mode de jeu.</p>
        </div>
        <button @click="$router.push('/equipes')" class="create-team-btn">
          <Icon name="mdi:plus-circle" />
          Créer une escouade
        </button>
      </div>
    </div>

    <!-- Main Content (only shown if user has team) -->
    <div v-else>
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
              {{ userTeam.team.members.length }}/{{ userTeam.team.maxMembers }} soldats
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
            Stats Escouade
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
              <p class="section-subtitle">Acceptez un défi pour affronter une autre escouade immédiatement</p>
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
              <p class="empty-description">Soyez la première escouade à créer un défi ! D'autres équipes pourront l'accepter et vous affronter.</p>
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
                    <span class="mode-badge team-mode">{{ challenge.gameMode }}</span>
                  </div>
                </div>

                <div class="challenge-body">
                  <div class="challenge-info">
                    <div class="challenge-status">
                      <div class="status-indicator team-match"></div>
                      <span>Combat d'escouade</span>
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
            <h2>Règlement du Ladder 2v2 COD BO7</h2>
            <p class="rules-intro">Règles spécifiques aux combats d'escouades en 2v2.</p>
          </div>
          
          <div class="rules-content">
            <div class="rule-section">
              <div class="rule-icon">
                <Icon name="mdi:account-group" />
              </div>
              <div class="rule-content">
                <h3>Éligibilité d'escouade</h3>
                <ul>
                  <li>Faire partie d'une escouade 2v2 active</li>
                  <li>L'escouade doit avoir exactement 2 membres</li>
                  <li>Tous les membres doivent posséder COD BO7</li>
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
                  <li><strong>Mode :</strong> Multijoueur classé (2v2)</li>
                  <li><strong>Objectif :</strong> Premier à 50 éliminations</li>
                  <li><strong>Cartes :</strong> Rotation cartes compétitives 2v2</li>
                  <li><strong>Armes :</strong> Méta autorisée selon saison</li>
                  <li><strong>Communication :</strong> Discord ou chat vocal requis</li>
                </ul>
              </div>
            </div>

            <div class="rule-section">
              <div class="rule-icon">
                <Icon name="mdi:trophy" />
              </div>
              <div class="rule-content">
                <h3>Classement d'escouade</h3>
                <ul>
                  <li><strong>Victoire :</strong> +35 points ELO pour l'escouade</li>
                  <li><strong>Défaite :</strong> -30 points ELO pour l'escouade</li>
                  <li>Le classement se met à jour en temps réel</li>
                  <li>Minimum 3 matchs pour apparaître au classement</li>
                </ul>
              </div>
            </div>

            <div class="rule-section warning">
              <div class="rule-icon">
                <Icon name="mdi:alert" />
              </div>
              <div class="rule-content">
                <h3>Sanctions d'escouade</h3>
                <ul>
                  <li><strong>Abandon de match :</strong> Défaite + -15 points supplémentaires</li>
                  <li><strong>Membre absent :</strong> Sanctions pour toute l'escouade</li>
                  <li><strong>Tricherie/Exploit :</strong> Bannissement de l'escouade entière</li>
                  <li><strong>Comportement toxique :</strong> Sanctions modulées pour l'escouade</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Classement -->
        <div v-if="activeTab === 'ranking'" class="ranking-tab">
          <h2>Classement Ladder 2v2 COD</h2>
          
          <div v-if="ranking.length === 0" class="empty-state">
            <Icon name="mdi:podium" class="empty-icon" />
            <h3>Aucun classement disponible</h3>
            <p>Jouez vos premiers matchs d'escouade pour apparaître dans le classement !</p>
          </div>

          <div v-else class="ranking-list">
            <div class="ranking-header">
              <div class="rank-col">#</div>
              <div class="team-col">Escouade</div>
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
                  <span class="team-name">{{ team.team?.name || 'Escouade inconnue' }}</span>
                </div>
              </div>
              <div class="stats-col victories">{{ team.victories }}</div>
              <div class="stats-col defeats">{{ team.defeats }}</div>
              <div class="stats-col ratio">{{ calculateRatio(team) }}%</div>
              <div class="stats-col">{{ team.matchesPlayed }}</div>
            </div>
          </div>
        </div>

        <!-- Tab: Stats Escouade -->
        <div v-if="activeTab === 'stats'" class="stats-tab">
          <h2>Statistiques de l'Escouade</h2>
          
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
                <span class="detail-label">Escouade créée le :</span>
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
              <p class="challenge-subtitle">Choisissez un créneau pour votre escouade</p>
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
const selectedGame = ref('CALL_OF_DUTY_BO7-2v2')
const challenges = ref([])
const ranking = ref([])
const myStats = ref(null)
const hasTeam = ref(false)
const userTeam = ref(null)

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
    
    // Chercher une équipe 2v2 pour CALL_OF_DUTY_BO7
    const team2v2 = response.data?.find(team => 
      team.game === 'CALL_OF_DUTY_BO7' && 
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
    addNotification('Défi d\'escouade COD créé avec succès !', 'success')
    
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
/* Reprendre les mêmes styles que FC26 2v2 mais avec le thème COD (rouge) */
.ladder-2v2-cod-page {
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

/* Team Required Message avec thème COD */
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
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.create-team-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}

/* Team Info Card avec thème COD */
.team-info-card {
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  border: 2px solid rgba(239, 68, 68, 0.2);
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
  color: #EF4444;
  font-weight: 600;
  font-size: 1rem;
}

.team-description {
  color: #9CA3AF;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.member-count {
  color: #EF4444;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Headers et Tabs avec thème COD */
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

/* Tabs avec thème COD */
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

/* Éléments COD avec couleurs thème */
.game-badge.cod {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.mode-badge.team-mode {
  background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
  color: white;
  border: none;
}

.status-indicator.team-match {
  background: #EF4444;
}

/* Continue avec les autres styles en adaptant les couleurs... */
/* Pour économiser l'espace, je vais inclure les styles principaux */

.tab-content {
  min-height: 400px;
}

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

/* Stats Cards */
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

/* Modal avec thème COD */
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

.time-icon {
  color: #EF4444;
}

.btn-primary.cod {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  border: 1px solid #EF4444;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.btn-primary.cod:hover:not(:disabled) {
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
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
</style>