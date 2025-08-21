<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">{{ team?.name || 'Chargement...' }}</h1>
        </div>
        
        <div class="header-right">
          <!-- Search Bar -->
          <SearchBar />
          
          <!-- User Menu -->
          <div class="user-menu">
            <button @click="toggleUserDropdown" class="user-button">
              <img 
                v-if="authStore.user?.avatar || authStore.user?.discordAvatar" 
                :src="authStore.user.avatar || authStore.user.discordAvatar" 
                :alt="authStore.user.pseudo" 
                class="user-avatar-image"
              />
              <div 
                v-else 
                class="user-avatar"
              >
                {{ authStore.user?.pseudo?.charAt(0).toUpperCase() }}
              </div>
              <span class="user-name">{{ authStore.user?.pseudo }}</span>
            </button>
            
            <!-- Dropdown Menu -->
            <div v-if="showUserDropdown" class="user-dropdown">
              <NuxtLink to="/dashboard" class="dropdown-item">
                Accueil
              </NuxtLink>
              <a href="#" class="dropdown-item">
                Paramètres
              </a>
              <div class="dropdown-divider"></div>
              <button @click="handleLogout" class="dropdown-item logout-item" :disabled="authStore.isLoading">
                {{ authStore.isLoading ? 'Déconnexion...' : 'Se déconnecter' }}
              </button>
            </div>
          </div>
        </div>
      </header>

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
              <h3 class="section-title">Membres (1)</h3>
              <div class="members-list">
                <div class="member-card owner-card">
                  <img 
                    :src="team.owner.avatar || team.owner.discordAvatar || '/default-avatar.svg'" 
                    :alt="team.owner.pseudo"
                    class="member-avatar"
                  />
                  <div class="member-info">
                    <span class="member-name">{{ team.owner.pseudo }}</span>
                    <span class="member-role owner-role">Capitaine</span>
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

            <!-- Delete Confirmation Modal -->
            <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
              <div class="modal-content delete-modal" @click.stop>
                <div class="modal-header">
                  <h3>Supprimer l'équipe</h3>
                  <button @click="showDeleteModal = false" class="modal-close">
                    <FontAwesomeIcon icon="times" />
                  </button>
                </div>
                
                <div class="delete-content">
                  <FontAwesomeIcon icon="exclamation-triangle" class="warning-icon" />
                  <p>Êtes-vous sûr de vouloir supprimer l'équipe <strong>{{ team.name }}</strong> ?</p>
                  <p class="warning-text">Cette action est irréversible.</p>
                </div>

                <div class="form-actions">
                  <button @click="showDeleteModal = false" class="cancel-btn">
                    Annuler
                  </button>
                  <button 
                    @click="handleDeleteTeam" 
                    class="delete-btn"
                    :disabled="isDeleting"
                  >
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Sidebar from "~/components/Sidebar.vue"
import SearchBar from "~/components/SearchBar.vue"

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
const showDeleteModal = ref(false)

// État des opérations
const isUpdating = ref(false)
const isDeleting = ref(false)

// Messages
const successMessage = ref('')

// État local pour le dropdown utilisateur
const showUserDropdown = ref(false)

// Formulaire d'édition
const editForm = reactive({
  name: '',
  shortName: ''
})

const editErrors = reactive({
  name: '',
  shortName: ''
})

// Computed properties
const isOwner = computed(() => {
  return team.value && authStore.user && team.value.owner.id === authStore.user.id
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

// Gestion du dropdown utilisateur
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

const closeDropdown = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    showUserDropdown.value = false
  }
}

// Gestion de la déconnexion
const handleLogout = async () => {
  showUserDropdown.value = false
  await authStore.logout()
  window.location.href = '/'
}

// API Calls
const fetchTeam = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const config = useRuntimeConfig()
    const token = useCookie('accessToken')
    const response = await $fetch(`${config.public.apiBase}/api/teams/${route.params.id}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      team.value = response.data
      
      // Initialiser le formulaire d'édition
      editForm.name = team.value.name
      editForm.shortName = team.value.shortName
    } else {
      error.value = response.message || 'Erreur lors du chargement de l\'équipe'
    }
  } catch (err) {
    console.error('Erreur fetchTeam:', err)
    error.value = 'Erreur de connexion au serveur'
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

// Lifecycle
onMounted(() => {
  fetchTeam()
  
  // Écouter les clics pour fermer le dropdown
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style lang="scss" scoped>
.team-creation-date {
  font-style: italic;
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.team-badges {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.team-badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
}

.game-mode-badge {
  background-color: #e3f2fd;
  color: #1565c0;
  border: 1px solid #bbdefb;
}

.members-badge {
  background-color: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
}
</style>