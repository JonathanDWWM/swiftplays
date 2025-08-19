<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <button @click="$router.go(-1)" class="back-button">
            <FontAwesomeIcon icon="arrow-left" />
            Retour
          </button>
          <h1 class="page-title">{{ team?.name || 'Équipe' }}</h1>
        </div>
        
        <div class="header-right">
          <!-- Search Bar -->
          <SearchBar />
          
          <!-- Notification Bell -->
          <NotificationBell />
          
          <!-- User Menu -->
          <div class="user-menu">
            <button @click="toggleUserDropdown" class="user-button">
              <img 
                v-if="authStore.user?.avatar" 
                :src="authStore.user.avatar" 
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
              <NuxtLink to="/profil" class="dropdown-item">
                Mon Profil
              </NuxtLink>
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
          
          <!-- Loading State -->
          <div v-if="pending" class="loading-container">
            <FontAwesomeIcon icon="spinner" spin class="loading-icon" />
            <span>Chargement de l'équipe...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-container">
            <FontAwesomeIcon icon="exclamation-triangle" class="error-icon" />
            <h3 class="error-title">Équipe non trouvée</h3>
            <p class="error-message">Cette équipe n'existe pas ou vous n'avez pas accès</p>
            <NuxtLink to="/equipes" class="back-to-teams-btn">
              <FontAwesomeIcon icon="arrow-left" />
              Retour aux équipes
            </NuxtLink>
          </div>

          <!-- Team Details -->
          <div v-else-if="team" class="team-details">
            
            <!-- Team Header -->
            <div class="team-header">
              <div class="team-header-info">
                <div class="team-avatar-large">
                  <img 
                    v-if="team.avatar" 
                    :src="team.avatar" 
                    :alt="team.name"
                    class="avatar-image-large"
                  />
                  <div v-else class="avatar-fallback-large">
                    {{ team.name.charAt(0).toUpperCase() }}
                  </div>
                  <div v-if="team.myRole === 'CAPTAIN'" class="captain-badge-large" title="Vous êtes capitaine">
                    <FontAwesomeIcon icon="crown" />
                  </div>
                </div>
                
                <div class="team-info">
                  <h2 class="team-name-large">{{ team.name }}</h2>
                  <p v-if="team.description" class="team-description">{{ team.description }}</p>
                  <div class="team-stats">
                    <span class="stat">
                      <FontAwesomeIcon icon="users" />
                      {{ team.memberCount }}/{{ team.maxMembers }} membres
                    </span>
                    <span class="stat">
                      <FontAwesomeIcon icon="user-crown" />
                      Créée par {{ team.creator.pseudo }}
                    </span>
                    <span class="stat">
                      <FontAwesomeIcon icon="calendar" />
                      {{ formatDate(team.createdAt) }}
                    </span>
                    <span v-if="!team.isPublic" class="stat private">
                      <FontAwesomeIcon icon="lock" />
                      Équipe privée
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="team-actions">
                <div v-if="team.myRole === 'CAPTAIN'" class="captain-actions">
                  <button @click="showEditModal = true" class="edit-team-btn">
                    <FontAwesomeIcon icon="edit" />
                    Modifier l'équipe
                  </button>
                  <button @click="showInviteModal = true" class="invite-member-btn">
                    <FontAwesomeIcon icon="user-plus" />
                    Inviter un membre
                  </button>
                  <button @click="handleDissolveTeam" class="dissolve-team-btn">
                    <FontAwesomeIcon icon="trash" />
                    Dissoudre l'équipe
                  </button>
                </div>
                <div v-else-if="team.myRole === 'MEMBER'" class="member-actions">
                  <button @click="handleLeaveTeam" class="leave-team-btn">
                    <FontAwesomeIcon icon="sign-out-alt" />
                    Quitter l'équipe
                  </button>
                </div>
              </div>
            </div>

            <!-- Team Members -->
            <div class="team-section">
              <div class="section-header">
                <h3 class="section-title">
                  <FontAwesomeIcon icon="users" />
                  Membres de l'équipe ({{ team.memberCount }})
                </h3>
              </div>
              
              <div class="members-grid">
                <div v-for="member in team.members" :key="member.id" class="member-card">
                  <div class="member-avatar">
                    <img 
                      v-if="member.avatar" 
                      :src="member.avatar" 
                      :alt="member.pseudo"
                      class="member-avatar-image"
                    />
                    <div v-else class="member-avatar-fallback">
                      {{ member.pseudo.charAt(0).toUpperCase() }}
                    </div>
                    <div v-if="member.role === 'CAPTAIN'" class="captain-badge-small">
                      <FontAwesomeIcon icon="crown" />
                    </div>
                  </div>
                  
                  <div class="member-info">
                    <NuxtLink :to="`/u/${member.pseudo}`" class="member-name">
                      {{ member.pseudo }}
                    </NuxtLink>
                    <div class="member-details">
                      <span class="member-role" :class="{ captain: member.role === 'CAPTAIN' }">
                        {{ member.role === 'CAPTAIN' ? 'Capitaine' : 'Membre' }}
                      </span>
                      <span class="member-join-date">
                        Rejoint {{ formatJoinDate(member.joinedAt) }}
                      </span>
                    </div>
                  </div>
                  
                  <div v-if="team.myRole === 'CAPTAIN' && member.id !== authStore.user?.id" class="member-actions">
                    <button @click="removeMember(member)" class="remove-member-btn" title="Retirer du groupe">
                      <FontAwesomeIcon icon="user-minus" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>

    <!-- Edit Team Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Modifier l'équipe</h3>
          <button @click="closeEditModal" class="modal-close">
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
        
        <form @submit.prevent="handleEditTeam" class="edit-team-form">
          <div class="form-group">
            <label for="editTeamName" class="form-label">Nom de l'équipe *</label>
            <input
              id="editTeamName"
              v-model="editForm.name"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': editErrors.name }"
              placeholder="Nom de l'équipe"
              maxlength="50"
              required
            />
            <span v-if="editErrors.name" class="form-error">{{ editErrors.name }}</span>
          </div>

          <div class="form-group">
            <label for="editTeamDescription" class="form-label">Description</label>
            <textarea
              id="editTeamDescription"
              v-model="editForm.description"
              class="form-textarea"
              placeholder="Description de l'équipe"
              rows="3"
              maxlength="500"
            ></textarea>
            <small class="form-hint">{{ editForm.description?.length || 0 }}/500 caractères</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="editMaxMembers" class="form-label">Nombre max de membres</label>
              <select id="editMaxMembers" v-model.number="editForm.maxMembers" class="form-select">
                <option value="2">2 membres</option>
                <option value="3">3 membres</option>
                <option value="4">4 membres</option>
                <option value="5">5 membres</option>
                <option value="6">6 membres</option>
                <option value="8">8 membres</option>
                <option value="10">10 membres</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Visibilité</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input
                    v-model="editForm.isPublic"
                    type="radio"
                    :value="true"
                  />
                  <span class="radio-label">
                    <FontAwesomeIcon icon="globe" />
                    Publique
                  </span>
                </label>
                <label class="radio-option">
                  <input
                    v-model="editForm.isPublic"
                    type="radio"
                    :value="false"
                  />
                  <span class="radio-label">
                    <FontAwesomeIcon icon="lock" />
                    Privée
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeEditModal" class="cancel-btn">
              Annuler
            </button>
            <button type="submit" :disabled="isEditing" class="submit-btn">
              <FontAwesomeIcon v-if="isEditing" icon="spinner" spin />
              <FontAwesomeIcon v-else icon="save" />
              {{ isEditing ? 'Modification...' : 'Modifier l\'équipe' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Invite Member Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click="closeInviteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Inviter un membre</h3>
          <button @click="closeInviteModal" class="modal-close">
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
        
        <form @submit.prevent="handleInviteMember" class="invite-form">
          <div class="form-group">
            <label for="invitePseudo" class="form-label">Pseudo du joueur *</label>
            <input
              id="invitePseudo"
              v-model="inviteForm.pseudo"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': inviteErrors.pseudo }"
              placeholder="Entrez le pseudo du joueur à inviter"
              maxlength="50"
              required
            />
            <span v-if="inviteErrors.pseudo" class="form-error">{{ inviteErrors.pseudo }}</span>
          </div>

          <div class="form-group">
            <label for="inviteMessage" class="form-label">Message d'invitation (optionnel)</label>
            <textarea
              id="inviteMessage"
              v-model="inviteForm.message"
              class="form-textarea"
              placeholder="Ajouter un message personnel..."
              rows="3"
              maxlength="200"
            ></textarea>
            <small class="form-hint">{{ inviteForm.message?.length || 0 }}/200 caractères</small>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeInviteModal" class="cancel-btn">
              Annuler
            </button>
            <button type="submit" :disabled="isInviting" class="submit-btn">
              <FontAwesomeIcon v-if="isInviting" icon="spinner" spin />
              <FontAwesomeIcon v-else icon="paper-plane" />
              {{ isInviting ? 'Envoi...' : 'Envoyer l\'invitation' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import Sidebar from "~/components/Sidebar.vue"
import SearchBar from "~/components/SearchBar.vue"
import NotificationBell from "~/components/NotificationBell.vue"

// Store
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Configuration de la page
definePageMeta({
  middleware: 'auth',
  title: 'Équipe - SwiftPlays'
})

// État local
const showUserDropdown = ref(false)
const showEditModal = ref(false)
const showInviteModal = ref(false)
const isEditing = ref(false)
const isInviting = ref(false)

// Formulaire d'édition
const editForm = reactive({
  name: '',
  description: '',
  maxMembers: 5,
  isPublic: true
})

const editErrors = reactive({
  name: ''
})

// Formulaire d'invitation
const inviteForm = reactive({
  pseudo: '',
  message: ''
})

const inviteErrors = reactive({
  pseudo: ''
})

// Récupération des détails de l'équipe
const { data: teamData, pending, error, refresh } = await useFetch(`/api/teams/${route.params.id}`, {
  baseURL: useRuntimeConfig().public.apiBase,
  headers: {
    'Authorization': `Bearer ${useCookie('accessToken').value}`
  },
  transform: (response: any) => {
    if (response.success) {
      return response.data.team
    }
    throw new Error(response.message || 'Erreur lors de la récupération de l\'équipe')
  }
})

const team = computed(() => teamData.value)

// Initialiser le formulaire d'édition quand les données arrivent
watch(team, (newTeam) => {
  if (newTeam) {
    editForm.name = newTeam.name
    editForm.description = newTeam.description || ''
    editForm.maxMembers = newTeam.maxMembers
    editForm.isPublic = newTeam.isPublic
  }
}, { immediate: true })

// Gestion du dropdown utilisateur
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

const closeDropdown = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    showUserDropdown.value = false
  }
}

const handleLogout = async () => {
  showUserDropdown.value = false
  await authStore.logout()
  window.location.href = '/'
}

// Gestion des modals
const closeEditModal = () => {
  showEditModal.value = false
  editErrors.name = ''
  // Reset form to original values
  if (team.value) {
    editForm.name = team.value.name
    editForm.description = team.value.description || ''
    editForm.maxMembers = team.value.maxMembers
    editForm.isPublic = team.value.isPublic
  }
}

const closeInviteModal = () => {
  showInviteModal.value = false
  // Reset form
  inviteForm.pseudo = ''
  inviteForm.message = ''
  inviteErrors.pseudo = ''
}

// Modification d'équipe
const handleEditTeam = async () => {
  editErrors.name = ''
  
  if (!editForm.name.trim()) {
    editErrors.name = 'Le nom de l\'équipe est requis'
    return
  }
  
  if (editForm.name.trim().length < 3) {
    editErrors.name = 'Le nom doit contenir au moins 3 caractères'
    return
  }

  isEditing.value = true
  
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/teams/${route.params.id}`, {
      method: 'PUT',
      body: {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        maxMembers: editForm.maxMembers,
        isPublic: editForm.isPublic
      },
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    await refresh()
    closeEditModal()
    
  } catch (error: any) {
    console.error('Erreur modification équipe:', error)
    if (error.data?.message) {
      editErrors.name = error.data.message
    }
  } finally {
    isEditing.value = false
  }
}

// Invitation de membre
const handleInviteMember = async () => {
  inviteErrors.pseudo = ''
  
  if (!inviteForm.pseudo.trim()) {
    inviteErrors.pseudo = 'Le pseudo est requis'
    return
  }

  isInviting.value = true
  
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/teams/${route.params.id}/invite`, {
      method: 'POST',
      body: {
        pseudo: inviteForm.pseudo.trim(),
        message: inviteForm.message.trim() || null
      },
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    closeInviteModal()
    
    // Afficher un message de succès
    // TODO: Ajouter système de notifications toast
    
  } catch (error: any) {
    console.error('Erreur invitation:', error)
    if (error.data?.message) {
      inviteErrors.pseudo = error.data.message
    }
  } finally {
    isInviting.value = false
  }
}

// Actions sur les membres
const removeMember = async (member: any) => {
  if (!confirm(`Êtes-vous sûr de vouloir retirer ${member.pseudo} de l'équipe ?`)) {
    return
  }
  
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/teams/${route.params.id}/members/${member.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    await refresh()
    
  } catch (error: any) {
    console.error('Erreur suppression membre:', error)
    alert(error.data?.message || 'Erreur lors de la suppression du membre')
  }
}

// Dissolution d'équipe
const handleDissolveTeam = async () => {
  if (!confirm(`Êtes-vous sûr de vouloir dissoudre l'équipe "${team.value?.name}" ?\n\nCette action est irréversible et supprimera définitivement l'équipe.`)) {
    return
  }
  
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/teams/${route.params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    // Rediriger vers la page des équipes
    await navigateTo('/equipes')
    
  } catch (error: any) {
    console.error('Erreur dissolution équipe:', error)
    alert(error.data?.message || 'Erreur lors de la dissolution de l\'équipe')
  }
}

// Quitter l'équipe
const handleLeaveTeam = async () => {
  if (!confirm(`Êtes-vous sûr de vouloir quitter l'équipe "${team.value?.name}" ?`)) {
    return
  }
  
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/teams/${route.params.id}/leave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    // Rediriger vers la page des équipes
    await navigateTo('/equipes')
    
  } catch (error: any) {
    console.error('Erreur quitter équipe:', error)
    alert(error.data?.message || 'Erreur lors du départ de l\'équipe')
  }
}

// Utilitaires
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  })
}

const formatJoinDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'aujourd\'hui'
  if (diffDays < 7) return `il y a ${diffDays} jours`
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaines`
  if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`
  return `il y a ${Math.floor(diffDays / 365)} ans`
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 1rem;
}

.back-button:hover {
  background: rgba(59, 130, 214, 0.2);
}

.team-details {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  padding: 2rem;
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.team-header-info {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  flex: 1;
}

.team-avatar-large {
  position: relative;
  flex-shrink: 0;
}

.avatar-image-large, .avatar-fallback-large {
  width: 100px;
  height: 100px;
  border-radius: 20px;
}

.avatar-image-large {
  object-fit: cover;
  border: 3px solid rgba(59, 130, 214, 0.3);
}

.avatar-fallback-large {
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 2.5rem;
}

.captain-badge-large {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  background: #F59E0B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  border: 3px solid #1a1a1a;
}

.team-info {
  flex: 1;
}

.team-name-large {
  font-size: 2rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0 0 0.5rem 0;
}

.team-description {
  color: #9CA3AF;
  font-size: 1rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.team-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9CA3AF;
  font-size: 0.9rem;
}

.stat.private {
  color: #F59E0B;
}

.team-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.captain-actions, .member-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit-team-btn, .invite-member-btn, .dissolve-team-btn, .leave-team-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.edit-team-btn {
  background: rgba(107, 114, 128, 0.1);
  color: #9CA3AF;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.edit-team-btn:hover {
  background: rgba(107, 114, 128, 0.2);
  color: #F3F4F6;
}

.invite-member-btn {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
}

.invite-member-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
}

