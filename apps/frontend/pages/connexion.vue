<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Logo/Titre -->
      <div class="auth-header">
        <h1 class="auth-title">SwiftPlays</h1>
        <p class="auth-subtitle">Connectez-vous à votre compte</p>
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
