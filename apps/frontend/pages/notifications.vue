<template>
  <div class="dashboard-layout">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <AppHeader title="Notifications" />

      <!-- Page Content -->
      <main class="page-content">
        <div class="content-container">
          
          <!-- Header with actions -->
          <div class="notifications-header">
            <div class="notifications-header-info">
              <h2 class="section-title">Toutes les notifications</h2>
              <p class="section-subtitle">Gérez vos notifications système et d'équipes</p>
            </div>
            <div class="notifications-actions">
              <button 
                @click="showUnreadOnly = !showUnreadOnly"
                class="filter-btn"
                :class="{ active: showUnreadOnly }"
              >
                <FontAwesomeIcon icon="filter" />
                {{ showUnreadOnly ? 'Toutes' : 'Non lues seulement' }}
              </button>
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
            <span>Chargement de vos notifications...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-container">
            <FontAwesomeIcon icon="exclamation-triangle" class="error-icon" />
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">Impossible de charger vos notifications</p>
            <button @click="refresh" class="retry-button">
              <FontAwesomeIcon icon="refresh" />
              Réessayer
            </button>
          </div>

          <!-- Notifications List -->
          <div v-else-if="displayedNotifications.length > 0" class="notifications-list">
            <div 
              v-for="notification in displayedNotifications" 
              :key="notification.id"
              class="notification-card"
              :class="{ 'unread': !notification.isRead }"
              @click="handleNotificationClick(notification)"
            >
              
              <!-- Notification Icon -->
              <div class="notification-icon">
                <FontAwesomeIcon 
                  :icon="getNotificationIcon(notification.type)" 
                  :class="getNotificationIconClass(notification.type)"
                />
              </div>

              <!-- Notification Content -->
              <div class="notification-content">
                <div class="notification-header">
                  <h3 class="notification-title">{{ notification.title }}</h3>
                  <span class="notification-time">{{ formatDate(notification.createdAt) }}</span>
                </div>
                
                <p class="notification-message">{{ notification.message }}</p>
                
                <div v-if="notification.data" class="notification-data">
                  <!-- Données spécifiques selon le type -->
                  <div v-if="notification.type === 'TEAM_INVITATION'" class="invitation-data">
                    <span class="data-label">Équipe:</span>
                    <span class="data-value">{{ notification.data.teamName }}</span>
                  </div>
                  <div v-else-if="notification.data.teamName" class="team-data">
                    <span class="data-label">Équipe:</span>
                    <span class="data-value">{{ notification.data.teamName }}</span>
                  </div>
                </div>

                <!-- Actions spécifiques aux invitations d'équipe -->
                <div v-if="notification.type === 'TEAM_INVITATION' && !notification.isRead && notification.actions" class="invitation-actions">
                  <button 
                    v-for="action in notification.actions"
                    :key="action.id"
                    @click.stop="handleInvitationAction(notification, action)"
                    class="invitation-action-btn"
                    :class="action.type"
                    :disabled="isProcessingAction"
                  >
                    <FontAwesomeIcon v-if="isProcessingAction && processingActionId === `${notification.id}-${action.id}`" icon="spinner" spin />
                    <FontAwesomeIcon v-else-if="action.id === 'accept'" icon="check" />
                    <FontAwesomeIcon v-else-if="action.id === 'decline'" icon="times" />
                    {{ action.label }}
                  </button>
                </div>
              </div>

              <!-- Notification Actions -->
              <div class="notification-actions">
                <button 
                  v-if="!notification.isRead"
                  @click.stop="markAsRead(notification.id)"
                  class="mark-read-btn"
                  title="Marquer comme lu"
                >
                  <FontAwesomeIcon icon="check" />
                </button>
                <button 
                  @click.stop="deleteNotification(notification.id)"
                  class="delete-notification-btn"
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
            <FontAwesomeIcon icon="bell-slash" class="empty-icon" />
            <h3 class="empty-title">
              {{ showUnreadOnly ? 'Aucune notification non lue' : 'Aucune notification' }}
            </h3>
            <p class="empty-message">
              {{ showUnreadOnly 
                ? 'Toutes vos notifications ont été lues !'
                : 'Vous n\'avez aucune notification pour le moment.' 
              }}
            </p>
            <button v-if="showUnreadOnly" @click="showUnreadOnly = false" class="show-all-btn">
              <FontAwesomeIcon icon="list" />
              Voir toutes les notifications
            </button>
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
  title: 'Notifications - SwiftPlays'
})

// État local
const showUnreadOnly = ref(false)
const isMarkingRead = ref(false)
const isLoadingMore = ref(false)
const currentOffset = ref(0)
const itemsPerPage = 20

// État pour les actions d'invitation
const isProcessingAction = ref(false)
const processingActionId = ref('')

// Récupération des notifications
const { data: notificationsData, pending, error, refresh } = await useFetch('/api/notifications', {
  baseURL: useRuntimeConfig().public.apiBase,
  headers: {
    'Authorization': `Bearer ${useCookie('accessToken').value}`
  },
  query: computed(() => ({
    limit: itemsPerPage,
    offset: currentOffset.value,
    unreadOnly: showUnreadOnly.value
  })),
  transform: (response: any) => {
    if (response.success) {
      return response.data
    }
    throw new Error(response.message || 'Erreur lors de la récupération des notifications')
  },
  watch: [showUnreadOnly]
})

