import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/auth';

/**
 * Soumettre le résultat d'un match
 */
export const submitMatchResult = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { winnerId, player1Score, player2Score, proofUrls } = req.body;
    const userId = req.user!.userId;

    // Récupérer le match avec les joueurs
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        },
        player2: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match introuvable'
      });
    }

    // Vérifier que l'utilisateur fait partie du match
    const isPlayer1 = match.player1.user.id === userId;
    const isPlayer2 = match.player2.user.id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à soumettre le résultat de ce match'
      });
    }

    // Vérifier que le match est en cours
    if (match.status !== 'IN_PROGRESS') {
      return res.status(409).json({
        success: false,
        message: 'Ce match n\'est plus en cours'
      });
    }

    // Valider que le winnerId correspond à l'un des joueurs
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return res.status(400).json({
        success: false,
        message: 'Le gagnant doit être l\'un des deux joueurs du match'
      });
    }

    // Déterminer le perdant
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

    // Vérifier qu'un résultat n'a pas déjà été soumis
    if (match.resultSubmittedBy) {
      return res.status(409).json({
        success: false,
        message: 'Un résultat a déjà été soumis pour ce match'
      });
    }

    const now = new Date();

    // Transaction pour mettre à jour le match et les statistiques
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour le match
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          status: 'COMPLETED',
          winnerId,
          loserId,
          player1Score,
          player2Score,
          proofUrls,
          resultSubmittedBy: userId,
          resultSubmittedAt: now,
          completedAt: now
        },
        include: {
          player1: {
            include: {
              user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
            }
          },
          player2: {
            include: {
              user: { select: { id: true, pseudo: true, avatar: true, discordAvatar: true } }
            }
          }
        }
      });

      // Mettre à jour les statistiques du gagnant
      await tx.ladderPlayer.update({
        where: { id: winnerId },
        data: {
          victories: { increment: 1 },
          matchesPlayed: { increment: 1 },
          lastMatchAt: now
        }
      });

      // Mettre à jour les statistiques du perdant
      await tx.ladderPlayer.update({
        where: { id: loserId },
        data: {
          defeats: { increment: 1 },
          matchesPlayed: { increment: 1 },
          lastMatchAt: now
        }
      });

      // Mettre à jour le statut du challenge associé
      if (updatedMatch.challenge) {
        await tx.challenge.update({
          where: { matchId: matchId },
          data: { status: 'COMPLETED' }
        });
      }

      return updatedMatch;
    });

    res.json({
      success: true,
      data: result,
      message: 'Résultat du match soumis avec succès'
    });

  } catch (error) {
    console.error('Erreur soumission résultat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Contester le résultat d'un match
 */
export const disputeMatchResult = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const { reason, description, proofUrls } = req.body;
    const userId = req.user!.userId;

    // Récupérer le match avec les joueurs
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        },
        player2: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match introuvable'
      });
    }

    // Vérifier que l'utilisateur fait partie du match
    const isPlayer1 = match.player1.user.id === userId;
    const isPlayer2 = match.player2.user.id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à contester ce match'
      });
    }

    // Vérifier que le match est complété
    if (match.status !== 'COMPLETED') {
      return res.status(409).json({
        success: false,
        message: 'Seuls les matchs terminés peuvent être contestés'
      });
    }

    // Vérifier qu'il n'y a pas déjà une contestation en cours
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        matchId,
        status: 'PENDING'
      }
    });

    if (existingDispute) {
      return res.status(409).json({
        success: false,
        message: 'Une contestation est déjà en cours pour ce match'
      });
    }

    // Vérifier que l'utilisateur n'est pas celui qui a soumis le résultat
    if (match.resultSubmittedBy === userId) {
      return res.status(409).json({
        success: false,
        message: 'Vous ne pouvez pas contester un résultat que vous avez soumis'
      });
    }

    // Transaction pour créer la contestation et mettre à jour le match
    const result = await prisma.$transaction(async (tx) => {
      // Créer la contestation
      const dispute = await tx.dispute.create({
        data: {
          matchId,
          disputedBy: userId,
          reason,
          description,
          proofUrls
        }
      });

      // Mettre à jour le statut du match
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: 'DISPUTED',
          isDisputed: true
        }
      });

      return dispute;
    });

    res.json({
      success: true,
      data: result,
      message: 'Contestation soumise avec succès. Un modérateur examinera votre demande.'
    });

  } catch (error) {
    console.error('Erreur contestation match:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Récupérer les détails d'un match
 */
export const getMatchDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const userId = req.user!.userId;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true,
                discordAvatar: true
              }
            }
          }
        },
        player2: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatar: true,
                discordAvatar: true
              }
            }
          }
        },
        disputes: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            reason: true,
            description: true,
            disputedBy: true,
            createdAt: true
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match introuvable'
      });
    }

    // Vérifier que l'utilisateur a le droit de voir ce match
    const isPlayer1 = match.player1.user.id === userId;
    const isPlayer2 = match.player2.user.id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à voir ce match'
      });
    }

    res.json({
      success: true,
      data: match
    });

  } catch (error) {
    console.error('Erreur récupération détails match:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Annuler un match (avant qu'il commence)
 */
export const cancelMatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const userId = req.user!.userId;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        },
        player2: {
          include: {
            user: { select: { id: true, pseudo: true } }
          }
        },
        challenge: true
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match introuvable'
      });
    }

    // Vérifier que l'utilisateur fait partie du match
    const isPlayer1 = match.player1.user.id === userId;
    const isPlayer2 = match.player2.user.id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à annuler ce match'
      });
    }

    // Vérifier que le match n'a pas encore commencé/terminé
    if (match.status !== 'IN_PROGRESS') {
      return res.status(409).json({
        success: false,
        message: 'Ce match ne peut plus être annulé'
      });
    }

    // Vérifier que le match n'est pas trop proche (moins d'1h)
    const now = new Date();
    const oneHourBeforeMatch = new Date(match.scheduledAt.getTime() - 60 * 60 * 1000);
    
    if (now > oneHourBeforeMatch) {
      return res.status(409).json({
        success: false,
        message: 'Vous ne pouvez plus annuler un match moins d\'1 heure avant l\'heure prévue'
      });
    }

    // Transaction pour annuler le match et remettre le challenge en PENDING
    await prisma.$transaction(async (tx) => {
      // Annuler le match
      await tx.match.update({
        where: { id: matchId },
        data: { status: 'CANCELLED' }
      });

      // Si le match avait un challenge associé, le remettre en PENDING
      if (match.challenge) {
        await tx.challenge.update({
          where: { id: match.challenge.id },
          data: {
            status: 'PENDING',
            acceptorId: null,
            matchId: null
          }
        });
      }
    });

    res.json({
      success: true,
      message: 'Match annulé avec succès'
    });

  } catch (error) {
    console.error('Erreur annulation match:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};