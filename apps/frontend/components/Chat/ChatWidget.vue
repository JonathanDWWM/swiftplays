<template>
  <div class="chat-widget" :class="{ 'is-minimized': isMinimized, 'is-expanded': isExpanded }">
    <!-- Header du widget -->
    <div class="chat-header" @click="toggleWidget">
      <div class="chat-title">
        <Icon name="mdi:chat" class="chat-icon" />
        <span>Chat</span>
        <div v-if="totalUnreadMessages > 0" class="unread-badge">
          {{ totalUnreadMessages }}
        </div>
      </div>
      <div class="chat-controls">
        <button 
          v-if="!isMinimized" 
          @click.stop="toggleExpand"
          class="control-btn"
          :title="isExpanded ? 'Réduire' : 'Agrandir'"
        >
          <Icon :name="isExpanded ? 'mdi:window-minimize' : 'mdi:window-maximize'" />
        </button>
        <button @click.stop="toggleMinimize" class="control-btn" :title="isMinimized ? 'Ouvrir' : 'Réduire'">
          <Icon :name="isMinimized ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
        </button>
      </div>
    </div>

    <!-- Contenu du chat -->
    <div v-show="!isMinimized" class="chat-body">
      <!-- Liste des conversations (sidebar) -->
      <div class="conversations-sidebar" :class="{ 'is-hidden': currentConversation }">
        <div class="conversations-header">
          <h3>Conversations</h3>
          <button @click="showNewConversationModal = true" class="new-conversation-btn" title="Nouvelle conversation">
            <Icon name="mdi:plus" />
          </button>
        </div>

        <!-- Recherche de conversations -->
        <div class="conversation-search">
          <input 
            v-model="conversationFilter"
            type="text"
            placeholder="Rechercher..."
            class="search-input"
          />
        </div>

        <!-- Liste des conversations filtrées -->
        <div class="conversations-list">
          <div 
            v-for="conversation in filteredConversations" 
            :key="conversation.id"
            class="conversation-item"
            :class="{ 'is-active': currentConversation?.id === conversation.id }"
            @click="selectConversation(conversation)"
          >
            <div class="conversation-avatar">
              <img 
                v-if="getConversationAvatar(conversation)" 
                :src="getConversationAvatar(conversation)" 
                :alt="getConversationTitle(conversation)"
                class="avatar-img"
              />
              <div v-else class="avatar-placeholder">
                <Icon :name="conversation.type === 'TEAM' ? 'mdi:account-group' : 'mdi:account'" />
              </div>
            </div>

            <div class="conversation-content">
              <div class="conversation-header-row">
                <h4 class="conversation-title">{{ getConversationTitle(conversation) }}</h4>
                <span v-if="conversation.lastMessage" class="last-message-time">
                  {{ formatTime(conversation.lastMessage.createdAt) }}
                </span>
              </div>

              <div class="conversation-preview">
                <span v-if="conversation.lastMessage" class="last-message">
                  <strong>{{ conversation.lastMessage.sender.pseudo }}:</strong>
                  {{ conversation.lastMessage.content }}
                </span>
                <span v-else class="no-messages">Aucun message</span>
              </div>
            </div>

            <div v-if="conversation.unreadCount > 0" class="unread-indicator">
              {{ conversation.unreadCount }}
            </div>
          </div>

          <!-- État vide -->
          <div v-if="filteredConversations.length === 0" class="empty-conversations">
            <Icon name="mdi:chat-outline" class="empty-icon" />
            <p>Aucune conversation</p>
          </div>
        </div>
      </div>

      <!-- Zone de chat principale -->
      <div v-if="currentConversation" class="chat-main">
        <!-- Header de la conversation -->
        <div class="conversation-header">
          <button @click="backToConversations" class="back-btn">
            <Icon name="mdi:arrow-left" />
          </button>
          
          <div class="conversation-info">
            <div class="conversation-avatar">
              <img 
                v-if="getConversationAvatar(currentConversation)" 
                :src="getConversationAvatar(currentConversation)" 
                :alt="getConversationTitle(currentConversation)"
                class="avatar-img"
              />
              <div v-else class="avatar-placeholder">
                <Icon :name="currentConversation.type === 'TEAM' ? 'mdi:account-group' : 'mdi:account'" />
              </div>
            </div>
            
            <div class="conversation-details">
              <h3>{{ getConversationTitle(currentConversation) }}</h3>
              <span class="conversation-type">
                {{ currentConversation.type === 'TEAM' ? 'Chat équipe' : 'Conversation privée' }}
              </span>
            </div>
          </div>

          <div class="conversation-actions">
            <button class="action-btn" title="Paramètres">
              <Icon name="mdi:cog" />
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="messages-container" ref="messagesContainer">
          <div class="messages-list">
            <!-- Messages groupés par jour -->
            <div v-for="(dayMessages, date) in messagesByDay" :key="date" class="messages-day">
              <div class="day-separator">
                <span>{{ formatDate(date) }}</span>
              </div>

              <div v-for="message in dayMessages" :key="message.id" class="message-wrapper">
                <ChatMessage 
                  :message="message" 
                  :is-own="message.senderId === user?.id"
                  @reply="startReply"
                  @edit="startEdit"
                  @delete="deleteMessage"
                />
              </div>
            </div>
          </div>

          <!-- Indicateur utilisateurs qui tapent -->
          <div v-if="typingText" class="typing-indicator">
            <span>{{ typingText }}</span>
          </div>

          <!-- État de chargement -->
          <div v-if="isLoading" class="loading-indicator">
            <Icon name="mdi:loading" class="spinning" />
          </div>
        </div>

        <!-- Zone de saisie -->
        <ChatInput 
          :conversation-id="currentConversation.id"
          :reply-to="replyToMessage"
          :edit-message="editingMessage"
          @send="handleSendMessage"
          @cancel-reply="replyToMessage = null"
          @cancel-edit="editingMessage = null"
          @typing-start="handleTypingStart"
          @typing-stop="handleTypingStop"
        />
      </div>
    </div>

    <!-- Modal nouvelle conversation -->
    <ChatNewConversationModal 
      v-if="showNewConversationModal"
      @close="showNewConversationModal = false"
      @created="handleConversationCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useChat } from '~/composables/useChat'
