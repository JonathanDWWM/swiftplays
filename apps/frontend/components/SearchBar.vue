<template>
  <div class="search-container" ref="searchContainer">
    <div class="search-input-wrapper">
      <FontAwesomeIcon icon="search" class="search-icon" />
      <input
        v-model="searchQuery"
        @input="handleSearch"
        @focus="showResults = true"
        @blur="handleBlur"
        type="text"
        class="search-input"
        placeholder="Rechercher un utilisateur..."
        autocomplete="off"
      />
      <button 
        v-if="searchQuery"
        @click="clearSearch"
        class="clear-button"
      >
        <FontAwesomeIcon icon="times" />
      </button>
    </div>

    <!-- Dropdown des résultats -->
    <div v-if="showResults && (searchResults.length > 0 || isLoading)" class="search-results">
      <!-- Loading -->
      <div v-if="isLoading" class="search-result-item loading">
        <FontAwesomeIcon icon="spinner" spin class="loading-icon" />
        <span>Recherche en cours...</span>
      </div>

      <!-- Résultats utilisateurs -->
      <div v-else-if="searchResults.length > 0">
        <div class="search-section-title">Utilisateurs</div>
        <NuxtLink
          v-for="user in searchResults"
          :key="user.id"
          :to="`/u/${user.pseudo}`"
          class="search-result-item user-result"
          @click="closeSearch"
        >
          <img 
            v-if="user.avatar" 
            :src="user.avatar" 
            :alt="user.pseudo"
            class="user-avatar"
          />
          <div v-else class="user-avatar-fallback">
            {{ user.pseudo.charAt(0).toUpperCase() }}
          </div>
          <div class="user-info">
            <span class="user-pseudo">{{ user.pseudo }}</span>
            <span v-if="user.firstName && user.lastName" class="user-name">
              {{ user.firstName }} {{ user.lastName }}
            </span>
          </div>
        </NuxtLink>
      </div>

      <!-- Aucun résultat -->
      <div v-else-if="searchQuery.length > 2" class="search-result-item no-results">
        <FontAwesomeIcon icon="user-slash" class="no-results-icon" />
        <span>Aucun utilisateur trouvé pour "{{ searchQuery }}"</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'

// Store
const authStore = useAuthStore()

// État local
const searchQuery = ref('')
const searchResults = ref([])
const showResults = ref(false)
const isLoading = ref(false)
const searchContainer = ref(null)

// Timeout pour éviter trop de requêtes
let searchTimeout: NodeJS.Timeout | null = null

// Fonction de recherche
const handleSearch = async () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  const query = searchQuery.value.trim()
  
  if (query.length < 2) {
    searchResults.value = []
    return
  }

  // Vérifier si l'utilisateur est bien connecté
  if (!authStore.isAuthenticated) {
    searchResults.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    isLoading.value = true
    
    try {
      const config = useRuntimeConfig()
      const accessTokenCookie = useCookie('accessToken')
      const token = accessTokenCookie.value

      // Si pas de token, essayer de rafraîchir
      if (!token) {
        const refreshed = await authStore.refreshToken()
        if (!refreshed) {
          searchResults.value = []
          return
        }
      }

      const finalToken = useCookie('accessToken').value
      
      const response = await $fetch(`${config.public.apiBase}/api/search/users`, {
        method: 'GET',
        query: { q: query },
        headers: {
          'Authorization': `Bearer ${finalToken}`
        }
      })
      
      if (response.success) {
        searchResults.value = response.data.users || []
      } else {
        searchResults.value = []
      }
    } catch (error) {
      console.error('Erreur de recherche:', error)
      
      // Si erreur 401, essayer de rafraîchir le token
      if (error.status === 401 || error.statusCode === 401) {
        const refreshed = await authStore.refreshToken()
        if (refreshed) {
          // Relancer une seule requête directement
          try {
            const newToken = useCookie('accessToken').value
            const retryResponse = await $fetch(`${config.public.apiBase}/api/search/users`, {
              method: 'GET',
              query: { q: query },
              headers: {
                'Authorization': `Bearer ${newToken}`
              }
            })
            
            if (retryResponse.success) {
              searchResults.value = retryResponse.data.users || []
            }
          } catch (retryError) {
            console.error('Erreur après refresh du token:', retryError)
          }
          return
        }
      }
      
      searchResults.value = []
    } finally {
      isLoading.value = false
    }
  }, 300) // Débounce de 300ms
}

// Fermer la recherche
const closeSearch = () => {
  showResults.value = false
}

// Vider la recherche
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  showResults.value = false
}

// Gérer le blur (avec délai pour permettre les clics)
const handleBlur = () => {
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

// Fermer quand on clique ailleurs
const handleClickOutside = (event: Event) => {
  if (searchContainer.value && !searchContainer.value.contains(event.target)) {
    showResults.value = false
  }
}

// Event listeners
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style scoped>
.search-container {
  position: relative;
  width: 300px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 20px;
  color: #F3F4F6;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #3B82D6;
  box-shadow: 0 0 0 3px rgba(59, 130, 214, 0.1);
  background: rgba(26, 26, 26, 0.95);
}

.search-input::placeholder {
  color: #9CA3AF;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #9CA3AF;
  font-size: 0.9rem;
  z-index: 1;
}

.clear-button {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-button:hover {
  color: #F3F4F6;
  background: rgba(239, 68, 68, 0.1);
}

.search-results {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  overflow: hidden;
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.search-section-title {
  padding: 0.75rem 1rem 0.5rem 1rem;
  color: #9CA3AF;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  color: #F3F4F6;
  text-decoration: none;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(59, 130, 214, 0.05);
}

.search-result-item:hover {
  background: rgba(59, 130, 214, 0.1);
}

.search-result-item:last-child {
  border-bottom: none;
}

.user-result {
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(59, 130, 214, 0.3);
}

.user-avatar-fallback {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.user-pseudo {
  font-weight: 600;
  font-size: 0.9rem;
}

.user-name {
  color: #9CA3AF;
  font-size: 0.8rem;
}

.loading {
  gap: 0.75rem;
  color: #9CA3AF;
}

.loading-icon {
  color: #3B82D6;
}

.no-results {
  gap: 0.75rem;
  color: #9CA3AF;
  font-style: italic;
}

.no-results-icon {
  color: #6B7280;
}

@media (max-width: 768px) {
  .search-container {
    width: 250px;
  }
}

@media (max-width: 480px) {
  .search-container {
    width: 200px;
  }
  
  .search-input {
    font-size: 0.85rem;
    padding: 0.625rem 0.875rem 0.625rem 2.25rem;
  }
}
</style>