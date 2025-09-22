<template>
  <aside class="app-sidebar">
    <div class="app-sidebar-header">
      <div class="app-logo-container">
        <img :src="logoUrl" alt="SwiftPlays" class="app-logo-image" @error="handleImageError" />
      </div>
    </div>
    
    <nav class="app-sidebar-nav">
      <ul class="app-nav-list">
        <li class="app-nav-item" :class="{ active: currentPath === '/dashboard' }">
          <NuxtLink to="/dashboard" class="app-nav-link">
            <span class="app-nav-text">Accueil</span>
          </NuxtLink>
        </li>
        <li class="app-nav-item" :class="{ active: currentPath.startsWith('/equipes') }">
          <NuxtLink to="/equipes" class="app-nav-link">
            <span class="app-nav-text">Mes équipes</span>
          </NuxtLink>
        </li>
        <li class="app-nav-item" :class="{ active: currentPath.startsWith('/ladder') }">
          <NuxtLink to="/ladder" class="app-nav-link">
            <span class="app-nav-text">Ladder</span>
          </NuxtLink>
        </li>
        <li class="app-nav-item" :class="{ active: currentPath.startsWith('/matches') }">
          <NuxtLink to="/matches" class="app-nav-link">
            <span class="app-nav-text">Mes Matches</span>
          </NuxtLink>
        </li>
        <li class="app-nav-item coming-soon" title="Bientôt disponible">
          <a href="#" class="app-nav-link disabled" @click.prevent>
            <span class="app-nav-text">Tournois</span>
            <span class="coming-soon-badge">Bientôt</span>
          </a>
        </li>
        <li class="app-nav-item coming-soon" title="Championnats - Bientôt disponible">
          <a href="#" class="app-nav-link disabled" @click.prevent>
            <span class="app-nav-text">Championnats</span>
            <span class="coming-soon-badge">Bientôt</span>
          </a>
        </li>
        
        <!-- Section Admin (visible seulement pour les admins/modérateurs) -->
        <li v-if="isAdmin" class="app-nav-section">
          <div class="app-nav-section-title">Administration</div>
        </li>
        <li v-if="isAdmin" class="app-nav-item" :class="{ active: currentPath.startsWith('/admin') }">
          <NuxtLink to="/admin" class="app-nav-link">
            <span class="app-nav-text">Panel Admin</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import logoImage from '~/assets/images/logo.png'

const route = useRoute()
const { user } = useAuth()

// Computed pour détecter la page active
const currentPath = computed(() => route.path)

// Vérifier si l'utilisateur est admin/modérateur
const isAdmin = computed(() => {
  return user.value && ['ADMIN', 'MODERATOR'].includes(user.value.role)
})

// URL du logo importé depuis les assets
const logoUrl = logoImage

// Gestion des erreurs d'image
const handleImageError = (event: Event) => {
  console.error('Erreur de chargement du logo:', event)
}
</script>

<style scoped>
.app-sidebar {
  width: 280px;
  background: linear-gradient(180deg, #1a1a1a 0%, #111111 100%);
  border-right: 1px solid rgba(59, 130, 214, 0.1);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 100;
}

.app-sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.app-logo-container {
  text-align: center;
}

.app-logo-image {
  max-width: 50%;
}

.app-logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
  text-align: center;
}

.app-sidebar-nav {
  flex: 1;
  padding: 1.5rem 0;
}

.app-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.app-nav-item {
  margin-bottom: 0.5rem;
}

.app-nav-item.active .app-nav-link {
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  color: white;
}

.app-nav-link {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: #9CA3AF;
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 0 25px 25px 0;
  margin-right: 1rem;
}

.app-nav-link:hover {
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
  transform: translateX(5px);
}

.app-nav-text {
  font-weight: 500;
  font-size: 0.95rem;
}

/* Styles pour les liens "Bientôt disponible" */
.app-nav-item.coming-soon .app-nav-link {
  opacity: 0.5;
  cursor: not-allowed;
  position: relative;
}

.app-nav-item.coming-soon .app-nav-link:hover {
  background: none;
  color: #9CA3AF;
  transform: none;
}

.coming-soon-badge {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  margin-left: auto;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Styles pour les sections admin */
.app-nav-section {
  margin: 1.5rem 0 0.5rem 0;
  padding: 0 1.5rem;
}

.app-nav-section-title {
  color: #6B7280;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.app-nav-item:has(.app-nav-section-title) {
  margin-bottom: 0;
}

@media (max-width: 1024px) {
  .app-sidebar {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .app-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
}
</style>