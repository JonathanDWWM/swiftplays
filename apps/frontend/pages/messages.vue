<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader title="Messages" />

      <!-- Page Content -->
      <main class="page-content">
        <div class="content-container">
          
          <!-- Header with actions -->
          <div class="messages-header">
            <div class="messages-header-info">
              <h2 class="section-title">Tous les messages</h2>
              <p class="section-subtitle">Consultez tous vos messages, invitations et notifications</p>
            </div>
            <div class="messages-actions">
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
              <button 
                v-if="unreadCount > 0" 
                @click="markAllAsRead"
                class="mark-all-read-btn"
                :disabled="isMarkingRead"
              >
                <FontAwesomeIcon v-if="isMarkingRead" icon="spinner" spin />
                <FontAwesomeIcon v-else icon="check-double" />
                Tout marquer lu
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="pending" class="loading-container">
            <FontAwesomeIcon icon="spinner" spin class="loading-icon" />
            <span>Chargement de vos messages...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-container">
            <FontAwesomeIcon icon="exclamation-triangle" class="error-icon" />
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">Impossible de charger vos messages</p>
            <button @click="refresh" class="retry-button">
              <FontAwesomeIcon icon="refresh" />
              Réessayer
            </button>
          </div>

          <!-- Messages List -->
          <div v-else-if="filteredMessages.length > 0" class="messages-list">
            <div 
              v-for="message in filteredMessages" 
              :key="message.id"
              class="message-card"
              :class="{ 
                'unread': !message.isRead,
                'high-priority': message.priority === 'HIGH',
                'urgent': message.priority === 'URGENT'
              }"
              @click="handleMessageClick(message)"
            >
              
              <!-- Message Icon -->
              <div class="message-icon">
                <FontAwesomeIcon 
                  :icon="getMessageIcon(message.type)" 
                  :class="getMessageIconClass(message.type)"
                />
                <span v-if="message.priority === 'URGENT'" class="priority-indicator urgent">!</span>
                <span v-else-if="message.priority === 'HIGH'" class="priority-indicator high">•</span>
              </div>

              <!-- Message Content -->
              <div class="message-content">
                <div class="message-header">
                  <h3 class="message-title">{{ message.title }}</h3>
                  <span class="message-time">{{ formatDate(message.createdAt) }}</span>
                </div>
                
                <p class="message-text">{{ message.content }}</p>
                
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

              <!-- Message Actions -->
              <div class="message-card-actions">
                <button 
                  v-if="!message.isRead"
                  @click.stop="markAsRead(message.id)"
                  class="mark-read-btn"
                  title="Marquer comme lu"
                >
                  <FontAwesomeIcon icon="check" />
                </button>
                <button 
                  @click.stop="deleteMessage(message.id)"
                  class="delete-message-btn"
                  title="Supprimer"
                >
                  <FontAwesomeIcon icon="trash" />
                </button>
              </div>
            </div>

            <!-- Load More Button -->
            <div v-if="hasMore" class="load-more-container">
              <button @click="loadMore" class="load-more-btn" :disabled="isLoadingMore">
                <FontAwesomeIcon v-if="isLoadingMore" icon="spinner" spin />
                <FontAwesomeIcon v-else icon="chevron-down" />
                {{ isLoadingMore ? 'Chargement...' : 'Charger plus' }}
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <FontAwesomeIcon :icon="getEmptyStateIcon()" class="empty-icon" />
            <h3 class="empty-title">{{ getEmptyStateText() }}</h3>
            <p class="empty-message">
              {{ getEmptyStateDescription() }}
            </p>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import Sidebar from "~/components/Sidebar.vue"
import AppHeader from "~/components/AppHeader.vue"

// Store
const authStore = useAuthStore()

// Configuration de la page
definePageMeta({
  middleware: 'auth',
  title: 'Messages - SwiftPlays'
})

// État local
const isMarkingRead = ref(false)
const isExecutingAction = ref(false)
const isLoadingMore = ref(false)
const selectedCategory = ref('all')
const currentOffset = ref(0)
const itemsPerPage = 50

// Categories
const categories = ref([
  { key: 'all', label: 'Tous', icon: 'envelope', count: 0 },
  { key: 'INVITATION', label: 'Invitations', icon: 'user-plus', count: 0 },
  { key: 'NOTIFICATION', label: 'Notifications', icon: 'bell', count: 0 },
  { key: 'SYSTEM', label: 'Système', icon: 'cog', count: 0 }
])

