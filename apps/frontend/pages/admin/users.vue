<template>
  <div class="admin-users">
    <div class="page-header">
      <h1>Gestion des Utilisateurs</h1>
      <NuxtLink to="/admin" class="back-button">
        <Icon name="mdi:arrow-left" />
        Retour au Dashboard
      </NuxtLink>
    </div>

    <!-- Filtres et recherche -->
    <div class="filters-section">
      <div class="search-box">
        <Icon name="mdi:magnify" />
        <input 
          v-model="searchQuery"
          @input="debouncedSearch"
          type="text" 
          placeholder="Rechercher par pseudo, email..."
        />
      </div>
      
      <div class="filter-select">
        <select v-model="roleFilter" @change="loadUsers">
          <option value="ALL">Tous les rôles</option>
          <option value="USER">Utilisateurs</option>
          <option value="MODERATOR">Modérateurs</option>
          <option value="ADMIN">Administrateurs</option>
        </select>
      </div>

      <div class="filter-select">
        <select v-model="banFilter" @change="loadUsers">
          <option value="">Tous les statuts</option>
          <option value="false">Non bannis</option>
          <option value="true">Bannis</option>
        </select>
      </div>

      <button @click="loadUsers" class="refresh-button">
        <Icon name="mdi:refresh" />
        Actualiser
      </button>
    </div>

    <!-- Liste des utilisateurs -->
    <div class="users-table">
      <div class="table-header">
        <div class="col-user">Utilisateur</div>
        <div class="col-role">Rôle</div>
        <div class="col-teams">Équipes</div>
        <div class="col-status">Statut</div>
        <div class="col-actions">Actions</div>
      </div>

      <div v-if="loading" class="loading-state">
        <Icon name="mdi:loading" class="loading-icon" />
        <span>Chargement des utilisateurs...</span>
      </div>

      <div v-else-if="users.length === 0" class="empty-state">
        <Icon name="mdi:account-off" />
        <span>Aucun utilisateur trouvé</span>
      </div>

      <div v-else class="table-body">
        <div 
          v-for="user in users" 
          :key="user.id"
          class="user-row"
          :class="{ banned: user.isBanned }"
        >
          <div class="col-user">
            <div class="user-info">
              <img 
                v-if="user.avatar || user.discordAvatar"
                :src="user.avatar || user.discordAvatar" 
                :alt="user.pseudo"
                class="user-avatar"
              />
              <div v-else class="user-avatar-placeholder">
                {{ user.pseudo.charAt(0).toUpperCase() }}
              </div>
              <div class="user-details">
                <div class="user-pseudo">{{ user.pseudo }}</div>
                <div class="user-email">{{ user.email }}</div>
                <div class="user-created">
                  Inscrit le {{ formatDate(user.createdAt) }}
                </div>
              </div>
            </div>
          </div>

          <div class="col-role">
            <span 
              class="role-badge"
              :class="user.role.toLowerCase()"
            >
              {{ user.role === 'USER' ? 'Utilisateur' : user.role === 'MODERATOR' ? 'Modérateur' : 'Admin' }}
            </span>
          </div>

          <div class="col-teams">
            <div v-if="user.ownedTeams.length > 0" class="teams-owned">
              <Icon name="mdi:crown" />
              {{ user.ownedTeams.length }} équipe(s)
            </div>
            <div v-if="user.teamMemberships.length > 0" class="teams-member">
              <Icon name="mdi:account-group" />
              Membre de {{ user.teamMemberships.length }}
            </div>
            <span v-if="user.ownedTeams.length === 0 && user.teamMemberships.length === 0" class="no-teams">
              Aucune équipe
            </span>
          </div>

          <div class="col-status">
            <div v-if="user.isBanned" class="status-banned">
              <Icon name="mdi:account-cancel" />
              Banni
            </div>
            <div v-else-if="user.activeSanctions.length > 0" class="status-warned">
              <Icon name="mdi:alert" />
              {{ user.activeSanctions.length }} sanction(s)
            </div>
            <div v-else class="status-clean">
              <Icon name="mdi:account-check" />
              Clean
            </div>
          </div>

          <div class="col-actions">
            <div class="action-buttons">
              <button 
                @click="viewUserDetails(user)"
                class="action-btn view"
                title="Voir détails"
              >
                <Icon name="mdi:eye" />
              </button>
              
              <button 
                v-if="!user.isBanned && user.role !== 'ADMIN'"
                @click="openSanctionModal(user)"
                class="action-btn warn"
                title="Sanctionner"
              >
                <Icon name="mdi:gavel" />
              </button>

              <button 
                v-if="user.isBanned"
                @click="unbanUser(user)"
                class="action-btn unban"
                title="Lever le ban"
              >
                <Icon name="mdi:account-check" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.pages > 1" class="pagination">
      <button 
        @click="changePage(pagination.page - 1)"
        :disabled="pagination.page === 1"
        class="page-btn"
      >
        <Icon name="mdi:chevron-left" />
      </button>
      
      <span class="page-info">
        Page {{ pagination.page }} sur {{ pagination.pages }}
        ({{ pagination.total }} utilisateurs)
      </span>
      
      <button 
        @click="changePage(pagination.page + 1)"
        :disabled="pagination.page === pagination.pages"
        class="page-btn"
      >
        <Icon name="mdi:chevron-right" />
      </button>
    </div>

    <!-- Modal de sanction -->
    <div v-if="sanctionModal.show" class="modal-overlay" @click.self="sanctionModal.show = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Sanctionner {{ sanctionModal.user?.pseudo }}</h3>
          <button @click="sanctionModal.show = false" class="close-btn">
            <Icon name="mdi:close" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Type de sanction</label>
            <select v-model="sanctionForm.type">
              <option value="WARNING">Avertissement</option>
              <option value="TEMPORARY_BAN">Ban temporaire</option>
              <option value="PERMANENT_BAN">Ban permanent</option>
              <option value="CHAT_MUTE">Mute chat</option>
            </select>
          </div>

          <div v-if="sanctionForm.type !== 'PERMANENT_BAN'" class="form-group">
            <label>Durée (heures)</label>
            <input v-model.number="sanctionForm.duration" type="number" min="1" />
          </div>

          <div class="form-group">
            <label>Raison</label>
            <textarea 
              v-model="sanctionForm.reason"
              placeholder="Expliquez la raison de cette sanction..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="sanctionModal.show = false" class="btn-cancel">
            Annuler
          </button>
          <button @click="applySanction" class="btn-confirm" :disabled="!sanctionForm.reason">
            Appliquer la sanction
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useRouter } from 'vue-router'