const notifications = computed(() => notificationsData.value?.notifications || [])
const unreadCount = computed(() => notificationsData.value?.unreadCount || 0)
const hasMore = computed(() => notifications.value.length >= itemsPerPage)

// Notifications affichées selon le filtre
const displayedNotifications = computed(() => {
  return notifications.value
})


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
    
    await refresh()
  } catch (error) {
    console.error('Erreur marquage notifications:', error)
  } finally {
    isMarkingRead.value = false
  }
}

// Marquer une notification comme lue
const markAsRead = async (notificationId: string) => {
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    await refresh()
  } catch (error) {
    console.error('Erreur marquage notification:', error)
  }
}

// Supprimer une notification
const deleteNotification = async (notificationId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
    return
  }
  
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${useCookie('accessToken').value}`
      }
    })
    
    await refresh()
  } catch (error) {
    console.error('Erreur suppression notification:', error)
  }
}

// Charger plus de notifications
const loadMore = async () => {
  isLoadingMore.value = true
  currentOffset.value += itemsPerPage
  // Note: Dans un vrai cas, on concatenerait les résultats
  // Ici on recharge juste avec le nouvel offset
  await refresh()
  isLoadingMore.value = false
}

// Gérer le clic sur une notification
const handleNotificationClick = async (notification: any) => {
  // Marquer comme lue si pas déjà lue
  if (!notification.isRead) {
    await markAsRead(notification.id)
  }

  // Navigation selon le type de notification
  if (notification.type === 'TEAM_INVITATION' && notification.data?.invitationId) {
    await navigateTo('/invitations')
  } else if (notification.data?.teamId) {
    await navigateTo(`/equipes/${notification.data.teamId}`)
  }
}

// Gérer les actions d'invitation (Accepter/Refuser)
const handleInvitationAction = async (notification: any, action: any) => {
  const actionId = `${notification.id}-${action.id}`
  
  if (isProcessingAction.value) return
  
  isProcessingAction.value = true
  processingActionId.value = actionId
  
  try {
    const config = useRuntimeConfig()
    const token = useCookie('accessToken')
    const teamId = notification.data?.teamId
    
    if (!teamId) {
      throw new Error('ID d\'équipe manquant')
    }
    
    let endpoint = ''
    let method = 'POST'
    
    if (action.payload?.action === 'accept_team_invitation') {
      endpoint = `${config.public.apiBase}/api/teams/invitations/${teamId}/accept`
    } else if (action.payload?.action === 'decline_team_invitation') {
      endpoint = `${config.public.apiBase}/api/teams/invitations/${teamId}/decline`
    } else {
      throw new Error('Action inconnue')
    }
    
    const response = await $fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      // Supprimer la notification après traitement
      await deleteNotification(notification.id)
      
      // Message de succès avec notification système
      const actionText = action.id === 'accept' ? 'acceptée' : 'refusée'
      const teamName = notification.data?.teamName || 'l\'équipe'
      
      if (action.id === 'accept') {
        // Message spécifique pour l'acceptation
        alert(`🎉 Vous avez rejoint l'équipe "${teamName}" !`)
        await navigateTo(`/equipe/${teamId}`)
      } else {
        // Message pour le refus
        alert(`Invitation de "${teamName}" refusée`)
      }
    }
  } catch (error: any) {
    console.error('Erreur action invitation:', error)
    alert(error.data?.message || `Erreur lors du traitement de l'invitation`)
  } finally {
    isProcessingAction.value = false
    processingActionId.value = ''
  }
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
.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  gap: 2rem;
}

.notifications-header-info {
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

.notifications-actions {
  display: flex;
  gap: 1rem;
}

.filter-btn, .mark-all-read-btn {
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
}

.filter-btn {
  background: rgba(107, 114, 128, 0.1);
  color: #9CA3AF;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.filter-btn:hover, .filter-btn.active {
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
  border-color: rgba(59, 130, 214, 0.2);
}

.mark-all-read-btn {
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

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-card {
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
}

.notification-card:hover {
  border-color: rgba(59, 130, 214, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.notification-card.unread {
  border-left: 4px solid #3B82D6;
  background: rgba(59, 130, 214, 0.03);
}

.notification-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
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

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.notification-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #F3F4F6;
  margin: 0;
}

.notification-time {
  color: #9CA3AF;
  font-size: 0.85rem;
  white-space: nowrap;
}

.notification-message {
  color: #9CA3AF;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.notification-data {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.invitation-data, .team-data {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(59, 130, 214, 0.05);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.data-label {
  color: #9CA3AF;
  font-size: 0.85rem;
}

.data-value {
  color: #3B82D6;
  font-weight: 500;
  font-size: 0.85rem;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Actions spécifiques aux invitations */
.invitation-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(59, 130, 214, 0.2);
}

.invitation-action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;

  &.success {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: white;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      transform: translateY(-1px);
    }
  }

  &.danger {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
    color: white;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      transform: translateY(-1px);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

.mark-read-btn, .delete-notification-btn {
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

.delete-notification-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.delete-notification-btn:hover {
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

.show-all-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
}

.show-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 214, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .notifications-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .notifications-actions {
    justify-content: stretch;
  }
  
  .filter-btn, .mark-all-read-btn {
    flex: 1;
    justify-content: center;
  }
  
  .notification-card {
    flex-direction: column;
    text-align: center;
  }
  
  .notification-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .notification-actions {
    flex-direction: row;
    justify-content: center;
  }
}
</style>