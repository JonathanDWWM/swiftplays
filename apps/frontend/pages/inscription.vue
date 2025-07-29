<template>
  <div class="auth-page">
    <div class="auth-container auth-container--register">
      <!-- Logo/Titre -->
      <div class="auth-header">
        <h1 class="auth-title">SWIFTPLAYS</h1>
        <p class="auth-subtitle">Créez votre compte</p>
      </div>

      <!-- Formulaire d'inscription -->
      <form @submit.prevent="handleRegister" class="auth-form">
        <!-- Champ Pseudo -->
        <div class="form-group">
          <label for="pseudo" class="form-label">Pseudo</label>
          <input
              id="pseudo"
              v-model="form.pseudo"
              type="text"
              class="form-input"
              :class="{
              'form-input--error': errors.pseudo,
              'form-input--success': !errors.pseudo && form.pseudo.length >= 3
            }"
              placeholder="Votre pseudo (3-15 caractères)"
              required
              autocomplete="username"
          />
          <span v-if="errors.pseudo" class="form-error">{{ errors.pseudo }}</span>
          <span v-else-if="!errors.pseudo && form.pseudo.length >= 3" class="form-success">
            Pseudo valide ✓
          </span>
        </div>

        <!-- Champ Email -->
        <div class="form-group">
          <label for="email" class="form-label">Adresse email</label>
          <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{
              'form-input--error': errors.email,
              'form-input--success': !errors.email && form.email.length > 0
            }"
              placeholder="votre@email.com"
              required
              autocomplete="email"
          />
          <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
          <span v-else-if="!errors.email && form.email.length > 0" class="form-success">
            Email valide ✓
          </span>
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
                :class="{
                'form-input--error': errors.password,
                'form-input--success': !errors.password && form.password.length >= 8
              }"
                placeholder="Minimum 8 caractères"
                required
                autocomplete="new-password"
            />
            <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="errors.password" class="form-error">{{ errors.password }}</span>

          <!-- Indicateur de force du mot de passe -->
          <div v-if="form.password.length > 0" class="password-strength">
            <div class="password-strength-label">
              Force du mot de passe : {{ passwordStrengthText }}
            </div>
            <div class="password-strength-bar">
              <div
                  class="password-strength-bar__fill"
                  :class="`password-strength-bar__fill--${passwordStrength}`"
              ></div>
            </div>
          </div>

          <!-- Exigences du mot de passe -->
          <div v-if="form.password.length > 0" class="password-requirements">
            <ul>
              <li :class="{ valid: passwordChecks.length }">Au moins 8 caractères</li>
              <li :class="{ valid: passwordChecks.uppercase }">Une majuscule</li>
              <li :class="{ valid: passwordChecks.number }">Un chiffre</li>
            </ul>
          </div>
        </div>

        <!-- Confirmation du mot de passe -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirmer le mot de passe</label>
          <div class="password-input-wrapper">
            <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                class="form-input"
                :class="{
                'form-input--error': errors.confirmPassword,
                'form-input--success': !errors.confirmPassword && form.confirmPassword.length > 0 && form.password === form.confirmPassword
              }"
                placeholder="Répétez votre mot de passe"
                required
                autocomplete="new-password"
            />
            <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="password-toggle"
            >
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="errors.confirmPassword" class="form-error">{{ errors.confirmPassword }}</span>
          <span v-else-if="!errors.confirmPassword && form.confirmPassword.length > 0 && form.password === form.confirmPassword" class="form-success">
            Les mots de passe correspondent ✓
          </span>
        </div>

        <!-- Erreur générale -->
        <div v-if="authStore.error" class="auth-error">
          {{ authStore.error.message }}
        </div>

        <!-- Bouton d'inscription -->
        <button
            type="submit"
            class="auth-button"
            :disabled="authStore.isLoading || !isFormValid"
            :class="{ 'auth-button--loading': authStore.isLoading }"
        >
          <span v-if="authStore.isLoading">Création du compte...</span>
          <span v-else>Créer mon compte</span>
        </button>
      </form>

      <!-- Lien vers connexion -->
      <div class="auth-footer">
        <p class="auth-link-text">
          Déjà un compte ?
          <NuxtLink to="/connexion" class="auth-link">Se connecter</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Imports Vue
import { reactive, ref, computed, watch, onMounted } from 'vue'

