<template>
  <div class="message-center" ref="centerRef">
    <button @click="toggleDropdown" class="message-button" title="Messages">
      <FontAwesomeIcon icon="envelope" class="message-icon" />
      <span v-if="unreadCount > 0" class="message-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown des messages -->
    <div v-if="showDropdown" class="message-dropdown" @click.stop>
      <div class="dropdown-header">
        <h3 class="dropdown-title">Messages</h3>
        <div class="dropdown-actions">
          <button 
            v-if="unreadCount > 0" 
            @click="markAllAsRead" 
            class="mark-all-read-btn"
            :disabled="isMarkingRead"
          >
            <FontAwesomeIcon v-if="isMarkingRead" icon="spinner" spin />
            <span v-else>Tout marquer</span>
          </button>
        </div>
      </div>

      <!-- Filtres par catégorie -->
      <div class="category-filters">
        <button 
          v-for="category in categories" 
          :key="category.key"
          @click="selectedCategory = category.key"
          class="category-btn"
          :class="{ active: selectedCategory === category.key }"
        >
          <FontAwesomeIcon :icon="category.icon" />
          {{ category.label }}
          <span v-if="category.count > 0" class="category-count">{{ category.count }}</span>
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="pending" class="dropdown-loading">
        <FontAwesomeIcon icon="spinner" spin />
        <span>Chargement...</span>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="dropdown-error">
        <FontAwesomeIcon icon="exclamation-triangle" />
        <span>Erreur de chargement</span>
      </div>

      <!-- Messages list -->
      <div v-else-if="filteredMessages.length > 0" class="messages-list">
        <div 
          v-for="message in filteredMessages" 
          :key="message.id"
          class="message-item"
          :class="{ 
            'unread': !message.isRead,
            'high-priority': message.priority === 'HIGH',
            'urgent': message.priority === 'URGENT'
          }"
          @click="handleMessageClick(message)"
        >
          <div class="message-icon-wrapper">
            <FontAwesomeIcon 
              :icon="getMessageIcon(message.type)" 
              :class="getMessageIconClass(message.type)"
            />
            <span v-if="message.priority === 'URGENT'" class="priority-indicator urgent">!</span>
            <span v-else-if="message.priority === 'HIGH'" class="priority-indicator high">•</span>
          </div>
          
          <div class="message-content">
            <div class="message-header">
              <div class="message-title">{{ message.title }}</div>
              <div class="message-time">{{ formatTime(message.createdAt) }}</div>
            </div>
            <div class="message-text">{{ message.content }}</div>
            
            <!-- Sender info -->
            <div v-if="message.sender" class="message-sender">
              <img 
                v-if="message.sender.avatar" 
                :src="message.sender.avatar" 
                :alt="message.sender.pseudo"
                class="sender-avatar"
              />
              <span class="sender-name">{{ message.sender.pseudo }}</span>
            </div>

            <!-- Actions pour les invitations -->
            <div v-if="message.actions && message.actions.length > 0" class="message-actions">
              <button
                v-for="action in message.actions"
                :key="action.id"
                @click.stop="executeAction(message, action)"
                :disabled="isExecutingAction"
                class="action-btn"
                :class="action.type"
              >
                <FontAwesomeIcon v-if="isExecutingAction" icon="spinner" spin />
                <FontAwesomeIcon v-else :icon="getActionIcon(action.id)" />
                {{ action.label }}
              </button>
            </div>
          </div>

          <button 
            @click.stop="deleteMessage(message.id)"
            class="delete-message-btn"
            title="Supprimer"
          >
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="dropdown-empty">
        <FontAwesomeIcon :icon="getEmptyStateIcon()" class="empty-icon" />
        <span>{{ getEmptyStateText() }}</span>
      </div>

      <!-- Footer -->
      <div class="dropdown-footer">
        <NuxtLink to="/messages" class="view-all-btn" @click="showDropdown = false">
          Voir tous les messages
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

// Props
interface Props {
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  refreshInterval: 30000 // 30 secondes par défaut
})

// State
const showDropdown = ref(false)
const centerRef = ref<HTMLElement>()
const isMarkingRead = ref(false)
const isExecutingAction = ref(false)
const selectedCategory = ref('all')
const refreshTimer = ref<NodeJS.Timeout>()

// Categories
const categories = ref([
  { key: 'all', label: 'Tous', icon: 'envelope', count: 0 },
  { key: 'INVITATION', label: 'Invitations', icon: 'user-plus', count: 0 },
  { key: 'NOTIFICATION', label: 'Notifications', icon: 'bell', count: 0 },
  { key: 'SYSTEM', label: 'Système', icon: 'cog', count: 0 }
])

// Récupération du nombre de messages non lus
const { data: unreadData, refresh: refreshUnreadCount } = await useFetch('/api/messages/unread-count', {
  baseURL: useRuntimeConfig().public.apiBase,
  headers: {
    'Authorization': `Bearer ${useCookie('accessToken').value}`
  },
  transform: (response: any) => response.success ? response.data : { unreadCount: 0 },
  default: () => ({ unreadCount: 0 })
})