definePageMeta({
  middleware: 'auth'
})

const { user: currentUser, token } = useAuth()
const router = useRouter()

const users = ref([])
const loading = ref(false)
const searchQuery = ref('')
const roleFilter = ref('ALL')
const banFilter = ref('')

const pagination = reactive({
  page: 1,
  pages: 1,
  total: 0,
  limit: 20
})

const sanctionModal = reactive({
  show: false,
  user: null
})

const sanctionForm = reactive({
  type: 'WARNING',
  duration: 24,
  reason: ''
})

// Vérifier les permissions
onMounted(async () => {
  if (!currentUser.value || !['ADMIN', 'MODERATOR'].includes(currentUser.value.role)) {
    await router.push('/dashboard')
    return
  }
  
  await loadUsers()
})

const loadUsers = async () => {
  try {
    loading.value = true
    
    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit,
      search: searchQuery.value,
      role: roleFilter.value,
      banned: banFilter.value
    })
    
    const response = await $fetch(`/api/admin/users?${params}`, {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      users.value = response.data
      Object.assign(pagination, response.pagination)
    }
  } catch (error) {
    console.error('Erreur chargement utilisateurs:', error)
  } finally {
    loading.value = false
  }
}

// Recherche avec debounce
let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    loadUsers()
  }, 500)
}

const changePage = (newPage) => {
  pagination.page = newPage
  loadUsers()
}

const openSanctionModal = (user) => {
  sanctionModal.user = user
  sanctionModal.show = true
  sanctionForm.type = 'WARNING'
  sanctionForm.duration = 24
  sanctionForm.reason = ''
}

const applySanction = async () => {
  try {
    const payload = {
      type: sanctionForm.type,
      reason: sanctionForm.reason
    }
    
    if (sanctionForm.type !== 'PERMANENT_BAN') {
      payload.duration = sanctionForm.duration
    }
    
    const response = await $fetch(`/api/admin/users/${sanctionModal.user.id}/sanction`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: payload
    })
    
    if (response.success) {
      sanctionModal.show = false
      await loadUsers()
      
      // TODO: Afficher notification de succès
      console.log('Sanction appliquée avec succès')
    }
  } catch (error) {
    console.error('Erreur application sanction:', error)
  }
}