import { useAuth } from '~/composables/useAuth'

// Composants
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'
import ChatNewConversationModal from './ChatNewConversationModal.vue'

const { user } = useAuth()

const {
  conversations,
  currentConversation,
  messages,
  totalUnreadMessages,
  typingText,
  isLoading,
  isConnected,
  initChatSocket,
  disconnectChatSocket,
  loadConversations,
  loadMessages,
  sendMessage,
  markAsRead,
  setCurrentConversation,
  joinConversation,
  leaveConversation,
  startTyping,
  stopTyping
} = useChat()

// État local du widget
const isMinimized = ref(true)
const isExpanded = ref(false)
const conversationFilter = ref('')
const showNewConversationModal = ref(false)
const replyToMessage = ref(null)
const editingMessage = ref(null)
const messagesContainer = ref(null)

// Computed
const filteredConversations = computed(() => {
  if (!conversationFilter.value) return conversations.value
  
  const filter = conversationFilter.value.toLowerCase()
  return conversations.value.filter(conv => {
    const title = getConversationTitle(conv).toLowerCase()
    return title.includes(filter)
  })
})

const messagesByDay = computed(() => {
  const grouped = {}
  
  messages.value.forEach(message => {
    const date = new Date(message.createdAt).toDateString()
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(message)
  })
  
  return grouped
})

// Méthodes du widget
const toggleWidget = () => {
  if (!isConnected.value) {
    initChatSocket()
  }
  isMinimized.value = !isMinimized.value
  if (!isMinimized.value && conversations.value.length === 0) {
    loadConversations()
  }
}

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const backToConversations = () => {
  if (currentConversation.value) {
    leaveConversation(currentConversation.value.id)
  }
  setCurrentConversation(null)
}

// Méthodes de conversation
const selectConversation = async (conversation) => {
  if (currentConversation.value) {
    leaveConversation(currentConversation.value.id)
  }
  
  setCurrentConversation(conversation)
  joinConversation(conversation.id)
  await loadMessages(conversation.id)
}

const handleConversationCreated = (conversation) => {
  showNewConversationModal.value = false
  selectConversation(conversation)
}

// Méthodes de messages
const handleSendMessage = async (content: string) => {
  if (currentConversation.value) {
    try {
      await sendMessage(
        currentConversation.value.id, 
        content, 
        replyToMessage.value?.id
      )
      replyToMessage.value = null
      editingMessage.value = null
    } catch (error) {
      console.error('Erreur envoi message:', error)
    }
  }
}

const startReply = (message) => {
  replyToMessage.value = message
  editingMessage.value = null
}

const startEdit = (message) => {
  editingMessage.value = message
  replyToMessage.value = null
}