const unreadCount = computed(() => unreadData.value?.unreadCount || 0)

// Récupération des messages récents (uniquement quand le dropdown est ouvert)
const { data: messagesData, pending, error, refresh: refreshMessages } = await useLazyFetch('/api/messages', {
  baseURL: useRuntimeConfig().public.apiBase,
  headers: {
    'Authorization': `Bearer ${useCookie('accessToken').value}`
  },
  query: {
    limit: 15
  },
  transform: (response: any) => response.success ? response.data : { messages: [] },
  default: () => ({ messages: [] })
})

const messages = computed(() => messagesData.value?.messages || [])

// Messages filtrés par catégorie
const filteredMessages = computed(() => {
  if (selectedCategory.value === 'all') {
    return messages.value
  }
  return messages.value.filter((msg: any) => msg.category === selectedCategory.value)
})

// Mise à jour des compteurs par catégorie
const updateCategoryCounts = () => {
  categories.value.forEach(cat => {
    if (cat.key === 'all') {
      cat.count = unreadCount.value
    } else {
      cat.count = messages.value.filter((msg: any) => 
        msg.category === cat.key && !msg.isRead
      ).length
    }
  })
}

// Toggle dropdown
const toggleDropdown = async () => {
  showDropdown.value = !showDropdown.value
  
  if (showDropdown.value && !messagesData.value) {
    await refreshMessages()
  }
  
  if (showDropdown.value) {
    updateCategoryCounts()
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  if (centerRef.value && !centerRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

// Marquer tous les messages comme lus
const markAllAsRead = async () => {
  if (isMarkingRead.value) return
  
  isMarkingRead.value = true
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/messages/mark-all-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    await Promise.all([refreshUnreadCount(), refreshMessages()])
    updateCategoryCounts()
  } catch (error) {
    console.error('Erreur marquage messages:', error)
  } finally {
    isMarkingRead.value = false
  }
}

// Supprimer un message
const deleteMessage = async (messageId: string) => {
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    await Promise.all([refreshUnreadCount(), refreshMessages()])
    updateCategoryCounts()
  } catch (error) {
    console.error('Erreur suppression message:', error)
  }
}

// Gérer le clic sur un message
const handleMessageClick = async (message: any) => {
  // Marquer comme lu si pas déjà lu
  if (!message.isRead) {
    try {
      await $fetch(`${useRuntimeConfig().public.apiBase}/api/messages/${message.id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useCookie('accessToken').value}`
        }
      })
      
      await Promise.all([refreshUnreadCount(), refreshMessages()])
      updateCategoryCounts()
    } catch (error) {
      console.error('Erreur marquage message:', error)
    }
  }

  // Navigation selon le type de message
  if (message.data?.teamId && message.category !== 'INVITATION') {
    await navigateTo(`/equipes/${message.data.teamId}`)
    showDropdown.value = false
  }
}