// Récupération des messages
const { data: messagesData, pending, error, refresh } = await useFetch('/api/messages', {
  baseURL: useRuntimeConfig().public.apiBase,
  headers: {
    'Authorization': `Bearer ${useCookie('accessToken').value}`
  },
  query: computed(() => ({
    limit: itemsPerPage,
    offset: currentOffset.value
  })),
  transform: (response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || 'Erreur lors de la récupération des messages')
  }
})

const messages = computed(() => messagesData.value?.messages || [])
const unreadCount = computed(() => messagesData.value?.unreadCount || 0)
const hasMore = computed(() => messages.value.length >= itemsPerPage)

// Messages filtrés par catégorie
const filteredMessages = computed(() => {
  updateCategoryCounts()
  
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
    
    await refresh()
  } catch (error) {
    console.error('Erreur marquage messages:', error)
  } finally {
    isMarkingRead.value = false
  }
}

// Marquer un message comme lu
const markAsRead = async (messageId: string) => {
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/messages/${messageId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    await refresh()
  } catch (error) {
    console.error('Erreur marquage message:', error)
  }
}

// Supprimer un message
const deleteMessage = async (messageId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
    return
  }
  
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    await refresh()
  } catch (error) {
    console.error('Erreur suppression message:', error)
  }
}

// Charger plus de messages
const loadMore = async () => {
  isLoadingMore.value = true
  currentOffset.value += itemsPerPage
  await refresh()
  isLoadingMore.value = false
}

// Gérer le clic sur un message
const handleMessageClick = async (message: any) => {
  // Marquer comme lu si pas déjà lu
  if (!message.isRead) {
    await markAsRead(message.id)
  }

  // Navigation selon le type de message
  if (message.data?.teamId && message.category !== 'INVITATION') {
    await navigateTo(`/equipes/${message.data.teamId}`)
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
    
    await refresh()
    
    // Navigation si acceptation d'invitation
    if (action.id === 'accept' && response.data?.teamId) {
      await navigateTo(`/equipes/${response.data.teamId}`)
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
    case 'NOTIFICATION':
      return 'bell-slash'
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

const getEmptyStateDescription = () => {
  switch (selectedCategory.value) {
    case 'INVITATION':
      return 'Vous n\'avez reçu aucune invitation d\'équipe pour le moment.'
    case 'NOTIFICATION':
      return 'Aucune notification n\'a été reçue.'
    case 'SYSTEM':
      return 'Aucun message système n\'a été envoyé.'
    default:
      return 'Votre boîte de messages est vide pour le moment.'
  }
}

// Formatage du temps
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
})
</script>

<style scoped>
.messages-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  gap: 2rem;
}

.messages-header-info {
  flex: 1;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  color: #9CA3AF;
  margin: 0;
}

.messages-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-end;
}

.category-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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

.mark-all-read-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  white-space: nowrap;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
}

.mark-all-read-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
}

.mark-all-read-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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

.retry-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: #DC2626;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.message-card:hover {
  border-color: rgba(59, 130, 214, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.message-card.unread {
  border-left: 4px solid #3B82D6;
  background: rgba(59, 130, 214, 0.03);
}

.message-card.high-priority {
  border-left-color: #F59E0B;
}

.message-card.urgent {
  border-left-color: #EF4444;
  background: rgba(239, 68, 68, 0.02);
}

.message-icon {
  position: relative;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.priority-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
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
  margin-bottom: 0.5rem;
}

.message-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #F3F4F6;
  margin: 0;
}

.message-time {
  color: #9CA3AF;
  font-size: 0.85rem;
  white-space: nowrap;
}

.message-text {
  color: #9CA3AF;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.message-sender {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.sender-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.sender-name {
  color: #6B7280;
  font-size: 0.9rem;
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

.message-card-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mark-read-btn, .delete-message-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mark-read-btn {
  background: rgba(34, 197, 94, 0.1);
  color: #22C55E;
}

.mark-read-btn:hover {
  background: rgba(34, 197, 94, 0.2);
}

.delete-message-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.delete-message-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover:not(:disabled) {
  background: rgba(59, 130, 214, 0.2);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.empty-icon {
  font-size: 4rem;
  color: #6B7280;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.empty-message {
  color: #9CA3AF;
  margin: 0;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 768px) {
  .messages-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .messages-actions {
    align-items: stretch;
  }
  
  .category-filters {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
  
  .mark-all-read-btn {
    justify-content: center;
  }
  
  .message-card {
    flex-direction: column;
    text-align: center;
  }
  
  .message-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .message-actions {
    flex-direction: column;
  }
  
  .message-card-actions {
    flex-direction: row;
    justify-content: center;
  }
}
</style>