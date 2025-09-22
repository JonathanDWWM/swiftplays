import { ref, computed, nextTick } from 'vue'
import { useAuth } from './useAuth'
import { io, Socket } from 'socket.io-client'

interface ChatMessage {
  id: string
  content: string
  type: string
  senderId: string
  sender: {
    id: string
    pseudo: string
    avatar?: string
  }
  replyTo?: {
    id: string
    content: string
    sender: {
      pseudo: string
    }
  }
  isEdited: boolean
  editedAt?: string
  createdAt: string
  reactions?: Record<string, string[]>
}

interface Conversation {
  id: string
  type: string
  title?: string
  members: Array<{
    userId: string
    user: {
      id: string
      pseudo: string
      avatar?: string
    }
  }>
  team?: {
    id: string
    name: string
    avatar?: string
  }
  lastMessage?: ChatMessage
  unreadCount: number
}

export const useChat = () => {
  const { user, token } = useAuth()
  
  // État réactif
  const conversations = ref<Conversation[]>([])
  const currentConversation = ref<Conversation | null>(null)
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const isConnected = ref(false)
  const typingUsers = ref<Set<string>>(new Set())
  
  // Socket.io
  let chatSocket: Socket | null = null
  
  // Configuration runtime Nuxt
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || 'http://localhost:3001'
  
  // Initialiser la connexion Socket.io pour le chat
  const initChatSocket = () => {
    if (!user.value || !token.value || chatSocket) return
    
    try {
      chatSocket = io(`${apiBase}/chat`, {
        auth: {
          token: token.value
        }
      })
      
      chatSocket.on('connect', () => {
        console.log('💬 Chat Socket connecté')
        isConnected.value = true
      })
      
      chatSocket.on('disconnect', () => {
        console.log('💬 Chat Socket déconnecté')
        isConnected.value = false
      })
      
      // Écouter les nouveaux messages
      chatSocket.on('new-message', (message: ChatMessage) => {
        if (currentConversation.value && message.conversationId === currentConversation.value.id) {
          messages.value.push(message)
          nextTick(() => {
            scrollToBottom()
          })
        }
        
        // Mettre à jour le nombre de non-lus dans la liste des conversations
        updateConversationUnreadCount(message.conversationId, message.senderId !== user.value?.id)
      })
      
      // Messages modifiés
      chatSocket.on('message-edited', (editedMessage: ChatMessage) => {
        const index = messages.value.findIndex(m => m.id === editedMessage.id)
        if (index !== -1) {
          messages.value[index] = editedMessage
        }
      })
      
      // Messages supprimés
      chatSocket.on('message-deleted', ({ messageId, conversationId }: { messageId: string, conversationId: string }) => {
        const index = messages.value.findIndex(m => m.id === messageId)
        if (index !== -1) {
          messages.value[index].content = '[Message supprimé]'
          messages.value[index].isDeleted = true
        }
      })
      
      // Utilisateurs en train de taper
      chatSocket.on('user-typing', ({ userId, pseudo }: { userId: string, pseudo: string }) => {
        if (userId !== user.value?.id) {
          typingUsers.value.add(pseudo)
        }
      })
      
      chatSocket.on('user-stopped-typing', ({ userId }: { userId: string }) => {
        // On ne peut pas retirer par userId car on stocke les pseudos, mais ça se nettoie automatiquement
      })
      
      // Nouvelles conversations
      chatSocket.on('new-conversation', (conversation: Conversation) => {
        conversations.value.unshift(conversation)
      })
      
    } catch (error) {
      console.error('Erreur connexion chat socket:', error)
    }
  }
  
  // Fermer la connexion Socket
  const disconnectChatSocket = () => {
    if (chatSocket) {
      chatSocket.disconnect()
      chatSocket = null
      isConnected.value = false
    }
  }
  
  // Charger toutes les conversations
  const loadConversations = async () => {
    try {
      isLoading.value = true
      
      const response = await $fetch<{ success: boolean, data: Conversation[] }>('/api/chat/conversations', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      
      if (response.success) {
        conversations.value = response.data
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Charger les messages d'une conversation
  const loadMessages = async (conversationId: string, page = 1) => {
    try {
      isLoading.value = true
      
      const response = await $fetch<{ 
        success: boolean, 
        data: ChatMessage[], 
        pagination: any 
      }>(`/api/chat/conversations/${conversationId}/messages?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      
      if (response.success) {
        if (page === 1) {
          messages.value = response.data
        } else {
          // Ajouter au début pour la pagination vers le haut
          messages.value.unshift(...response.data)
        }
        
        // Marquer automatiquement comme lu
        await markAsRead(conversationId)
        
        nextTick(() => {
          if (page === 1) scrollToBottom()
        })
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error)
    } finally {
      isLoading.value = false
    }
  }
  
  // Envoyer un message
  const sendMessage = async (conversationId: string, content: string, replyToId?: string) => {
    if (!content.trim()) return
    
    try {
      const response = await $fetch<{ success: boolean, data: ChatMessage }>(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`
        },
        body: {
          content: content.trim(),
          replyToId
        }
      })
      
      if (response.success) {
        // Le message sera ajouté automatiquement via Socket.io
        return response.data
      }
    } catch (error) {
      console.error('Erreur envoi message:', error)
      throw error
    }
  }
  
  // Marquer les messages comme lus
  const markAsRead = async (conversationId: string) => {
    try {
      await $fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      
      // Mettre à jour localement
      updateConversationUnreadCount(conversationId, false, 0)
      
      // Notifier via Socket.io
      if (chatSocket) {
        chatSocket.emit('messages-read', conversationId)
      }
    } catch (error) {
      console.error('Erreur marquer comme lu:', error)
    }
  }
  
  // Créer une conversation directe
  const createDirectConversation = async (targetUserId: string) => {
    try {
      const response = await $fetch<{ success: boolean, data: Conversation }>('/api/chat/conversations/direct', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`
        },
        body: { targetUserId }
      })
      
      if (response.success) {
        // Ajouter à la liste si c'est une nouvelle conversation
        const existing = conversations.value.find(c => c.id === response.data.id)
        if (!existing) {
          conversations.value.unshift(response.data)
        }
        return response.data
      }
    } catch (error) {
      console.error('Erreur création conversation directe:', error)
      throw error
    }
  }
  
  // Récupérer ou créer conversation d'équipe
  const getTeamConversation = async (teamId: string) => {
    try {
      const response = await $fetch<{ success: boolean, data: Conversation }>(`/api/chat/conversations/team/${teamId}`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      
      if (response.success) {
        // Ajouter à la liste si pas déjà présente
        const existing = conversations.value.find(c => c.id === response.data.id)
        if (!existing) {
          conversations.value.unshift(response.data)
        }
        return response.data
      }
    } catch (error) {
      console.error('Erreur conversation équipe:', error)
      throw error
    }
  }
  
  // Rejoindre une conversation (via Socket)
  const joinConversation = (conversationId: string) => {
    if (chatSocket) {
      chatSocket.emit('join-conversation', conversationId)
    }
  }
  
  // Quitter une conversation (via Socket)
  const leaveConversation = (conversationId: string) => {
    if (chatSocket) {
      chatSocket.emit('leave-conversation', conversationId)
    }
  }
  
  // Indicateur de frappe
  const startTyping = (conversationId: string) => {
    if (chatSocket) {
      chatSocket.emit('typing-start', conversationId)
    }
  }
  
  const stopTyping = (conversationId: string) => {
    if (chatSocket) {
      chatSocket.emit('typing-stop', conversationId)
    }
  }
  
  // Utilitaires
  const updateConversationUnreadCount = (conversationId: string, increment: boolean, count?: number) => {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (conversation) {
      if (count !== undefined) {
        conversation.unreadCount = count
      } else if (increment) {
        conversation.unreadCount++
      }
    }
  }
  
  const scrollToBottom = () => {
    const messagesContainer = document.querySelector('.chat-messages')
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }
  
  // Computed
  const totalUnreadMessages = computed(() => {
    return conversations.value.reduce((total, conv) => total + conv.unreadCount, 0)
  })
  
  const typingText = computed(() => {
    const users = Array.from(typingUsers.value)
    if (users.length === 0) return ''
    if (users.length === 1) return `${users[0]} est en train d'écrire...`
    if (users.length === 2) return `${users[0]} et ${users[1]} sont en train d'écrire...`
    return `${users.length} personnes sont en train d'écrire...`
  })
  
  return {
    // État
    conversations: readonly(conversations),
    currentConversation: readonly(currentConversation),
    messages: readonly(messages),
    isLoading: readonly(isLoading),
    isConnected: readonly(isConnected),
    totalUnreadMessages,
    typingText,
    
    // Actions
    initChatSocket,
    disconnectChatSocket,
    loadConversations,
    loadMessages,
    sendMessage,
    markAsRead,
    createDirectConversation,
    getTeamConversation,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    
    // Mutations
    setCurrentConversation: (conversation: Conversation | null) => {
      currentConversation.value = conversation
      messages.value = []
      typingUsers.value.clear()
    }
  }
}