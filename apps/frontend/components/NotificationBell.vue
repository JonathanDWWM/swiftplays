<template>
  <div class="notification-bell">
    <button 
      @click="toggleDropdown" 
      class="bell-button"
      :class="{ active: isOpen }"
      :aria-label="`${unreadCount} notifications non lues`"
    >
      <Icon name="mdi:bell" class="bell-icon" />
      <span v-if="hasUnread" class="notification-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown des notifications -->
    <div v-if="isOpen" class="notification-dropdown" @click.stop>
      <div class="dropdown-header">
        <h3 class="dropdown-title">Notifications</h3>
        <div class="dropdown-actions">
          <button 
            v-if="hasUnread" 
            @click="markAllAsRead"
            class="mark-all-read-btn"
          >
            Tout lire
          </button>
          <NuxtLink to="/notifications" @click="closeDropdown" class="view-all-btn">
            Voir tout
          </NuxtLink>
        </div>
      </div>

      <div class="notifications-list">
        <!-- État de chargement -->
        <div v-if="loading" class="loading-state">
          <Icon name="mdi:loading" class="loading-icon" />
          <span>Chargement...</span>
        </div>

        <!-- Aucune notification -->
        <div v-else-if="notifications.length === 0" class="empty-state">
          <Icon name="mdi:bell-off" class="empty-icon" />
          <span>Aucune notification</span>
        </div>

        <!-- Liste des notifications -->
        <div v-else class="notification-items">
          <div 
            v-for="notification in displayedNotifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              <Icon 
                :name="getNotificationIcon(notification.type)" 
                :class="`icon-${getNotificationColor(notification.type, notification.priority)}`"
              />
            </div>
            
            <div class="notification-content">
              <h4 class="notification-title">{{ notification.title }}</h4>
              <p class="notification-message">{{ notification.content }}</p>
              <span class="notification-time">
                {{ formatNotificationTime(notification.createdAt) }}
              </span>
            </div>

            <div class="notification-actions">
              <button 
                v-if="!notification.isRead"
                @click.stop="markAsRead(notification.id)"
                class="mark-read-btn"
                title="Marquer comme lu"
              >
                <Icon name="mdi:check" />
              </button>
              <button 
                @click.stop="deleteNotification(notification.id)"
                class="delete-btn"
                title="Supprimer"
              >
                <Icon name="mdi:close" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="notifications.length > 5" class="dropdown-footer">
        <NuxtLink to="/notifications" @click="closeDropdown" class="view-all-link">
          Voir toutes les notifications ({{ unreadCount }})
          <Icon name="mdi:arrow-right" />
        </NuxtLink>
      </div>
    </div>

    <!-- Overlay pour fermer le dropdown -->
    <div v-if="isOpen" class="dropdown-overlay" @click="closeDropdown"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotifications } from '~/composables/useNotifications'

const { 
  notifications, 
  unreadCount, 
  loading, 
  hasUnread,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor
} = useNotifications()

const isOpen = ref(false)

// Afficher seulement les 5 dernières notifications dans le dropdown
const displayedNotifications = computed(() => 
  notifications.value.slice(0, 5)
)

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value
  
  if (isOpen.value && notifications.value.length === 0) {
    await fetchNotifications({ limit: 5 })
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

const handleNotificationClick = async (notification) => {
  // Marquer comme lu si pas encore lu
  if (!notification.isRead) {
    await markAsRead(notification.id)
  }

  // Navigation selon le type de notification
  if (notification.data?.url) {
    await navigateTo(notification.data.url)
  } else if (notification.type === 'TEAM_INVITATION') {
    await navigateTo('/invitations')
  } else if (notification.type.startsWith('CHALLENGE_')) {
    await navigateTo('/ladder')
  } else if (notification.type.startsWith('MATCH_')) {
    await navigateTo('/matches')
  }

  closeDropdown()
}

// Écouter les clics à l'extérieur pour fermer le dropdown
const handleClickOutside = (event) => {
  if (!event.target.closest('.notification-bell')) {
    closeDropdown()
  }
}

// Charger le compteur au montage
onMounted(async () => {
  await fetchUnreadCount()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Exposer la fonction refresh pour usage externe
defineExpose({
  refresh: fetchUnreadCount
})
</script>

<style scoped>
.notification-bell {
  position: relative;
  display: inline-block;
}

.bell-button {
  position: relative;
  background: none;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.bell-button:hover,
.bell-button.active {
  background: rgba(59, 130, 214, 0.1);
}

.bell-icon {
  font-size: 1.2rem;
  color: #9CA3AF;
}

.bell-button:hover .bell-icon,
.bell-button.active .bell-icon {
  color: #3B82D6;
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #EF4444;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 998;
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 380px;
  max-height: 500px;
  background: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(59, 130, 214, 0.2);
  z-index: 999;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.dropdown-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #F3F4F6;
  margin: 0;
}

.dropdown-actions {
  display: flex;
  gap: 8px;
}

.mark-all-read-btn,
.view-all-btn {
  font-size: 0.9rem;
  color: #3B82D6;
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
}

.mark-all-read-btn:hover,
.view-all-btn:hover {
  background: rgba(59, 130, 214, 0.1);
}

.notifications-list {
  max-height: 300px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: #6B7280;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 1.5rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(59, 130, 214, 0.05);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background: rgba(59, 130, 214, 0.05);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread {
  background: rgba(59, 130, 214, 0.05);
  border-left: 3px solid #3B82D6;
}

.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.icon-blue { color: #3B82D6; }
.icon-green { color: #10B981; }
.icon-purple { color: #8B5CF6; }
.icon-yellow { color: #F59E0B; }
.icon-red { color: #EF4444; }
.icon-gold { color: #FBBF24; }
.icon-gray { color: #6B7280; }

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #F3F4F6;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.notification-message {
  font-size: 0.85rem;
  color: #9CA3AF;
  margin: 0 0 6px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 0.75rem;
  color: #6B7280;
}

.notification-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

.mark-read-btn,
.delete-btn {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: #6B7280;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.mark-read-btn:hover {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.dropdown-footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(59, 130, 214, 0.1);
  background: rgba(26, 26, 26, 0.5);
}

.view-all-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #3B82D6;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.view-all-link:hover {
  color: #2563EB;
}

/* Responsive */
@media (max-width: 640px) {
  .notification-dropdown {
    width: calc(100vw - 20px);
    right: -140px;
  }
}
</style>