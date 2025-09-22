import { ref, computed } from 'vue'
import { useAuth } from './useAuth'

const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)

export const useNotifications = () => {
  const { token } = useAuth()

  /**
   * Récupérer les notifications de l'utilisateur
   */
  const fetchNotifications = async (options = {}) => {
    try {
      loading.value = true
      
      const params = new URLSearchParams({
        page: options.page || currentPage.value,
        limit: options.limit || 20,
        unreadOnly: options.unreadOnly || false,
        ...(options.category && { category: options.category })
      })

      const response = await $fetch(`/api/notifications?${params}`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (response.success) {
        if (options.append) {
          notifications.value.push(...response.data)
        } else {
          notifications.value = response.data
        }
        
        if (response.pagination) {
          currentPage.value = response.pagination.page
          totalPages.value = response.pagination.pages
        }
      }
    } catch (error) {
      console.error('Erreur récupération notifications:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupérer le nombre de notifications non lues
   */
  const fetchUnreadCount = async () => {
    try {
      const response = await $fetch('/api/notifications/unread-count', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (response.success) {
        unreadCount.value = response.data.unreadCount
      }
    } catch (error) {
      console.error('Erreur comptage notifications:', error)
    }
  }

  /**
   * Marquer une notification comme lue
   */
  const markAsRead = async (notificationId) => {
    try {
      const response = await $fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (response.success) {
        // Mettre à jour localement
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification && !notification.isRead) {
          notification.isRead = true
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
      }
    } catch (error) {
      console.error('Erreur marquage notification:', error)
      throw error
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  const markAllAsRead = async () => {
    try {
      const response = await $fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (response.success) {
        // Mettre à jour localement
        notifications.value.forEach(notification => {
          notification.isRead = true
        })
        unreadCount.value = 0
      }
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error)
      throw error
    }
  }

  /**
   * Supprimer une notification
   */
  const deleteNotification = async (notificationId) => {
    try {
      const response = await $fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (response.success) {
        // Retirer de la liste locale
        const index = notifications.value.findIndex(n => n.id === notificationId)
        if (index !== -1) {
          const notification = notifications.value[index]
          if (!notification.isRead) {
            unreadCount.value = Math.max(0, unreadCount.value - 1)
          }
          notifications.value.splice(index, 1)
        }
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error)
      throw error
    }
  }

  /**
   * Récupérer les préférences de notification
   */
  const fetchNotificationSettings = async () => {
    try {
      const response = await $fetch('/api/notifications/settings', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur récupération préférences:', error)
      throw error
    }
  }

  /**
   * Mettre à jour les préférences de notification
   */
  const updateNotificationSettings = async (settings) => {
    try {
      const response = await $fetch('/api/notifications/settings', {
        method: 'PUT',
        body: settings,
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur mise à jour préférences:', error)
      throw error
    }
  }

  /**
   * Charger plus de notifications (pagination)
   */
  const loadMore = async () => {
    if (currentPage.value < totalPages.value) {
      await fetchNotifications({
        page: currentPage.value + 1,
        append: true
      })
    }
  }

  /**
   * Ajouter une notification en temps réel
   */
  const addNotification = (notification) => {
    notifications.value.unshift(notification)
    if (!notification.isRead) {
      unreadCount.value++
    }
  }

  // Computed properties
  const hasUnread = computed(() => unreadCount.value > 0)
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.isRead)
  )
  const hasMore = computed(() => currentPage.value < totalPages.value)

  // Formatters utilitaires
  const formatNotificationTime = (date) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffMs = now - notifDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}j`
    
    return notifDate.toLocaleDateString('fr-FR')
  }

  const getNotificationIcon = (type) => {
    const iconMap = {
      SYSTEM_WELCOME: 'mdi:hand-wave',
      TEAM_INVITATION: 'mdi:account-multiple-plus',
      CHALLENGE_CREATED: 'mdi:plus-circle',
      CHALLENGE_RECEIVED: 'mdi:sword-cross',
      CHALLENGE_ACCEPTED: 'mdi:check-circle',
      CHALLENGE_DECLINED: 'mdi:close-circle',
      MATCH_REMINDER: 'mdi:alarm',
      MATCH_RESULT_SUBMITTED: 'mdi:clipboard-text',
      MATCH_RESULT_CONFIRMED: 'mdi:trophy',
      ACHIEVEMENT_UNLOCKED: 'mdi:medal',
      ONBOARDING_GUIDE: 'mdi:compass'
    }
    return iconMap[type] || 'mdi:bell'
  }

  const getNotificationColor = (type, priority) => {
    if (priority === 'URGENT') return 'red'
    if (priority === 'HIGH') return 'orange'
    
    const colorMap = {
      SYSTEM_WELCOME: 'blue',
      TEAM_INVITATION: 'green',
      CHALLENGE_CREATED: 'blue',
      CHALLENGE_RECEIVED: 'purple',
      CHALLENGE_ACCEPTED: 'green',
      CHALLENGE_DECLINED: 'red',
      MATCH_REMINDER: 'yellow',
      MATCH_RESULT_SUBMITTED: 'orange',
      MATCH_RESULT_CONFIRMED: 'gold',
      ACHIEVEMENT_UNLOCKED: 'gold'
    }
    return colorMap[type] || 'gray'
  }

  return {
    // State
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    loading: readonly(loading),
    currentPage: readonly(currentPage),
    totalPages: readonly(totalPages),
    
    // Computed
    hasUnread,
    unreadNotifications,
    hasMore,
    
    // Methods
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotificationSettings,
    updateNotificationSettings,
    loadMore,
    addNotification,
    
    // Utilities
    formatNotificationTime,
    getNotificationIcon,
    getNotificationColor
  }
}