// Exécuter une action (accepter/refuser invitation, etc.)
const executeAction = async (message: any, action: any) => {
  if (isExecutingAction.value) return
  
  isExecutingAction.value = true
  try {
    const response = await $fetch(`${useRuntimeConfig().public.apiBase}/api/messages/${message.id}/action`, {
      method: 'POST',
      body: action.payload,
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    await Promise.all([refreshUnreadCount(), refreshMessages()])
    updateCategoryCounts()
    
    // Navigation si acceptation d'invitation
    if (action.id === 'accept' && response.data?.teamId) {
      await navigateTo(`/equipes/${response.data.teamId}`)
      showDropdown.value = false
    }
    
  } catch (error: any) {
    console.error('Erreur action message:', error)
    alert(error.data?.message || 'Erreur lors de l\'exécution de l\'action')
  } finally {
    isExecutingAction.value = false
  }
}

// Icône selon le type de message
const getMessageIcon = (type: string) => {
  switch (type) {
    case 'TEAM_INVITATION':
      return 'user-plus'
    case 'TEAM_INVITATION_ACCEPTED':
      return 'check-circle'
    case 'TEAM_INVITATION_DECLINED':
      return 'times-circle'
    case 'TEAM_MEMBER_JOINED':
      return 'users'
    case 'TEAM_MEMBER_LEFT':
      return 'user-minus'
    case 'TEAM_DISSOLVED':
      return 'exclamation-triangle'
    case 'SYSTEM_WELCOME':
      return 'star'
    default:
      return 'info-circle'
  }
}

// Classe CSS pour l'icône selon le type
const getMessageIconClass = (type: string) => {
  switch (type) {
    case 'TEAM_INVITATION':
      return 'icon-invitation'
    case 'TEAM_INVITATION_ACCEPTED':
      return 'icon-success'
    case 'TEAM_INVITATION_DECLINED':
      return 'icon-error'
    case 'TEAM_MEMBER_JOINED':
      return 'icon-info'
    case 'TEAM_MEMBER_LEFT':
      return 'icon-warning'
    case 'TEAM_DISSOLVED':
      return 'icon-error'
    case 'SYSTEM_WELCOME':
      return 'icon-star'
    default:
      return 'icon-info'
  }
}

// Icône pour les actions
const getActionIcon = (actionId: string) => {
  switch (actionId) {
    case 'accept':
      return 'check'
    case 'decline':
      return 'times'
    default:
      return 'arrow-right'
  }
}

// Empty state
const getEmptyStateIcon = () => {
  switch (selectedCategory.value) {
    case 'INVITATION':
      return 'envelope-open'
    case 'SYSTEM':
      return 'cog'
    default:
      return 'envelope-open'
  }
}

const getEmptyStateText = () => {
  switch (selectedCategory.value) {
    case 'INVITATION':
      return 'Aucune invitation'
    case 'NOTIFICATION':
      return 'Aucune notification'
    case 'SYSTEM':
      return 'Aucun message système'
    default:
      return 'Aucun message'
  }
}

// Formatage du temps
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffMinutes = Math.ceil(diffTime / (1000 * 60))
  
  if (diffMinutes < 1) return 'Maintenant'
  if (diffMinutes < 60) return `${diffMinutes}min`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}j`
  
  return date.toLocaleDateString('fr-FR')
}

// Auto-refresh
const startAutoRefresh = () => {
  refreshTimer.value = setInterval(() => {
    refreshUnreadCount()
  }, props.refreshInterval)
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  startAutoRefresh()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  stopAutoRefresh()
})

// Exposer la fonction de refresh pour usage externe
defineExpose({
  refresh: refreshUnreadCount
})
</script>

<style scoped>
.message-center {
  position: relative;
}

.message-button {
  position: relative;
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-button:hover {
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
}

.message-icon {
  font-size: 1.25rem;
}

.message-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #EF4444;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid #1a1a1a;
}

.message-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 420px;
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.dropdown-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #F3F4F6;
  margin: 0;
}

.mark-all-read-btn {
  background: none;
  border: none;
  color: #3B82D6;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.mark-all-read-btn:hover:not(:disabled) {
  background: rgba(59, 130, 214, 0.1);
}

.mark-all-read-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-filters {
  display: flex;
  padding: 0.75rem;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
  overflow-x: auto;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(59, 130, 214, 0.05);
  border: 1px solid rgba(59, 130, 214, 0.1);
  color: #9CA3AF;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 0.85rem;
}

.category-btn:hover,
.category-btn.active {
  background: rgba(59, 130, 214, 0.15);
  color: #3B82D6;
  border-color: rgba(59, 130, 214, 0.3);
}

.category-count {
  background: #3B82D6;
  color: white;
  border-radius: 10px;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.dropdown-loading, .dropdown-error, .dropdown-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #9CA3AF;
  gap: 0.5rem;
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.5;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 0.75rem;
  position: relative;
}

.message-item:hover {
  background: rgba(59, 130, 214, 0.05);
}

.message-item.unread {
  background: rgba(59, 130, 214, 0.03);
  border-left: 3px solid #3B82D6;
}

.message-item.high-priority {
  border-left-color: #F59E0B;
}

.message-item.urgent {
  border-left-color: #EF4444;
  background: rgba(239, 68, 68, 0.02);
}

.message-icon-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.priority-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  color: white;
}

.priority-indicator.high {
  background: #F59E0B;
}

.priority-indicator.urgent {
  background: #EF4444;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.icon-invitation {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.icon-success {
  background: rgba(34, 197, 94, 0.1);
  color: #22C55E;
}

.icon-error {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.icon-warning {
  background: rgba(251, 146, 60, 0.1);
  color: #FB923C;
}

.icon-info {
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
}

.icon-star {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.25rem;
}

.message-title {
  font-weight: 600;
  color: #F3F4F6;
  font-size: 0.9rem;
}

.message-time {
  color: #6B7280;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.message-text {
  color: #9CA3AF;
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.message-sender {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.sender-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.sender-name {
  color: #6B7280;
  font-size: 0.8rem;
  font-weight: 500;
}

.message-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.success {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
}

.action-btn.success:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.action-btn.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.action-btn.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.delete-message-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  color: #6B7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0;
  font-size: 0.8rem;
}

.message-item:hover .delete-message-btn {
  opacity: 1;
}

.delete-message-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.dropdown-footer {
  padding: 1rem;
  border-top: 1px solid rgba(59, 130, 214, 0.1);
}

.view-all-btn {
  display: block;
  text-align: center;
  color: #3B82D6;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.view-all-btn:hover {
  background: rgba(59, 130, 214, 0.1);
}

/* Responsive */
@media (max-width: 480px) {
  .message-dropdown {
    width: 350px;
    right: -30px;
  }
  
  .category-filters {
    padding: 0.5rem;
  }
  
  .message-actions {
    flex-direction: column;
  }
}
</style>