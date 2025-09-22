<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">Panel Administrateur</h1>
      <div class="admin-info">
        <Icon name="mdi:shield-account" class="admin-icon" />
        <span>{{ user.pseudo }} ({{ user.role }})</span>
      </div>
    </div>

    <!-- Statistiques en temps réel -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon users">
          <Icon name="mdi:account-group" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.users?.total || 0 }}</div>
          <div class="stat-label">Utilisateurs Total</div>
          <div class="stat-change positive" v-if="stats.users?.newToday">
            +{{ stats.users.newToday }} aujourd'hui
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon teams">
          <Icon name="mdi:account-multiple" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.teams?.total || 0 }}</div>
          <div class="stat-label">Équipes Total</div>
          <div class="stat-change positive" v-if="stats.teams?.newThisWeek">
            +{{ stats.teams.newThisWeek }} cette semaine
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon activity">
          <Icon name="mdi:sword-cross" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.activity?.activeChallenges || 0 }}</div>
          <div class="stat-label">Défis Actifs</div>
          <div class="stat-sublabel">{{ stats.activity?.activeMatches || 0 }} matchs en cours</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon moderation">
          <Icon name="mdi:gavel" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.users?.banned || 0 }}</div>
          <div class="stat-label">Utilisateurs Bannis</div>
          <div class="stat-sublabel">{{ stats.moderation?.recentActions || 0 }} actions récentes</div>
        </div>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="quick-actions">
      <h2>Actions Rapides</h2>
      <div class="actions-grid">
        <NuxtLink to="/admin/users" class="action-card">
          <Icon name="mdi:account-cog" />
          <span>Gérer Utilisateurs</span>
        </NuxtLink>
        <NuxtLink to="/admin/teams" class="action-card">
          <Icon name="mdi:account-group-outline" />
          <span>Gérer Équipes</span>
        </NuxtLink>
        <NuxtLink to="/admin/sanctions" class="action-card">
          <Icon name="mdi:gavel" />
          <span>Sanctions</span>
        </NuxtLink>
        <NuxtLink to="/admin/logs" class="action-card">
          <Icon name="mdi:history" />
          <span>Logs Admin</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Activité récente -->
    <div class="recent-activity" v-if="recentActions.length > 0">
      <h2>Activité Administrative Récente</h2>
      <div class="activity-list">
        <div 
          v-for="action in recentActions" 
          :key="action.id"
          class="activity-item"
        >
          <div class="activity-icon">
            <Icon :name="getActionIcon(action.type)" />
          </div>
          <div class="activity-content">
            <div class="activity-description">{{ action.description }}</div>
            <div class="activity-meta">
              Par {{ action.adminUser.pseudo }} • {{ formatDate(action.createdAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="loading-overlay">
      <Icon name="mdi:loading" class="loading-icon" />
      <span>Chargement des données...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useRouter } from 'vue-router'

definePageMeta({
  middleware: 'auth'
})

const { user, token } = useAuth()
const router = useRouter()

const stats = ref({})
const recentActions = ref([])
const loading = ref(true)

// Vérifier les permissions admin au montage
onMounted(async () => {
  if (!user.value || !['ADMIN', 'MODERATOR'].includes(user.value.role)) {
    await router.push('/dashboard')
    return
  }
  
  await loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // Charger les statistiques
    const statsResponse = await $fetch('/api/admin/dashboard/stats', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    
    if (statsResponse.success) {
      stats.value = statsResponse.data
    }
    
    // Charger les actions récentes
    const actionsResponse = await $fetch('/api/admin/actions?limit=5', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    
    if (actionsResponse.success) {
      recentActions.value = actionsResponse.data
    }
    
  } catch (error) {
    console.error('Erreur chargement dashboard admin:', error)
  } finally {
    loading.value = false
  }
}

const getActionIcon = (type) => {
  const icons = {
    USER_WARN: 'mdi:alert',
    USER_BAN: 'mdi:account-cancel',
    USER_UNBAN: 'mdi:account-check',
    TEAM_DISSOLVE: 'mdi:account-group-outline',
    CONTENT_MODERATE: 'mdi:file-edit'
  }
  return icons[type] || 'mdi:cog'
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.admin-dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #3B82D6;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  color: #F3F4F6;
  margin: 0;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3B82D6;
  font-weight: 600;
}

.admin-icon {
  font-size: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: #3B82D6;
  transform: translateY(-2px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-icon.users { background: linear-gradient(135deg, #3B82D6, #2563EB); }
.stat-icon.teams { background: linear-gradient(135deg, #10B981, #059669); }
.stat-icon.activity { background: linear-gradient(135deg, #F59E0B, #D97706); }
.stat-icon.moderation { background: linear-gradient(135deg, #EF4444, #DC2626); }

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #F3F4F6;
  line-height: 1;
}

.stat-label {
  color: #9CA3AF;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.stat-change {
  font-size: 0.8rem;
  font-weight: 600;
}

.stat-change.positive {
  color: #10B981;
}

.stat-sublabel {
  color: #6B7280;
  font-size: 0.8rem;
}

.quick-actions {
  margin-bottom: 2rem;
}

.quick-actions h2 {
  color: #F3F4F6;
  margin-bottom: 1rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-card {
  background: #1a1a1a;
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  text-decoration: none;
  color: #F3F4F6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.action-card:hover {
  border-color: #3B82D6;
  background: rgba(59, 130, 214, 0.1);
  transform: translateY(-2px);
}

.action-card svg {
  font-size: 2rem;
  color: #3B82D6;
}

.recent-activity h2 {
  color: #F3F4F6;
  margin-bottom: 1rem;
}

.activity-list {
  background: #1a1a1a;
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 214, 0.2);
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(59, 130, 214, 0.1);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  background: rgba(59, 130, 214, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3B82D6;
}

.activity-content {
  flex: 1;
}

.activity-description {
  color: #F3F4F6;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.activity-meta {
  color: #9CA3AF;
  font-size: 0.85rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #F3F4F6;
  z-index: 9999;
}

.loading-icon {
  font-size: 3rem;
  animation: spin 1s linear infinite;
  color: #3B82D6;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>