<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Nouvelle Conversation</h3>
        <button @click="$emit('close')" class="close-btn">
          <Icon name="mdi:close" />
        </button>
      </div>

      <div class="modal-body">
        <div class="conversation-types">
          <button 
            @click="selectedType = 'DIRECT'" 
            class="type-btn" 
            :class="{ active: selectedType === 'DIRECT' }"
          >
            <Icon name="mdi:account" />
            <span>Message Privé</span>
          </button>
          <button 
            @click="selectedType = 'TEAM'" 
            class="type-btn" 
            :class="{ active: selectedType === 'TEAM' }"
          >
            <Icon name="mdi:account-group" />
            <span>Chat Équipe</span>
          </button>
        </div>

        <!-- Message privé -->
        <div v-if="selectedType === 'DIRECT'" class="user-search">
          <h4>Rechercher un utilisateur</h4>
          <input 
            v-model="userSearch"
            type="text"
            placeholder="Pseudo de l'utilisateur..."
            class="search-input"
            @input="searchUsers"
          />

          <div v-if="searchResults.length > 0" class="search-results">
            <div 
              v-for="user in searchResults"
              :key="user.id"
              class="user-item"
              @click="selectUser(user)"
            >
              <div class="user-avatar">
                <img 
                  v-if="user.avatar" 
                  :src="user.avatar" 
                  :alt="user.pseudo"
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  {{ user.pseudo.charAt(0).toUpperCase() }}
                </div>
              </div>
              <span class="user-pseudo">{{ user.pseudo }}</span>
            </div>
          </div>

          <div v-if="selectedUser" class="selected-user">
            <h5>Utilisateur sélectionné:</h5>
            <div class="user-preview">
              <div class="user-avatar">
                <img 
                  v-if="selectedUser.avatar" 
                  :src="selectedUser.avatar" 
                  :alt="selectedUser.pseudo"
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  {{ selectedUser.pseudo.charAt(0).toUpperCase() }}
                </div>
              </div>
              <span>{{ selectedUser.pseudo }}</span>
            </div>
          </div>
        </div>

        <!-- Chat équipe -->
        <div v-if="selectedType === 'TEAM'" class="team-selection">
          <h4>Sélectionner une équipe</h4>
          <div v-if="userTeams.length > 0" class="teams-list">
            <div 
              v-for="team in userTeams"
              :key="team.id"
              class="team-item"
              :class="{ selected: selectedTeam?.id === team.id }"
              @click="selectedTeam = team"
            >
              <div class="team-avatar">
                <img 
                  v-if="team.avatar" 
                  :src="team.avatar" 
                  :alt="team.name"
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  <Icon name="mdi:account-group" />
                </div>
              </div>
              <div class="team-info">
                <span class="team-name">{{ team.name }}</span>
                <span class="team-game">{{ team.game }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-teams">
            <Icon name="mdi:account-group-outline" class="empty-icon" />
            <p>Vous n'avez pas d'équipes</p>
            <NuxtLink to="/equipes" class="create-team-link">Créer une équipe</NuxtLink>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="$emit('close')" class="btn-cancel">Annuler</button>
        <button 
          @click="createConversation" 
          class="btn-create" 
          :disabled="!canCreate"
        >
          <Icon v-if="isCreating" name="mdi:loading" class="spinning" />
          {{ isCreating ? 'Création...' : 'Créer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChat } from '~/composables/useChat'
import { useAuth } from '~/composables/useAuth'

interface User {
  id: string
  pseudo: string
  avatar?: string
}

interface Team {
  id: string
  name: string
  avatar?: string
  game: string
}

interface Emits {
  close: []
  created: [conversation: any]
}

const emit = defineEmits<Emits>()

const { token } = useAuth()
const { createDirectConversation, getTeamConversation } = useChat()

const selectedType = ref<'DIRECT' | 'TEAM'>('DIRECT')
const userSearch = ref('')
const searchResults = ref<User[]>([])
const selectedUser = ref<User | null>(null)
const userTeams = ref<Team[]>([])
const selectedTeam = ref<Team | null>(null)
const isCreating = ref(false)

let searchTimeout: NodeJS.Timeout

const canCreate = computed(() => {
  if (selectedType.value === 'DIRECT') {
    return selectedUser.value !== null
  } else {
    return selectedTeam.value !== null
  }
})

const searchUsers = async () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (userSearch.value.length < 2) {
    searchResults.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    try {
      const response = await $fetch<{ success: boolean, data: User[] }>(`/api/search/users?q=${encodeURIComponent(userSearch.value)}`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (response.success) {
        searchResults.value = response.data
      }
    } catch (error) {
      console.error('Erreur recherche utilisateurs:', error)
    }
  }, 300)
}

const selectUser = (user: User) => {
  selectedUser.value = user
  searchResults.value = []
  userSearch.value = user.pseudo
}

const loadUserTeams = async () => {
  try {
    const response = await $fetch<{ success: boolean, data: Team[] }>('/api/teams/my', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    if (response.success) {
      userTeams.value = response.data
    }
  } catch (error) {
    console.error('Erreur chargement équipes:', error)
  }
}

const createConversation = async () => {
  if (!canCreate.value) return

  try {
    isCreating.value = true
    let conversation

    if (selectedType.value === 'DIRECT' && selectedUser.value) {
      conversation = await createDirectConversation(selectedUser.value.id)
    } else if (selectedType.value === 'TEAM' && selectedTeam.value) {
      conversation = await getTeamConversation(selectedTeam.value.id)
    }

    if (conversation) {
      emit('created', conversation)
    }
  } catch (error) {
    console.error('Erreur création conversation:', error)
  } finally {
    isCreating.value = false
  }
}

onMounted(() => {
  loadUserTeams()
})
</script>

<style scoped>
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
  z-index: 10000;
}

.modal-content {
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.2);
}

.modal-header h3 {
  color: #F3F4F6;
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(59, 130, 214, 0.2);
  color: #3B82D6;
}

.modal-body {
  padding: 1.5rem;
}

.conversation-types {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #111111;
  border: 2px solid rgba(59, 130, 214, 0.2);
  border-radius: 12px;
  color: #9CA3AF;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-btn:hover {
  border-color: rgba(59, 130, 214, 0.5);
  color: #3B82D6;
}

.type-btn.active {
  border-color: #3B82D6;
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
}

.type-btn svg {
  font-size: 1.5rem;
}

.user-search h4,
.team-selection h4 {
  color: #F3F4F6;
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #111111;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 8px;
  color: #F3F4F6;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #3B82D6;
}

.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.user-item,
.team-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.user-item:hover,
.team-item:hover {
  background: rgba(59, 130, 214, 0.1);
}

.user-item:last-child,
.team-item:last-child {
  border-bottom: none;
}

.team-item.selected {
  background: rgba(59, 130, 214, 0.2);
}

.user-avatar,
.team-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3B82D6;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-pseudo {
  color: #F3F4F6;
  font-weight: 500;
}

.team-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.team-name {
  color: #F3F4F6;
  font-weight: 600;
}

.team-game {
  color: #9CA3AF;
  font-size: 0.85rem;
}

.selected-user {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(59, 130, 214, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 214, 0.3);
}

.selected-user h5 {
  color: #3B82D6;
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
}

.user-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.teams-list {
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 8px;
  overflow: hidden;
}

.no-teams {
  text-align: center;
  padding: 2rem;
  color: #6B7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.create-team-link {
  color: #3B82D6;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.create-team-link:hover {
  text-decoration: underline;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid rgba(59, 130, 214, 0.2);
}

.btn-cancel,
.btn-create {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: transparent;
  color: #9CA3AF;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.btn-cancel:hover {
  background: rgba(156, 163, 175, 0.1);
  color: #F3F4F6;
}

.btn-create {
  background: linear-gradient(135deg, #3B82D6, #2563EB);
  color: white;
}

.btn-create:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563EB, #1D4ED8);
}

.btn-create:disabled {
  background: #374151;
  color: #6B7280;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>