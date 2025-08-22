<template>
  <Teleport to="body">
    <div class="notification-container">
      <TransitionGroup name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification-toast', `notification-${notification.type}`]"
        >
          <div class="notification-content">
            <Icon 
              :name="getNotificationIcon(notification.type)" 
              class="notification-icon" 
            />
            <span class="notification-message">{{ notification.message }}</span>
          </div>
          <button 
            @click="removeNotification(notification.id)"
            class="notification-close"
          >
            <Icon name="mdi:close" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { notifications, removeNotification } = useNotifications()

const getNotificationIcon = (type: string) => {
  const icons = {
    success: 'mdi:check-circle',
    error: 'mdi:alert-circle',
    warning: 'mdi:alert',
    info: 'mdi:information'
  }
  return icons[type] || icons.info
}
</script>

<style scoped lang="scss">
.notification-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  pointer-events: none;
}

.notification-toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  min-width: 300px;
  pointer-events: auto;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  .notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;

    .notification-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .notification-message {
      font-weight: 500;
      line-height: 1.4;
    }
  }

  .notification-close {
    background: none;
    border: none;
    color: inherit;
    opacity: 0.7;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    margin-left: 1rem;
    flex-shrink: 0;
    transition: all 0.2s ease;

    &:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.1);
    }
  }

  // Types de notifications
  &.notification-success {
    background: rgba(16, 185, 129, 0.9);
    color: white;
    border-color: rgba(16, 185, 129, 0.3);

    .notification-icon {
      color: #ffffff;
    }
  }

  &.notification-error {
    background: rgba(239, 68, 68, 0.9);
    color: white;
    border-color: rgba(239, 68, 68, 0.3);

    .notification-icon {
      color: #ffffff;
    }
  }

  &.notification-warning {
    background: rgba(245, 158, 11, 0.9);
    color: white;
    border-color: rgba(245, 158, 11, 0.3);

    .notification-icon {
      color: #ffffff;
    }
  }

  &.notification-info {
    background: rgba(59, 130, 246, 0.9);
    color: white;
    border-color: rgba(59, 130, 246, 0.3);

    .notification-icon {
      color: #ffffff;
    }
  }
}

// Animations
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .notification-container {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
  }

  .notification-toast {
    min-width: auto;
    max-width: none;
  }
}
</style>