<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader title="Mes équipes" />

      <!-- Page Content -->
      <main class="page-content">
        <div class="content-container">
          <div class="page-header">
            <button class="btn-primary" @click="showCreateModal = true">
              <FontAwesomeIcon icon="plus" />
              Créer une équipe
            </button>
          </div>

    <!-- Liste des équipes -->
    <div class="teams-grid" v-if="teams.length > 0">
      <div 
        v-for="team in teams" 
        :key="team.id"
        class="team-card"
      >
        <div class="team-avatar">
          <img 
            v-if="team.avatar" 
            :src="team.avatar" 
            :alt="team.name"
            class="team-avatar-img"
          />
          <div v-else class="team-avatar-placeholder">
            {{ team.name.charAt(0).toUpperCase() }}
          </div>
        </div>
        
        <div class="team-info">
          <div class="team-header">
            <h3 class="team-name">{{ team.name }}</h3>
            <span v-if="team.shortName" class="team-short-name">{{ team.shortName }}</span>
          </div>
          <div v-if="team.game" class="team-game">
            <span class="game-badge">{{ getGameDisplayName(team.game) }}</span>
            <span v-if="team.gameMode" class="game-mode">{{ team.gameMode }}</span>
          </div>
          <p class="team-owner">
            Créée par {{ team.owner.pseudo }}
          </p>
          <div class="team-date">
            Créée le {{ formatDate(team.createdAt) }}
          </div>
        </div>

        <div class="team-actions">
          <NuxtLink 
            :to="`/equipe/${team.id}`" 
            class="btn-secondary btn-small"
          >
            Voir l'équipe
          </NuxtLink>
          <NuxtLink 
            :to="`/equipe/${team.id}`" 
            class="btn-danger btn-small"
          >
            Gérer l'équipe
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Message si aucune équipe -->
    <div v-else class="no-teams">
      <h3>Aucune équipe</h3>
      <p>Vous n'avez pas encore créé d'équipe. Créez votre première équipe pour commencer !</p>
      <button class="btn-primary" @click="showCreateModal = true">
        Créer ma première équipe
      </button>
    </div>

    <!-- Modal de création/édition -->
    <div v-if="showCreateModal || editingTeam" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ editingTeam ? 'Modifier l\'équipe' : 'Créer une équipe' }}</h2>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        
        <form @submit.prevent="submitTeam" class="modal-form">
          <!-- Message d'erreur -->
          <div v-if="errorMessage" class="error-message">
            <FontAwesomeIcon icon="exclamation-triangle" />
            {{ errorMessage }}
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="teamName">Nom de l'équipe *</label>
              <input 
                id="teamName"
                v-model="formData.name" 
                type="text" 
                required 
                maxlength="50"
                placeholder="Nom de votre équipe"
              />
            </div>
            
            <div class="form-group">
              <label for="teamShortName">Nom court (3 caractères)</label>
              <input 
                id="teamShortName"
                v-model="formData.shortName" 
                type="text" 
                maxlength="3"
                placeholder="ABC"
                style="text-transform: uppercase;"
              />
              <small>Laissez vide pour générer automatiquement</small>
            </div>
          </div>
          
          
          <div class="form-group">
            <label for="teamAvatar">Avatar (optionnel)</label>
            <input 
              id="teamAvatar"
              type="file" 
              accept="image/*"
              @change="handleAvatarUpload"
            />
            <small>Formats acceptés : JPG, PNG, GIF (max 5MB)</small>
            
            <!-- Prévisualisation de l'avatar -->
            <div v-if="avatarPreview" class="avatar-preview">
              <img :src="avatarPreview" alt="Prévisualisation" />
              <button type="button" @click="removeAvatar" class="remove-avatar">×</button>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="teamGame">Jeu *</label>
              <select 
                id="teamGame"
                v-model="formData.game" 
                required
              >
                <option value="">Sélectionner un jeu</option>
                <option 
                  v-for="game in gameOptions" 
                  :key="game.value" 
                  :value="game.value"
                >
                  {{ game.label }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="teamGameMode">Mode de jeu *</label>
              <select 
                id="teamGameMode"
                v-model="formData.gameMode" 
                required
                :disabled="!formData.game"
              >
                <option value="">Sélectionner un mode</option>
                <option 
                  v-for="mode in availableGameModes" 
                  :key="mode.value" 
                  :value="mode.value"
                >
                  {{ mode.label }}
                </option>
              </select>
              <small v-if="!formData.game">Sélectionnez d'abord un jeu</small>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal">
              Annuler
            </button>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Sauvegarde...' : editingTeam ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

          <!-- Loading -->
          <div v-if="pageLoading" class="loading">
            Chargement des équipes...
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import Sidebar from "~/components/Sidebar.vue"
import AppHeader from "~/components/AppHeader.vue"

// Configuration de la page
definePageMeta({
  layout: false,
  title: 'Mes équipes - SwiftPlays'
})

// Store d'authentification
const authStore = useAuthStore()


// Types
interface Team {
  id: string
  name: string
  shortName?: string
  description?: string
  avatar?: string
  game?: string
  gameMode?: string
  maxMembers?: number
  createdAt: string
  owner: {
    id: string
    pseudo: string
    avatar?: string
    discordAvatar?: string
  }
}

interface TeamFormData {
  name: string
  shortName: string
  game: string
  gameMode: string
  avatar: File | null
}

// État réactif
const teams = ref<Team[]>([])
const showCreateModal = ref(false)
const editingTeam = ref<Team | null>(null)
const loading = ref(false)
const pageLoading = ref(true)
const errorMessage = ref('')

const formData = ref<TeamFormData>({
  name: '',
  shortName: '',
  game: '',
  gameMode: '',
  avatar: null
})

const avatarPreview = ref<string | null>(null)

// Configuration des jeux et modes
const gameOptions = [
  { value: 'FC_26', label: 'FC 26' },
  { value: 'CALL_OF_DUTY_BO7', label: 'Call of Duty BO7' }
]

const gameModes = ref({
  FC_26: [
    { value: '1v1', label: '1v1' },
    { value: '2v2', label: '2v2' },
    { value: '5v5', label: '5v5' }
  ],
  CALL_OF_DUTY_BO7: [
    { value: '1v1', label: '1v1' },
    { value: '2v2', label: '2v2' },
    { value: '4v4', label: '4v4' }
  ]
})

const availableGameModes = computed(() => {
  if (!formData.value.game) return []
  return gameModes.value[formData.value.game as keyof typeof gameModes.value] || []
})

// Configuration runtime
const config = useRuntimeConfig()


// Fonctions utilitaires
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR')
}

