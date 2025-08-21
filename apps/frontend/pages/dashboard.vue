<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader title="Dashboard" />

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
import { onMounted, ref } from 'vue'

// Import du store Pinia
import { useAuthStore } from '../stores/auth'
import Sidebar from "~/components/Sidebar.vue";
import AppHeader from "~/components/AppHeader.vue";

// Configuration de la page
definePageMeta({
  layout: false,
  title: 'Dashboard - SwiftPlays'
})

// Store d'authentification
const authStore = useAuthStore()


onMounted(async () => {
  // Initialiser le store au cas où il ne l'est pas encore
  await authStore.initAuth()

  // Redirection si pas authentifié
  if (!authStore.isAuthenticated) {
    window.location.href = '/connexion'
  }

})
</script>

