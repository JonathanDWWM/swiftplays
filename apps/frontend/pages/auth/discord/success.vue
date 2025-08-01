<template>
  <div class="discord-success-page">
    <div class="success-container">
      <div class="loading-content" v-if="isProcessing">
        <div class="loading-spinner"></div>
        <h1 class="loading-title">Connexion en cours...</h1>
        <p class="loading-text">Finalisation de votre connexion Discord</p>
      </div>
      
      <div class="error-content" v-else-if="hasError">
        <div class="error-icon">❌</div>
        <h1 class="error-title">Erreur de connexion</h1>
        <p class="error-text">{{ errorMessage }}</p>
        <NuxtLink to="/connexion" class="retry-button">
          Réessayer
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../../stores/auth'

// Configuration de la page
definePageMeta({
  layout: false,
  title: 'Connexion Discord - SwiftPlays'
})

// Store et état
const authStore = useAuthStore()
const isProcessing = ref(true)
const hasError = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  try {
    // Récupérer les paramètres d'URL
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')

    if (!accessToken || !refreshToken) {
      throw new Error('Tokens manquants dans l\'URL de callback')
    }

    // Stocker les tokens dans le store
    authStore.setTokens(accessToken, refreshToken)

    // Récupérer les infos utilisateur
    const success = await authStore.fetchUserProfile()
    
    if (success) {
      // Succès - rediriger vers le dashboard
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    } else {
      throw new Error('Impossible de récupérer le profil utilisateur')
    }

  } catch (error) {
    console.error('Erreur callback Discord:', error)
    isProcessing.value = false
    hasError.value = true
    errorMessage.value = error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite'
    
    // Redirection automatique vers connexion après erreur
    setTimeout(() => {
      window.location.href = '/connexion?error=discord_callback'
    }, 3000)
  }
})
</script>

<style scoped lang="scss">
.discord-success-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.success-container {
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.loading-content, .error-content {
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 20px;
  padding: 3rem 2rem;
  backdrop-filter: blur(10px);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(59, 130, 214, 0.3);
  border-top: 4px solid #3B82D6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-title, .error-title {
  font-size: 2rem;
  font-weight: 700;
  color: #F3F4F6;
  margin-bottom: 1rem;
}

.loading-text, .error-text {
  color: #9CA3AF;
  font-size: 1.1rem;
  margin: 0;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 2rem;
}

.retry-button {
  display: inline-block;
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  color: white;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  margin-top: 2rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(59, 130, 214, 0.3);
  }
}

// Responsive
@media (max-width: 768px) {
  .discord-success-page {
    padding: 1rem;
  }
  
  .loading-content, .error-content {
    padding: 2rem 1.5rem;
  }
  
  .loading-title, .error-title {
    font-size: 1.5rem;
  }
}
</style>