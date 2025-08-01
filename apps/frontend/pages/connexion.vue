<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Logo/Titre -->
      <div class="auth-header">
        <h1 class="auth-title">SwiftPlays</h1>
        <p class="auth-subtitle">Connectez-vous à votre compte</p>
      </div>

      <!-- Connexion Discord -->
      <div class="discord-auth">
        <button @click="handleDiscordLogin" type="button" class="discord-button" :disabled="authStore.isLoading">
          <svg width="20" height="20" viewBox="0 0 24 24" class="discord-icon">
            <path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Se connecter avec Discord
        </button>
        
        <div class="auth-divider">
          <span class="divider-text">ou</span>
        </div>
      </div>

      <!-- Formulaire de connexion -->
      <form @submit.prevent="handleLogin" class="auth-form">
        <!-- Champ Email -->
        <div class="form-group">
          <label for="email" class="form-label">Adresse email</label>
          <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{ 'form-input--error': errors.email }"
              placeholder="votre@email.com"
              required
              autocomplete="email"
          />
          <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
        </div>

        <!-- Champ Mot de passe -->
        <div class="form-group">
          <label for="password" class="form-label">Mot de passe</label>
          <div class="password-input-wrapper">
            <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ 'form-input--error': errors.password }"
                placeholder="Votre mot de passe"
                required
                autocomplete="current-password"
            />
            <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
            >
              {{ showPassword ? 'Masquer' : 'Afficher' }}
            </button>
          </div>
          <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
        </div>

        <!-- Se souvenir de moi -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
                v-model="form.rememberMe"
                type="checkbox"
                class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            Se souvenir de moi
          </label>
        </div>

        <!-- Erreur générale -->
        <div v-if="authStore.error" class="auth-error">
          {{ authStore.error.message }}
        </div>

        <!-- Bouton de connexion -->
        <button
            type="submit"
            class="auth-button"
            :disabled="authStore.isLoading || !isFormValid"
            :class="{ 'auth-button--loading': authStore.isLoading }"
        >
          <span v-if="authStore.isLoading">Connexion en cours...</span>
          <span v-else>Se connecter</span>
        </button>
      </form>

      <!-- Lien vers inscription -->
      <div class="auth-footer">
        <p class="auth-link-text">
          Pas encore de compte ?
          <NuxtLink to="/inscription" class="auth-link">Créer un compte</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Imports Vue explicites
import { reactive, ref, computed, watch, onMounted } from 'vue'

// Import du store Pinia
import { useAuthStore } from '../stores/auth'

// Configuration de la page (peut être supprimé si erreur)
definePageMeta({
layout: false,
title: 'Swiftplays | Connexion'
})

// Imports des types
import type { LoginCredentials } from '../types/auth'

// Store d'authentification
const authStore = useAuthStore()

// État du formulaire
const form = reactive<LoginCredentials>({
  email: '',
  password: '',
  rememberMe: false
})

// État de l'affichage du mot de passe
const showPassword = ref(false)

// Erreurs de validation
const errors = reactive({
  email: '',
  password: ''
})

// Validation du formulaire
const isFormValid = computed(() => {
  return form.email.length > 0 &&
      form.password.length > 0 &&
      !errors.email &&
      !errors.password
})

// Validation de l'email
const validateEmail = (email: string): string => {
  if (!email) return 'L\'email est requis'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'Format d\'email invalide'
  return ''
}

// Validation du mot de passe
const validatePassword = (password: string): string => {
  if (!password) return 'Le mot de passe est requis'
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères'
  return ''
}

// Watchers pour validation en temps réel
watch(() => form.email, (newEmail) => {
  errors.email = validateEmail(newEmail)
})

watch(() => form.password, (newPassword) => {
  errors.password = validatePassword(newPassword)
})

// Gestion de la connexion Discord
const handleDiscordLogin = async () => {
  try {
    // Rediriger vers l'endpoint Discord OAuth du backend
    const apiBase = process.env.NODE_ENV === 'production'
      ? 'https://swiftplays.fr'
      : 'http://localhost:3001'
    
    window.location.href = `${apiBase}/api/auth/discord`
  } catch (error) {
    console.error('Erreur connexion Discord:', error)
  }
}

// Gestion de la soumission du formulaire
const handleLogin = async () => {
  // Validation finale
  errors.email = validateEmail(form.email)
  errors.password = validatePassword(form.password)

  if (!isFormValid.value) return

  console.log('=== TENTATIVE DE CONNEXION ===')
  console.log('Email:', form.email)

  // Tentative de connexion
  const result = await authStore.login(form)

  console.log('=== RÉSULTAT CONNEXION ===')
  console.log('result:', result)
  console.log('authStore.isAuthenticated après login:', authStore.isAuthenticated)
  console.log('authStore.user après login:', authStore.user)

  if (result.success) {
    console.log('Success = true, redirection...')
    // Redirection vers le dashboard
    window.location.href = '/dashboard'
  } else {
    console.log('Success = false, erreur:', result.error)
  }
}

// Redirection si déjà connecté
onMounted(() => {
  if (authStore.isAuthenticated) {
    window.location.href = '/dashboard' // Alternative à navigateTo
  }
})
</script>
