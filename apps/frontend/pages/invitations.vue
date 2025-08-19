<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">Mes Invitations</h1>
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
          
          <!-- Header with info -->
          <div class="invitations-header">
            <div class="invitations-header-info">
              <h2 class="section-title">Invitations d'équipes</h2>
              <p class="section-subtitle">Gérez vos invitations à rejoindre des équipes</p>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="pending" class="loading-container">
            <FontAwesomeIcon icon="spinner" spin class="loading-icon" />
            <span>Chargement de vos invitations...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-container">
            <FontAwesomeIcon icon="exclamation-triangle" class="error-icon" />
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">Impossible de charger vos invitations</p>
            <button @click="refresh" class="retry-button">
              <FontAwesomeIcon icon="refresh" />
              Réessayer
            </button>
          </div>

          <!-- Invitations List -->
          <div v-else-if="invitations && invitations.length > 0" class="invitations-list">
            <div v-for="invitation in invitations" :key="invitation.id" class="invitation-card">
              
              <!-- Team Avatar -->
              <div class="team-avatar">
                <img 
                  v-if="invitation.team.avatar" 
                  :src="invitation.team.avatar" 
                  :alt="invitation.team.name"
                  class="avatar-image"
                />
                <div v-else class="avatar-fallback">
                  {{ invitation.team.name.charAt(0).toUpperCase() }}
                </div>
              </div>

              <!-- Invitation Info -->
              <div class="invitation-info">
                <div class="invitation-header">
                  <h3 class="team-name">{{ invitation.team.name }}</h3>
                  <span class="invitation-date">{{ formatDate(invitation.createdAt) }}</span>
                </div>
                
                <div class="invitation-details">
                  <p class="invitation-text">
                    <strong>{{ invitation.sender.pseudo }}</strong> vous invite à rejoindre son équipe
                  </p>
                  <div class="team-stats">
                    <span class="stat">
                      <FontAwesomeIcon icon="users" />
                      {{ invitation.team.memberCount }} membres
                    </span>
                  </div>
                  <p v-if="invitation.message" class="invitation-message">
                    "{{ invitation.message }}"
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="invitation-actions">
                <button 
                  @click="respondToInvitation(invitation.id, 'ACCEPTED')" 
                  :disabled="isResponding"
                  class="accept-btn"
                >
                  <FontAwesomeIcon v-if="isResponding" icon="spinner" spin />
                  <FontAwesomeIcon v-else icon="check" />
                  Accepter
                </button>
                <button 
                  @click="respondToInvitation(invitation.id, 'DECLINED')" 
                  :disabled="isResponding"
                  class="decline-btn"
                >
                  <FontAwesomeIcon v-if="isResponding" icon="spinner" spin />
                  <FontAwesomeIcon v-else icon="times" />
                  Refuser
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <FontAwesomeIcon icon="envelope-open" class="empty-icon" />
            <h3 class="empty-title">Aucune invitation</h3>
            <p class="empty-message">
              Vous n'avez aucune invitation d'équipe en attente.
              <br>
              Les invitations que vous recevrez apparaîtront ici !
            </p>
            <NuxtLink to="/equipes" class="browse-teams-btn">
              <FontAwesomeIcon icon="users" />
              Parcourir les équipes
            </NuxtLink>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import Sidebar from "~/components/Sidebar.vue"
import SearchBar from "~/components/SearchBar.vue"
import NotificationBell from "~/components/NotificationBell.vue"

// Store
const authStore = useAuthStore()

// Configuration de la page
definePageMeta({
  middleware: 'auth',
  title: 'Mes Invitations - SwiftPlays'
})

// État local
const showUserDropdown = ref(false)
const isResponding = ref(false)

// Récupération des invitations
const { data: invitationsData, pending, error, refresh } = await useFetch('/api/teams/invitations/received', {
  baseURL: useRuntimeConfig().public.apiBase,
  headers: {
    'Authorization': `Bearer ${useCookie('accessToken').value}`
  },
  transform: (response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || 'Erreur lors de la récupération des invitations')
  }
})

const invitations = computed(() => invitationsData.value?.invitations || [])

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

// Réponse aux invitations
const respondToInvitation = async (invitationId: string, response: 'ACCEPTED' | 'DECLINED') => {
  isResponding.value = true
  
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/teams/invitations/${invitationId}/respond`, {
      method: 'POST',
      body: { response },
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    // Rafraîchir la liste des invitations
    await refresh()
    
    if (response === 'ACCEPTED') {
      // Rediriger vers la page des équipes pour voir la nouvelle équipe
      await navigateTo('/equipes')
    }
    
  } catch (error: any) {
    console.error('Erreur réponse invitation:', error)
    alert(error.data?.message || 'Erreur lors de la réponse à l\'invitation')
  } finally {
    isResponding.value = false
  }
}

// Utilitaires
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Aujourd\'hui'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  })
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
.invitations-header {
  margin-bottom: 2rem;
}

.invitations-header-info {
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

.invitations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.invitation-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}

.invitation-card:hover {
  border-color: rgba(59, 130, 214, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.team-avatar {
  flex-shrink: 0;
}

.avatar-image, .avatar-fallback {
  width: 64px;
  height: 64px;
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

.invitation-info {
  flex: 1;
}

.invitation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.team-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.invitation-date {
  color: #9CA3AF;
  font-size: 0.85rem;
}

.invitation-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.invitation-text {
  color: #F3F4F6;
  margin: 0;
}

.team-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9CA3AF;
  font-size: 0.85rem;
}

.invitation-message {
  color: #9CA3AF;
  font-style: italic;
  margin: 0;
  padding: 0.5rem;
  background: rgba(59, 130, 214, 0.05);
  border-left: 3px solid #3B82D6;
  border-radius: 4px;
}

.invitation-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.accept-btn, .decline-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.accept-btn {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
}

.accept-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
}

.decline-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.decline-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

.accept-btn:disabled, .decline-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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

.browse-teams-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
  margin-top: 1rem;
}

.browse-teams-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 214, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .invitation-card {
    flex-direction: column;
    text-align: center;
  }
  
  .invitation-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .invitation-actions {
    flex-direction: row;
    justify-content: center;
    width: 100%;
  }
}
</style>