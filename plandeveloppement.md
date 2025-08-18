# Plan de développement - SwiftPlays

## 🎯 Roadmap par phases

## Phase 1 : Fondations & Authentification

*Objectif : Base fonctionnelle avec authentification complète et pages essentielles*

### Setup initial ✅ TERMINÉ

**Vous (développeur principal)**

- [x] Configuration Git + dépôt (GitHub/GitLab)
- [x] Setup serveur de développement (Hetzner)
- [x] Setup Nuxt 3 + structure projet frontend
- [x] Configuration base backend Express + TypeScript
- [x] Setup base de données PostgreSQL + Prisma sur serveur

### Pages fondamentales

**Vous**

- [x] Page d'accueil (landing page)
- [x] Layout de base + navigation
- [x] Page À propos / Présentation de SwiftPlays
- [x] Footer avec liens légaux
- [x] Pages d'erreur (404, 500)

### Système d'authentification JWT

**Vous**

- [x] Modèle User en base de données
- [x] Hash des mots de passe (bcrypt)
- [x] Génération/validation JWT
- [x] Middleware de sécurité
- [x] API routes auth (register, login, logout, refresh)
- [x] Validation des données (email, password strength)

### Pages d'authentification

**Vous**

- [x] Page inscription (email + mot de passe)
- [x] Page connexion
- [x] Formulaires avec validation côté client
- [x] Gestion des erreurs d'auth
- [x] Redirection après connexion

### Dashboard utilisateur

**Vous**

- [x] Page dashboard post-connexion
- [x] Navigation utilisateur connecté
- [x] Affichage des infos utilisateur de base
- [x] Bouton déconnexion

### Intégration Discord OAuth ✅ TERMINÉ

**Vous**

- [x] Configuration Discord OAuth
- [x] Route d'authentification Discord
- [x] Récupération données Discord (pseudo, avatar)
- [x] Liaison compte Discord ↔ compte classique
- [x] Pages connexion avec choix auth classique/Discord
- [x] Création automatique de comptes via Discord
- [x] Système de types de comptes (EMAIL, DISCORD, HYBRID)

-----

## Phase 2 : Profils utilisateurs

*Objectif : Gestion complète des profils et personnalisation*

### Modèles et API

**Vous**

- [ ] Extension du modèle User (pseudo, bio, avatar, stats)
- [ ] Modèles Game (jeux supportés)
- [ ] API gestion profils (GET, PUT /api/users/profile)
- [ ] Upload d'images (Cloudinary ou local)
- [ ] Validation des données profil
- [ ] API recherche utilisateurs

### Interface profil utilisateur

**Vous**

- [ ] Page profil utilisateur (affichage public)
- [ ] Page modification profil (privée)
- [ ] Formulaires de modification profil
- [ ] Upload d'avatar
- [ ] Composants d'affichage statistiques
- [ ] Historique des activités utilisateur

-----

## Phase 3 : Système d'équipes

*Objectif : Création/gestion équipes + rôles*

### Modèles et API équipes

**Vous**

- [ ] Modèles base données équipes
- [ ] API création/dissolution équipes
- [ ] Système de rôles (Capitaine, Vice-capitaine, Membre)
- [ ] Invitations/acceptations équipes
- [ ] Gestion des permissions par rôle

### Interface gestion équipes

**Vous**

- [ ] Pages de création d'équipe
- [ ] Interface gestion des membres
- [ ] Affichage des statistiques équipe
- [ ] Page équipe publique
- [ ] Système d'invitations

### Système de transferts

**Vous**

- [ ] API transferts joueurs
- [ ] Système de jokers quotidiens
- [ ] Notifications transferts
- [ ] Validation des contraintes
- [ ] Interface de demande transfert
- [ ] Historique des transferts
- [ ] Notifications frontend

-----

## Phase 4 : Système Ladder

*Objectif : Matchmaking et classements*

### Ladder de base

**Vous**

- [ ] Modèles matches + résultats
- [ ] API matchmaking
- [ ] Système de classement ELO
- [ ] Gestion des forfaits/annulations
- [ ] Interface de défis
- [ ] Tableaux de classement
- [ ] Historique des matches

### Système de litiges

**Vous**

- [ ] API gestion litiges
- [ ] Système de preuves (screenshots)
- [ ] Modération/sanctions
- [ ] Système de réputation
- [ ] Interface signalement
- [ ] Affichage des litiges
- [ ] Système de notation post-match

-----

## Phase 5 : Championnats

*Objectif : Compétitions fermées par divisions*

### Structure championnats

**Vous**

