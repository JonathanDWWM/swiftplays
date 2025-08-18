<template>
  <div class="auth-page">
    <!-- Message de succès (overlay) -->
    <div v-if="showSuccessMessage" class="success-overlay">
      <div class="success-message">
        <div class="success-icon">✅</div>
        <h3>Inscription réussie !</h3>
        <p>Votre compte <strong>{{ form.pseudo }}</strong> a été créé avec succès</p>
        <p>Un email de confirmation a été envoyé à <strong>{{ form.email }}</strong></p>
        <div class="redirect-info">
          <span class="loading-spinner"></span>
          Redirection vers la connexion...
        </div>
      </div>
    </div>

    <div class="auth-container auth-container--register">
      <!-- Logo/Titre -->
      <div class="auth-header">
        <h1 class="auth-title">SWIFTPLAYS</h1>
        <p class="auth-subtitle">Créez votre compte</p>
      </div>

      <!-- Connexion Discord -->
      <div class="discord-auth">
        <button @click="handleDiscordLogin" type="button" class="discord-button" :disabled="authStore.isLoading || showSuccessMessage">
          <svg width="20" height="20" viewBox="0 0 24 24" class="discord-icon">
            <path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          S'inscrire avec Discord
        </button>
        
        <div class="auth-divider">
          <span class="divider-text">ou</span>
        </div>
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
              :disabled="showSuccessMessage"
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
              :disabled="showSuccessMessage"
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
                :disabled="showSuccessMessage"
            />
            <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
                :disabled="showSuccessMessage"
            >
            
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
                :disabled="showSuccessMessage"
            />
            <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="password-toggle"
                :disabled="showSuccessMessage"
            >
            
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
            :disabled="authStore.isLoading || !isFormValid || showSuccessMessage"
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
        <p class="discord-hint">
          Vous avez Discord ? Connectez-vous directement avec votre compte Discord ci-dessus
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

// État pour le message de succès
const showSuccessMessage = ref(false)

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
    // ✅ INSCRIPTION RÉUSSIE
    console.log('Inscription réussie !')

    // Afficher le message de succès
    showSuccessMessage.value = true

    // Redirection vers la connexion après 3 secondes
    setTimeout(() => {
      window.location.href = '/connexion?registered=true'
    }, 3000)
  }
  // Les erreurs sont gérées automatiquement par le store
}

// Redirection si déjà connecté
onMounted(() => {
  if (authStore.isAuthenticated) {
    window.location.href = '/dashboard'
  }
})
</script>

