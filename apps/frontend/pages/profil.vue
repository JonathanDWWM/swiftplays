<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">Mon Profil</h1>
        </div>
        
        <div class="header-right">
          <!-- Search Bar -->
          <SearchBar />
          
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

      <!-- Page Content -->
      <main class="page-content">
        <div class="content-container">
          
          <!-- Success Message -->
          <div v-if="successMessage" class="success-alert">
            <FontAwesomeIcon icon="check-circle" class="success-icon" />
            <span>{{ successMessage }}</span>
          </div>

          <!-- Avatar Section -->
          <div class="profile-section avatar-section">
            <h2 class="section-title">Photo de profil</h2>
            <div class="avatar-container">
              <div class="avatar-preview">
                <img 
                  :src="authStore.user?.avatar || authStore.user?.discordAvatar || '/default-avatar.svg'" 
                  :alt="authStore.user?.pseudo"
                  class="avatar-image"
                />
                <div class="avatar-overlay">
                  <button class="change-avatar-btn" @click="$refs.avatarInput.click()">
                    <FontAwesomeIcon icon="camera" />
                    Changer
                  </button>
                </div>
              </div>
              <input 
                ref="avatarInput"
                type="file" 
                accept="image/*" 
                @change="handleAvatarChange" 
                style="display: none;"
              />
              <div class="avatar-info">
                <p class="avatar-text">Format recommandé : JPG, PNG (max 2MB)</p>
                <p class="avatar-text">Taille optimale : 256x256px</p>
              </div>
            </div>
          </div>

          <!-- Profile Info Section -->
          <div class="profile-section info-section">
            <h2 class="section-title">Informations personnelles</h2>
            
            <form @submit.prevent="handleUpdateProfile" class="profile-form">
              
              <!-- Account Type Info -->

              <div class="form-row">
                <div class="form-group">
                  <label for="pseudo" class="form-label">Pseudo *</label>
                  <input
                    id="pseudo"
                    v-model="profileForm.pseudo"
                    type="text"
                    class="form-input"
                    :class="{ 'form-input--error': errors.pseudo }"
                    placeholder="Votre pseudo"
                    required
                  />
                  <span v-if="errors.pseudo" class="form-error">{{ errors.pseudo }}</span>
                </div>

                <div class="form-group">
                  <label for="email" class="form-label">Adresse email *</label>
                  <input
                    id="email"
                    v-model="profileForm.email"
                    type="email"
                    class="form-input"
                    :class="{ 'form-input--error': errors.email }"
                    placeholder="votre@email.com"
                    required
                  />
                  <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="firstName" class="form-label">Prénom</label>
                  <input
                    id="firstName"
                    v-model="profileForm.firstName"
                    type="text"
                    class="form-input"
                    placeholder="Votre prénom"
                  />
                </div>

                <div class="form-group">
                  <label for="lastName" class="form-label">Nom</label>
                  <input
                    id="lastName"
                    v-model="profileForm.lastName"
                    type="text"
                    class="form-input"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <!-- Discord Info (read-only) -->
              <div v-if="authStore.user?.discordId" class="discord-info">
                <h3 class="discord-title">Informations Discord</h3>
                <div class="discord-details">
                  <div class="discord-field">
                    <span class="discord-label">Nom Discord:</span>
                    <span class="discord-value">{{ authStore.user?.discordUsername }}</span>
                  </div>
                  <div class="discord-field">
                    <span class="discord-label">ID Discord:</span>
                    <span class="discord-value">{{ authStore.user?.discordId }}</span>
                  </div>
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="authStore.error" class="error-alert">
                {{ authStore.error.message }}
              </div>

              <!-- Submit Button -->
              <div class="form-actions">
                <button 
                  type="submit" 
                  class="save-btn"
                  :disabled="authStore.isLoading || !hasChanges"
                  :class="{ 'save-btn--loading': authStore.isLoading }"
                >
                  <span v-if="authStore.isLoading">Sauvegarde...</span>
                  <span v-else>Sauvegarder les modifications</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Password Section (for email accounts only) -->
          <div v-if="canChangePassword" class="profile-section password-section">
            <h2 class="section-title">Changer le mot de passe</h2>
            <form @submit.prevent="handleChangePassword" class="password-form">
              
              <div class="form-group">
                <label for="currentPassword" class="form-label">Mot de passe actuel *</label>
                <input
                  id="currentPassword"
                  v-model="passwordForm.currentPassword"
                  type="password"
                  class="form-input"
                  :class="{ 'form-input--error': errors.currentPassword }"
                  placeholder="Votre mot de passe actuel"
                  required
                />
                <span v-if="errors.currentPassword" class="form-error">{{ errors.currentPassword }}</span>
              </div>

              <div class="form-group">
                <label for="newPassword" class="form-label">Nouveau mot de passe *</label>
                <input
                  id="newPassword"
                  v-model="passwordForm.newPassword"
                  type="password"
                  class="form-input"
                  :class="{ 'form-input--error': errors.newPassword }"
                  placeholder="Votre nouveau mot de passe"
                  required
                />
                <span v-if="errors.newPassword" class="form-error">{{ errors.newPassword }}</span>
              </div>

              <div class="form-group">
                <label for="confirmPassword" class="form-label">Confirmer le nouveau mot de passe *</label>
                <input
                  id="confirmPassword"
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  class="form-input"
                  :class="{ 'form-input--error': errors.confirmPassword }"
                  placeholder="Confirmer le nouveau mot de passe"
                  required
                />
                <span v-if="errors.confirmPassword" class="form-error">{{ errors.confirmPassword }}</span>
              </div>

              <div class="form-actions">
                <button 
                  type="submit" 
                  class="save-btn"
                  :disabled="authStore.isLoading || !isPasswordFormValid"
                  :class="{ 'save-btn--loading': authStore.isLoading }"
                >
                  <span v-if="authStore.isLoading">Changement...</span>
                  <span v-else>Changer le mot de passe</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import Sidebar from "~/components/Sidebar.vue"