.dissolve-team-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.dissolve-team-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
}

.leave-team-btn {
  background: rgba(251, 146, 60, 0.1);
  color: #F59E0B;
  border: 1px solid rgba(251, 146, 60, 0.2);
}

.leave-team-btn:hover {
  background: rgba(251, 146, 60, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(251, 146, 60, 0.3);
}

.team-section {
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.1);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(17, 17, 17, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.1);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.member-card:hover {
  border-color: rgba(59, 130, 214, 0.3);
}

.member-avatar {
  position: relative;
  flex-shrink: 0;
}

.member-avatar-image, .member-avatar-fallback {
  width: 48px;
  height: 48px;
  border-radius: 12px;
}

.member-avatar-image {
  object-fit: cover;
  border: 2px solid rgba(59, 130, 214, 0.2);
}

.member-avatar-fallback {
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
}

.captain-badge-small {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: #F59E0B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
  border: 2px solid #1a1a1a;
}

.member-info {
  flex: 1;
}

.member-name {
  display: block;
  font-weight: 600;
  color: #F3F4F6;
  text-decoration: none;
  margin-bottom: 0.25rem;
  transition: color 0.2s ease;
}

.member-name:hover {
  color: #3B82D6;
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-role {
  font-size: 0.85rem;
  color: #9CA3AF;
  font-weight: 500;
}

.member-role.captain {
  color: #F59E0B;
}

.member-join-date {
  font-size: 0.8rem;
  color: #6B7280;
}

.member-actions {
  display: flex;
  gap: 0.5rem;
}

.remove-member-btn {
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-member-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.loading-icon, .error-icon {
  font-size: 3rem;
  color: #3B82D6;
}

.error-icon {
  color: #EF4444;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.error-message {
  color: #9CA3AF;
  margin: 0;
}

.back-to-teams-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3B82D6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-top: 1rem;
}

.back-to-teams-btn:hover {
  background: #2563EB;
  transform: translateY(-1px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.edit-team-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.invite-form {
  padding: 1.5rem;
  text-align: center;
}

.invite-description {
  color: #9CA3AF;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  color: #F3F4F6;
  font-weight: 600;
  font-size: 0.9rem;
}

.form-input, .form-textarea, .form-select {
  padding: 0.75rem;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 6px;
  color: #F3F4F6;
  transition: all 0.2s ease;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #3B82D6;
  box-shadow: 0 0 0 3px rgba(59, 130, 214, 0.1);
}

.form-input--error {
  border-color: #EF4444;
}

.form-error {
  color: #EF4444;
  font-size: 0.875rem;
}

.form-hint {
  color: #9CA3AF;
  font-size: 0.8rem;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9CA3AF;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid rgba(59, 130, 214, 0.1);
}

.cancel-btn, .submit-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
}

.cancel-btn {
  background: rgba(107, 114, 128, 0.1);
  color: #9CA3AF;
}

.cancel-btn:hover {
  background: rgba(107, 114, 128, 0.2);
  color: #F3F4F6;
}

.submit-btn {
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(59, 130, 214, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .team-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .team-header-info {
    flex-direction: column;
    text-align: center;
  }
  
  .team-actions {
    flex-direction: row;
    justify-content: center;
  }
  
  .members-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>