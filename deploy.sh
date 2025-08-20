      #!/bin/bash

      # 🚀 Script de déploiement SwiftPlays - Version avancée avec sécurité DB
      # Usage: ./deploy.sh [--fast|--full|--backend-only|--frontend-only]

      set -e

      FAST_MODE=false
      BACKEND_ONLY=false
      FRONTEND_ONLY=false
      ROLLBACK_ON_ERROR=true

      # Colors for output
      RED='\033[0;31m'
      GREEN='\033[0;32m'
      YELLOW='\033[1;33m'
      BLUE='\033[0;34m'
      NC='\033[0m' # No Color

      # Function to print colored output
      print_status() {
          echo -e "${BLUE}$1${NC}"
      }

      print_success() {
          echo -e "${GREEN}✅ $1${NC}"
      }

      print_warning() {
          echo -e "${YELLOW}⚠️ $1${NC}"
      }

      print_error() {
          echo -e "${RED}❌ $1${NC}"
      }

      # Function to check database connection
      check_database() {
          print_status "🔍 Vérification de la connexion à la base de données..."
          cd apps/backend
          if npx tsx src/scripts/test-db.ts > /dev/null 2>&1; then
              print_success "Base de données accessible"
              cd ../../
              return 0
          else
              print_error "Impossible de se connecter à la base de données"
              cd ../../
              return 1
          fi
      }

      # Function to backup current state
      backup_state() {
          print_status "💾 Sauvegarde de l'état actuel..."
          pm2 save > /dev/null 2>&1 || true
      }

      # Function to rollback on error
      rollback() {
          if [ "$ROLLBACK_ON_ERROR" = true ]; then
              print_warning "🔄 Rollback en cours..."
              git reset --hard HEAD~1 2>/dev/null || print_warning "Impossible de rollback git"
              pm2 restart all > /dev/null 2>&1 || true
          fi
      }

      # Trap errors for rollback
      trap 'print_error "❌ Erreur détectée durant le déploiement"; rollback; exit 1' ERR

      # Parse arguments
      while [[ $# -gt 0 ]]; do
          case $1 in
              --fast)
                  FAST_MODE=true
                  shift
                  ;;
              --backend-only)
                  BACKEND_ONLY=true
                  shift
                  ;;
              --frontend-only)
                  FRONTEND_ONLY=true
                  shift
                  ;;
              --full)
                  # Mode complet (par défaut)
                  shift
                  ;;
              --no-rollback)
                  ROLLBACK_ON_ERROR=false
                  shift
                  ;;
              *)
                  echo "Usage: $0 [--fast|--full|--backend-only|--frontend-only] [--no-rollback]"
                  exit 1
                  ;;
          esac
      done

      echo "🚀 Déploiement SwiftPlays"
      echo "Mode: $([ "$FAST_MODE" = true ] && echo "RAPIDE" || echo "COMPLET")"
      echo "Rollback: $([ "$ROLLBACK_ON_ERROR" = true ] && echo "ACTIVÉ" || echo "DÉSACTIVÉ")"
      echo "======================================"

      # Backup current state
      backup_state

      # Git pull
      print_status "📥 Récupération du code..."
      git pull origin main

      if [ "$FRONTEND_ONLY" = false ]; then
          # Backend
          print_status "🔧 Mise à jour du backend..."
          cd apps/backend

          # Toujours installer les deps et générer Prisma en production
          if [ "$FAST_MODE" = false ]; then
              print_status "📦 Installation des dépendances..."
              npm install

              print_status "🗄️ Génération du client Prisma..."
              npx prisma generate

              # Vérifier la connexion DB avant les migrations
              cd ../../
              if ! check_database; then
                  print_error "Arrêt du déploiement - problème de base de données"
                  exit 1
              fi
              cd apps/backend

              print_status "🚀 Application des migrations..."
              npx prisma migrate deploy

              print_status "✅ Vérification post-migration..."
              cd ../../
              check_database || exit 1
              cd apps/backend
          else
              # Même en mode fast, toujours générer le client Prisma
              print_warning "Mode rapide - Génération du client Prisma uniquement"
              npx prisma generate

              # Vérifier la connexion même en mode fast
              cd ../../
              check_database || exit 1
              cd apps/backend
          fi

          print_status "🏗️ Build du backend..."
          npm run build
          cd ../../
      fi

      if [ "$BACKEND_ONLY" = false ]; then
          # Frontend
          print_status "🎨 Mise à jour du frontend..."
          cd apps/frontend

          if [ "$FAST_MODE" = false ]; then
              print_status "📦 Installation des dépendances frontend..."
              npm install
          fi

          cd ../../
      fi

      # Build global du projet (Turbo)
      print_status "🏗️ Build du projet complet..."
      npm run build
      print_success "Build terminé"

      # Test final de la base de données avant redémarrage
      if [ "$FRONTEND_ONLY" = false ]; then
          print_status "🔍 Test final de la base de données..."
          if ! check_database; then
              print_error "Test final de DB échoué - arrêt du déploiement"
              exit 1
          fi
      fi

      # Restart services avec délais
      print_status "🔄 Redémarrage des services..."
      if [ "$FRONTEND_ONLY" = false ]; then
          print_status "🔄 Redémarrage du backend..."
          pm2 restart swiftplays-backend
          sleep 3  # Attendre que le backend soit prêt
      fi

      if [ "$BACKEND_ONLY" = false ]; then
          print_status "🔄 Redémarrage du frontend..."
          pm2 restart swiftplays-frontend
      fi

      # Vérification finale
      print_status "🧪 Vérification post-déploiement..."
      sleep 5
      pm2 list | grep -E "(swiftplays-backend|swiftplays-frontend)"

      # Test final de santé
      if [ "$FRONTEND_ONLY" = false ]; then
          print_status "🩺 Test de santé final..."
          if check_database; then
              print_success "Déploiement terminé avec succès !"
          else
              print_error "Déploiement terminé mais problèmes détectés"
              pm2 logs swiftplays-backend --lines 10
              exit 1
          fi
      else
          print_success "Déploiement frontend terminé !"
      fi

      pm2 status
