<template>
  <div class="admin-logs">
    <div class="page-header">
      <h1 class="page-title">Logs Administratifs</h1>
      <div class="page-stats">
        <span class="stat-item">
          <Icon name="mdi:history" />
          {{ totalActions }} actions au total
        </span>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-section">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">Type d'action</label>
          <select v-model="selectedActionType" @change="filterActions" class="filter-select">
            <option value="">Tous les types</option>
            <option value="USER_WARN">Avertissement</option>
            <option value="USER_BAN">Bannissement</option>
            <option value="USER_UNBAN">Débannissement</option>
            <option value="TEAM_DISSOLVE">Dissolution équipe</option>
            <option value="CONTENT_MODERATE">Modération contenu</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Administrateur</label>
          <select v-model="selectedAdminId" @change="filterActions" class="filter-select">
            <option value="">Tous les admins</option>
            <option v-for="admin in admins" :key="admin.id" :value="admin.id">
              {{ admin.pseudo }} ({{ admin.role }})
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Période</label>
          <select v-model="selectedPeriod" @change="filterActions" class="filter-select">
            <option value="">Toutes les périodes</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Liste des actions -->
    <div class="actions-list" v-if="!loading && paginatedActions.length > 0">
      <div 
        v-for="action in paginatedActions" 
        :key="action.id"
        class="action-card"
        :class="`action-${action.type.toLowerCase()}`"
      >
        <div class="action-header">
          <div class="action-icon">
            <Icon :name="getActionIcon(action.type)" />
          </div>
          <div class="action-info">
            <div class="action-type">{{ getActionTypeLabel(action.type) }}</div>
            <div class="action-date">{{ formatDate(action.createdAt) }}</div>
          </div>
          <div class="action-admin">
            <div class="admin-name">{{ action.adminUser.pseudo }}</div>
            <div class="admin-role" :class="action.adminUser.role.toLowerCase()">
              {{ action.adminUser.role }}
            </div>
          </div>
        </div>
        
        <div class="action-description">
          {{ action.description }}
        </div>
        
        <div v-if="action.targetUser" class="action-target">
          <Icon name="mdi:account-arrow-right" class="target-icon" />
          <span>Cible: {{ action.targetUser.pseudo }}</span>
        </div>
        
        <div v-if="action.metadata && Object.keys(action.metadata).length > 0" class="action-metadata">
          <details class="metadata-details">
            <summary class="metadata-summary">
              <Icon name="mdi:information-outline" />
              Détails techniques
            </summary>
            <div class="metadata-content">
              <pre>{{ formatMetadata(action.metadata) }}</pre>
            </div>
          </details>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else-if="!loading && paginatedActions.length === 0" class="empty-state">
      <Icon name="mdi:history" class="empty-icon" />
      <h3>Aucune action trouvée</h3>
      <p>Aucune action administrative ne correspond aux filtres sélectionnés.</p>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="currentPage--"
        :disabled="currentPage <= 1"
        class="pagination-btn"
      >
        <Icon name="mdi:chevron-left" />
        Précédent
      </button>
      
      <div class="pagination-info">
        <span class="page-numbers">
          Page {{ currentPage }} sur {{ totalPages }}
        </span>
        <span class="results-count">
          {{ filteredActions.length }} résultats
        </span>
      </div>
      
      <button 
        @click="currentPage++"
        :disabled="currentPage >= totalPages"
        class="pagination-btn"
      >
        Suivant
        <Icon name="mdi:chevron-right" />
      </button>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="loading-state">
      <Icon name="mdi:loading" class="loading-icon" />
      <span>Chargement des logs...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useRouter } from 'vue-router'

definePageMeta({
  middleware: 'auth'
})

const { user, token } = useAuth()
const router = useRouter()

// État des données
const actions = ref([])
const admins = ref([])
const loading = ref(true)

// Filtres
const selectedActionType = ref('')
const selectedAdminId = ref('')
const selectedPeriod = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = 15

// Vérifier les permissions admin au montage
onMounted(async () => {
  if (!user.value || !['ADMIN', 'MODERATOR'].includes(user.value.role)) {
    await router.push('/dashboard')
    return
  }
  
  await loadActions()
  await loadAdmins()
})

// Charger les actions admin
const loadActions = async () => {
  try {
    loading.value = true
    
    const response = await $fetch('/api/admin/actions?limit=1000', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      actions.value = response.data
    }
    
  } catch (error) {
    console.error('Erreur chargement actions:', error)
  } finally {
    loading.value = false
  }
}

