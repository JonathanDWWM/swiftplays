<template>
  <div class="notification-bell" ref="bellRef">
    <button @click="toggleDropdown" class="bell-button" title="Notifications">
      <FontAwesomeIcon icon="bell" class="bell-icon" />
      <span v-if="unreadCount > 0" class="notification-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown des notifications -->
    <div v-if="showDropdown" class="notification-dropdown" @click.stop>
      <div class="dropdown-header">
        <h3 class="dropdown-title">Notifications</h3>
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

      <!-- Notifications list -->
      <div v-else-if="notifications.length > 0" class="notifications-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 'unread': !notification.isRead }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <FontAwesomeIcon 
              :icon="getNotificationIcon(notification.type)" 
              :class="getNotificationIconClass(notification.type)"
            />
          </div>
          
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
          </div>

          <button 
            @click.stop="deleteNotification(notification.id)"
            class="delete-notification-btn"
            title="Supprimer"
          >
            <FontAwesomeIcon icon="times" />
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="dropdown-empty">
        <FontAwesomeIcon icon="bell-slash" class="empty-icon" />
        <span>Aucune notification</span>
      </div>

      <!-- Footer actions -->
      <div class="dropdown-footer">
        <NuxtLink to="/notifications" class="view-all-btn" @click="showDropdown = false">
          Voir toutes les notifications
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
const bellRef = ref<HTMLElement>()
const isMarkingRead = ref(false)
const refreshTimer = ref<NodeJS.Timeout>()

// Récupération du nombre de notifications non lues
const { data: unreadData, refresh: refreshUnreadCount } = await useFetch('/api/notifications/unread-count', {
  baseURL: useRuntimeConfig().public.apiBase,
  headers: {
    'Authorization': `Bearer ${useCookie('accessToken').value}`
  },
  transform: (response: any) => response.success ? response.data : { unreadCount: 0 },
  default: () => ({ unreadCount: 0 })
})

const unreadCount = computed(() => unreadData.value?.unreadCount || 0)

// Récupération des notifications récentes (uniquement quand le dropdown est ouvert)
const { data: notificationsData, pending, error, refresh: refreshNotifications } = await useLazyFetch('/api/notifications', {
  baseURL: useRuntimeConfig().public.apiBase,
  headers: {
    'Authorization': `Bearer ${useCookie('accessToken').value}`
  },
  query: {
    limit: 10
  },
  transform: (response: any) => response.success ? response.data : { notifications: [] },
  default: () => ({ notifications: [] })
})

const notifications = computed(() => notificationsData.value?.notifications || [])

// Toggle dropdown
const toggleDropdown = async () => {
  showDropdown.value = !showDropdown.value
  
  if (showDropdown.value && !notificationsData.value) {
    await refreshNotifications()
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  if (bellRef.value && !bellRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

// Marquer toutes les notifications comme lues
const markAllAsRead = async () => {
  if (isMarkingRead.value) return
  
  isMarkingRead.value = true
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/notifications/mark-all-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    await Promise.all([refreshUnreadCount(), refreshNotifications()])
  } catch (error) {
    console.error('Erreur marquage notifications:', error)
  } finally {
    isMarkingRead.value = false
  }
}

// Supprimer une notification
const deleteNotification = async (notificationId: string) => {
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    await Promise.all([refreshUnreadCount(), refreshNotifications()])
  } catch (error) {
    console.error('Erreur suppression notification:', error)
  }
}

// Gérer le clic sur une notification
const handleNotificationClick = async (notification: any) => {
  // Marquer comme lue si pas déjà lue
  if (!notification.isRead) {
    try {
      await $fetch(`${useRuntimeConfig().public.apiBase}/api/notifications/${notification.id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useCookie('accessToken').value}`
        }
      })
      
      await Promise.all([refreshUnreadCount(), refreshNotifications()])
    } catch (error) {
      console.error('Erreur marquage notification:', error)
    }
  }

  // Navigation selon le type de notification
  if (notification.type === 'TEAM_INVITATION' && notification.data?.invitationId) {
    await navigateTo('/invitations')
  } else if (notification.data?.teamId) {
    await navigateTo(`/equipes/${notification.data.teamId}`)
  }
  
  showDropdown.value = false
}

// Icône selon le type de notification
const getNotificationIcon = (type: string) => {
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
    default:
      return 'info-circle'
  }
}

// Classe CSS pour l'icône selon le type
const getNotificationIconClass = (type: string) => {
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
    default:
      return 'icon-info'
  }
}

// Formatage du temps
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffMinutes = Math.ceil(diffTime / (1000 * 60))
  
  if (diffMinutes < 1) return 'Maintenant'
  if (diffMinutes < 60) return `Il y a ${diffMinutes}min`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Il y a ${diffHours}h`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Il y a ${diffDays}j`
  
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
.notification-bell {
  position: relative;
}

.bell-button {
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

.bell-button:hover {
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
}

.bell-icon {
  font-size: 1.25rem;
}

.notification-badge {
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

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 380px;
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-height: 500px;
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

.notifications-list {
  flex: 1;
  overflow-y: auto;
  max-height: 320px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 0.75rem;
}

.notification-item:hover {
  background: rgba(59, 130, 214, 0.05);
}

.notification-item.unread {
  background: rgba(59, 130, 214, 0.03);
  border-left: 3px solid #3B82D6;
}

.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
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

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  color: #F3F4F6;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.notification-message {
  color: #9CA3AF;
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 0.25rem;
}

.notification-time {
  color: #6B7280;
  font-size: 0.75rem;
}

.delete-notification-btn {
  background: none;
  border: none;
  color: #6B7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0;
}

.notification-item:hover .delete-notification-btn {
  opacity: 1;
}

.delete-notification-btn:hover {
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
  .notification-dropdown {
    width: 320px;
    right: -50px;
  }
}
</style>