const deleteMessage = async (messageId: string) => {
  try {
    await $fetch(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
  } catch (error) {
    console.error('Erreur suppression message:', error)
  }
}

const handleTypingStart = () => {
  if (currentConversation.value) {
    startTyping(currentConversation.value.id)
  }
}

const handleTypingStop = () => {
  if (currentConversation.value) {
    stopTyping(currentConversation.value.id)
  }
}

// Utilitaires
const getConversationTitle = (conversation) => {
  if (conversation.type === 'TEAM' && conversation.team) {
    return conversation.team.name
  }
  
  if (conversation.type === 'DIRECT') {
    const otherMember = conversation.members?.find(m => m.userId !== user.value?.id)
    return otherMember?.user?.pseudo || 'Conversation'
  }
  
  return conversation.title || 'Conversation'
}

const getConversationAvatar = (conversation) => {
  if (conversation.type === 'TEAM' && conversation.team?.avatar) {
    return conversation.team.avatar
  }
  
  if (conversation.type === 'DIRECT') {
    const otherMember = conversation.members?.find(m => m.userId !== user.value?.id)
    return otherMember?.user?.avatar
  }
  
  return null
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return "Aujourd'hui"
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Hier'
  } else {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long' 
    })
  }
}

// Lifecycle
onMounted(() => {
  if (user.value) {
    initChatSocket()
  }
})

onUnmounted(() => {
  disconnectChatSocket()
})

// Watcher pour auto-scroll
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })
</script>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  height: 500px;
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: all 0.3s ease;
}

.chat-widget.is-minimized {
  height: 60px;
}

.chat-widget.is-expanded {
  width: 800px;
  height: 700px;
  right: 20px;
  bottom: 20px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #3B82D6, #2563EB);
  color: white;
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  user-select: none;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.chat-icon {
  font-size: 1.2rem;
}

.unread-badge {
  background: #EF4444;
  color: white;
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.chat-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.4rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.conversations-sidebar {
  width: 100%;
  border-right: 1px solid rgba(59, 130, 214, 0.2);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

.chat-widget.is-expanded .conversations-sidebar {
  width: 350px;
}

.conversations-sidebar.is-hidden {
  transform: translateX(-100%);
  width: 0;
}

.chat-widget.is-expanded .conversations-sidebar.is-hidden {
  transform: translateX(0);
  width: 0;
}

.conversations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.2);
}

.conversations-header h3 {
  color: #F3F4F6;
  margin: 0;
  font-size: 1rem;
}

.new-conversation-btn {
  background: #3B82D6;
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.new-conversation-btn:hover {
  background: #2563EB;
}

.conversation-search {
  padding: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  background: #111111;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 8px;
  color: #F3F4F6;
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: #3B82D6;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
  transition: background 0.2s ease;
  position: relative;
}

.conversation-item:hover {
  background: rgba(59, 130, 214, 0.1);
}

.conversation-item.is-active {
  background: rgba(59, 130, 214, 0.2);
}

.conversation-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3B82D6;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: white;
  font-size: 1.2rem;
}

.conversation-content {
  flex: 1;
  min-width: 0;
}

.conversation-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.25rem;
}

.conversation-title {
  color: #F3F4F6;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-message-time {
  color: #9CA3AF;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.conversation-preview {
  font-size: 0.8rem;
}

.last-message {
  color: #9CA3AF;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-messages {
  color: #6B7280;
}

.unread-indicator {
  background: #3B82D6;
  color: white;
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.empty-conversations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6B7280;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.conversation-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.2);
  background: #111111;
}

.back-btn {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
}

.conversation-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.conversation-details h3 {
  color: #F3F4F6;
  font-size: 1rem;
  margin: 0 0 0.25rem 0;
}

.conversation-type {
  color: #9CA3AF;
  font-size: 0.8rem;
}

.conversation-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.messages-list {
  flex: 1;
  padding: 1rem 0;
}

.messages-day {
  margin-bottom: 1rem;
}

.day-separator {
  text-align: center;
  margin: 1rem 0;
}

.day-separator span {
  background: #111111;
  color: #9CA3AF;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  border: 1px solid rgba(59, 130, 214, 0.2);
}

.message-wrapper {
  margin-bottom: 0.5rem;
}

.typing-indicator {
  padding: 1rem;
  color: #9CA3AF;
  font-style: italic;
  font-size: 0.9rem;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  padding: 1rem;
  color: #3B82D6;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .chat-widget {
    width: calc(100% - 40px);
    height: 60%;
    right: 20px;
    bottom: 20px;
  }
  
  .chat-widget.is-expanded {
    width: calc(100% - 20px);
    height: calc(100% - 40px);
    right: 10px;
    bottom: 20px;
  }
  
  .conversations-sidebar.is-hidden {
    display: none;
  }
}
</style>