// Imports des types
import type { RegisterCredentials } from '../types/auth'

// Import du store Pinia
import { useAuthStore } from '../stores/auth'

// Configuration de la page
definePageMeta({
  layout: false,
  title: 'SwiftPlays | Inscription'
})

// Store d'authentification
const authStore = useAuthStore()

// Interface pour le formulaire d'inscription
interface RegisterForm extends RegisterCredentials {
  pseudo: string
  confirmPassword: string
}

// État du formulaire
const form = reactive<RegisterForm>({
  pseudo: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// État de l'affichage des mots de passe
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Erreurs de validation
const errors = reactive({
  pseudo: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Vérifications du mot de passe
const passwordChecks = computed(() => ({
  length: form.password.length >= 8,
  uppercase: /[A-Z]/.test(form.password),
  number: /\d/.test(form.password),
}))

// Force du mot de passe
const passwordStrength = computed(() => {
  const checks = Object.values(passwordChecks.value)
  const validCount = checks.filter(Boolean).length

  if (validCount < 2) return 'weak'
  if (validCount === 2) return 'medium'
  if (validCount === 3) return 'strong'
  return 'very-strong'
})

// Texte de la force du mot de passe
const passwordStrengthText = computed(() => {
  const strengthMap = {
    weak: 'Faible',
    medium: 'Moyen',
    strong: 'Fort',
    'very-strong': 'Très fort'
  }
  return strengthMap[passwordStrength.value]
})

// Validation du formulaire
const isFormValid = computed(() => {
  return form.pseudo.length >= 3 &&
      form.email.length > 0 &&
      form.password.length >= 8 &&
      form.confirmPassword.length > 0 &&
      !errors.pseudo &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword &&
      passwordChecks.value.length &&
      passwordChecks.value.uppercase &&
      passwordChecks.value.number
})

// Validation du pseudo
const validatePseudo = (pseudo: string): string => {
  if (!pseudo) return 'Le pseudo est requis'
  if (pseudo.length < 3) return 'Le pseudo doit contenir au moins 3 caractères'
  if (pseudo.length > 15) return 'Le pseudo ne peut pas dépasser 15 caractères'
  if (!/^[a-zA-Z0-9_-]+$/.test(pseudo)) return 'Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores'
  return ''
}

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
  if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une majuscule'
  if (!/\d/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre'
  return ''
}

// Validation de la confirmation du mot de passe
const validateConfirmPassword = (confirmPassword: string, password: string): string => {
  if (!confirmPassword) return 'La confirmation du mot de passe est requise'
  if (confirmPassword !== password) return 'Les mots de passe ne correspondent pas'
  return ''
}

// Watchers pour validation en temps réel
watch(() => form.pseudo, (newPseudo) => {
  errors.pseudo = validatePseudo(newPseudo)
})

watch(() => form.email, (newEmail) => {
  errors.email = validateEmail(newEmail)
})

watch(() => form.password, (newPassword) => {
  errors.password = validatePassword(newPassword)
  // Re-valider la confirmation si elle existe déjà
  if (form.confirmPassword) {
    errors.confirmPassword = validateConfirmPassword(form.confirmPassword, newPassword)
  }
})

watch(() => form.confirmPassword, (newConfirmPassword) => {
  errors.confirmPassword = validateConfirmPassword(newConfirmPassword, form.password)
})

// Gestion de la soumission du formulaire
const handleRegister = async () => {
  // Validation finale
  errors.pseudo = validatePseudo(form.pseudo)
  errors.email = validateEmail(form.email)
  errors.password = validatePassword(form.password)
  errors.confirmPassword = validateConfirmPassword(form.confirmPassword, form.password)

  if (!isFormValid.value) return

  // Tentative d'inscription
  const result = await authStore.register({
    pseudo: form.pseudo,
    email: form.email,
    password: form.password
  })

  if (result.success) {
    // ✅ PAS BESOIN DE initAuth() - le register() met déjà à jour le store
    console.log('Inscription réussie, authStore.isAuthenticated:', authStore.isAuthenticated)

    // Redirection directe vers le dashboard
    window.location.href = '/dashboard'
  }
}

// Redirection si déjà connecté
onMounted(() => {
  if (authStore.isAuthenticated) {
    window.location.href = '/dashboard'
  }
})
</script>