import SearchBar from "~/components/SearchBar.vue"

// Configuration de la page
definePageMeta({
  middleware: 'auth',
  title: 'SwiftPlays | Mon Profil'
})

// Store
const authStore = useAuthStore()

// État des formulaires
const profileForm = reactive({
  pseudo: '',
  email: '',
  firstName: '',
  lastName: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// État des erreurs
const errors = reactive({
  pseudo: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Messages de succès
const successMessage = ref('')

// État local pour le dropdown utilisateur
const showUserDropdown = ref(false)

// Computed properties
const accountTypeClass = computed(() => {
  switch (authStore.user?.accountType) {
    case 'EMAIL': return 'account-badge--email'
    case 'DISCORD': return 'account-badge--discord'
    case 'HYBRID': return 'account-badge--hybrid'
    default: return 'account-badge--default'
  }
})

const accountTypeText = computed(() => {
  switch (authStore.user?.accountType) {
    case 'EMAIL': return 'Compte Email'
    case 'DISCORD': return 'Compte Discord'
    case 'HYBRID': return 'Compte Hybride'
    default: return 'Compte Standard'
  }
})

const accountDescription = computed(() => {
  switch (authStore.user?.accountType) {
    case 'EMAIL': return 'Compte créé avec une adresse email et un mot de passe'
    case 'DISCORD': return 'Compte créé via Discord OAuth'
    case 'HYBRID': return 'Compte email lié à Discord'
    default: return ''
  }
})

const canChangePassword = computed(() => {
  return authStore.user?.accountType !== 'DISCORD'
})

const hasChanges = computed(() => {
  if (!authStore.user) return false
  
  return profileForm.pseudo !== authStore.user.pseudo ||
         profileForm.email !== authStore.user.email ||
         profileForm.firstName !== (authStore.user.firstName || '') ||
         profileForm.lastName !== (authStore.user.lastName || '')
})

const isPasswordFormValid = computed(() => {
  return passwordForm.currentPassword.length > 0 &&
         passwordForm.newPassword.length >= 8 &&
         passwordForm.confirmPassword === passwordForm.newPassword
})

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

// Méthodes
const initializeForm = () => {
  if (authStore.user) {
    profileForm.pseudo = authStore.user.pseudo
    profileForm.email = authStore.user.email
    profileForm.firstName = authStore.user.firstName || ''
    profileForm.lastName = authStore.user.lastName || ''
  }
}

const handleUpdateProfile = async () => {
  // Reset errors
  Object.keys(errors).forEach(key => errors[key] = '')
  
  // Validation basique
  if (profileForm.pseudo.length < 3) {
    errors.pseudo = 'Le pseudo doit contenir au moins 3 caractères'
    return
  }
  
  if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
    errors.email = 'Format d\'email invalide'
    return
  }

  // Appel API (à implémenter dans le store)
  try {
    const success = await authStore.updateProfile({
      pseudo: profileForm.pseudo,
      email: profileForm.email,
      firstName: profileForm.firstName || null,
      lastName: profileForm.lastName || null
    })

    if (success) {
      successMessage.value = 'Profil mis à jour avec succès !'
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
    }
  } catch (error) {
    console.error('Erreur mise à jour profil:', error)
  }
}

const handleChangePassword = async () => {
  // Reset errors
  errors.currentPassword = ''
  errors.newPassword = ''
  errors.confirmPassword = ''
  
  // Validation
  if (passwordForm.newPassword.length < 8) {
    errors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères'
    return
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas'
    return
  }

  // Appel API (à implémenter dans le store)
  try {
    const success = await authStore.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })

    if (success) {
      // Reset form
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      
      successMessage.value = 'Mot de passe changé avec succès !'
      setTimeout(() => {
        successMessage.value = ''
      }, 5000)
    }
  } catch (error) {
    console.error('Erreur changement mot de passe:', error)
  }
}

const handleAvatarChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Validation taille
  if (file.size > 2 * 1024 * 1024) {
    alert('Le fichier est trop volumineux (max 2MB)')
    return
  }

  // Validation type
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner une image')
    return
  }

  // TODO: Implémenter l'upload d'avatar
  console.log('Avatar sélectionné:', file)
}

// Lifecycle
onMounted(() => {
  initializeForm()
  
  // Écouter les clics pour fermer le dropdown
  document.addEventListener('click', closeDropdown)
})

// Nettoyage des event listeners
onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

// Watchers
watch(() => authStore.user, () => {
  initializeForm()
}, { deep: true })
</script>