const unbanUser = async (user) => {
  if (!confirm(`Êtes-vous sûr de lever le ban de ${user.pseudo} ?`)) {
    return
  }
  
  try {
    // Trouver la sanction active de ban
    const banSanction = user.activeSanctions.find(s => 
      ['PERMANENT_BAN', 'TEMPORARY_BAN'].includes(s.type)
    )
    
    if (banSanction) {
      const response = await $fetch(`/api/admin/sanctions/${banSanction.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token.value}`
        },
        body: {
          reason: 'Ban levé par un administrateur'
        }
      })
      
      if (response.success) {
        await loadUsers()
        console.log('Ban levé avec succès')
      }
    }
  } catch (error) {
    console.error('Erreur levée de ban:', error)
  }
}

const viewUserDetails = (user) => {
  // TODO: Ouvrir modal de détails ou rediriger vers page profil
  console.log('Voir détails de', user.pseudo)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR')
}
</script>

<style scoped>
.admin-users {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #3B82D6;
}

.page-header h1 {
  color: #F3F4F6;
  margin: 0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3B82D6;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: 1px solid #3B82D6;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: rgba(59, 130, 214, 0.1);
}

.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-box svg {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 6px;
  color: #F3F4F6;
}

.filter-select select, .refresh-button {
  padding: 0.75rem 1rem;
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 6px;
  color: #F3F4F6;
  cursor: pointer;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3B82D6;
  border-color: #3B82D6;
  transition: all 0.2s ease;
}

.refresh-button:hover {
  background: #2563EB;
}

.users-table {
  background: #1a1a1a;
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 214, 0.2);
  overflow: hidden;
  margin-bottom: 2rem;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 120px;
  gap: 1rem;
  padding: 1rem;
  background: rgba(59, 130, 214, 0.1);
  font-weight: 600;
  color: #3B82D6;
}

.loading-state, .empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem;
  color: #9CA3AF;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.table-body {
  display: flex;
  flex-direction: column;
}

.user-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 120px;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
  align-items: center;
}

.user-row:last-child {
  border-bottom: none;
}

.user-row.banned {
  background: rgba(239, 68, 68, 0.05);
  border-left: 3px solid #EF4444;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3B82D6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.user-details {
  flex: 1;
}

.user-pseudo {
  font-weight: 600;
  color: #F3F4F6;
}

.user-email {
  color: #9CA3AF;
  font-size: 0.85rem;
}

.user-created {
  color: #6B7280;
  font-size: 0.8rem;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.role-badge.user {
  background: rgba(75, 85, 99, 0.2);
  color: #9CA3AF;
}

.role-badge.moderator {
  background: rgba(251, 191, 36, 0.2);
  color: #FBBF24;
}

.role-badge.admin {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
}

.teams-owned, .teams-member {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #9CA3AF;
  margin-bottom: 0.25rem;
}

.teams-owned svg {
  color: #FBBF24;
}

.no-teams {
  color: #6B7280;
  font-size: 0.85rem;
}

.status-banned, .status-warned, .status-clean {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-banned {
  color: #EF4444;
}

.status-warned {
  color: #F59E0B;
}

.status-clean {
  color: #10B981;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.view {
  background: rgba(59, 130, 214, 0.2);
  color: #3B82D6;
}

.action-btn.warn {
  background: rgba(251, 191, 36, 0.2);
  color: #FBBF24;
}

.action-btn.unban {
  background: rgba(16, 185, 129, 0.2);
  color: #10B981;
}

.action-btn:hover {
  transform: scale(1.1);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.page-btn {
  padding: 0.5rem;
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 4px;
  color: #3B82D6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:hover:not(:disabled) {
  background: rgba(59, 130, 214, 0.1);
}

.page-info {
  color: #9CA3AF;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: #1a1a1a;
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 214, 0.3);
  width: 90%;
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.2);
}

.modal-header h3 {
  color: #F3F4F6;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
}

.close-btn:hover {
  background: rgba(156, 163, 175, 0.1);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  color: #F3F4F6;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group select, .form-group input, .form-group textarea {
  width: 100%;
  padding: 0.75rem;
  background: #2a2a2a;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 4px;
  color: #F3F4F6;
}

.form-group textarea {
  height: 80px;
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(59, 130, 214, 0.2);
}

.btn-cancel, .btn-confirm {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #374151;
  color: #9CA3AF;
}

.btn-cancel:hover {
  background: #4B5563;
}

.btn-confirm {
  background: #3B82D6;
  color: white;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-confirm:hover:not(:disabled) {
  background: #2563EB;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1200px) {
  .table-header, .user-row {
    grid-template-columns: 2fr 1fr 80px;
    gap: 0.5rem;
  }
  
  .col-teams, .col-status {
    display: none;
  }
}

@media (max-width: 768px) {
  .admin-users {
    padding: 1rem;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    min-width: auto;
  }
}
</style>