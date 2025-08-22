<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader :title="`Profil de ${userProfile?.pseudo || 'Joueur'}`" />

      <!-- Page Content -->
      <main class="page-content">
        <div class="content-container">
          
          <!-- Loading State -->
          <div v-if="pending" class="loading-container">
            <FontAwesomeIcon icon="spinner" spin class="loading-icon" />
            <span>Chargement du profil...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-container">
            <FontAwesomeIcon icon="user-slash" class="error-icon" />
            <h2 class="error-title">Utilisateur introuvable</h2>
            <p class="error-message">
              L'utilisateur "{{ route.params.pseudo }}" n'existe pas ou son profil est privé.
            </p>
            <NuxtLink to="/dashboard" class="back-button">
              <FontAwesomeIcon icon="arrow-left" />
              Retour au dashboard
            </NuxtLink>
          </div>

          <!-- Profile Content -->
          <div v-else-if="userProfile" class="public-profile">
            
            <!-- Profile Header -->
            <div class="profile-header">
              <div class="profile-avatar">
                <img 
                  :src="userProfile.avatar || '/default-avatar.svg'" 
                  :alt="userProfile.pseudo"
                  class="avatar-image"
                />
                <div v-if="userProfile.accountType === 'DISCORD'" class="discord-badge">
                  <FontAwesomeIcon icon="brands fa-discord" />
                </div>
              </div>
              
              <div class="profile-info">
                <h1 class="profile-pseudo">{{ userProfile.pseudo }}</h1>
                <p v-if="userProfile.firstName && userProfile.lastName" class="profile-name">
                  {{ userProfile.firstName }} {{ userProfile.lastName }}
                </p>
                <div class="profile-meta">
                  <span class="join-date">
                    <FontAwesomeIcon icon="calendar" />
                    Membre depuis {{ formatDate(userProfile.joinedAt) }}
                  </span>
                  <span class="account-type" :class="`account-type--${userProfile.accountType.toLowerCase()}`">
                    <FontAwesomeIcon :icon="getAccountIcon(userProfile.accountType)" />
                    {{ getAccountTypeLabel(userProfile.accountType) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="stats-section">
              <h2 class="section-title">Statistiques</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">
                    <FontAwesomeIcon icon="users" />
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-title">Équipes</h3>
                    <p class="stat-value">{{ userProfile.stats.teams }}</p>
                  </div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-icon">
                    <FontAwesomeIcon icon="trophy" />
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-title">Tournois</h3>
                    <p class="stat-value">{{ userProfile.stats.tournaments }}</p>
                  </div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-icon">
                    <FontAwesomeIcon icon="star" />
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-title">Victoires</h3>
                    <p class="stat-value">{{ userProfile.stats.wins }}</p>
                  </div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-icon">
                    <FontAwesomeIcon icon="chart-line" />
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-title">Défaites</h3>
                    <p class="stat-value">{{ userProfile.stats.losses }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions Section (pour les capitaines/vice-capitaines) -->
            <div v-if="showTeamActions" class="actions-section">
              <h2 class="section-title">Actions</h2>
              <div class="actions-grid">
                <button 
                  v-if="canInviteToTeam && !isPlayerInUserTeam"
                  @click="showInviteModal = true" 
                  class="action-btn invite-btn"
                >
                  <FontAwesomeIcon icon="user-plus" />
                  Inviter dans mon équipe
                </button>
                
                <div v-if="isPlayerInUserTeam" class="info-message">
                  <FontAwesomeIcon icon="users" />
                  Ce joueur fait déjà partie de votre équipe
                </div>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="activity-section">
              <h2 class="section-title">Activité récente</h2>
              <div class="activity-placeholder">
                <FontAwesomeIcon icon="clock" class="placeholder-icon" />
                <p>Aucune activité récente à afficher</p>
                <small>Les activités apparaîtront ici une fois les équipes et tournois implémentés</small>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>

    <!-- Modal d'invitation -->
    <div v-if="showInviteModal" class="modal-overlay" @click="closeInviteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title-section">
            <FontAwesomeIcon icon="user-plus" class="modal-icon" />
            <div>
              <h3>Inviter {{ userProfile?.pseudo }}</h3>
              <p class="modal-subtitle">dans votre équipe</p>
            </div>
          </div>
          <button @click="closeInviteModal" class="modal-close">
            <FontAwesomeIcon icon="times" />
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleInvitePlayer" class="invite-form">
            <div v-if="inviteErrors.general" class="error-message">
              <FontAwesomeIcon icon="exclamation-triangle" />
              {{ inviteErrors.general }}
            </div>

            <div v-if="successMessage" class="success-message">
              <FontAwesomeIcon icon="check-circle" />
              {{ successMessage }}
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
                placeholder="Ajoutez un message personnalisé pour votre invitation..."
                rows="4"
                maxlength="500"
              />
              <small class="char-counter">{{ inviteForm.message.length }}/500</small>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeInviteModal" class="cancel-btn">
                <FontAwesomeIcon icon="times" />
                Annuler
              </button>
              <button 
                type="submit" 
                class="invite-btn"
                :disabled="isInviting"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import Sidebar from "~/components/Sidebar.vue"
import AppHeader from "~/components/AppHeader.vue"

// Store
const authStore = useAuthStore()
const route = useRoute()

// Configuration de la page
definePageMeta({
  middleware: 'auth',
  title: 'Profil utilisateur - SwiftPlays'
})

// État local pour le dropdown utilisateur
const showUserDropdown = ref(false)

// État pour les invitations
const showInviteModal = ref(false)
const isInviting = ref(false)
const successMessage = ref('')

// Formulaire d'invitation
const inviteForm = reactive({
  message: ''
})

// Erreurs d'invitation
const inviteErrors = reactive({
  general: ''
})

// État pour l'équipe de l'utilisateur connecté
const { data: userTeam } = await useFetch('/api/teams/my-team', {
  baseURL: useRuntimeConfig().public.apiBase,
  headers: {
    'Authorization': `Bearer ${useCookie('accessToken').value}`
  },
  transform: (response: any) => {
    if (response.success) {
      return response.data
    }
    return null
  }
})

// Computed properties pour les actions d'équipe
const showTeamActions = computed(() => {
  return canInviteToTeam.value || isPlayerInUserTeam.value
})

const canInviteToTeam = computed(() => {
  if (!userTeam.value || !authStore.user) return false
  
  // Vérifier si l'utilisateur connecté est capitaine ou vice-capitaine
  const userRole = userTeam.value.ownerId === authStore.user.id ? 'CAPTAIN' : 
    userTeam.value.members?.find((m: any) => m.userId === authStore.user?.id)?.role
  
  return userRole === 'CAPTAIN' || userRole === 'CO_CAPTAIN'
})

const isPlayerInUserTeam = computed(() => {
  if (!userTeam.value || !userProfile.value) return false
  
  // Vérifier si le joueur est le propriétaire ou un membre
  return userTeam.value.ownerId === userProfile.value.id ||
    userTeam.value.members?.some((m: any) => m.userId === userProfile.value?.id)
})

// Gestion du dropdown utilisateur
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

// Fermer le dropdown quand on clique ailleurs
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

// Gestion du modal d'invitation
const closeInviteModal = () => {
  showInviteModal.value = false
  inviteErrors.general = ''
  inviteForm.message = ''
  successMessage.value = ''
}

// Gestion de l'invitation
const handleInvitePlayer = async () => {
  try {
    inviteErrors.general = ''
    successMessage.value = ''
    isInviting.value = true
    
    if (!userProfile.value || !userTeam.value) {
      inviteErrors.general = 'Erreur lors de l\'invitation'
      return
    }

    const response = await $fetch(`/api/teams/${userTeam.value.id}/invite`, {
      method: 'POST',
      baseURL: useRuntimeConfig().public.apiBase,
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`,
        'Content-Type': 'application/json'
      },
      body: {
        playerPseudo: userProfile.value.pseudo,
        message: inviteForm.message.trim() || undefined
      }
    })

    if (response.success) {
      successMessage.value = 'Invitation envoyée avec succès !'
      setTimeout(() => {
        closeInviteModal()
      }, 2000)
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

// Récupération du profil utilisateur
const { data: userProfile, pending, error } = await useFetch(`/api/search/users/${route.params.pseudo}`, {
  baseURL: useRuntimeConfig().public.apiBase,
  headers: {
    'Authorization': `Bearer ${useCookie('accessToken').value}`
  },
  transform: (response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || 'Erreur lors de la récupération du profil')
  }
})

// Utilitaires de formatage
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long' 
  })
}

const getAccountTypeLabel = (type: string) => {
  switch (type) {
    case 'EMAIL': return 'Compte Email'
    case 'DISCORD': return 'Compte Discord'
    case 'HYBRID': return 'Compte Hybride'
    default: return 'Compte Standard'
  }
}

const getAccountIcon = (type: string) => {
  switch (type) {
    case 'EMAIL': return 'envelope'
    case 'DISCORD': return ['fab', 'discord']
    case 'HYBRID': return 'link'
    default: return 'user'
  }
}

// Lifecycle
onMounted(() => {
  // Écouter les clics pour fermer le dropdown
  document.addEventListener('click', closeDropdown)
})

// Nettoyage des event listeners
onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

// Mise à jour du titre de la page
if (userProfile.value) {
  useSeoMeta({
    title: `${userProfile.value.pseudo} - SwiftPlays`,
    description: `Profil public de ${userProfile.value.pseudo} sur SwiftPlays`
  })
}
</script>

<style scoped>
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  gap: 1rem;
}

.loading-icon, .error-icon {
  font-size: 3rem;
  color: #3B82D6;
}

.error-icon {
  color: #9CA3AF;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.error-message {
  color: #9CA3AF;
  font-size: 1rem;
  margin: 0;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 214, 0.3);
}

.public-profile {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-header {
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.1);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  backdrop-filter: blur(10px);
}

.profile-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(59, 130, 214, 0.3);
}

.discord-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 32px;
  height: 32px;
  background: #5865f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 3px solid #1a1a1a;
}

.profile-info {
  flex: 1;
}

.profile-pseudo {
  font-size: 2rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0 0 0.5rem 0;
}

.profile-name {
  font-size: 1.125rem;
  color: #9CA3AF;
  margin: 0 0 1rem 0;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.join-date, .account-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #9CA3AF;
}

.account-type--email {
  color: #22c55e;
}

.account-type--discord {
  color: #5865f2;
}

.account-type--hybrid {
  color: #a855f7;
}

.stats-section, .activity-section {
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.1);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0 0 1.5rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: rgba(59, 130, 214, 0.05);
  border: 1px solid rgba(59, 130, 214, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: rgba(59, 130, 214, 0.2);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 1.5rem;
  color: #3B82D6;
  opacity: 0.8;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #9CA3AF;
  margin: 0 0 0.25rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.activity-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  gap: 1rem;
}

.placeholder-icon {
  font-size: 2rem;
  color: #6B7280;
}

.activity-placeholder p {
  color: #9CA3AF;
  font-size: 1rem;
  margin: 0;
}

.activity-placeholder small {
  color: #6B7280;
  font-size: 0.875rem;
}

.actions-section {
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.1);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 214, 0.3);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.info-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
  font-size: 0.9rem;
}

/* Modal styles */
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
  padding: 1rem;
}

.modal-content {
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 16px;
  width: 100%;
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

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-icon {
  font-size: 1.5rem;
  color: #3B82D6;
}

.modal-title-section h3 {
  margin: 0;
  color: #F3F4F6;
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-subtitle {
  margin: 0;
  color: #9CA3AF;
  font-size: 0.875rem;
}

.modal-close {
  background: none;
  border: none;
  color: #9CA3AF;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(59, 130, 214, 0.1);
  color: #F3F4F6;
}

.modal-body {
  padding: 1.5rem;
}

.error-message, .success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #F3F4F6;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.label-icon {
  color: #3B82D6;
  opacity: 0.8;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 8px;
  color: #F3F4F6;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: rgba(59, 130, 214, 0.4);
}

.form-textarea::placeholder {
  color: #6B7280;
}

.char-counter {
  color: #6B7280;
  font-size: 0.75rem;
  float: right;
  margin-top: 0.25rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(107, 114, 128, 0.1);
  color: #9CA3AF;
  border: 1px solid rgba(107, 114, 128, 0.2);
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: rgba(107, 114, 128, 0.2);
  color: #F3F4F6;
}

.invite-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.invite-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(59, 130, 214, 0.3);
}

.invite-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }
  
  .avatar-image {
    width: 100px;
    height: 100px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-pseudo {
    font-size: 1.5rem;
  }
}
</style>