<template>
  <header class="top-header">
    <div class="header-left">
      <h1 class="page-title">{{ title }}</h1>
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
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import SearchBar from "~/components/SearchBar.vue"
import MessageCenter from "~/components/MessageCenter.vue"

// Props
interface Props {
  title: string
}

const props = defineProps<Props>()

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

// Lifecycle
onMounted(() => {
  // Écouter les clics pour fermer le dropdown
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>