const getGameDisplayName = (game: string) => {
  const gameNames = {
    'FC_26': 'FC 26',
    'CALL_OF_DUTY_BO7': 'Call of Duty BO7'
  }
  return gameNames[game as keyof typeof gameNames] || game
}

// Surveiller les changements de jeu pour réinitialiser le mode
watch(() => formData.value.game, (newGame) => {
  if (newGame !== formData.value.game) {
    formData.value.gameMode = ''
  }
})

// Charger les équipes
const loadTeams = async () => {
  try {
    pageLoading.value = true
    const token = useCookie('accessToken')
    
    const response = await $fetch<{ success: boolean, data: Team[] }>('/api/teams/my', {
      baseURL: config.public.apiBase,
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      teams.value = response.data || []
    }
  } catch (error) {
    console.error('Erreur chargement équipes:', error)
    // TODO: Afficher une notification d'erreur
  } finally {
    pageLoading.value = false
  }
}

// Gestion de l'upload d'avatar
const handleAvatarUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // Vérification de la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop volumineuse. Taille maximum : 5MB')
      return
    }
    
    // Vérification du type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide')
      return
    }
    
    formData.value.avatar = file
    
    // Créer la prévisualisation
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const removeAvatar = () => {
  formData.value.avatar = null
  avatarPreview.value = null
  // Reset du champ file input
  const fileInput = document.getElementById('teamAvatar') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

// Créer ou modifier une équipe
const submitTeam = async () => {
  if (!formData.value.name.trim()) return
  
  // Validation des champs requis pour la création
  if (!editingTeam.value && (!formData.value.game || !formData.value.gameMode)) {
    alert('Veuillez sélectionner un jeu et un mode de jeu')
    return
  }
  
  try {
    loading.value = true
    const token = useCookie('accessToken')
    
    const endpoint = editingTeam.value 
      ? `/api/teams/${editingTeam.value.id}`
      : '/api/teams'
    
    const method = editingTeam.value ? 'PUT' : 'POST'
    
    // Préparer les données avec FormData pour l'upload
    const formDataToSend = new FormData()
    formDataToSend.append('name', formData.value.name.trim())
    if (formData.value.shortName.trim()) {
      formDataToSend.append('shortName', formData.value.shortName.trim())
    }
    if (formData.value.game) {
      formDataToSend.append('game', formData.value.game)
    }
    if (formData.value.gameMode) {
      formDataToSend.append('gameMode', formData.value.gameMode)
    }
    if (formData.value.avatar) {
      formDataToSend.append('avatar', formData.value.avatar)
    }
    
    const response = await $fetch<{ success: boolean, data: Team, message: string }>(endpoint, {
      baseURL: config.public.apiBase,
      method,
      headers: {
        'Authorization': `Bearer ${token.value}`
      },
      body: formDataToSend
    })
    
    if (response.success) {
      closeModal()
      await loadTeams() // Recharger la liste
      // TODO: Afficher une notification de succès
    }
  } catch (error: any) {
    console.error('Erreur sauvegarde équipe:', error)
    
    // Gérer les différents types d'erreurs
    if (error.data?.message) {
      errorMessage.value = error.data.message
    } else if (error.message) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = editingTeam.value 
        ? 'Erreur lors de la modification de l\'équipe' 
        : 'Erreur lors de la création de l\'équipe'
    }
  } finally {
    loading.value = false
  }
}

