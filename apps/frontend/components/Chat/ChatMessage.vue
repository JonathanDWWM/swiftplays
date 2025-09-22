<template>
  <div class="chat-message" :class="{ 'is-own': isOwn, 'is-deleted': message.isDeleted }">
    <div v-if="!isOwn" class="message-avatar">
      <img 
        v-if="message.sender.avatar" 
        :src="message.sender.avatar" 
        :alt="message.sender.pseudo"
        class="avatar-img"
      />
      <div v-else class="avatar-placeholder">
        {{ message.sender.pseudo.charAt(0).toUpperCase() }}
      </div>
    </div>

    <div class="message-content">
      <!-- Message de réponse -->
      <div v-if="message.replyTo" class="reply-message">
        <Icon name="mdi:reply" class="reply-icon" />
        <span class="reply-author">{{ message.replyTo.sender.pseudo }}</span>
        <span class="reply-content">{{ message.replyTo.content }}</span>
      </div>

      <!-- Contenu du message -->
      <div class="message-bubble">
        <div v-if="!isOwn" class="message-author">{{ message.sender.pseudo }}</div>
        
        <div class="message-text" :class="{ 'is-deleted': message.isDeleted }">
          {{ message.content }}
        </div>

        <div class="message-meta">
          <span class="message-time">{{ formatTime(message.createdAt) }}</span>
          <span v-if="message.isEdited" class="edited-label">(modifié)</span>
        </div>

        <!-- Actions du message -->
        <div v-if="!message.isDeleted" class="message-actions" :class="{ 'is-visible': showActions }">
          <button @click="$emit('reply', message)" class="action-btn" title="Répondre">
            <Icon name="mdi:reply" />
          </button>
          <button v-if="isOwn" @click="$emit('edit', message)" class="action-btn" title="Modifier">
            <Icon name="mdi:pencil" />
          </button>
          <button v-if="isOwn" @click="confirmDelete" class="action-btn delete-btn" title="Supprimer">
            <Icon name="mdi:delete" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteModal" class="delete-modal-overlay" @click="showDeleteModal = false">
      <div class="delete-modal" @click.stop>
        <h4>Supprimer ce message ?</h4>
        <p>Cette action est irréversible.</p>
        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn-cancel">Annuler</button>
          <button @click="deleteMessage" class="btn-delete">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface ChatMessage {
  id: string
  content: string
  senderId: string
  sender: {
    pseudo: string
    avatar?: string
  }
  replyTo?: {
    content: string
    sender: {
      pseudo: string
    }
  }
  isEdited: boolean
  isDeleted?: boolean
  createdAt: string
}

interface Props {
  message: ChatMessage
  isOwn: boolean
}

interface Emits {
  reply: [message: ChatMessage]
  edit: [message: ChatMessage]
  delete: [messageId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showActions = ref(false)
const showDeleteModal = ref(false)

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const confirmDelete = () => {
  showDeleteModal.value = true
}

const deleteMessage = () => {
  emit('delete', props.message.id)
  showDeleteModal.value = false
}
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  position: relative;
  transition: background 0.2s ease;
}

.chat-message:hover {
  background: rgba(59, 130, 214, 0.05);
}

.chat-message:hover .message-actions {
  opacity: 1;
}

.chat-message.is-own {
  flex-direction: row-reverse;
}

.chat-message.is-own .message-content {
  align-items: flex-end;
}

.chat-message.is-own .message-bubble {
  background: linear-gradient(135deg, #3B82D6, #2563EB);
  color: white;
}

.chat-message.is-deleted {
  opacity: 0.6;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #3B82D6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
}

.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.reply-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  padding: 0.5rem;
  background: rgba(59, 130, 214, 0.1);
  border-radius: 8px;
  border-left: 3px solid #3B82D6;
  font-size: 0.85rem;
}

.reply-icon {
  color: #3B82D6;
  font-size: 1rem;
}

.reply-author {
  color: #3B82D6;
  font-weight: 600;
}

.reply-content {
  color: #9CA3AF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.message-bubble {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  position: relative;
  border: 1px solid rgba(59, 130, 214, 0.2);
  max-width: 400px;
  word-wrap: break-word;
}

.chat-message.is-own .message-bubble {
  margin-left: auto;
}

.message-author {
  font-weight: 600;
  color: #3B82D6;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.message-text {
  color: #F3F4F6;
  line-height: 1.5;
  margin-bottom: 0.5rem;
  white-space: pre-wrap;
}

.message-text.is-deleted {
  font-style: italic;
  color: #6B7280;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #9CA3AF;
}

.chat-message.is-own .message-meta {
  color: rgba(255, 255, 255, 0.8);
}

.edited-label {
  font-style: italic;
}

.message-actions {
  position: absolute;
  top: -10px;
  right: 10px;
  background: #111111;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 20px;
  padding: 0.25rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.message-actions.is-visible {
  opacity: 1;
}

.chat-message.is-own .message-actions {
  left: 10px;
  right: auto;
}

.action-btn {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(59, 130, 214, 0.2);
  color: #3B82D6;
}

.action-btn.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
}

/* Modal de confirmation */
.delete-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.delete-modal {
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.delete-modal h4 {
  color: #F3F4F6;
  margin: 0 0 0.5rem 0;
}

.delete-modal p {
  color: #9CA3AF;
  margin: 0 0 1.5rem 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-cancel,
.btn-delete {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: transparent;
  color: #9CA3AF;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.btn-cancel:hover {
  background: rgba(156, 163, 175, 0.1);
  color: #F3F4F6;
}

.btn-delete {
  background: #EF4444;
  color: white;
}

.btn-delete:hover {
  background: #DC2626;
}
</style>