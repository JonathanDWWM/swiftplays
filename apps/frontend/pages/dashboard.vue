<template>
  <div class="dashboard-page">
    <div class="dashboard-container">
      <h1 class="dashboard-title">Dashboard</h1>

      <!-- Informations utilisateur basiques -->
      <div v-if="authStore.user" class="user-info">
        <p class="welcome-text">
          Bienvenue, <span class="user-pseudo">{{ authStore.user.pseudo }}</span> !
        </p>
        <p class="user-email">{{ authStore.user.email }}</p>
        <p class="connection-status">
          ✅ Vous êtes bien connecté à SwiftPlays
        </p>
      </div>

      <!-- Bouton de déconnexion -->
      <button
          @click="handleLogout"
          class="logout-button"
          :disabled="authStore.isLoading"
      >
        {{ authStore.isLoading ? 'Déconnexion...' : 'Se déconnecter' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Imports Vue
import { onMounted } from 'vue'

// Import du store Pinia
import { useAuthStore } from '../stores/auth'

// Configuration de la page
definePageMeta({
  layout: false,
  title: 'Dashboard - SwiftPlays'
})

// Store d'authentification
const authStore = useAuthStore()

// Gestion de la déconnexion
const handleLogout = async () => {
  await authStore.logout()
  window.location.href = '/'
}

// Initialisation et vérification de l'authentification
onMounted(async () => {
  // Initialiser le store au cas où il ne l'est pas encore
  await authStore.initAuth()

  // Redirection si pas authentifié
  if (!authStore.isAuthenticated) {
    window.location.href = '/connexion'
  }
})
</script>
