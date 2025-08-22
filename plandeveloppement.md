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

## Phase 2 : Recherche et Profils Utilisateurs ✅ TERMINÉ

*Objectif : Gestion des profils et fonctionnalités de recherche*

### Système de recherche ✅ TERMINÉ

**Vous**

- [x] API recherche utilisateurs (`/api/search/users`)
- [x] Composant SearchBar avec autocomplete
- [x] Debounce et optimisations de recherche
- [x] Gestion des tokens d'authentification expirés
- [x] Intégration dans le header de l'application

### Profils utilisateurs publics ✅ TERMINÉ

**Vous**

- [x] Pages profil utilisateur publiques (`/u/[pseudo]`)
- [x] API endpoint profils publics (`/api/search/users/:pseudo`)
- [x] Affichage des informations utilisateur publiques
- [x] Navigation depuis la recherche vers les profils
- [x] Design responsive et intégration au système d'auth

-----

## Phase 3 : Système d'équipes ✅ TERMINÉ

*Objectif : Création/gestion équipes complète avec rôles et invitations*

### Modèles et API équipes ✅ TERMINÉ

**Vous**

- [x] Modèles Prisma Team, TeamMember, TeamInvitation
- [x] Migration base de données avec relations
- [x] API création équipes (`POST /api/teams`)
- [x] API dissolution équipes (`DELETE /api/teams/:id`)
- [x] Système de rôles (Capitaine, Membre)
- [x] API modification équipes (`PUT /api/teams/:id`)
- [x] API récupération équipes utilisateur (`GET /api/teams/my`)
- [x] API détails équipe (`GET /api/teams/:id`)

### Système d'invitations ✅ TERMINÉ

**Vous**

- [x] API invitations équipes (`POST /api/teams/:id/invite`)
- [x] API réception invitations (`GET /api/teams/invitations/received`)
- [x] API réponse aux invitations (`POST /api/teams/invitations/:id/respond`)
- [x] Validation des contraintes (capacité équipe, doublons)
- [x] Gestion des statuts d'invitation (PENDING, ACCEPTED, DECLINED)

### Gestion des membres ✅ TERMINÉ

**Vous**

- [x] API suppression membres (`DELETE /api/teams/:id/members/:memberId`)
- [x] API quitter équipe (`POST /api/teams/:id/leave`)
- [x] Validation des permissions par rôle
- [x] Protection contre auto-exclusion du capitaine
- [x] Contraintes d'intégrité et transactions

### Interface gestion équipes ✅ TERMINÉ

**Vous**

- [x] Page "Mes Équipes" (`/equipes`) avec grille d'équipes
- [x] Modal création d'équipe avec validation complète
- [x] Page détail équipe (`/equipes/[id]`) avec gestion membres
- [x] Interface invitations membres (modal + formulaire)
- [x] Page gestion invitations reçues (`/invitations`)
- [x] Actions contextuelles selon le rôle (capitaine/membre)
- [x] Boutons dissolution équipe et quitter équipe
- [x] Badges et indicateurs de rôle (couronnes capitaines)
- [x] Design responsive et états de chargement/erreur

### Fonctionnalités avancées ✅ TERMINÉ

**Vous**

- [x] Équipes publiques/privées avec contrôle d'accès
- [x] Capacités variables d'équipes (2-20 membres)
- [x] Historique et dates d'adhésion des membres
- [x] Messages personnalisés dans les invitations
- [x] Navigation intégrée dans sidebar application
- [x] Gestion complète des erreurs et confirmations utilisateur

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

### Phase 2 : Recherche et profils utilisateurs ✅ TERMINÉ
- Système de recherche d'utilisateurs complet ✅
- Pages profil utilisateur publiques ✅
- Integration dans l'application ✅

### Phase 3 : Système d'équipes ✅ TERMINÉ
- Création/gestion/dissolution équipes ✅
- Système de rôles et permissions ✅
- Invitations et gestion membres ✅
- Interface complète avec toutes les fonctionnalités ✅

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

**Phase 2 - ✅ COMPLÈTEMENT TERMINÉE :**
1. ✅ Système de recherche utilisateurs avec autocomplete
2. ✅ Pages profil utilisateur publiques (/u/[pseudo])
3. ✅ Intégration complète dans l'application

**Phase 3 - ✅ COMPLÈTEMENT TERMINÉE :**
1. ✅ Système d'équipes complet avec base de données
2. ✅ Interface création/gestion/dissolution équipes  
3. ✅ Système d'invitations avec notifications interactives
4. ✅ Gestion des membres et permissions par rôle (Capitaine/Vice-capitaine/Membre)
5. ✅ Pages dédiées : /equipes, /equipes/[id], /notifications
6. ✅ Design moderne responsive et expérience utilisateur complète
7. ✅ Validation "1 équipe par mode de jeu" stricte (propriétaire ET membre)
8. ✅ Invitations depuis profils utilisateurs avec sélecteur d'équipe
9. ✅ Suppression automatique notifications après traitement
10. ✅ Messages de confirmation détaillés ("Vous avez rejoint l'équipe X!")
11. ✅ Interface "Mes équipes" avec design moderne et avatars

**Phase 3+ - EXTENSIONS SYSTÈME ÉQUIPES (EN COURS) :**

**Messages & Communication :**
- [x] Page messages basique (/messages) avec conversations
- [ ] Interface de chat moderne avec Socket.io temps réel
- [ ] Messages d'équipe (chat groupe par équipe)
- [ ] Système de présence (en ligne/hors ligne)
- [ ] Notifications push pour nouveaux messages

**Logique membres max par jeu/mode (OPTIONNEL) :**
1. [ ] Système de limites de membres dynamiques selon le jeu et mode :
   - FC 26 : 1v1 (2 membres max), 2v2 (4 membres max), 5v5 (7-8 membres max)
   - Call of Duty BO7 : 1v1 (2 membres max), 2v2 (4 membres max), 4v4 (6-8 membres max)
2. [ ] Validation côté backend selon le jeu/mode sélectionné
3. [ ] Interface frontend adaptée avec limites dynamiques

**Phase 4 - PROCHAINE PHASE MAJEURE (Système Ladder) :**
**OBJECTIF :** Ajouter la dimension compétitive avec matchmaking et classements
1. [ ] Modèles matches + résultats en base de données
2. [ ] API système de défis entre équipes
3. [ ] Matchmaking basique avec contraintes (même jeu/mode)
4. [ ] Système de classement ELO simple
5. [ ] Interface défis et acceptation de matches
6. [ ] Page historique des matches
7. [ ] Tableaux de classement par jeu/mode
8. [ ] Système de validation des résultats (screenshot + accord équipes)