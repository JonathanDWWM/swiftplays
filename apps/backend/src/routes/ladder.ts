import express from 'express';
import {
  createChallenge,
  getAvailableChallenges,
  acceptChallenge,
  getMyMatches,
  getLadderRanking,
  getPlayerStats,
  getGameStats,
  getSpecificGameStats,
  getRecentActivity
} from '../controllers/ladderController';
import {
  submitMatchResult,
  disputeMatchResult,
  getMatchDetails,
  cancelMatch,
  getUserPendingMatches,
  getUserCompletedMatches,
  confirmMatchResult
} from '../controllers/matchController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ===========================
// ROUTES DÉFIS (CHALLENGES)
// ===========================

// Créer un nouveau défi
router.post('/challenges', authenticateToken, createChallenge);

// Récupérer tous les défis disponibles (anonymes)
router.get('/challenges', authenticateToken, getAvailableChallenges);

// Accepter un défi spécifique
router.post('/challenges/:id/accept', authenticateToken, acceptChallenge);

// ===========================
// ROUTES MATCHS
// ===========================

// Récupérer mes matchs
router.get('/matches/my', authenticateToken, getMyMatches);

// Récupérer mes matchs en attente de résultats
router.get('/matches/pending', authenticateToken, getUserPendingMatches);

// Récupérer mes matchs terminés
router.get('/matches/completed', authenticateToken, getUserCompletedMatches);

// Récupérer les détails d'un match
router.get('/matches/:matchId', authenticateToken, getMatchDetails);

// Soumettre le résultat d'un match
router.post('/matches/:matchId/result', authenticateToken, submitMatchResult);

// Confirmer un résultat soumis par l'adversaire
router.post('/matches/:matchId/confirm', authenticateToken, confirmMatchResult);

// Contester le résultat d'un match
router.post('/matches/:matchId/dispute', authenticateToken, disputeMatchResult);

// Annuler un match
router.delete('/matches/:matchId', authenticateToken, cancelMatch);

// ===========================
// ROUTES CLASSEMENTS & STATS
// ===========================

// Récupérer le classement Ladder
router.get('/ranking', authenticateToken, getLadderRanking);

// Récupérer mes statistiques
router.get('/stats', authenticateToken, getPlayerStats);

// Récupérer les statistiques des jeux (page principale)
router.get('/stats/games', authenticateToken, getGameStats);

// Récupérer les statistiques d'un jeu spécifique (ex: FC26)
router.get('/stats/:game', authenticateToken, getSpecificGameStats);

// Récupérer l'activité récente
router.get('/activity/recent', authenticateToken, getRecentActivity);

export default router;