// Charger la liste des admins/modérateurs
const loadAdmins = async () => {
  try {
    const response = await $fetch('/api/admin/users?role=ADMIN&limit=100', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      const adminUsers = response.data.filter(u => ['ADMIN', 'MODERATOR'].includes(u.role))
      admins.value = adminUsers
    }
    
    const moderatorResponse = await $fetch('/api/admin/users?role=MODERATOR&limit=100', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    
    if (moderatorResponse.success) {
      const moderatorUsers = moderatorResponse.data.filter(u => ['ADMIN', 'MODERATOR'].includes(u.role))
      // Fusionner sans doublons
      const existingIds = admins.value.map(a => a.id)
      const newModerators = moderatorUsers.filter(m => !existingIds.includes(m.id))
      admins.value = [...admins.value, ...newModerators]
    }
    
  } catch (error) {
    console.error('Erreur chargement admins:', error)
  }
}

// Actions filtrées
const filteredActions = computed(() => {
  let filtered = actions.value

  // Filtre par type d'action
  if (selectedActionType.value) {
    filtered = filtered.filter(action => action.type === selectedActionType.value)
  }

  // Filtre par admin
  if (selectedAdminId.value) {
    filtered = filtered.filter(action => action.adminUserId === selectedAdminId.value)
  }

  // Filtre par période
  if (selectedPeriod.value) {
    const now = new Date()
    let startDate = new Date()
    
    switch (selectedPeriod.value) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }
    
    filtered = filtered.filter(action => new Date(action.createdAt) >= startDate)
  }

  return filtered
})

// Pagination
const totalActions = computed(() => filteredActions.value.length)
const totalPages = computed(() => Math.ceil(totalActions.value / itemsPerPage))

const paginatedActions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredActions.value.slice(start, end)
})

// Fonctions utilitaires
const filterActions = () => {
  currentPage.value = 1 // Reset pagination lors du filtrage
}

const getActionIcon = (type) => {
  const icons = {
    USER_WARN: 'mdi:alert-circle',
    USER_BAN: 'mdi:account-cancel',
    USER_UNBAN: 'mdi:account-check',
    TEAM_DISSOLVE: 'mdi:account-group-outline',
    CONTENT_MODERATE: 'mdi:file-edit-outline'
  }
  return icons[type] || 'mdi:cog'
}

const getActionTypeLabel = (type) => {
  const labels = {
    USER_WARN: 'Avertissement utilisateur',
    USER_BAN: 'Bannissement utilisateur',
    USER_UNBAN: 'Débannissement utilisateur',
    TEAM_DISSOLVE: 'Dissolution d\'équipe',
    CONTENT_MODERATE: 'Modération de contenu'
  }
  return labels[type] || type
}

const formatDate = (date) => {
  const d = new Date(date)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatMetadata = (metadata) => {
  return JSON.stringify(metadata, null, 2)
}
</script>

<style scoped>
.admin-logs {
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

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.page-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3B82D6;
  font-weight: 600;
}

.filters-section {
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filter-row {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
  flex: 1;
}

.filter-label {
  color: #9CA3AF;
  font-size: 0.9rem;
  font-weight: 500;
}

.filter-select {
  padding: 0.75rem 1rem;
  background: #111111;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 8px;
  color: #F3F4F6;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #3B82D6;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-card {
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  border-left-width: 4px;
}

.action-card:hover {
  transform: translateX(2px);
}

.action-card.action-user_warn {
  border-left-color: #F59E0B;
}

.action-card.action-user_ban {
  border-left-color: #EF4444;
}

.action-card.action-user_unban {
  border-left-color: #10B981;
}

.action-card.action-team_dissolve {
  border-left-color: #8B5CF6;
}

.action-card.action-content_moderate {
  border-left-color: #3B82D6;
}

.action-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.action-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  background: linear-gradient(135deg, #3B82D6, #2563EB);
}

.action-info {
  flex: 1;
}

.action-type {
  font-size: 1.1rem;
  font-weight: 600;
  color: #F3F4F6;
  margin-bottom: 0.25rem;
}

.action-date {
  color: #9CA3AF;
  font-size: 0.9rem;
}

.action-admin {
  text-align: right;
}

.admin-name {
  font-weight: 600;
  color: #F3F4F6;
  margin-bottom: 0.25rem;
}

.admin-role {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.admin-role.admin {
  background: linear-gradient(135deg, #EF4444, #DC2626);
  color: white;
}

.admin-role.moderator {
  background: linear-gradient(135deg, #3B82D6, #2563EB);
  color: white;
}

.action-description {
  color: #D1D5DB;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(59, 130, 214, 0.05);
  border-radius: 8px;
  border-left: 3px solid #3B82D6;
}

.action-target {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #F59E0B;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.target-icon {
  font-size: 1rem;
}

.action-metadata {
  margin-top: 1rem;
}

.metadata-details {
  background: rgba(17, 17, 17, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 214, 0.2);
}

.metadata-summary {
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9CA3AF;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.metadata-summary:hover {
  color: #3B82D6;
}

.metadata-content {
  padding: 0 1rem 1rem 1rem;
}

.metadata-content pre {
  background: #0f0f0f;
  padding: 1rem;
  border-radius: 6px;
  color: #E5E7EB;
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6B7280;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #9CA3AF;
  margin-bottom: 0.5rem;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding: 1rem;
  background: #1a1a1a;
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 214, 0.2);
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 6px;
  color: #F3F4F6;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(59, 130, 214, 0.1);
  border-color: #3B82D6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.page-numbers {
  color: #F3F4F6;
  font-weight: 500;
}

.results-count {
  color: #9CA3AF;
  font-size: 0.8rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #9CA3AF;
  gap: 1rem;
}

.loading-icon {
  font-size: 2rem;
  animation: spin 1s linear infinite;
  color: #3B82D6;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .admin-logs {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .filter-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .action-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .action-admin {
    text-align: left;
    align-self: flex-start;
  }
  
  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pagination-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>