// Supprimer une équipe
const confirmDelete = (team: Team) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}" ? Cette action est irréversible.`)) {
    deleteTeam(team.id)
  }
}

const deleteTeam = async (teamId: string) => {
  try {
    const token = useCookie('accessToken')
    
    const response = await $fetch<{ success: boolean, message: string }>(`/api/teams/${teamId}`, {
      baseURL: config.public.apiBase,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      await loadTeams() // Recharger la liste
      // TODO: Afficher une notification de succès
    }
  } catch (error) {
    console.error('Erreur suppression équipe:', error)
    // TODO: Afficher une notification d'erreur
  }
}

// Gestion du modal
const editTeam = (team: Team) => {
  editingTeam.value = team
  formData.value = {
    name: team.name,
    shortName: team.shortName || '',
    game: team.game || '',
    gameMode: team.gameMode || '',
    avatar: null
  }
  
  // Afficher l'avatar existant en prévisualisation si présent
  if (team.avatar) {
    avatarPreview.value = team.avatar
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingTeam.value = null
  errorMessage.value = ''
  formData.value = {
    name: '',
    shortName: '',
    game: '',
    gameMode: '',
    avatar: null
  }
  avatarPreview.value = null
  
  // Reset du champ file input
  const fileInput = document.getElementById('teamAvatar') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

// Charger les équipes au montage du composant
onMounted(async () => {
  // Initialiser le store au cas où il ne l'est pas encore
  await authStore.initAuth()

  // Redirection si pas authentifié
  if (!authStore.isAuthenticated) {
    window.location.href = '/connexion'
    return
  }

  // Charger les équipes
  loadTeams()
})
</script>

<style lang="scss" scoped>
// Importer les styles spécifiques aux équipes
@import '~/assets/scss/equipes';
</style>