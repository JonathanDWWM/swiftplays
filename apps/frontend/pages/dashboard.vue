<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">Dashboard</h1>
        </div>
        
        <div class="header-right">
          <!-- Search Bar -->
          <SearchBar />
          
          <!-- Message Center -->
          <MessageCenter />
          
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
          <!-- Welcome Section -->
          <div class="welcome-section">
            <h2 class="welcome-title">
              Bienvenue, {{ authStore.user?.pseudo }} !
            </h2>
          </div>

          <!-- Quick Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <FontAwesomeIcon icon="trophy" />
              </div>
              <div class="stat-content">
                <h3 class="stat-title">Tournois</h3>
                <p class="stat-value">0</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <FontAwesomeIcon icon="people-group" />
              </div>
              <div class="stat-content">
                <h3 class="stat-title">Équipe</h3>
                <p class="stat-value">Aucune</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <FontAwesomeIcon icon="ranking-star" />
              </div>
              <div class="stat-content">
                <h3 class="stat-title">Classement</h3>
                <p class="stat-value">Non classé</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Imports Vue
import { onMounted, onUnmounted, ref } from 'vue'

// Import du store Pinia
import { useAuthStore } from '../stores/auth'
import Sidebar from "~/components/Sidebar.vue";
import SearchBar from "~/components/SearchBar.vue";
import MessageCenter from "~/components/MessageCenter.vue";

// Configuration de la page
definePageMeta({
  layout: false,
  title: 'Dashboard - SwiftPlays'
})

// Store d'authentification
const authStore = useAuthStore()

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

onMounted(async () => {
  // Initialiser le store au cas où il ne l'est pas encore
  await authStore.initAuth()

  // Redirection si pas authentifié
  if (!authStore.isAuthenticated) {
    window.location.href = '/connexion'
  }

  // Écouter les clics pour fermer le dropdown
  document.addEventListener('click', closeDropdown)
})

// Nettoyage des event listeners
onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

