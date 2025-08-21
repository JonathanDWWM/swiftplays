<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader :title="player?.pseudo || 'Profil Joueur'" />

      <!-- Page Content -->
      <main class="page-content">
        <div class="content-container">
          
          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Chargement du profil...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <FontAwesomeIcon icon="exclamation-triangle" class="error-icon" />
            <h3>Erreur</h3>
            <p>{{ error }}</p>
          </div>

          <!-- Player Profile -->
          <template v-else-if="player">
            
            <!-- Success Message -->
            <div v-if="successMessage" class="success-alert">
              <FontAwesomeIcon icon="check-circle" class="success-icon" />
              <span>{{ successMessage }}</span>
            </div>

            <!-- Player Header Section -->
            <div class="player-section header-section">
              <div class="player-header-content">
                <div class="player-avatar-container">
                  <img 
                    :src="player.avatar || player.discordAvatar || '/logo.png'" 
                    :alt="player.pseudo"
                    class="player-avatar-image"
                  />
                </div>
                
                <div class="player-info">
                  <div class="player-name-section">
                    <h2 class="player-name">{{ player.pseudo }}</h2>
                    <div v-if="player.firstName || player.lastName" class="player-real-name">
                      {{ player.firstName }} {{ player.lastName }}
                    </div>
                  </div>
                  
                  <div class="player-details">
                    <div class="player-detail-item">
                      <span class="detail-label">Type de compte:</span>
                      <span class="detail-value">
                        <span v-if="player.accountType === 'DISCORD'" class="account-type discord">
                          <FontAwesomeIcon icon="fab fa-discord" /> Discord
                        </span>
                        <span v-else-if="player.accountType === 'HYBRID'" class="account-type hybrid">
                          <FontAwesomeIcon icon="envelope" /> <FontAwesomeIcon icon="fab fa-discord" /> Hybride
                        </span>
                        <span v-else class="account-type email">
                          <FontAwesomeIcon icon="envelope" /> Email
                        </span>
                      </span>
                    </div>
                    <div class="player-detail-item">
                      <span class="detail-label">Membre depuis:</span>
                      <span class="detail-value">{{ formatDate(player.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Actions (seulement si ce n'est pas son propre profil) -->
              <div v-if="!isOwnProfile" class="player-actions">
                <button @click="showInviteModal = true" class="invite-player-btn" :disabled="userTeams.length === 0">
                  <FontAwesomeIcon icon="user-plus" />
                  {{ userTeams.length === 0 ? 'Aucune équipe' : 'Inviter dans mon équipe' }}
                </button>
              </div>
            </div>

            <!-- Player Teams Section -->
            <div v-if="playerTeams.length > 0" class="player-section teams-section">
              <h3 class="section-title">Équipes ({{ playerTeams.length }})</h3>
              <div class="teams-grid">
                <div 
                  v-for="membership in playerTeams" 
                  :key="membership.team.id"
                  class="team-card"
                >
                  <div class="team-avatar">
                    <img 
                      v-if="membership.team.avatar" 
                      :src="membership.team.avatar" 
                      :alt="membership.team.name"
                      class="team-avatar-img"
                    />
                    <div v-else class="team-avatar-placeholder">
                      {{ membership.team.name.charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  
                  <div class="team-info">
                    <h4 class="team-name">{{ membership.team.name }}</h4>
                    <div class="team-game">{{ getGameDisplayName(membership.team.game) }} - {{ membership.team.gameMode }}</div>
                    <div class="team-role">{{ getRoleDisplayName(membership.role) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Invite Modal -->
            <div v-if="showInviteModal" class="modal-overlay" @click="closeInviteModal">
              <div class="modal-content" @click.stop>
                <div class="modal-header">
                  <h3>Inviter {{ player.pseudo }}</h3>
                  <button @click="closeInviteModal" class="modal-close">
                    <FontAwesomeIcon icon="times" />
                  </button>
                </div>
                
                <form @submit.prevent="handleInvitePlayer" class="invite-form">
                  <div class="form-group">
                    <label for="selectedTeam" class="form-label">Choisir une équipe *</label>
                    <select
                      id="selectedTeam"
                      v-model="inviteForm.teamId"
                      class="form-input"
                      :class="{ 'form-input--error': inviteErrors.teamId }"
                      required
                    >
                      <option value="">Sélectionner une équipe</option>
                      <option 
                        v-for="team in userTeams" 
                        :key="team.id" 
                        :value="team.id"
                      >
                        {{ team.name }} ({{ getGameDisplayName(team.game) }} - {{ team.gameMode }})
                      </option>
                    </select>
                    <span v-if="inviteErrors.teamId" class="form-error">{{ inviteErrors.teamId }}</span>
                  </div>

                  <div class="form-group">
                    <label for="inviteMessage" class="form-label">Message personnalisé (optionnel)</label>
                    <textarea
                      id="inviteMessage"
                      v-model="inviteForm.message"
                      class="form-textarea"
                      rows="3"
                      placeholder="Message d'invitation personnalisé..."
                    ></textarea>
                  </div>

                  <div v-if="inviteErrors.general" class="error-message">
                    {{ inviteErrors.general }}
                  </div>

                  <div class="form-actions">
                    <button type="button" @click="closeInviteModal" class="cancel-btn">
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      class="invite-btn"
                      :disabled="isInviting"
                    >
                      {{ isInviting ? 'Envoi...' : 'Envoyer l\'invitation' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </template>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Sidebar from "~/components/Sidebar.vue"
import AppHeader from "~/components/AppHeader.vue"

// Configuration de la page
definePageMeta({
  middleware: 'auth',
  title: 'Profil Joueur - SwiftPlays'
})

// Stores
const authStore = useAuthStore()
const route = useRoute()

// État du joueur
const player = ref(null)
const playerTeams = ref([])
const userTeams = ref([])
const loading = ref(true)
const error = ref('')

// État des modales
const showInviteModal = ref(false)

// État des opérations
const isInviting = ref(false)

// Messages
const successMessage = ref('')

// Formulaire d'invitation
const inviteForm = ref({
  teamId: '',
  message: ''
})

const inviteErrors = ref({
  teamId: '',
  general: ''
})

// Computed properties
const isOwnProfile = computed(() => {
  return player.value && authStore.user && player.value.id === authStore.user.id
})

// Méthodes utilitaires
const getGameDisplayName = (game: string) => {
  const gameNames = {
    'FC_26': 'FC 26',
    'CALL_OF_DUTY_BO7': 'Call of Duty BO7',
    'LEAGUE_OF_LEGENDS': 'League of Legends',
    'VALORANT': 'Valorant',
    'COUNTER_STRIKE_2': 'Counter-Strike 2',
    'ROCKET_LEAGUE': 'Rocket League',
    'OVERWATCH_2': 'Overwatch 2',
    'APEX_LEGENDS': 'Apex Legends'
  }
  return gameNames[game] || game
}

const getRoleDisplayName = (role: string) => {
  const roles = {
    'CAPTAIN': 'Capitaine',
    'CO_CAPTAIN': 'Co-capitaine',
    'MEMBER': 'Membre',
    'SUBSTITUTE': 'Remplaçant'
  }
  return roles[role] || role
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// API Calls
const fetchPlayer = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const config = useRuntimeConfig()
    const token = useCookie('accessToken')
    const response = await $fetch(`${config.public.apiBase}/api/users/${route.params.pseudo}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      player.value = response.data.user
      playerTeams.value = response.data.teams || []
    } else {
      error.value = response.message || 'Erreur lors du chargement du profil'
    }
  } catch (err) {
    console.error('Erreur fetchPlayer:', err)
    error.value = 'Joueur introuvable ou erreur de connexion'
  } finally {
    loading.value = false
  }
}

const fetchUserTeams = async () => {
  try {
    const config = useRuntimeConfig()
    const token = useCookie('accessToken')
    const response = await $fetch(`${config.public.apiBase}/api/teams/my`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      userTeams.value = response.data || []
    }
  } catch (err) {
    console.error('Erreur fetchUserTeams:', err)
  }
}

// Gestion des modales
const closeInviteModal = () => {
  showInviteModal.value = false
  inviteErrors.value.teamId = ''
  inviteErrors.value.general = ''
  inviteForm.value.teamId = ''
  inviteForm.value.message = ''
}

// Invitation de joueur
const handleInvitePlayer = async () => {
  try {
    // Reset erreurs
    inviteErrors.value.teamId = ''
    inviteErrors.value.general = ''
    
    // Validation
    if (!inviteForm.value.teamId) {
      inviteErrors.value.teamId = 'Veuillez sélectionner une équipe'
      return
    }
    
    isInviting.value = true
    
    const config = useRuntimeConfig()
    const token = useCookie('accessToken')
    const response = await $fetch(`${config.public.apiBase}/api/teams/${inviteForm.value.teamId}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: {
        playerPseudo: player.value.pseudo,
        message: inviteForm.value.message.trim() || undefined
      }
    })
    
    if (response.success) {
      closeInviteModal()
      successMessage.value = response.message
      
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
    }
  } catch (err: any) {
    console.error('Erreur invitation joueur:', err)
    
    if (err.data?.message) {
      inviteErrors.value.general = err.data.message
    } else {
      inviteErrors.value.general = 'Erreur lors de l\'envoi de l\'invitation'
    }
  } finally {
    isInviting.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchPlayer(),
    fetchUserTeams()
  ])
})
</script>

<style lang="scss" scoped>
.player-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-section {
  .player-header-content {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .player-avatar-container {
    flex-shrink: 0;
  }

  .player-avatar-image {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #f0f0f0;
  }

  .player-info {
    flex: 1;
  }

  .player-name {
    font-size: 2rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .player-real-name {
    color: #666;
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .player-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .player-detail-item {
    display: flex;
    gap: 1rem;

    .detail-label {
      font-weight: 600;
      color: #555;
      min-width: 150px;
    }

    .detail-value {
      color: #333;
    }
  }

  .account-type {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;

    &.discord {
      background-color: #5865f2;
      color: white;
    }

    &.email {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    &.hybrid {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }
  }

  .player-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
}

.invite-player-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #218838 0%, #1ba085 100%);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
}

.teams-section {
  .teams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .team-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      border-color: #ccc;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .team-avatar {
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    border-radius: 8px;
    overflow: hidden;

    .team-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .team-avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 1.2rem;
    }
  }

  .team-info {
    flex: 1;

    .team-name {
      font-weight: bold;
      margin-bottom: 0.25rem;
    }

    .team-game {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }

    .team-role {
      background-color: #f0f0f0;
      color: #333;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      display: inline-block;
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #eee;

  h3 {
    margin: 0;
    font-size: 1.25rem;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;

    &:hover {
      color: #333;
    }
  }
}

.invite-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
  }

  .form-input,
  .form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: #007bff;
    }

    &.form-input--error {
      border-color: #dc3545;
    }
  }

  .form-error {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;

  .cancel-btn {
    padding: 0.75rem 1.5rem;
    border: 2px solid #ccc;
    background: white;
    color: #666;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      border-color: #999;
      color: #333;
    }
  }

  .invite-btn {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #218838 0%, #1ba085 100%);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.success-alert {
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #c3e6cb;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
  margin-bottom: 1rem;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  .error-icon {
    font-size: 3rem;
    color: #dc3545;
    margin-bottom: 1rem;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>