- [ ] Modèles championnats/divisions
- [ ] API inscriptions championnats
- [ ] Génération calendriers automatique
- [ ] Système de points/classement
- [ ] Pages des championnats
- [ ] Calendrier des matches
- [ ] Tableaux de classement

### Gestion avancée

**Vous**

- [ ] Système de sanctions/réputation
- [ ] API gestion retards/forfaits
- [ ] Notifications automatiques
- [ ] Système de récompenses
- [ ] Interface admin championnats
- [ ] Notifications frontend temps réel
- [ ] Système de badges/récompenses

-----

## Phase 6 : Bot Discord & Intégration

*Objectif : Bot Discord + synchronisation complète*

### Bot Discord

**Vous**

- [ ] Création bot Discord
- [ ] Commandes de base (/profil, /équipe, /classement)
- [ ] Synchronisation données site ↔ Discord
- [ ] Notifications automatiques Discord
- [ ] Webhook Discord pour événements

### Système de notifications avancé

**Vous**

- [ ] Notifications temps réel (Socket.io)
- [ ] Emails de notification
- [ ] Interface paramètres notifications
- [ ] Tableau de bord admin
- [ ] Tableaux de bord utilisateur avancés

### Documentation

**Vous**

- [ ] Documentation utilisateur
- [ ] Pages d'aide/FAQ
- [ ] Tutoriels intégrés
- [ ] Guide d'utilisation du bot Discord

-----

## Phase 7 : Tournois & Monétisation

*Objectif : Système de tournois + préparation revenus*

### Système de tournois

**Vous**

- [ ] Modèles tournois (élimination, groupes)
- [ ] API inscriptions/brackets
- [ ] Système de seeds
- [ ] Gestion des phases de tournoi
- [ ] Interface création tournois
- [ ] Affichage brackets interactifs
- [ ] Suivi des résultats en temps réel

### Préparation monétisation

**Vous**

- [ ] Système de portefeuille interne
- [ ] Intégration paiements (Stripe)
- [ ] API transactions
- [ ] Système de publicité
- [ ] Interface portefeuille utilisateur
- [ ] Historique transactions
- [ ] Espaces publicitaires

-----

## Phase 8 : Optimisations & Production

*Objectif : Performance et stabilité*

### Performance & Monitoring

**Vous**

- [ ] Optimisations performance frontend
- [ ] Cache Redis pour les données fréquentes
- [ ] Monitoring avec Sentry
- [ ] Analytics utilisateurs
- [ ] Tests automatisés (backend + frontend)

### Déploiement avancé

**Vous**

- [ ] CI/CD GitHub Actions
- [ ] Scripts de déploiement automatique
- [ ] Backup automatique base de données
- [ ] Monitoring serveur

-----

## 🎯 Livrables par phase

### Phase 1 : Site fonctionnel avec auth ✅ TERMINÉ
- Page d'accueil professionnelle ✅
- Inscription/connexion complète (email ✅ + Discord ✅)
- Dashboard utilisateur style application ✅
- Emails de bienvenue automatiques ✅
- Pages légales et erreurs ✅
- Authentification Discord OAuth complète ✅

### Phase 2 : Profils utilisateurs
- Profils personnalisables
- Upload d'avatars
- Pages publiques utilisateurs

### Phase 3 : Système d'équipes
- Création/gestion équipes
- Système de rôles complet
- Transferts et mercato

### Phase 4 : Compétition ladder
- Matchmaking fonctionnel
- Classements ELO
- Système de litiges

### Phase 5 : Championnats
- Divisions et calendriers
- Système de points
- Interface admin

### Phase 6 : Intégration Discord
- Bot Discord fonctionnel
- Synchronisation complète
- Notifications temps réel

### Phase 7 : Tournois et monétisation
- Système de tournois complet
- Paiements intégrés
- Génération de revenus

### Phase 8 : Produit final optimisé
- Performance maximale
- Monitoring complet
- Déploiement automatisé

-----

## 🚀 PROCHAINE ÉTAPE IMMÉDIATE
**Phase 1 - ✅ COMPLÈTEMENT TERMINÉE :**
1. ✅ Page d'accueil → Vitrine professionnelle
2. ✅ Auth JWT → Base solide
3. ✅ Dashboard → Experience post-connexion style app
4. ✅ Emails → Service automatique
5. ✅ Pages manquantes → À propos, Footer, Erreurs
6. ✅ Discord OAuth → Authentification complète avec liaison de comptes

**Phase 2 - Démarrage immédiat :**
1. Extension du modèle User (pseudo, bio, avatar, stats)
2. Pages de gestion des profils utilisateurs
3. Upload d'avatars et personnalisation
4. API gestion profils (GET, PUT /api/users/profile)