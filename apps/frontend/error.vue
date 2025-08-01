<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-content">
        <!-- Code d'erreur -->
        <h1 class="error-code">{{ error.statusCode }}</h1>
        
        <!-- Message d'erreur -->
        <h2 class="error-title">{{ errorTitle }}</h2>
        <p class="error-message">{{ errorMessage }}</p>
        
        <!-- Illustration -->
        <div class="error-illustration">
          <div class="error-icon">
            {{ errorIcon }}
          </div>
        </div>
        
        <!-- Actions -->
        <div class="error-actions">
          <button @click="$router.go(-1)" class="btn btn-outline">
            ← Retour
          </button>
          <NuxtLink to="/" class="btn btn-primary">
            🏠 Accueil
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ErrorProps {
  statusCode: number
  statusMessage?: string
}

const props = defineProps<{
  error: ErrorProps
}>()

// Personnalisation selon le type d'erreur
const errorTitle = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'Page introuvable'
    case 500:
      return 'Erreur serveur'
    case 403:
      return 'Accès interdit'
    default:
      return 'Une erreur est survenue'
  }
})

const errorMessage = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'La page que vous recherchez n\'existe pas ou a été déplacée.'
    case 500:
      return 'Un problème technique est survenu. Nos équipes ont été notifiées.'
    case 403:
      return 'Vous n\'avez pas l\'autorisation d\'accéder à cette ressource.'
    default:
      return 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
  }
})

const errorIcon = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return '🔍'
    case 500:
      return '⚠️'
    case 403:
      return '🔒'
    default:
      return '❌'
  }
})

// Configuration de la page
useHead({
  title: `Erreur ${props.error.statusCode} - SwiftPlays`,
  meta: [
    {
      name: 'robots',
      content: 'noindex'
    }
  ]
})
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.error-container {
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.error-content {
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 20px;
  padding: 4rem 2rem;
  backdrop-filter: blur(10px);
}

.error-code {
  font-size: 6rem;
  font-weight: 900;
  color: #3B82D6;
  margin: 0 0 1rem 0;
  line-height: 1;
  letter-spacing: -0.05em;
}

.error-title {
  font-size: 2rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0 0 1rem 0;
}

.error-message {
  font-size: 1.1rem;
  color: #9CA3AF;
  margin: 0 0 3rem 0;
  line-height: 1.6;
}

.error-illustration {
  margin: 2rem 0 3rem 0;
  
  .error-icon {
    font-size: 4rem;
    opacity: 0.8;
  }
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  
  &.btn-primary {
    background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(59, 130, 214, 0.3);
    }
  }
  
  &.btn-outline {
    background: transparent;
    color: #9CA3AF;
    border: 1px solid rgba(156, 163, 175, 0.3);
    
    &:hover {
      background: rgba(59, 130, 214, 0.1);
      color: #3B82D6;
      border-color: rgba(59, 130, 214, 0.3);
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .error-page {
    padding: 1rem 0.5rem;
  }
  
  .error-content {
    padding: 3rem 1.5rem;
  }
  
  .error-code {
    font-size: 4rem;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
    
    .btn {
      width: 100%;
      max-width: 200px;
    }
  }
}
</style>