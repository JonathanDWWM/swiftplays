<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">Mes Équipes</h1>
        </div>
        
        <div class="header-right">
          <!-- Search Bar -->
          <SearchBar />
          
          <!-- Notification Bell -->
          <NotificationBell />
          
          <!-- User Menu -->
          <div class="user-menu">
            <button @click="toggleUserDropdown" class="user-button">
              <img 
                v-if="authStore.user?.avatar" 
                :src="authStore.user.avatar" 
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
              <NuxtLink to="/profil" class="dropdown-item">
                Mon Profil
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
          
          <!-- Header with create button -->
          <div class="teams-header">
            <div class="teams-header-info">
              <h2 class="section-title">Mes Équipes</h2>
              <p class="section-subtitle">Gérez vos équipes et participez à des tournois</p>
            </div>
            <button @click="showCreateModal = true" class="create-team-btn">
              <FontAwesomeIcon icon="plus" />
              Créer une équipe
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="pending" class="loading-container">
            <FontAwesomeIcon icon="spinner" spin class="loading-icon" />
            <span>Chargement de vos équipes...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-container">
            <FontAwesomeIcon icon="exclamation-triangle" class="error-icon" />
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">Impossible de charger vos équipes</p>
            <button @click="refreshTeams" class="retry-button">
              <FontAwesomeIcon icon="refresh" />
              Réessayer
            </button>
          </div>

          <!-- Teams Grid -->
          <div v-else-if="teams && teams.length > 0" class="teams-grid">
            <div v-for="team in teams" :key="team.id" class="team-card">
              
              <!-- Team Avatar -->
              <div class="team-avatar">
                <img 
                  v-if="team.avatar" 
                  :src="team.avatar" 
                  :alt="team.name"
                  class="avatar-image"
                />
                <div v-else class="avatar-fallback">
                  {{ team.name.charAt(0).toUpperCase() }}
                </div>
                <div v-if="team.myRole === 'CAPTAIN'" class="captain-badge" title="Vous êtes capitaine">
                  <FontAwesomeIcon icon="crown" />
                </div>
              </div>

              <!-- Team Info -->
              <div class="team-info">
                <h3 class="team-name">{{ team.name }}</h3>
                <div class="team-stats">
                  <span class="stat">
                    <FontAwesomeIcon icon="users" />
                    {{ team.memberCount }} membres
                  </span>
                  <span class="stat">
                    <FontAwesomeIcon icon="gamepad" />
                    {{ team.game }} - {{ team.gameMode }}
                  </span>
                  <span class="stat team-short-name">
                    <FontAwesomeIcon icon="tag" />
                    {{ team.shortName }}
                  </span>
                  <span class="stat">
                    <FontAwesomeIcon icon="calendar" />
                    Créée {{ formatDate(team.createdAt) }}
                  </span>
                </div>
              </div>

              <!-- Team Actions -->
              <div class="team-actions">
                <NuxtLink :to="`/equipes/${team.id}`" class="view-team-btn">
                  <FontAwesomeIcon icon="eye" />
                  Voir l'équipe
                </NuxtLink>
                <button 
                  v-if="team.myRole === 'CAPTAIN'" 
                  @click="editTeam(team)" 
                  class="edit-team-btn"
                >
                  <FontAwesomeIcon icon="edit" />
                  Modifier
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <FontAwesomeIcon icon="users" class="empty-icon" />
            <h3 class="empty-title">Aucune équipe</h3>
            <p class="empty-message">
              Vous ne faites partie d'aucune équipe pour le moment.
              <br>
              Créez votre première équipe pour commencer !
            </p>
            <button @click="showCreateModal = true" class="create-first-team-btn">
              <FontAwesomeIcon icon="plus" />
              Créer ma première équipe
            </button>
          </div>

        </div>
      </main>
    </div>

    <!-- Create Team Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Créer une équipe</h3>
          <button @click="closeCreateModal" class="modal-close">
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
        
        <form @submit.prevent="handleCreateTeam" class="create-team-form">
          <div class="form-group">
            <label for="teamName" class="form-label">Nom de l'équipe *</label>
            <input
              id="teamName"
              v-model="createForm.name"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': createErrors.name }"
              placeholder="Entrez le nom de votre équipe"
              maxlength="50"
              required
            />
            <span v-if="createErrors.name" class="form-error">{{ createErrors.name }}</span>
          </div>

          <div class="form-group">
            <label for="teamShortName" class="form-label">Nom court *</label>
            <input
              id="teamShortName"
              v-model="createForm.shortName"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': createErrors.shortName }"
              placeholder="Ex: PSG, FCB, etc. (3 caractères max)"
              maxlength="3"
              required
              style="text-transform: uppercase;"
            />
            <span v-if="createErrors.shortName" class="form-error">{{ createErrors.shortName }}</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="teamGame" class="form-label">Jeu *</label>
              <select 
                id="teamGame" 
                v-model="createForm.game" 
                class="form-select"
                :class="{ 'form-input--error': createErrors.game }"
                required
                @change="resetGameMode"
              >
                <option value="">Sélectionner un jeu</option>
                <option value="FIFA 24">FIFA 24</option>
                <option value="Rocket League">Rocket League</option>
                <option value="Fortnite">Fortnite</option>
                <option value="Valorant">Valorant</option>
                <option value="CS2">Counter-Strike 2</option>
                <option value="League of Legends">League of Legends</option>
              </select>
              <span v-if="createErrors.game" class="form-error">{{ createErrors.game }}</span>
            </div>

            <div class="form-group">
              <label for="teamGameMode" class="form-label">Mode de jeu *</label>
              <select 
                id="teamGameMode" 
                v-model="createForm.gameMode" 
                class="form-select"
                :class="{ 'form-input--error': createErrors.gameMode }"
                :disabled="!createForm.game"
                required
              >
                <option value="">Sélectionner un mode</option>
                <template v-if="createForm.game === 'FIFA 24'">
                  <option value="1v1">1v1</option>
                  <option value="2v2">2v2</option>
                  <option value="11v11">11v11</option>
                </template>
                <template v-else-if="createForm.game === 'Rocket League'">
                  <option value="1v1">1v1</option>
                  <option value="2v2">2v2</option>
                  <option value="3v3">3v3</option>
                </template>
                <template v-else-if="createForm.game === 'Fortnite'">
                  <option value="Solo">Solo</option>
                  <option value="Duo">Duo</option>
                  <option value="Squad">Squad</option>
                </template>
                <template v-else-if="createForm.game === 'Valorant'">
                  <option value="5v5 Compétitif">5v5 Compétitif</option>
                  <option value="5v5 Casual">5v5 Casual</option>
                </template>
                <template v-else-if="createForm.game === 'CS2'">
                  <option value="5v5 Compétitif">5v5 Compétitif</option>
                  <option value="5v5 Casual">5v5 Casual</option>
                </template>
                <template v-else-if="createForm.game === 'League of Legends'">
                  <option value="5v5 Classée">5v5 Classée</option>
                  <option value="5v5 Normale">5v5 Normale</option>
                  <option value="ARAM">ARAM</option>
                </template>
              </select>
              <span v-if="createErrors.gameMode" class="form-error">{{ createErrors.gameMode }}</span>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeCreateModal" class="cancel-btn">
              Annuler
            </button>
            <button type="submit" :disabled="isCreating" class="submit-btn">
              <FontAwesomeIcon v-if="isCreating" icon="spinner" spin />
              <FontAwesomeIcon v-else icon="plus" />
              {{ isCreating ? 'Création...' : 'Créer l\'équipe' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import Sidebar from "~/components/Sidebar.vue"
import SearchBar from "~/components/SearchBar.vue"
import NotificationBell from "~/components/NotificationBell.vue"

// Store
const authStore = useAuthStore()

// Configuration de la page
definePageMeta({
  middleware: 'auth',
  title: 'Mes Équipes - SwiftPlays'
})

// État local
const showUserDropdown = ref(false)
const showCreateModal = ref(false)
const isCreating = ref(false)

// Formulaire de création
const createForm = reactive({
  name: '',
  shortName: '',
  game: '',
  gameMode: ''
})

const createErrors = reactive({
  name: '',
  shortName: '',
  game: '',
  gameMode: ''
})

// Récupération des équipes
const { data: teamsData, pending, error, refresh: refreshTeams } = await useFetch('/api/teams/my', {
  baseURL: useRuntimeConfig().public.apiBase,
  headers: {
    'Authorization': `Bearer ${useCookie('accessToken').value}`
  },
  transform: (response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || 'Erreur lors de la récupération des équipes')
  }
})

const teams = computed(() => teamsData.value?.teams || [])

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

const handleLogout = async () => {
  showUserDropdown.value = false
  await authStore.logout()
  window.location.href = '/'
}

// Gestion de la modal de création
const closeCreateModal = () => {
  showCreateModal.value = false
  // Reset form
  createForm.name = ''
  createForm.shortName = ''
  createForm.game = ''
  createForm.gameMode = ''
  // Reset errors
  createErrors.name = ''
  createErrors.shortName = ''
  createErrors.game = ''
  createErrors.gameMode = ''
}

// Création d'équipe
const handleCreateTeam = async () => {
  // Reset errors
  createErrors.name = ''
  createErrors.shortName = ''
  createErrors.game = ''
  createErrors.gameMode = ''
  
  // Validation
  if (!createForm.name.trim()) {
    createErrors.name = 'Le nom de l\'équipe est requis'
    return
  }
  
  if (createForm.name.trim().length < 3) {
    createErrors.name = 'Le nom doit contenir au moins 3 caractères'
    return
  }
  
  if (!createForm.shortName.trim()) {
    createErrors.shortName = 'Le nom court est requis'
    return
  }
  
  if (createForm.shortName.trim().length > 3) {
    createErrors.shortName = 'Le nom court ne peut pas dépasser 3 caractères'
    return
  }
  
  if (!createForm.game.trim()) {
    createErrors.game = 'Le jeu est requis'
    return
  }
  
  if (!createForm.gameMode.trim()) {
    createErrors.gameMode = 'Le mode de jeu est requis'
    return
  }

  isCreating.value = true
  
  try {
    const response = await $fetch(`${useRuntimeConfig().public.apiBase}/api/teams`, {
      method: 'POST',
      body: {
        name: createForm.name.trim(),
        shortName: createForm.shortName.trim(),
        game: createForm.game.trim(),
        gameMode: createForm.gameMode.trim()
      },
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    if (response.success) {
      // Rafraîchir la liste des équipes
      await refreshTeams()
      closeCreateModal()
      
      // Rediriger vers la nouvelle équipe
      await navigateTo(`/equipes/${response.data.team.id}`)
    }
  } catch (error: any) {
    console.error('Erreur création équipe:', error)
    if (error.data?.message) {
      createErrors.name = error.data.message
    }
  } finally {
    isCreating.value = false
  }
}

// Utilitaires
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long' 
  })
}

