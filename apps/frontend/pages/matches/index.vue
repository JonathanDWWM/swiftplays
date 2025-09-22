<template>
  <div class="matches-page">
    <div class="page-header">
      <h1>Mes Matches</h1>
      <p>Gérez vos matches en cours et soumettez vos résultats</p>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        :class="['tab-button', { active: activeTab === 'pending' }]"
        @click="activeTab = 'pending'"
      >
        En attente ({{ pendingMatches.length }})
      </button>
      <button 
        :class="['tab-button', { active: activeTab === 'completed' }]"
        @click="activeTab = 'completed'"
      >
        Terminés
      </button>
    </div>

    <!-- Pending Matches Tab -->
    <div v-if="activeTab === 'pending'" class="tab-content">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement de vos matches...</p>
      </div>

      <div v-else-if="pendingMatches.length === 0" class="no-matches">
        <div class="empty-state">
          <h3>Aucun match en attente</h3>
          <p>Vous n'avez actuellement aucun match en attente de résultats.</p>
          <NuxtLink to="/ladder" class="btn btn-primary">
            Participer au Ladder
          </NuxtLink>
        </div>
      </div>

      <div v-else class="matches-grid">
        <div 
          v-for="match in pendingMatches" 
          :key="match.id"
          class="match-card"
        >
          <div class="match-header">
            <div class="game-info">
              <span :class="['game-badge', getGameClass(match.game)]">
                {{ getGameName(match.game) }}
              </span>
              <span class="mode-badge">{{ match.gameMode }}</span>
            </div>
            <div :class="['status-badge', getStatusClass(match.status)]">
              {{ getStatusText(match.status) }}
            </div>
          </div>

          <div class="match-opponents">
            <!-- Mode 1v1 -->
            <div v-if="match.gameMode === '1v1'" class="opponents-1v1">
              <div class="player">
                <img 
                  :src="getPlayerAvatar(match.player1)" 
                  :alt="match.player1.user.pseudo"
                  class="avatar"
                />
                <span class="pseudo">{{ match.player1.user.pseudo }}</span>
              </div>
              <div class="vs">VS</div>
              <div class="player">
                <img 
                  :src="getPlayerAvatar(match.player2)" 
                  :alt="match.player2.user.pseudo"
                  class="avatar"
                />
                <span class="pseudo">{{ match.player2.user.pseudo }}</span>
              </div>
            </div>

            <!-- Mode équipe -->
            <div v-else class="opponents-team">
              <div class="team">
                <h4>{{ match.team1.name }}</h4>
                <div class="team-members">
                  <img 
                    v-for="member in match.team1.members.slice(0, 3)" 
                    :key="member.id"
                    :src="getPlayerAvatar({ user: member.user })" 
                    :alt="member.user.pseudo"
                    class="member-avatar"
                  />
                  <span v-if="match.team1.members.length > 3" class="more-members">
                    +{{ match.team1.members.length - 3 }}
                  </span>
                </div>
              </div>
              <div class="vs">VS</div>
              <div class="team">
                <h4>{{ match.team2.name }}</h4>
                <div class="team-members">
                  <img 
                    v-for="member in match.team2.members.slice(0, 3)" 
                    :key="member.id"
                    :src="getPlayerAvatar({ user: member.user })" 
                    :alt="member.user.pseudo"
                    class="member-avatar"
                  />
                  <span v-if="match.team2.members.length > 3" class="more-members">
                    +{{ match.team2.members.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="match-schedule">
            <div class="schedule-info">
              <span class="label">Programmé le :</span>
              <span class="datetime">{{ formatDateTime(match.scheduledAt) }}</span>
            </div>
          </div>

          <!-- Soumissions existantes -->
          <div v-if="match.submissions.length > 0" class="submissions">
            <h4>Résultats soumis :</h4>
            <div 
              v-for="submission in match.submissions" 
              :key="submission.id"
              class="submission"
            >
              <span class="submitter">Par {{ getUserPseudo(submission.submittedBy) }}</span>
              <span class="result">
                Gagnant : {{ getWinnerName(submission.winnerId, match) }}
              </span>
              <span v-if="submission.score1 !== null || submission.score2 !== null" class="score">
                Score : {{ submission.score1 }} - {{ submission.score2 }}
              </span>
            </div>
          </div>

          <div class="match-actions">
            <button 
              v-if="canSubmitResult(match)"
              @click="openSubmitModal(match)"
              class="btn btn-primary"
            >
              Soumettre le résultat
            </button>
            
            <button 
              v-if="canConfirmResult(match)"
              @click="confirmResult(match)"
              class="btn btn-success"
            >
              Confirmer le résultat
            </button>

            <button 
              v-if="canDispute(match)"
              @click="openDisputeModal(match)"
              class="btn btn-warning"
            >
              Contester
            </button>

            <button 
              v-if="canCancel(match)"
              @click="cancelMatch(match)"
              class="btn btn-danger"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Completed Matches Tab -->
    <div v-if="activeTab === 'completed'" class="tab-content">
      <div v-if="loadingCompleted" class="loading">
        <div class="spinner"></div>
        <p>Chargement de vos matches terminés...</p>
      </div>

      <div v-else-if="completedMatches.length === 0" class="no-matches">
        <div class="empty-state">
          <h3>Aucun match terminé</h3>
          <p>Vous n'avez encore aucun match terminé.</p>
          <NuxtLink to="/ladder" class="btn btn-primary">
            Participer au Ladder
          </NuxtLink>
        </div>
      </div>

      <div v-else class="matches-grid">
        <div 
          v-for="match in completedMatches" 
          :key="match.id"
          class="match-card completed-match"
        >
          <div class="match-header">
            <div class="game-info">
              <span :class="['game-badge', getGameClass(match.game)]">
                {{ getGameName(match.game) }}
              </span>
              <span class="mode-badge">{{ match.gameMode }}</span>
            </div>
            <div :class="['status-badge', getStatusClass(match.status)]">
              {{ getStatusText(match.status) }}
            </div>
          </div>

          <div class="match-opponents">
            <!-- Mode 1v1 -->
            <div v-if="match.gameMode === '1v1'" class="opponents-1v1">
              <div :class="['player', { winner: match.winnerId === match.player1Id }]">
                <img 
                  :src="getPlayerAvatar(match.player1)" 
                  :alt="match.player1.user.pseudo"
                  class="avatar"
                />
                <span class="pseudo">{{ match.player1.user.pseudo }}</span>
                <span v-if="match.winnerId === match.player1Id" class="winner-badge">🏆</span>
              </div>
              <div class="vs">
                <span class="score" v-if="match.score1 !== null && match.score2 !== null">
                  {{ match.score1 }} - {{ match.score2 }}
                </span>
                <span v-else>VS</span>
              </div>
              <div :class="['player', { winner: match.winnerId === match.player2Id }]">
                <img 
                  :src="getPlayerAvatar(match.player2)" 
                  :alt="match.player2.user.pseudo"
                  class="avatar"
                />
                <span class="pseudo">{{ match.player2.user.pseudo }}</span>
                <span v-if="match.winnerId === match.player2Id" class="winner-badge">🏆</span>
              </div>
            </div>

            <!-- Mode équipe -->
            <div v-else class="opponents-team">
              <div :class="['team', { winner: match.winnerId === match.team1Id }]">
                <h4>
                  {{ match.team1.name }}
                  <span v-if="match.winnerId === match.team1Id" class="winner-badge">🏆</span>
                </h4>
                <div class="team-members">
                  <img 
                    v-for="member in match.team1.members.slice(0, 3)" 
                    :key="member.id"
                    :src="getPlayerAvatar({ user: member.user })" 
                    :alt="member.user.pseudo"
                    class="member-avatar"
                  />
                  <span v-if="match.team1.members.length > 3" class="more-members">
                    +{{ match.team1.members.length - 3 }}
                  </span>
                </div>
              </div>
              <div class="vs">
                <span class="score" v-if="match.score1 !== null && match.score2 !== null">
                  {{ match.score1 }} - {{ match.score2 }}
                </span>
                <span v-else>VS</span>
              </div>
              <div :class="['team', { winner: match.winnerId === match.team2Id }]">
                <h4>
                  {{ match.team2.name }}
                  <span v-if="match.winnerId === match.team2Id" class="winner-badge">🏆</span>
                </h4>
                <div class="team-members">
                  <img 
                    v-for="member in match.team2.members.slice(0, 3)" 
                    :key="member.id"
                    :src="getPlayerAvatar({ user: member.user })" 
                    :alt="member.user.pseudo"
                    class="member-avatar"
                  />
                  <span v-if="match.team2.members.length > 3" class="more-members">
                    +{{ match.team2.members.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="match-info">
            <div class="schedule-info">
              <span class="label">Joué le :</span>
              <span class="datetime">{{ formatDateTime(match.completedAt || match.scheduledAt) }}</span>
            </div>
            <div v-if="match.disputes && match.disputes.length > 0" class="dispute-info">
              <span class="dispute-badge">⚠️ En litige</span>
            </div>
          </div>

          <div class="match-actions">
            <button 
              v-if="canDispute(match) && !hasActiveDispute(match)"
              @click="openDisputeModal(match)"
              class="btn btn-warning"
            >
              Contester
            </button>
            <span v-else-if="hasActiveDispute(match)" class="dispute-status">
              Contestation en cours...
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Result Modal -->
    <div v-if="showSubmitModal" class="modal-overlay" @click="closeSubmitModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Soumettre le résultat du match</h3>
          <button @click="closeSubmitModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="submitResult">
            <div class="form-group">
              <label>Gagnant du match :</label>
              <div class="winner-selection">
                <!-- Mode 1v1 -->
                <div v-if="selectedMatch?.gameMode === '1v1'" class="winner-options">
                  <label class="winner-option">
                    <input 
                      type="radio" 
                      :value="selectedMatch.player1Id" 
                      v-model="submitForm.winnerId"
                    />
                    <span>{{ selectedMatch.player1.user.pseudo }}</span>
                  </label>
                  <label class="winner-option">
                    <input 
                      type="radio" 
                      :value="selectedMatch.player2Id" 
                      v-model="submitForm.winnerId"
                    />
                    <span>{{ selectedMatch.player2.user.pseudo }}</span>
                  </label>
                </div>

                <!-- Mode équipe -->
                <div v-else class="winner-options">
                  <label class="winner-option">
                    <input 
                      type="radio" 
                      :value="selectedMatch.team1Id" 
                      v-model="submitForm.winnerId"
                    />
                    <span>{{ selectedMatch.team1.name }}</span>
                  </label>
                  <label class="winner-option">
                    <input 
                      type="radio" 
                      :value="selectedMatch.team2Id" 
                      v-model="submitForm.winnerId"
                    />
                    <span>{{ selectedMatch.team2.name }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Score équipe 1/joueur 1 :</label>
                <input 
                  type="number" 
                  v-model.number="submitForm.score1"
                  min="0"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>Score équipe 2/joueur 2 :</label>
                <input 
                  type="number" 
                  v-model.number="submitForm.score2"
                  min="0"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Commentaires (optionnel) :</label>
              <textarea 
                v-model="submitForm.comments"
                placeholder="Ajoutez des commentaires sur le match..."
                class="form-textarea"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Preuves (screenshots, vidéos) :</label>
              <input 
                type="file" 
                multiple
                accept="image/*,video/*"
                @change="handleFileUpload"
                class="form-input"
              />
              <div v-if="submitForm.files.length > 0" class="files-preview">
                <div 
                  v-for="(file, index) in submitForm.files" 
                  :key="index"
                  class="file-preview"
                >
                  <span class="file-name">{{ file.name }}</span>
                  <button @click="removeFile(index)" class="remove-file">&times;</button>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeSubmitModal" class="btn btn-secondary">
                Annuler
              </button>
              <button 
                type="submit" 
                :disabled="!submitForm.winnerId || submitting"
                class="btn btn-primary"
              >
                {{ submitting ? 'Envoi...' : 'Soumettre' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Dispute Modal -->
    <div v-if="showDisputeModal" class="modal-overlay" @click="closeDisputeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Contester le résultat du match</h3>
          <button @click="closeDisputeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="warning-box">
            <h4>⚠️ Attention</h4>
            <p>Contester un résultat de match est une action sérieuse. Assurez-vous d'avoir des preuves valides pour justifier votre contestation.</p>
          </div>

          <form @submit.prevent="submitDispute">
            <div class="form-group">
              <label>Raison de la contestation :</label>
              <select v-model="disputeForm.reason" class="form-input" required>
                <option value="">Sélectionnez une raison</option>
                <option value="WRONG_RESULT">Résultat incorrect</option>
                <option value="SCORE_ERROR">Erreur de score</option>
                <option value="CHEATING">Tricherie suspectée</option>
                <option value="TECHNICAL_ISSUE">Problème technique</option>
                <option value="NO_SHOW">Adversaire absent</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div class="form-group">
              <label>Description détaillée :</label>
              <textarea 
                v-model="disputeForm.description"
                placeholder="Décrivez en détail les raisons de votre contestation..."
                class="form-textarea"
                required
                minlength="20"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Preuves (screenshots, vidéos, etc.) :</label>
              <input 
                type="file" 
                multiple
                accept="image/*,video/*"
                @change="handleDisputeFileUpload"
                class="form-input"
              />
              <small class="form-help">Formats acceptés : JPG, PNG, GIF, MP4, MOV, AVI (max 50MB par fichier, 5 fichiers max)</small>
              
              <div v-if="disputeForm.files.length > 0" class="files-preview">
                <div 
                  v-for="(file, index) in disputeForm.files" 
                  :key="index"
                  class="file-preview"
                >
                  <span class="file-name">{{ file.name }}</span>
                  <button @click="removeDisputeFile(index)" class="remove-file">&times;</button>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeDisputeModal" class="btn btn-secondary">
                Annuler
              </button>
              <button 
                type="submit" 
                :disabled="!disputeForm.reason || !disputeForm.description || disputing"
                class="btn btn-warning"
              >
                {{ disputing ? 'Envoi...' : 'Soumettre la contestation' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { $api } = useNuxtApp()
const { user } = useAuth()

// State
const activeTab = ref('pending')
const pendingMatches = ref([])
const completedMatches = ref([])
const loading = ref(true)
const loadingCompleted = ref(false)
const showSubmitModal = ref(false)
const showDisputeModal = ref(false)
const selectedMatch = ref(null)
const submitting = ref(false)
const disputing = ref(false)

const submitForm = ref({
  winnerId: '',
  score1: null,
  score2: null,
  comments: '',
  files: []
})

const disputeForm = ref({
  reason: '',
  description: '',
  files: []
})

// Computed
const getUserPseudo = (userId) => {
  // Helper pour récupérer le pseudo d'un utilisateur depuis les données du match
  return 'Utilisateur' // TODO: implémenter la logique
}

// Methods
const fetchPendingMatches = async () => {
  try {
    loading.value = true
    const response = await $api('/api/ladder/matches/pending')
    if (response.success) {
      pendingMatches.value = response.data
    }
  } catch (error) {
    console.error('Erreur lors du chargement des matches:', error)
  } finally {
    loading.value = false
  }
}

const fetchCompletedMatches = async () => {
  try {
    loadingCompleted.value = true
    const response = await $api('/api/ladder/matches/completed')
    if (response.success) {
      completedMatches.value = response.data
    }
  } catch (error) {
    console.error('Erreur lors du chargement des matches terminés:', error)
  } finally {
    loadingCompleted.value = false
  }
}

const getGameName = (game) => {
  const names = {
    'FC_26': 'FC 26',
    'CALL_OF_DUTY_BO7': 'COD BO7'
  }
  return names[game] || game
}

const getGameClass = (game) => {
  return game === 'FC_26' ? 'fc26' : 'cod'
}

const getStatusClass = (status) => {
  const classes = {
    'IN_PROGRESS': 'in-progress',
    'AWAITING_RESULTS': 'awaiting-results',
    'AWAITING_CONFIRMATION': 'awaiting-confirmation',
    'COMPLETED': 'completed',
    'DISPUTED': 'disputed',
    'CANCELLED': 'cancelled'
  }
  return classes[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    'IN_PROGRESS': 'En cours',
    'AWAITING_RESULTS': 'Attente résultats',
    'AWAITING_CONFIRMATION': 'Attente confirmation',
    'COMPLETED': 'Terminé',
    'DISPUTED': 'En litige',
    'CANCELLED': 'Annulé'
  }
  return texts[status] || status
}

const getPlayerAvatar = (player) => {
  return player.user.discordAvatar || player.user.avatar || '/img/default-avatar.png'
}

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('fr-FR')
}

const canSubmitResult = (match) => {
  return match.status === 'IN_PROGRESS' || match.status === 'AWAITING_RESULTS'
}

const canConfirmResult = (match) => {
  return match.status === 'AWAITING_CONFIRMATION' && 
         match.submissions.length > 0 && 
         !match.submissions.some(s => s.submittedBy === user.value.id)
}

const canDispute = (match) => {
  return match.status === 'COMPLETED'
}

const canCancel = (match) => {
  return match.status === 'IN_PROGRESS'
}

const hasActiveDispute = (match) => {
  return match.disputes && match.disputes.some(dispute => dispute.status === 'PENDING')
}

const getWinnerName = (winnerId, match) => {
  if (match.gameMode === '1v1') {
    if (winnerId === match.player1Id) return match.player1.user.pseudo
    if (winnerId === match.player2Id) return match.player2.user.pseudo
  } else {
    if (winnerId === match.team1Id) return match.team1.name
    if (winnerId === match.team2Id) return match.team2.name
  }
  return 'Inconnu'
}

const openSubmitModal = (match) => {
  selectedMatch.value = match
  submitForm.value = {
    winnerId: '',
    score1: null,
    score2: null,
    comments: '',
    files: []
  }
  showSubmitModal.value = true
}

const closeSubmitModal = () => {
  showSubmitModal.value = false
  selectedMatch.value = null
}

const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)
  try {
    const { validateFiles } = useFileUpload()
    validateFiles(files)
    submitForm.value.files = [...submitForm.value.files, ...files]
  } catch (error) {
    alert(error.message)
    event.target.value = '' // Reset input
  }
}

const removeFile = (index) => {
  submitForm.value.files.splice(index, 1)
}

const submitResult = async () => {
  try {
    submitting.value = true
    
    // Upload des fichiers si nécessaire
    let evidenceUrls = []
    
    if (submitForm.value.files.length > 0) {
      const { uploadFiles } = useFileUpload()
      try {
        evidenceUrls = await uploadFiles(submitForm.value.files)
      } catch (uploadError) {
        alert('Erreur lors de l\'upload des fichiers: ' + uploadError.message)
        return
      }
    }
    
    const response = await $api(`/api/ladder/matches/${selectedMatch.value.id}/result`, {
      method: 'POST',
      body: {
        winnerId: submitForm.value.winnerId,
        score1: submitForm.value.score1,
        score2: submitForm.value.score2,
        comments: submitForm.value.comments,
        evidenceUrls
      }
    })

    if (response.success) {
      closeSubmitModal()
      await fetchPendingMatches()
    }
  } catch (error) {
    console.error('Erreur soumission résultat:', error)
    alert('Erreur lors de la soumission: ' + error.message)
  } finally {
    submitting.value = false
  }
}

const confirmResult = async (match) => {
  try {
    const response = await $api(`/api/ladder/matches/${match.id}/confirm`, {
      method: 'POST'
    })

    if (response.success) {
      await fetchPendingMatches()
    }
  } catch (error) {
    console.error('Erreur confirmation résultat:', error)
  }
}

const cancelMatch = async (match) => {
  if (confirm('Êtes-vous sûr de vouloir annuler ce match ?')) {
    try {
      const response = await $api(`/api/ladder/matches/${match.id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        await fetchPendingMatches()
      }
    } catch (error) {
      console.error('Erreur annulation match:', error)
    }
  }
}

const openDisputeModal = (match) => {
  selectedMatch.value = match
  disputeForm.value = {
    reason: '',
    description: '',
    files: []
  }
  showDisputeModal.value = true
}

const closeDisputeModal = () => {
  showDisputeModal.value = false
  selectedMatch.value = null
}

const handleDisputeFileUpload = (event) => {
  const files = Array.from(event.target.files)
  try {
    const { validateFiles } = useFileUpload()
    validateFiles(files)
    disputeForm.value.files = [...disputeForm.value.files, ...files]
  } catch (error) {
    alert(error.message)
    event.target.value = '' // Reset input
  }
}

const removeDisputeFile = (index) => {
  disputeForm.value.files.splice(index, 1)
}

const submitDispute = async () => {
  try {
    disputing.value = true
    
    // Upload des fichiers de preuve si nécessaire
    let proofUrls = []
    
    if (disputeForm.value.files.length > 0) {
      const { uploadFiles } = useFileUpload()
      try {
        proofUrls = await uploadFiles(disputeForm.value.files)
      } catch (uploadError) {
        alert('Erreur lors de l\'upload des preuves: ' + uploadError.message)
        return
      }
    }
    
    const response = await $api(`/api/ladder/matches/${selectedMatch.value.id}/dispute`, {
      method: 'POST',
      body: {
        reason: disputeForm.value.reason,
        description: disputeForm.value.description,
        proofUrls
      }
    })

    if (response.success) {
      closeDisputeModal()
      await fetchPendingMatches()
      alert('Contestation soumise avec succès. Un modérateur examinera votre demande.')
    }
  } catch (error) {
    console.error('Erreur soumission contestation:', error)
    alert('Erreur lors de la soumission: ' + error.message)
  } finally {
    disputing.value = false
  }
}

// Watchers
watch(activeTab, (newTab) => {
  if (newTab === 'completed' && completedMatches.value.length === 0) {
    fetchCompletedMatches()
  }
})

// Lifecycle
onMounted(() => {
  fetchPendingMatches()
})

// Head
useHead({
  title: 'Mes Matches - SwiftPlays'
})
</script>

<style scoped>
.matches-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.page-header p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

/* Tabs */
.tabs {
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.tab-button {
  padding: 1rem 2rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.tab-button:hover {
  color: var(--primary-color);
}

/* Loading */
.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.no-matches {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

/* Matches Grid */
.matches-grid {
  display: grid;
  gap: 1.5rem;
}

.match-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.match-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.game-info {
  display: flex;
  gap: 0.5rem;
}

.game-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.game-badge.fc26 {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}

.game-badge.cod {
  background: linear-gradient(135deg, #f44336, #d32f2f);
}

.mode-badge {
  padding: 0.25rem 0.75rem;
  background: var(--secondary-color);
  color: white;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.in-progress {
  background: #2196F3;
  color: white;
}

.status-badge.awaiting-results {
  background: #FF9800;
  color: white;
}

.status-badge.awaiting-confirmation {
  background: #9C27B0;
  color: white;
}

.status-badge.completed {
  background: #4CAF50;
  color: white;
}

.status-badge.disputed {
  background: #FF5722;
  color: white;
}

.status-badge.cancelled {
  background: #9E9E9E;
  color: white;
}

/* Opponents */
.opponents-1v1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 1rem 0;
}

.player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.pseudo {
  font-weight: 600;
  color: var(--text-primary);
}

.vs {
  font-weight: bold;
  color: var(--primary-color);
  font-size: 1.2rem;
}

.opponents-team {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 1rem 0;
}

.team {
  text-align: center;
}

.team h4 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.team-members {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.member-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.more-members {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

/* Match Info */
.match-schedule {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: 8px;
}

.schedule-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label {
  font-weight: 500;
  color: var(--text-secondary);
}

.datetime {
  color: var(--text-primary);
  font-weight: 600;
}

/* Submissions */
.submissions {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: 8px;
}

.submissions h4 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.submission {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.submission:last-child {
  border-bottom: none;
}

.submitter {
  font-weight: 600;
  color: var(--primary-color);
}

.result {
  color: var(--text-primary);
}

.score {
  color: var(--text-secondary);
}

/* Actions */
.match-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-success {
  background: #4CAF50;
  color: white;
}

.btn-warning {
  background: #FF9800;
  color: white;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-secondary {
  background: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn:hover {
  transform: translateY(-1px);
  filter: brightness(110%);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--card-bg);
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
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--background-secondary);
  color: var(--text-primary);
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.winner-selection {
  margin-top: 0.5rem;
}

.winner-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.winner-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--background-secondary);
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.winner-option:hover {
  background: var(--primary-color-light);
}

.winner-option input[type="radio"] {
  margin: 0;
}

.files-preview {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--background-secondary);
  border-radius: 4px;
  font-size: 0.9rem;
}

.file-name {
  flex: 1;
  color: var(--text-primary);
}

.remove-file {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.2rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 2rem;
}

/* Warning Box */
.warning-box {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.warning-box h4 {
  margin: 0 0 0.5rem 0;
  color: #856404;
  font-size: 1rem;
}

.warning-box p {
  margin: 0;
  color: #856404;
  font-size: 0.9rem;
}

/* Form Help */
.form-help {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Form Select */
select.form-input {
  cursor: pointer;
}

select.form-input option {
  background: var(--card-bg);
  color: var(--text-primary);
}

/* Completed Matches Specific Styles */
.completed-match {
  border-left: 4px solid var(--primary-color);
}

.completed-match.disputed {
  border-left-color: #FF5722;
}

.player.winner,
.team.winner {
  position: relative;
}

.winner-badge {
  font-size: 1.2rem;
  margin-left: 0.5rem;
}

.dispute-info {
  margin-top: 0.5rem;
}

.dispute-badge {
  background: #ffeb3b;
  color: #856404;
  padding: 0.25rem 0.5rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
}

.dispute-status {
  color: var(--text-secondary);
  font-style: italic;
  font-size: 0.9rem;
}

.match-info {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: 8px;
}

.score {
  font-weight: bold;
  color: var(--primary-color);
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .matches-page {
    padding: 1rem;
  }
  
  .opponents-1v1,
  .opponents-team {
    gap: 1rem;
  }
  
  .match-actions {
    flex-direction: column;
  }
  
  .btn {
    text-align: center;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>