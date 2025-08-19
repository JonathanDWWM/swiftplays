<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">Profil de {{ userProfile?.pseudo }}</h1>
        </div>
        
        <div class="header-right">
          <!-- Search Bar -->
          <SearchBar />
          
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import Sidebar from "~/components/Sidebar.vue"
import SearchBar from "~/components/SearchBar.vue"

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