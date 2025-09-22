<template>
  <div class="admin-teams">
    <div class="page-header">
      <h1 class="page-title">Gestion des Équipes</h1>
      <div class="page-stats">
        <span class="stat-item">
          <Icon name="mdi:account-group" />
          {{ totalTeams }} équipes
        </span>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="filters-section">
      <div class="search-box">
        <Icon name="mdi:magnify" class="search-icon" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Rechercher une équipe..."
          class="search-input"
          @input="searchTeams"
        />
      </div>
      
      <div class="filter-controls">
        <select v-model="selectedGame" @change="filterTeams" class="filter-select">
          <option value="">Tous les jeux</option>
          <option value="FC24">FC24</option>
          <option value="COD">Call of Duty</option>
          <option value="VALORANT">Valorant</option>
        </select>
        
        <select v-model="selectedStatus" @change="filterTeams" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actives</option>
          <option value="INACTIVE">Inactives</option>
        </select>
      </div>
    </div>

    <!-- Liste des équipes -->
    <div class="teams-grid" v-if="!loading && filteredTeams.length > 0">
      <div 
        v-for="team in paginatedTeams" 
        :key="team.id"
        class="team-card"
      >
        <div class="team-header">
          <div class="team-info">
            <h3 class="team-name">{{ team.name }}</h3>
            <div class="team-meta">
              <span class="team-game">{{ team.game || 'Non spécifié' }}</span>
              <span class="team-members-count">
                <Icon name="mdi:account-group" />
                {{ team.members?.length || 0 }} membres
              </span>
            </div>
          </div>
          
          <div class="team-actions">
            <button 
              @click="viewTeamDetails(team)"
              class="action-btn view-btn"
              title="Voir détails"
            >
              <Icon name="mdi:eye" />
            </button>
            <button 
              @click="confirmDissolveTeam(team)"
              class="action-btn danger-btn"
              title="Dissoudre équipe"
            >
              <Icon name="mdi:delete" />
            </button>
          </div>
        </div>

        <div class="team-captain" v-if="team.owner">
          <Icon name="mdi:crown" class="captain-icon" />
          <span>Propriétaire: {{ team.owner.pseudo }}</span>
        </div>

        <div class="team-stats">
          <div class="stat">
            <span class="stat-label">Créée le</span>
            <span class="stat-value">{{ formatDate(team.createdAt) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Dernière activité</span>
            <span class="stat-value">{{ formatDate(team.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else-if="!loading && filteredTeams.length === 0" class="empty-state">
      <Icon name="mdi:account-group-outline" class="empty-icon" />
      <h3>Aucune équipe trouvée</h3>
      <p>{{ searchQuery ? 'Aucun résultat pour votre recherche' : 'Aucune équipe correspondante aux filtres' }}</p>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="currentPage--"
        :disabled="currentPage <= 1"
        class="pagination-btn"
      >
        <Icon name="mdi:chevron-left" />
      </button>
      
      <span class="pagination-info">
        Page {{ currentPage }} sur {{ totalPages }}
      </span>
      
      <button 
        @click="currentPage++"
        :disabled="currentPage >= totalPages"
        class="pagination-btn"
      >
        <Icon name="mdi:chevron-right" />
      </button>
    </div>

    <!-- Modal de confirmation de dissolution -->
    <div v-if="teamToDissolve" class="modal-overlay" @click="cancelDissolve">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Confirmer la dissolution</h3>
          <button @click="cancelDissolve" class="modal-close">
            <Icon name="mdi:close" />
          </button>
        </div>
        
        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir dissoudre l'équipe <strong>{{ teamToDissolve.name }}</strong> ?</p>
          <p class="warning-text">Cette action est irréversible et supprimera définitivement l'équipe.</p>
        </div>
        
        <div class="modal-actions">
          <button @click="cancelDissolve" class="btn-secondary">Annuler</button>
          <button @click="dissolveTeam" class="btn-danger" :disabled="dissolving">
            <Icon v-if="dissolving" name="mdi:loading" class="spinning" />
            {{ dissolving ? 'Dissolution...' : 'Dissoudre' }}
          </button>
        </div>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="loading-state">
      <Icon name="mdi:loading" class="loading-icon" />
      <span>Chargement des équipes...</span>
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
const teams = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedGame = ref('')
const selectedStatus = ref('')
const teamToDissolve = ref(null)
const dissolving = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = 12

// Vérifier les permissions admin au montage
onMounted(async () => {
  if (!user.value || !['ADMIN', 'MODERATOR'].includes(user.value.role)) {
    await router.push('/dashboard')
    return
  }
  
  await loadTeams()
})

// Charger les équipes
const loadTeams = async () => {
  try {
    loading.value = true
    
    const response = await $fetch('/api/admin/teams', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      teams.value = response.data
    }
    
  } catch (error) {
    console.error('Erreur chargement équipes:', error)
  } finally {
    loading.value = false
  }
}

// Équipes filtrées
const filteredTeams = computed(() => {
  let filtered = teams.value

  // Recherche par nom
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(team => 
      team.name.toLowerCase().includes(query) ||
      team.owner?.pseudo.toLowerCase().includes(query)
    )
  }

  // Filtre par jeu
  if (selectedGame.value) {
    filtered = filtered.filter(team => team.game === selectedGame.value)
  }

  // Filtre par statut
  if (selectedStatus.value) {
    filtered = filtered.filter(team => team.status === selectedStatus.value)
  }

  return filtered
})

// Pagination
const totalTeams = computed(() => filteredTeams.value.length)
const totalPages = computed(() => Math.ceil(totalTeams.value / itemsPerPage))

const paginatedTeams = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredTeams.value.slice(start, end)
})

// Fonctions de recherche et filtrage
const searchTeams = () => {
  currentPage.value = 1 // Reset pagination sur recherche
}

const filterTeams = () => {
  currentPage.value = 1 // Reset pagination sur filtre
}

// Gestion des équipes
const viewTeamDetails = (team) => {
  // Rediriger vers la page de détails de l'équipe
  router.push(`/equipe/${team.id}`)
}

const confirmDissolveTeam = (team) => {
  teamToDissolve.value = team
}

const cancelDissolve = () => {
  teamToDissolve.value = null
}

const dissolveTeam = async () => {
  if (!teamToDissolve.value) return
  
  try {
    dissolving.value = true
    
    const response = await $fetch(`/api/admin/teams/${teamToDissolve.value.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    
    if (response.success) {
      // Retirer l'équipe de la liste
      teams.value = teams.value.filter(t => t.id !== teamToDissolve.value.id)
      teamToDissolve.value = null
      
      // Message de succès (pourrait utiliser un toast)
      console.log('Équipe dissoute avec succès')
    }
    
  } catch (error) {
    console.error('Erreur dissolution équipe:', error)
  } finally {
    dissolving.value = false
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<style scoped>
.admin-teams {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6B7280;
  font-size: 1.2rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 8px;
  color: #F3F4F6;
  font-size: 0.95rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3B82D6;
}

.filter-controls {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 8px;
  color: #F3F4F6;
  font-size: 0.95rem;
  min-width: 150px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #3B82D6;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.team-card {
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.team-card:hover {
  border-color: #3B82D6;
  transform: translateY(-2px);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.team-info {
  flex: 1;
}

.team-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #F3F4F6;
  margin: 0 0 0.5rem 0;
}

.team-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #9CA3AF;
  font-size: 0.9rem;
}

.team-members-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.team-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.view-btn {
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
}

.view-btn:hover {
  background: rgba(59, 130, 214, 0.2);
}

.danger-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.danger-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.team-captain {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #F59E0B;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.captain-icon {
  font-size: 1rem;
}

.team-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(59, 130, 214, 0.1);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  color: #6B7280;
  font-size: 0.8rem;
}

.stat-value {
  color: #F3F4F6;
  font-size: 0.9rem;
  font-weight: 500;
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
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 6px;
  color: #F3F4F6;
  cursor: pointer;
  transition: all 0.2s ease;
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
  color: #9CA3AF;
  font-size: 0.9rem;
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
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.modal-header h3 {
  color: #F3F4F6;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(59, 130, 214, 0.1);
  color: #3B82D6;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  color: #D1D5DB;
  margin-bottom: 1rem;
}

.warning-text {
  color: #F59E0B !important;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(59, 130, 214, 0.1);
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(59, 130, 214, 0.3);
  border-radius: 6px;
  color: #9CA3AF;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: #3B82D6;
  color: #3B82D6;
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #EF4444;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-danger:hover:not(:disabled) {
  background: #DC2626;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.loading-icon, .spinning {
  font-size: 2rem;
  animation: spin 1s linear infinite;
  color: #3B82D6;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .admin-teams {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-controls {
    justify-content: stretch;
  }
  
  .filter-select {
    flex: 1;
  }
  
  .teams-grid {
    grid-template-columns: 1fr;
  }
  
  .team-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .team-actions {
    align-self: flex-start;
  }
}
</style>