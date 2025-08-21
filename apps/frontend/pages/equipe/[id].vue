<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader :title="team?.name || 'Chargement...'" />

      <!-- Page Content -->
      <main class="page-content">
        <div class="content-container">
          
          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Chargement de l'équipe...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <FontAwesomeIcon icon="exclamation-triangle" class="error-icon" />
            <h3>Erreur</h3>
            <p>{{ error }}</p>
            <button @click="fetchTeam" class="retry-btn">
              Réessayer
            </button>
          </div>

          <!-- Team Content -->
          <template v-else-if="team">
            
            <!-- Success Message -->
            <div v-if="successMessage" class="success-alert">
              <FontAwesomeIcon icon="check-circle" class="success-icon" />
              <span>{{ successMessage }}</span>
            </div>

            <!-- Team Header Section -->
            <div class="team-section header-section">
              <div class="team-header-content">
                <div class="team-avatar-container">
                  <div class="team-avatar-preview">
                    <img 
                      :src="team.avatar || '/logo.png'" 
                      :alt="team.name"
                      class="team-avatar-image"
                    />
                    <div v-if="isOwner" class="avatar-overlay">
                      <button class="change-avatar-btn" @click="$refs.avatarInput.click()">
                        <FontAwesomeIcon icon="camera" />
                        Changer
                      </button>
                    </div>
                  </div>
                  <input 
                    v-if="isOwner"
                    ref="avatarInput"
                    type="file" 
                    accept="image/*" 
                    @change="handleAvatarChange" 
                    style="display: none;"
                  />
                </div>
                
                <div class="team-info">
                  <div class="team-name-section">
                    <h2 class="team-name">{{ team.name }}</h2>
                    <span class="team-short-name">{{ team.shortName }}</span>
                    <div class="team-creation-date">Créée le {{ formatDate(team.createdAt) }}</div>
                  </div>
                  
                  <div class="team-badges">
                    <div class="team-badge game-mode-badge">
                      {{ getGameDisplayName(team.game) }} / {{ team.gameMode }}
                    </div>
                    <div class="team-badge members-badge">
                      Membres : 1
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="isOwner" class="team-actions">
                <button @click="showEditModal = true" class="edit-team-btn">
                  <FontAwesomeIcon icon="edit" />
                  Modifier l'équipe
                </button>
                <button @click="showInviteModal = true" class="invite-team-btn">
                  <FontAwesomeIcon icon="user-plus" />
                  Inviter des joueurs
                </button>
                <button @click="showDeleteModal = true" class="delete-team-btn">
                  <FontAwesomeIcon icon="trash" />
                  Supprimer
                </button>
              </div>
            </div>

            <!-- Team Description Section -->
            <div v-if="team.description" class="team-section description-section">
              <h3 class="section-title">Description</h3>
              <p class="team-description">{{ team.description }}</p>
            </div>

            <!-- Team Members Section -->
            <div class="team-section members-section">
              <h3 class="section-title">Membres ({{ totalMembers }})</h3>
              <div class="members-list">
                <div 
                  v-for="member in allMembers" 
                  :key="member.id"
                  :class="getCardClass(member.role)"
                  class="member-card"
                >
                  <img 
                    :src="member.user.avatar || member.user.discordAvatar || '/default-avatar.svg'" 
                    :alt="member.user.pseudo"
                    class="member-avatar"
                  />
                  <div class="member-info">
                    <NuxtLink :to="`/u/${member.user.pseudo}`" class="member-name-link">
                      <span class="member-name">{{ member.user.pseudo }}</span>
                    </NuxtLink>
                    <span :class="getRoleClass(member.role)" class="member-role">
                      {{ getRoleDisplayName(member.role) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Team Statistics Section -->
            <div class="team-section stats-section">
              <h3 class="section-title">Statistiques</h3>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">
                    <FontAwesomeIcon icon="trophy" />
                  </div>
                  <div class="stat-content">
                    <h4 class="stat-title">Victoires</h4>
                    <p class="stat-value">0</p>
                  </div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-icon">
                    <FontAwesomeIcon icon="times" />
                  </div>
                  <div class="stat-content">
                    <h4 class="stat-title">Défaites</h4>
                    <p class="stat-value">0</p>
                  </div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-icon">
                    <FontAwesomeIcon icon="percentage" />
                  </div>
                  <div class="stat-content">
                    <h4 class="stat-title">Ratio V/D</h4>
                    <p class="stat-value">0%</p>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon">
                    <FontAwesomeIcon icon="star" />
                  </div>
                  <div class="stat-content">
                    <h4 class="stat-title">Classement</h4>
                    <p class="stat-value">Non classé</p>
                  </div>
                </div>

                <div class="stat-card">
                  <div class="stat-icon">
                    <FontAwesomeIcon icon="gamepad" />
                  </div>
                  <div class="stat-content">
                    <h4 class="stat-title">Matchs joués</h4>
                    <p class="stat-value">0</p>
                  </div>
                </div>

              </div>
            </div>

            <!-- Recent Activity Section -->
            <div class="team-section activity-section">
              <h3 class="section-title">Activité récente</h3>
              <div class="activity-list">
                <div class="activity-item">
                  <div class="activity-icon creation">
                    <FontAwesomeIcon icon="plus-circle" />
                  </div>
                  <div class="activity-content">
                    <p class="activity-text">Équipe créée par {{ team.owner.pseudo }}</p>
                    <span class="activity-time">{{ formatDate(team.createdAt) }}</span>
                  </div>
                </div>
                
                <div class="activity-item">
                  <div class="activity-icon info">
                    <FontAwesomeIcon icon="info-circle" />
                  </div>
                  <div class="activity-content">
                    <p class="activity-text">Aucune autre activité récente</p>
                    <span class="activity-time">L'équipe vient d'être créée</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Edit Modal -->
            <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
              <div class="modal-content" @click.stop>
                <div class="modal-header">
                  <h3>Modifier l'équipe</h3>
                  <button @click="closeEditModal" class="modal-close">
                    <FontAwesomeIcon icon="times" />
                  </button>
                </div>
                
                <form @submit.prevent="handleUpdateTeam" class="edit-form">
                  <div class="form-group">
                    <label for="editName" class="form-label">Nom de l'équipe *</label>
                    <input
                      id="editName"
                      v-model="editForm.name"
                      type="text"
                      class="form-input"
                      :class="{ 'form-input--error': editErrors.name }"
                      placeholder="Nom de l'équipe"
                      required
                    />
                    <span v-if="editErrors.name" class="form-error">{{ editErrors.name }}</span>
                  </div>

                  <div class="form-group">
                    <label for="editShortName" class="form-label">Nom court (3 caractères) *</label>
                    <input
                      id="editShortName"
                      v-model="editForm.shortName"
                      type="text"
                      maxlength="3"
                      class="form-input"
                      :class="{ 'form-input--error': editErrors.shortName }"
                      placeholder="ABC"
                      required
                    />
                    <span v-if="editErrors.shortName" class="form-error">{{ editErrors.shortName }}</span>
                  </div>

                  <div class="form-actions">
                    <button type="button" @click="closeEditModal" class="cancel-btn">
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      class="save-btn"
                      :disabled="isUpdating"
                    >
                      {{ isUpdating ? 'Sauvegarde...' : 'Sauvegarder' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Invite Player Modal -->
            <div v-if="showInviteModal" class="modal-overlay" @click="closeInviteModal">
              <div class="modal-content invite-modal" @click.stop>
                <div class="modal-header">
                  <div class="modal-title-section">
                    <FontAwesomeIcon icon="user-plus" class="modal-icon" />
                    <div>
                      <h3>Inviter un joueur</h3>
                      <p class="modal-subtitle">dans l'équipe {{ team.name }}</p>
                    </div>
                  </div>
                  <button @click="closeInviteModal" class="modal-close">
                    <FontAwesomeIcon icon="times" />
                  </button>
                </div>
                
                <form @submit.prevent="handleInvitePlayer" class="invite-form">
                  <!-- Informations sur l'équipe -->
                  <div class="team-preview">
                    <div class="team-preview-avatar">
                      <img 
                        :src="team.avatar || '/logo.png'" 
                        :alt="team.name"
                        class="preview-avatar-img"
                      />
                    </div>
                    <div class="team-preview-info">
                      <h4 class="preview-team-name">{{ team.name }}</h4>
                      <div class="preview-team-details">
                        <span class="preview-game">{{ getGameDisplayName(team.game) }} - {{ team.gameMode }}</span>
                        <span class="preview-members">1 membre</span>
                      </div>
                    </div>
                  </div>

                  <div class="form-section">
                    <div class="form-group">
                      <label for="playerPseudo" class="form-label">
                        <FontAwesomeIcon icon="user" class="label-icon" />
                        Pseudo du joueur *
                      </label>
                      <div class="input-wrapper autocomplete-wrapper">
                        <input
                          id="playerPseudo"
                          v-model="inviteForm.playerPseudo"
                          type="text"
                          class="form-input"
                          :class="{ 'form-input--error': inviteErrors.playerPseudo }"
                          placeholder="Entrez le pseudo du joueur..."
                          autocomplete="off"
                          @input="handlePseudoInput"
                          @keydown="handleSuggestionKeydown"
                          @blur="hideSuggestions"
                          required
                        />
                        <FontAwesomeIcon 
                          :icon="isSearchingUsers ? 'spinner' : 'search'" 
                          class="input-icon"
                          :class="{ 'fa-spin': isSearchingUsers }"
                          v-if="!inviteErrors.playerPseudo"
                        />
                        
                        <!-- Suggestions dropdown -->
                        <div v-if="showSuggestions" class="suggestions-dropdown">
                          <div 
                            v-for="(user, index) in suggestedUsers" 
                            :key="user.id"
                            class="suggestion-item"
                            :class="{ 'selected': index === selectedSuggestionIndex }"
                            @click="selectSuggestion(user)"
                          >
                            <img 
                              :src="user.avatar || user.discordAvatar || '/default-avatar.svg'" 
                              :alt="user.pseudo"
                              class="suggestion-avatar"
                            />
                            <div class="suggestion-info">
                              <span class="suggestion-pseudo">{{ user.pseudo }}</span>
                              <span v-if="user.firstName || user.lastName" class="suggestion-name">
                                {{ user.firstName }} {{ user.lastName }}
                              </span>
                            </div>
                            <div class="suggestion-account-type">
                              <FontAwesomeIcon 
                                v-if="user.accountType === 'DISCORD'" 
                                icon="fab fa-discord" 
                                class="discord-icon"
                              />
                              <FontAwesomeIcon 
                                v-else-if="user.accountType === 'HYBRID'" 
                                icon="envelope" 
                                class="email-icon"
                              />
                              <FontAwesomeIcon 
                                v-else 
                                icon="envelope" 
                                class="email-icon"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <span v-if="inviteErrors.playerPseudo" class="form-error">
                        <FontAwesomeIcon icon="exclamation-triangle" />
                        {{ inviteErrors.playerPseudo }}
                      </span>
                    </div>

                    <div class="form-group">
                      <label for="inviteMessage" class="form-label">
                        <FontAwesomeIcon icon="comment" class="label-icon" />
                        Message d'invitation (optionnel)
                      </label>
                      <textarea
                        id="inviteMessage"
                        v-model="inviteForm.message"
                        class="form-textarea"
                        rows="4"
                        :placeholder="`Rejoignez-nous dans ${team.name} ! Nous recherchons des joueurs motivés pour notre équipe ${getGameDisplayName(team.game)}.`"
                      ></textarea>
                      <div class="message-helper">
                        <FontAwesomeIcon icon="lightbulb" class="helper-icon" />
                        <span>Un message personnalisé augmente les chances d'acceptation</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="inviteErrors.general" class="error-message">
                    <FontAwesomeIcon icon="exclamation-circle" />
                    {{ inviteErrors.general }}
                  </div>

                  <div class="form-actions">
                    <button type="button" @click="closeInviteModal" class="cancel-btn">
                      <FontAwesomeIcon icon="times" />
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      class="invite-btn"
                      :disabled="isInviting || !inviteForm.playerPseudo.trim()"
                    >
                      <FontAwesomeIcon 
                        :icon="isInviting ? 'spinner' : 'paper-plane'" 
                        :class="{ 'fa-spin': isInviting }"
                      />
                      {{ isInviting ? 'Envoi en cours...' : 'Envoyer l\'invitation' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
              <div class="modal-content delete-modal" @click.stop>
                <div class="modal-header">
                  <div class="modal-title-section">
                    <FontAwesomeIcon icon="exclamation-triangle" class="modal-icon danger" />
                    <div>
                      <h3>Supprimer l'équipe</h3>
                      <p class="modal-subtitle">Action irréversible</p>
                    </div>
                  </div>
                  <button @click="showDeleteModal = false" class="modal-close">
                    <FontAwesomeIcon icon="times" />
                  </button>
                </div>
                
                <div class="delete-content">
                  <div class="team-info-delete">
                    <img 
                      :src="team.avatar || '/logo.png'" 
                      :alt="team.name"
                      class="team-avatar-delete"
                    />
                    <div class="team-details-delete">
                      <h4 class="team-name-delete">{{ team.name }}</h4>
                      <span class="team-game-delete">{{ getGameDisplayName(team.game) }} - {{ team.gameMode }}</span>
                    </div>
                  </div>
                  
                  <div class="warning-message">
                    <p>Êtes-vous sûr de vouloir supprimer cette équipe ?</p>
                    <div class="warning-list">
                      <div class="warning-item">
                        <FontAwesomeIcon icon="users" />
                        <span>Tous les membres seront exclus</span>
                      </div>
                      <div class="warning-item">
                        <FontAwesomeIcon icon="chart-line" />
                        <span>Toutes les statistiques seront perdues</span>
                      </div>
                      <div class="warning-item">
                        <FontAwesomeIcon icon="trash" />
                        <span>Cette action est définitive et irréversible</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-actions">
                  <button @click="showDeleteModal = false" class="cancel-btn">
                    <FontAwesomeIcon icon="times" />
                    Annuler
                  </button>
                  <button 
                    @click="handleDeleteTeam" 
                    class="delete-btn"
                    :disabled="isDeleting"
                  >
                    <FontAwesomeIcon 
                      :icon="isDeleting ? 'spinner' : 'trash'" 
                      :class="{ 'fa-spin': isDeleting }"
                    />
                    {{ isDeleting ? 'Suppression...' : 'Supprimer définitivement' }}
                  </button>
                </div>
              </div>
            </div>

          </template>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Sidebar from "~/components/Sidebar.vue"
import AppHeader from "~/components/AppHeader.vue"

// Configuration de la page
definePageMeta({
  middleware: 'auth',
  title: 'SwiftPlays | Équipe'
})

// Stores
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// État de l'équipe
const team = ref(null)
const loading = ref(true)
const error = ref('')

// État des modales
const showEditModal = ref(false)
const showInviteModal = ref(false)
const showDeleteModal = ref(false)

// État des opérations
const isUpdating = ref(false)
const isDeleting = ref(false)
const isInviting = ref(false)

// Messages
const successMessage = ref('')


// Formulaire d'édition
const editForm = reactive({
  name: '',
  shortName: ''
})

const editErrors = reactive({
  name: '',
  shortName: ''
})

// Formulaire d'invitation
const inviteForm = reactive({
  playerPseudo: '',
  message: ''
})

const inviteErrors = reactive({
  playerPseudo: '',
  general: ''
})

// Autocompletion des pseudos
const suggestedUsers = ref([])
const showSuggestions = ref(false)
const selectedSuggestionIndex = ref(-1)
const isSearchingUsers = ref(false)

// Computed properties
const isOwner = computed(() => {
  return team.value && authStore.user && team.value.owner.id === authStore.user.id
})

const totalMembers = computed(() => {
  if (!team.value) return 0
  return 1 + (team.value.members?.length || 0) // 1 pour le propriétaire + les membres
})

const allMembers = computed(() => {
  if (!team.value) return []
  
  // Créer la liste complète : propriétaire + membres
  const ownerMember = {
    id: team.value.owner.id,
    user: {
      id: team.value.owner.id,
      pseudo: team.value.owner.pseudo,
      avatar: team.value.owner.avatar,
      discordAvatar: team.value.owner.discordAvatar
    },
    role: 'CAPTAIN',
    joinedAt: team.value.createdAt,
    isOwner: true
  }
  
  const teamMembers = (team.value.members || []).map(member => ({
    id: member.user?.id || member.id,
    user: member.user || member,
    role: member.role,
    joinedAt: member.joinedAt,
    isOwner: false
  }))
  
  return [ownerMember, ...teamMembers]
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getRoleDisplayName = (role: string) => {
  const roles = {
    'CAPTAIN': 'Capitaine',
    'CO_CAPTAIN': 'Vice-capitaine',
    'MEMBER': 'Membre'
  }
  return roles[role] || role
}

const getRoleClass = (role: string) => {
  const roleClasses = {
    'CAPTAIN': 'owner-role',
    'CO_CAPTAIN': 'co-captain-role',
    'MEMBER': 'member-role-default'
  }
  return roleClasses[role] || 'member-role-default'
}

const getCardClass = (role: string) => {
  const cardClasses = {
    'CAPTAIN': 'owner-card',
    'CO_CAPTAIN': 'co-captain-card',
    'MEMBER': 'member-card-default'
  }
  return cardClasses[role] || 'member-card-default'
}

const getDaysActive = () => {
  if (!team.value?.createdAt) return '0'
  const createdDate = new Date(team.value.createdAt)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - createdDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays.toString()
}


// API Calls
const fetchTeam = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const config = useRuntimeConfig()
    const token = useCookie('accessToken')
    
    // Vérification des prérequis
    if (!route.params.id) {
      error.value = 'ID d\'équipe manquant'
      return
    }
    
    if (!token.value) {
      error.value = 'Token d\'authentification manquant'
      await router.push('/connexion')
      return
    }
    
    console.log('Fetching team with ID:', route.params.id)
    console.log('API Base:', config.public.apiBase)
    console.log('Token présent:', !!token.value)
    
    const response = await $fetch(`${config.public.apiBase}/api/teams/${route.params.id}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    console.log('Response received:', response)
    
    if (response.success) {
      team.value = response.data
      
      // Initialiser le formulaire d'édition
      editForm.name = team.value.name
      editForm.shortName = team.value.shortName
    } else {
      error.value = response.message || 'Erreur lors du chargement de l\'équipe'
    }
  } catch (err: any) {
    console.error('Erreur fetchTeam:', err)
    
    // Gestion d'erreurs spécifiques
    if (err.status === 401) {
      error.value = 'Session expirée. Veuillez vous reconnecter.'
      await router.push('/connexion')
    } else if (err.status === 404) {
      error.value = 'Équipe introuvable'
    } else if (err.status === 403) {
      error.value = 'Accès refusé à cette équipe'
    } else {
      error.value = err.data?.message || 'Erreur de connexion au serveur'
    }
  } finally {
    loading.value = false
  }
}

// Gestion des modales
const closeEditModal = () => {
  showEditModal.value = false
  // Reset des erreurs
  editErrors.name = ''
  editErrors.shortName = ''
  // Reset du formulaire
  if (team.value) {
    editForm.name = team.value.name
    editForm.shortName = team.value.shortName
  }
}

const closeInviteModal = () => {
  showInviteModal.value = false
  // Reset des erreurs
  inviteErrors.playerPseudo = ''
  inviteErrors.general = ''
  // Reset du formulaire
  inviteForm.playerPseudo = ''
  inviteForm.message = ''
  // Reset des suggestions
  suggestedUsers.value = []
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
}

// Mise à jour de l'équipe
const handleUpdateTeam = async () => {
  try {
    // Reset erreurs
    editErrors.name = ''
    editErrors.shortName = ''
    
    // Validation
    if (editForm.name.length < 2) {
      editErrors.name = 'Le nom doit contenir au moins 2 caractères'
      return
    }
    
    if (editForm.shortName.length !== 3) {
      editErrors.shortName = 'Le nom court doit faire exactement 3 caractères'
      return
    }
    
    isUpdating.value = true
    
    const config = useRuntimeConfig()
    const token = useCookie('accessToken')
    const response = await $fetch(`${config.public.apiBase}/api/teams/${route.params.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: editForm.name.trim(),
        shortName: editForm.shortName.trim().toUpperCase()
      }
    })
    
    if (response.success) {
      team.value = response.data
      showEditModal.value = false
      successMessage.value = 'Équipe mise à jour avec succès !'
      
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
    } else {
      if (response.message.includes('nom d\'équipe')) {
        editErrors.name = response.message
      } else if (response.message.includes('nom court')) {
        editErrors.shortName = response.message
      } else {
        error.value = response.message
      }
    }
  } catch (err) {
    console.error('Erreur updateTeam:', err)
    error.value = 'Erreur lors de la mise à jour'
  } finally {
    isUpdating.value = false
  }
}

// Suppression de l'équipe
const handleDeleteTeam = async () => {
  try {
    isDeleting.value = true
    
    const config = useRuntimeConfig()
    const token = useCookie('accessToken')
    const response = await $fetch(`${config.public.apiBase}/api/teams/${route.params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      // Rediriger vers la page des équipes
      router.push('/equipes')
    } else {
      error.value = response.message || 'Erreur lors de la suppression'
      showDeleteModal.value = false
    }
  } catch (err) {
    console.error('Erreur deleteTeam:', err)
    error.value = 'Erreur lors de la suppression'
    showDeleteModal.value = false
  } finally {
    isDeleting.value = false
  }
}

// Invitation de joueur
const handleInvitePlayer = async () => {
  try {
    // Reset erreurs
    inviteErrors.playerPseudo = ''
    inviteErrors.general = ''
    
    // Validation
    if (!inviteForm.playerPseudo.trim()) {
      inviteErrors.playerPseudo = 'Le pseudo est requis'
      return
    }
    
    isInviting.value = true
    
    const config = useRuntimeConfig()
    const token = useCookie('accessToken')
    const response = await $fetch(`${config.public.apiBase}/api/teams/${route.params.id}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: {
        playerPseudo: inviteForm.playerPseudo.trim(),
        message: inviteForm.message.trim() || undefined
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
      inviteErrors.general = err.data.message
    } else {
      inviteErrors.general = 'Erreur lors de l\'envoi de l\'invitation'
    }
  } finally {
    isInviting.value = false
  }
}

// Changement d'avatar
const handleAvatarChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Validation taille
  if (file.size > 2 * 1024 * 1024) {
    alert('Le fichier est trop volumineux (max 2MB)')
    return
  }

  // Validation type
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner une image')
    return
  }

  // TODO: Implémenter l'upload d'avatar d'équipe
  console.log('Avatar d\'équipe sélectionné:', file)
}

// Recherche d'utilisateurs pour autocompletion
const searchUsers = async (query: string) => {
  if (query.length < 2) {
    suggestedUsers.value = []
    showSuggestions.value = false
    return
  }

  try {
    isSearchingUsers.value = true
    const config = useRuntimeConfig()
    const token = useCookie('accessToken')
    
    const response = await $fetch(`${config.public.apiBase}/api/users/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      // Filtrer les utilisateurs pour exclure le propriétaire de l'équipe
      suggestedUsers.value = response.data.filter(user => user.id !== team.value?.owner.id)
      showSuggestions.value = suggestedUsers.value.length > 0
      selectedSuggestionIndex.value = -1
    }
  } catch (err) {
    console.error('Erreur recherche utilisateurs:', err)
    suggestedUsers.value = []
    showSuggestions.value = false
  } finally {
    isSearchingUsers.value = false
  }
}

// Gestion de la saisie dans l'input pseudo
const handlePseudoInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  inviteForm.playerPseudo = value
  searchUsers(value)
}

// Sélection d'un utilisateur suggéré
const selectSuggestion = (user: any) => {
  inviteForm.playerPseudo = user.pseudo
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
}

// Navigation clavier dans les suggestions
const handleSuggestionKeydown = (event: KeyboardEvent) => {
  if (!showSuggestions.value || suggestedUsers.value.length === 0) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedSuggestionIndex.value = Math.min(
      selectedSuggestionIndex.value + 1,
      suggestedUsers.value.length - 1
    )
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
  } else if (event.key === 'Enter' && selectedSuggestionIndex.value >= 0) {
    event.preventDefault()
    selectSuggestion(suggestedUsers.value[selectedSuggestionIndex.value])
  } else if (event.key === 'Escape') {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }
}

// Masquer les suggestions quand on clique ailleurs
const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }, 150)
}

// Lifecycle
onMounted(() => {
  fetchTeam()
})
</script>

<style lang="scss" scoped>
// Sections principales
.team-section {
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
  color: #F3F4F6;
}

// Section header
.header-section {
  .team-header-content {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
    margin-bottom: 1.5rem;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.5rem;
    }
  }

  .team-avatar-container {
    flex-shrink: 0;
    position: relative;
  }

  .team-avatar-preview {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 12px;
    overflow: hidden;
    border: 4px solid #f0f0f0;
    transition: all 0.3s ease;

    &:hover .avatar-overlay {
      opacity: 1;
    }
  }

  .team-avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .change-avatar-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  .team-info {
    flex: 1;
  }

  .team-name-section {
    margin-bottom: 1rem;
  }

  .team-name {
    font-size: 2rem;
    font-weight: bold;
    color: #F3F4F6;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .team-short-name {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    letter-spacing: 1px;
  }

  .team-creation-date {
    font-style: italic;
    color: #9CA3AF;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .team-badges {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .team-badge {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .game-mode-badge {
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    color: #1565c0;
    border: 1px solid #bbdefb;
  }

  .members-badge {
    background: linear-gradient(135deg, #f3e5f5 0%, #e8f5e8 100%);
    color: #7b1fa2;
    border: 1px solid #e1bee7;
  }

  .team-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      justify-content: center;
    }
  }
}

// Boutons d'action
.edit-team-btn {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
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

  &:hover {
    background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.invite-team-btn {
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

  &:hover {
    background: linear-gradient(135deg, #218838 0%, #1ba085 100%);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.delete-team-btn {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
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

  &:hover {
    background: linear-gradient(135deg, #c82333 0%, #a71e2a 100%);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

// Section description
.description-section {
  .section-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #F3F4F6;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &::before {
      content: "";
      width: 4px;
      height: 1.5rem;
      background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
      border-radius: 2px;
    }
  }

  .team-description {
    color: #D1D5DB;
    line-height: 1.6;
    font-size: 1rem;
    padding: 1rem;
    background: rgba(59, 130, 214, 0.1);
    border-radius: 8px;
    border-left: 4px solid #3B82D6;
  }
}

// Section membres
.members-section {
  .section-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #F3F4F6;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &::before {
      content: "";
      width: 4px;
      height: 1.5rem;
      background: linear-gradient(135deg, #34D399 0%, #10B981 100%);
      border-radius: 2px;
    }
  }

  .members-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .member-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border: 2px solid rgba(59, 130, 214, 0.2);
    border-radius: 12px;
    transition: all 0.3s ease;
    background: rgba(31, 41, 55, 0.5);
    backdrop-filter: blur(10px);

    &:hover {
      border-color: rgba(59, 130, 214, 0.4);
      box-shadow: 0 4px 12px rgba(59, 130, 214, 0.2);
      transform: translateY(-2px);
    }

    &.owner-card {
      border-color: rgba(255, 193, 7, 0.5);
      background: rgba(255, 193, 7, 0.15);
      
      &:hover {
        border-color: rgba(255, 193, 7, 0.7);
        box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
      }
    }

    &.co-captain-card {
      border-color: rgba(139, 69, 19, 0.5);
      background: rgba(139, 69, 19, 0.15);
      
      &:hover {
        border-color: rgba(139, 69, 19, 0.7);
        box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
      }
    }

    &.member-card-default {
      border-color: rgba(34, 197, 94, 0.5);
      background: rgba(34, 197, 94, 0.15);
      
      &:hover {
        border-color: rgba(34, 197, 94, 0.7);
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
      }
    }

  }

  .member-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(59, 130, 214, 0.3);
    flex-shrink: 0;
  }

  .member-info {
    flex: 1;
  }

  .member-name {
    font-weight: bold;
    font-size: 1.1rem;
    color: #F3F4F6;
    margin-bottom: 0.25rem;
  }

  .member-role {
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &.owner-role {
      background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
      color: #1F2937;
    }

    &.co-captain-role {
      background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
      color: #F3F4F6;
    }

    &.member-role-default {
      background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
      color: #F3F4F6;
    }

  }

  .member-name-link {
    text-decoration: none;
    color: inherit;
    cursor: pointer;
  }
}

// Modales
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
  backdrop-filter: blur(4px);
}

.modal-content {
  background: rgba(26, 26, 26, 0.95);
  border: 2px solid rgba(59, 130, 214, 0.2);
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(15px);
  animation: modalSlideIn 0.3s ease-out;

  &.delete-modal {
    max-width: 400px;
    border-color: rgba(239, 68, 68, 0.3);
  }

  &.invite-modal {
    max-width: 600px;
    border-color: rgba(34, 197, 94, 0.3);
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.2);

  .modal-title-section {
    display: flex;
    align-items: center;
    gap: 1rem;

    .modal-icon {
      font-size: 1.5rem;
      color: #10B981;
      padding: 0.75rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
      border-radius: 12px;
    }

    h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: bold;
      color: #F3F4F6;
    }

    .modal-subtitle {
      margin: 0;
      font-size: 0.9rem;
      color: #9CA3AF;
      font-weight: 400;
    }
  }

  h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: bold;
    color: #F3F4F6;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #9CA3AF;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.2s ease;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(59, 130, 214, 0.2);
      color: #F3F4F6;
    }
  }
}

// Formulaires dans les modales
.edit-form,
.invite-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;
  }

  .form-input,
  .form-textarea {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid rgba(59, 130, 214, 0.2);
    border-radius: 10px;
    font-size: 1rem;
    transition: all 0.2s ease;
    background: rgba(31, 41, 55, 0.5);
    color: #F3F4F6;

    &::placeholder {
      color: #9CA3AF;
    }

    &:focus {
      outline: none;
      border-color: #3B82D6;
      background: rgba(31, 41, 55, 0.8);
      box-shadow: 0 0 0 3px rgba(59, 130, 214, 0.2);
    }

    &.form-input--error {
      border-color: #dc3545;
      background: rgba(220, 53, 69, 0.1);
    }
  }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
    font-family: inherit;
  }

  .form-error {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    display: block;
    font-weight: 500;
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(59, 130, 214, 0.2);

  @media (max-width: 480px) {
    flex-direction: column;
  }

  .cancel-btn {
    padding: 0.875rem 1.5rem;
    border: 2px solid rgba(156, 163, 175, 0.3);
    background: rgba(31, 41, 55, 0.5);
    color: #D1D5DB;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.95rem;
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(156, 163, 175, 0.5);
      color: #F3F4F6;
      background: rgba(31, 41, 55, 0.8);
    }
  }

  .save-btn {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    border: none;
    padding: 0.875rem 1.5rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  .invite-btn {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    padding: 0.875rem 1.5rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #218838 0%, #1ba085 100%);
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  .delete-btn {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    color: white;
    border: none;
    padding: 0.875rem 1.5rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #c82333 0%, #a71e2a 100%);
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }
}

// Modal de suppression
.delete-modal {
  .modal-icon.danger {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
    color: #FCA5A5;
  }

  .modal-header {
    border-bottom-color: rgba(239, 68, 68, 0.2);
  }

  .form-actions {
    padding: 1.5rem 2rem;
    gap: 0.75rem;
    border-top: 1px solid rgba(239, 68, 68, 0.2);

    .cancel-btn,
    .delete-btn {
      padding: 0.75rem 1.25rem;
      font-size: 0.9rem;
    }
  }
}

.delete-content {
  padding: 1.5rem 2rem 0;

  .team-info-delete {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba(31, 41, 55, 0.8);
    border: 2px solid rgba(59, 130, 214, 0.3);
    border-radius: 12px;
    margin-bottom: 1.5rem;

    .team-avatar-delete {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid rgba(59, 130, 214, 0.5);
      flex-shrink: 0;
    }

    .team-details-delete {
      flex: 1;

      .team-name-delete {
        font-size: 1.1rem;
        font-weight: bold;
        color: #F3F4F6;
        margin: 0 0 0.25rem 0;
      }

      .team-game-delete {
        color: #9CA3AF;
        font-size: 0.85rem;
        font-weight: 500;
      }
    }
  }

  .warning-message {
    text-align: center;

    p {
      font-size: 1.05rem;
      color: #F3F4F6;
      margin-bottom: 1.5rem;
      font-weight: 500;
      line-height: 1.5;
    }

    .warning-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      text-align: left;
      margin-bottom: 1rem;

      .warning-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1.125rem;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.25);
        border-radius: 8px;
        color: #F8FAFC;
        font-size: 0.9rem;
        font-weight: 500;

        svg {
          color: #FCA5A5;
          font-size: 0.95rem;
          flex-shrink: 0;
        }
      }
    }
  }
}

// Messages d'état
.success-alert {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  color: #155724;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  border: 1px solid #c3e6cb;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;

  .success-icon {
    font-size: 1.2rem;
  }
}

.error-message {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  color: #721c24;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  border: 1px solid #f5c6cb;
  margin-bottom: 1rem;
  font-weight: 500;
}

// États de chargement et d'erreur
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

  .retry-btn {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);
      transform: translateY(-1px);
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Styles spécifiques au modal d'invitation
.invite-modal {
  .team-preview {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 2px solid #e0e0e0;

    .team-preview-avatar {
      flex-shrink: 0;
      width: 60px;
      height: 60px;
      border-radius: 10px;
      overflow: hidden;
      border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .preview-avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .team-preview-info {
      flex: 1;

      .preview-team-name {
        font-size: 1.2rem;
        font-weight: bold;
        color: #333;
        margin-bottom: 0.5rem;
      }

      .preview-team-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.9rem;
        color: #666;

        .preview-game {
          font-weight: 500;
        }

        .preview-members {
          color: #28a745;
          font-weight: 500;
        }
      }
    }
  }

  .form-section {
    padding: 0 1rem;
  }

  .form-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;

    .label-icon {
      color: #007bff;
      font-size: 0.9rem;
    }
  }

  .input-wrapper {
    position: relative;

    .form-input {
      padding-right: 3rem;
    }

    .input-icon {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9CA3AF;
      font-size: 0.9rem;
    }

    &.autocomplete-wrapper {
      .suggestions-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: rgba(31, 41, 55, 0.95);
        border: 2px solid rgba(59, 130, 214, 0.3);
        border-radius: 10px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        z-index: 1000;
        max-height: 250px;
        overflow-y: auto;

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(59, 130, 214, 0.1);

          &:last-child {
            border-bottom: none;
          }

          &:hover,
          &.selected {
            background: rgba(59, 130, 214, 0.2);
          }

          .suggestion-avatar {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(59, 130, 214, 0.3);
            flex-shrink: 0;
          }

          .suggestion-info {
            flex: 1;
            min-width: 0;

            .suggestion-pseudo {
              display: block;
              font-weight: 600;
              color: #F3F4F6;
              font-size: 0.95rem;
            }

            .suggestion-name {
              display: block;
              color: #9CA3AF;
              font-size: 0.8rem;
              margin-top: 0.15rem;
            }
          }

          .suggestion-account-type {
            flex-shrink: 0;

            .discord-icon {
              color: #5865f2;
            }

            .email-icon {
              color: #9CA3AF;
            }
          }
        }
      }
    }
  }

  .form-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .message-helper {
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
    border-radius: 8px;
    border-left: 4px solid #ffc107;
    font-size: 0.85rem;
    color: #856404;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .helper-icon {
      color: #ffc107;
      font-size: 0.9rem;
    }
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1rem;
  }

  .form-actions {
    .cancel-btn,
    .invite-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
    }
  }
}

// Section statistiques
.stats-section {
  .section-title {
    &::before {
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    background: rgba(31, 41, 55, 0.5);
    border: 2px solid rgba(59, 130, 214, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);

    &:hover {
      border-color: rgba(59, 130, 214, 0.3);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
      font-size: 2rem;
      color: #3B82D6;
      opacity: 0.8;
    }

    .stat-content {
      flex: 1;
    }

    .stat-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #9CA3AF;
      margin: 0 0 0.5rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #F3F4F6;
      margin: 0;
    }
  }
}

// Section activité récente
.activity-section {
  .section-title {
    &::before {
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
    }
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba(31, 41, 55, 0.5);
    border: 2px solid rgba(59, 130, 214, 0.1);
    border-radius: 12px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);

    &:hover {
      border-color: rgba(59, 130, 214, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
  }

  .activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
    color: white;

    &.creation {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    }

    &.info {
      background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
    }

    &.match {
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    }

    &.member {
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
    }
  }

  .activity-content {
    flex: 1;
    min-width: 0;
  }

  .activity-text {
    color: #F3F4F6;
    font-weight: 500;
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
  }

  .activity-time {
    color: #9CA3AF;
    font-size: 0.85rem;
    font-style: italic;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 1.25rem;
  }

  .activity-item {
    padding: 1rem;
  }

  .activity-icon {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
}
</style>