<template>
  <div class="chat-input-container">
    <!-- Message de réponse -->
    <div v-if="replyTo" class="reply-preview">
      <div class="reply-content">
        <Icon name="mdi:reply" class="reply-icon" />
        <div class="reply-info">
          <span class="reply-author">Répondre à {{ replyTo.sender.pseudo }}</span>
          <span class="reply-text">{{ replyTo.content }}</span>
        </div>
      </div>
      <button @click="$emit('cancel-reply')" class="cancel-btn">
        <Icon name="mdi:close" />
      </button>
    </div>

    <!-- Message en cours de modification -->
    <div v-if="editMessage" class="edit-preview">
      <div class="edit-content">
        <Icon name="mdi:pencil" class="edit-icon" />
        <div class="edit-info">
          <span class="edit-label">Modification du message</span>
        </div>
      </div>
      <button @click="$emit('cancel-edit')" class="cancel-btn">
        <Icon name="mdi:close" />
      </button>
    </div>

    <!-- Zone de saisie -->
    <div class="input-wrapper">
      <textarea
        ref="messageInput"
        v-model="messageText"
        :placeholder="placeholder"
        class="message-input"
        rows="1"
        @keydown="handleKeyDown"
        @input="handleInput"
        @paste="handlePaste"
        :disabled="isSending"
      />
      
      <div class="input-actions">
        <!-- Bouton emoji (futur) -->
        <button class="action-button emoji-btn" title="Emoji" disabled>
          <Icon name="mdi:emoticon-happy-outline" />
        </button>
        
        <!-- Bouton fichier (futur) -->
        <button class="action-button file-btn" title="Fichier" disabled>
          <Icon name="mdi:attachment" />
        </button>
        
        <!-- Bouton envoyer -->
        <button 
          @click="sendMessage"
          class="action-button send-btn"
          :disabled="!canSend"
          :title="editMessage ? 'Modifier' : 'Envoyer'"
        >
          <Icon v-if="isSending" name="mdi:loading" class="spinning" />
          <Icon v-else :name="editMessage ? 'mdi:check' : 'mdi:send'" />
        </button>
      </div>
    </div>

    <!-- Compteur de caractères -->
    <div v-if="messageText.length > 0" class="character-count" :class="{ 'is-limit': messageText.length > maxLength }">
      {{ messageText.length }} / {{ maxLength }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'

interface ChatMessage {
  id: string
  content: string
  sender: {
    pseudo: string
  }
}

interface Props {
  conversationId: string
  replyTo?: ChatMessage | null
  editMessage?: ChatMessage | null
}

interface Emits {
  send: [content: string]
  'cancel-reply': []
  'cancel-edit': []
  'typing-start': []
  'typing-stop': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const messageText = ref('')
const isSending = ref(false)
const messageInput = ref<HTMLTextAreaElement>()
const maxLength = 2000
const typingTimer = ref<NodeJS.Timeout>()

const placeholder = computed(() => {
  if (props.editMessage) return 'Modifier le message...'
  if (props.replyTo) return `Répondre à ${props.replyTo.sender.pseudo}...`
  return 'Tapez votre message...'
})

const canSend = computed(() => {
  return messageText.value.trim().length > 0 && 
         messageText.value.length <= maxLength && 
         !isSending.value
})

// Gestion des événements
const handleKeyDown = (event: KeyboardEvent) => {
  // Envoyer avec Entrée, nouvelle ligne avec Shift+Entrée
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
  
  // Échapper pour annuler réponse/édition
  if (event.key === 'Escape') {
    if (props.replyTo) emit('cancel-reply')
    if (props.editMessage) emit('cancel-edit')
  }
}

const handleInput = () => {
  // Auto-resize du textarea
  autoResize()
  
  // Gestion de l'indicateur de frappe
  if (messageText.value.length > 0) {
    if (!typingTimer.value) {
      emit('typing-start')
    }
    
    // Reset du timer
    clearTimeout(typingTimer.value)
    typingTimer.value = setTimeout(() => {
      emit('typing-stop')
      typingTimer.value = undefined
    }, 1000)
  } else {
    if (typingTimer.value) {
      clearTimeout(typingTimer.value)
      typingTimer.value = undefined
      emit('typing-stop')
    }
  }
}

const handlePaste = (event: ClipboardEvent) => {
  // Gérer le collage de fichiers/images (futur)
  const items = event.clipboardData?.items
  if (items) {
    for (let item of items) {
      if (item.type.startsWith('image/')) {
        // TODO: Gérer le collage d'images
        event.preventDefault()
        console.log('Image collée (fonctionnalité à venir)')
      }
    }
  }
}

const autoResize = () => {
  if (messageInput.value) {
    messageInput.value.style.height = 'auto'
    messageInput.value.style.height = Math.min(messageInput.value.scrollHeight, 150) + 'px'
  }
}

const sendMessage = async () => {
  if (!canSend.value) return
  
  try {
    isSending.value = true
    
    if (props.editMessage) {
      // TODO: Implémenter l'édition de message
      await editExistingMessage()
    } else {
      // Envoyer nouveau message
      emit('send', messageText.value)
    }
    
    // Nettoyer après envoi
    messageText.value = ''
    autoResize()
    
    // Arrêter l'indicateur de frappe
    if (typingTimer.value) {
      clearTimeout(typingTimer.value)
      typingTimer.value = undefined
      emit('typing-stop')
    }
    
  } catch (error) {
    console.error('Erreur envoi message:', error)
  } finally {
    isSending.value = false
    nextTick(() => {
      messageInput.value?.focus()
    })
  }
}

const editExistingMessage = async () => {
  if (!props.editMessage) return
  
  try {
    const { token } = useAuth()
    
    await $fetch(`/api/chat/messages/${props.editMessage.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: {
        content: messageText.value
      }
    })
    
    emit('cancel-edit')
  } catch (error) {
    console.error('Erreur modification message:', error)
    throw error
  }
}

const focusInput = () => {
  nextTick(() => {
    messageInput.value?.focus()
  })
}

// Watchers
watch(() => props.editMessage, (newEditMessage) => {
  if (newEditMessage) {
    messageText.value = newEditMessage.content
    focusInput()
    nextTick(() => autoResize())
  }
})

watch(() => props.replyTo, () => {
  focusInput()
})

// Lifecycle
onMounted(() => {
  focusInput()
})

// Expose pour composant parent
defineExpose({
  focusInput
})
</script>

<style scoped>
.chat-input-container {
  border-top: 1px solid rgba(59, 130, 214, 0.2);
  background: #111111;
}

.reply-preview,
.edit-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 214, 0.1);
  border-bottom: 1px solid rgba(59, 130, 214, 0.2);
}

.reply-content,
.edit-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.reply-icon,
.edit-icon {
  color: #3B82D6;
  font-size: 1.1rem;
}

.reply-info,
.edit-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.reply-author,
.edit-label {
  color: #3B82D6;
  font-weight: 600;
  font-size: 0.85rem;
}

.reply-text {
  color: #9CA3AF;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cancel-btn {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 1rem;
  position: relative;
}

.message-input {
  flex: 1;
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 20px;
  padding: 0.75rem 1rem;
  color: #F3F4F6;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: none;
  min-height: 44px;
  max-height: 150px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.message-input:focus {
  outline: none;
  border-color: #3B82D6;
  box-shadow: 0 0 0 2px rgba(59, 130, 214, 0.2);
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message-input::placeholder {
  color: #6B7280;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.emoji-btn,
.file-btn {
  background: transparent;
  color: #6B7280;
}

.emoji-btn:hover,
.file-btn:hover {
  background: rgba(107, 114, 128, 0.2);
  color: #9CA3AF;
}

.emoji-btn:disabled,
.file-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.send-btn {
  background: linear-gradient(135deg, #3B82D6, #2563EB);
  color: white;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563EB, #1D4ED8);
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #374151;
  color: #6B7280;
  cursor: not-allowed;
  transform: none;
}

.send-btn.is-editing {
  background: linear-gradient(135deg, #10B981, #059669);
}

.character-count {
  padding: 0.5rem 1rem 0.75rem;
  color: #6B7280;
  font-size: 0.8rem;
  text-align: right;
}

.character-count.is-limit {
  color: #EF4444;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .input-wrapper {
    padding: 0.75rem;
  }
  
  .input-actions {
    gap: 0.25rem;
  }
  
  .action-button {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  
  .message-input {
    font-size: 16px; /* Empêche le zoom sur iOS */
  }
}
</style>