const resetGameMode = () => {
  createForm.gameMode = ''
  createErrors.gameMode = ''
}

const editTeam = (team: any) => {
  // TODO: Implémenter la modification d'équipe
  console.log('Edit team:', team)
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.teams-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
}

.teams-header-info {
  flex: 1;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  color: #9CA3AF;
  margin: 0;
}

.create-team-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-team-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 214, 0.3);
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.loading-icon, .error-icon {
  font-size: 3rem;
  color: #3B82D6;
}

.error-icon {
  color: #EF4444;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.error-message {
  color: #9CA3AF;
  margin: 0;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: #DC2626;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.team-card {
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-card:hover {
  border-color: rgba(59, 130, 214, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.team-avatar {
  position: relative;
  align-self: flex-start;
}

.avatar-image, .avatar-fallback {
  width: 60px;
  height: 60px;
  border-radius: 12px;
}

.avatar-image {
  object-fit: cover;
  border: 2px solid rgba(59, 130, 214, 0.3);
}

.avatar-fallback {
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
}

.captain-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 24px;
  height: 24px;
  background: #F59E0B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  border: 2px solid #1a1a1a;
}

.team-info {
  flex: 1;
}

.team-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0 0 0.5rem 0;
}

.team-description {
  color: #9CA3AF;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.team-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9CA3AF;
  font-size: 0.85rem;
}

.stat.private {
  color: #F59E0B;
}

.team-short-name {
  font-weight: 600;
  color: #3B82D6 !important;
  background: rgba(59, 130, 214, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(59, 130, 214, 0.2);
}

.team-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}

.view-team-btn, .edit-team-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.view-team-btn {
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
  border: 1px solid rgba(59, 130, 214, 0.2);
}

.view-team-btn:hover {
  background: rgba(59, 130, 214, 0.2);
}

.edit-team-btn {
  background: rgba(107, 114, 128, 0.1);
  color: #9CA3AF;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.edit-team-btn:hover {
  background: rgba(107, 114, 128, 0.2);
  color: #F3F4F6;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.empty-icon {
  font-size: 4rem;
  color: #6B7280;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.empty-message {
  color: #9CA3AF;
  margin: 0;
  line-height: 1.6;
}

.create-first-team-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
}

.create-first-team-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 214, 0.3);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.create-team-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  color: #F3F4F6;
  font-weight: 600;
  font-size: 0.9rem;
}

.form-input, .form-textarea, .form-select {
  padding: 0.75rem;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 6px;
  color: #F3F4F6;
  transition: all 0.2s ease;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #3B82D6;
  box-shadow: 0 0 0 3px rgba(59, 130, 214, 0.1);
}

.form-input--error {
  border-color: #EF4444;
}

.form-error {
  color: #EF4444;
  font-size: 0.875rem;
}

.form-hint {
  color: #9CA3AF;
  font-size: 0.8rem;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9CA3AF;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid rgba(59, 130, 214, 0.1);
}

.cancel-btn, .submit-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
}

.cancel-btn {
  background: rgba(107, 114, 128, 0.1);
  color: #9CA3AF;
}

.cancel-btn:hover {
  background: rgba(107, 114, 128, 0.2);
  color: #F3F4F6;
}

.submit-btn {
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(59, 130, 214, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .teams-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .teams-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>