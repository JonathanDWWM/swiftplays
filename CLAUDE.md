# CLAUDE.md

Ce fichier fournit des orientations à Claude Code (claude.ai/code) lors du travail avec le code de ce dépôt.

## Aperçu du Projet

SwiftPlays est une plateforme de jeu compétitif avec gestion d'équipes et tournois, construite comme un monorepo utilisant Turbo. Le projet se compose de :
- **Frontend** : Nuxt.js 4 avec Vue 3, TypeScript, gestion d'état Pinia, et stylisation SCSS
- **Backend** : Express.js avec TypeScript, Prisma ORM, base de données PostgreSQL, authentification JWT
- **Architecture** : Monorepo géré par Turbo avec des espaces de travail pour les apps et packages

## Commandes Essentielles

### Développement
```bash
# Démarrer tous les services en mode développement
npm run dev

# Démarrer une app spécifique
cd apps/frontend && npm run dev  # Frontend sur http://localhost:3000
cd apps/backend && npm run dev   # Backend sur http://localhost:3001
```

### Build & Production
```bash
# Construire toutes les applications
npm run build

# Démarrer le serveur de production
npm run start

# Nettoyer les artefacts de build
npm run clean
```

### Linting & Vérification de Types
```bash
# Lancer le linting sur tous les espaces de travail
npm run lint

# Vérification de types frontend (si nécessaire)
cd apps/frontend && npx vue-tsc --noEmit
```

### Gestion de Base de Données
```bash
# Générer le client Prisma
cd apps/backend && npx prisma generate

# Exécuter les migrations de base de données
cd apps/backend && npx prisma migrate dev

# Réinitialiser la base de données
cd apps/backend && npx prisma migrate reset

# Visualiser la base de données dans Prisma Studio
cd apps/backend && npx prisma studio
```

## Architecture & Composants Clés

### Flux d'Authentification
- Authentification basée sur JWT avec paires de tokens accès/rafraîchissement
- Inscription et connexion utilisateur gérées par `apps/backend/src/controllers/authController.ts`
- État d'authentification frontend géré par le store Pinia dans `apps/frontend/stores/auth.ts`
- Routes protégées utilisant le middleware JWT dans `apps/backend/src/middleware/auth.ts`
- Envoi automatique d'emails de bienvenue lors de l'inscription via `apps/backend/src/services/emailService.ts`

### Schéma de Base de Données
- PostgreSQL avec Prisma ORM
- Modèle User avec permissions basées sur les rôles (USER, MODERATOR, ADMIN)
- Schéma défini dans `apps/backend/prisma/schema.prisma`

### Structure Frontend
- Pages dans `apps/frontend/pages/` (connexion.vue, inscription.vue, dashboard.vue)
- Dashboard style application avec sidebar navigation et header utilisateur
- Styles SCSS globaux dans `apps/frontend/assets/scss/` (architecture modulaire)
- Configurations TypeScript pour vérification stricte des types
- Intégration client Socket.io pour fonctionnalités temps réel

### Structure Backend
- API Express.js avec TypeScript
- Contrôleurs dans `apps/backend/src/controllers/`
- Services dans `apps/backend/src/services/` (email, autres fonctionnalités)
- Templates d'emails dans `apps/backend/src/templates/`
- Utilitaires JWT dans `apps/backend/src/utils/`
- Middleware d'authentification et validation
- Serveur Socket.io pour communication temps réel

## Directives de Développement

### Travail avec l'Authentification
- Toujours utiliser la structure de token JWT existante lors de modifications auth
- Le hachage des mots de passe est géré par les utilitaires bcryptjs
- L'état d'auth frontend doit être synchronisé avec le payload JWT backend

### Modifications de Base de Données
- Toujours créer des migrations lors de modifications du schéma Prisma
- Se rappeler de régénérer le client Prisma après changements de schéma
- Utiliser la structure du modèle User existant comme référence

### Développement Frontend
- Suivre l'architecture SCSS existante dans `assets/scss/`
- Dashboard utilise un layout d'application avec sidebar fixe (280px) et header utilisateur
- Navigation sidebar préparée pour extension future (profil, équipes, tournois, classements)
- Utiliser les stores Pinia pour la gestion d'état
- Exploiter les auto-imports de Nuxt pour les composables
- Le frontend se connecte au backend via la config runtime (`apiBase`)

### Développement Backend
- Suivre les patterns de contrôleurs existants pour nouveaux endpoints
- Utiliser les interfaces TypeScript de `src/types/`
- Implémenter une gestion d'erreurs appropriée suivant les patterns existants
- Maintenir une structure de réponse API cohérente

## Configuration d'Environnement

### Frontend (Nuxt)
- Serveur de développement : `http://localhost:3000`
- Appels API configurés via `runtimeConfig.public.apiBase`

### Backend (Express)
- Serveur de développement : `http://localhost:3001`
- Nécessite la variable d'environnement `DATABASE_URL` pour PostgreSQL
- Configuration email requise : `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS`
- Secrets JWT et autres données sensibles via fichiers `.env`

## Tests & Assurance Qualité

Avant de commiter les changements :
1. S'assurer que toutes les apps se construisent avec succès avec `npm run build`
2. Lancer le linting avec `npm run lint`
3. Tester les flux d'authentification si modification du code d'auth
4. Vérifier que les migrations de base de données fonctionnent correctement