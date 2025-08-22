interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

let notifications = ref<Notification[]>([]);
let notificationIdCounter = 0;

export const useNotifications = () => {
  const addNotification = (message: string, type: Notification['type'] = 'info', duration: number = 5000) => {
    const id = `notification-${++notificationIdCounter}`;
    
    const notification: Notification = {
      id,
      message,
      type,
      duration
    };

    notifications.value.push(notification);

    // Auto-remove après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  };

  const clearAll = () => {
    notifications.value = [];
  };

  return {
    notifications: readonly(notifications),
    addNotification,
    removeNotification,
    clearAll
  };
};