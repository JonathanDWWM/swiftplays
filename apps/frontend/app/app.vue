<template>
  <div class="homepage">
    <!-- Navigation -->
    <nav class="nav">
      <div class="nav-container">
        <div class="nav-logo">
          <svg width="40" height="40" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#5BA3E0"/>
                <stop offset="100%" style="stop-color:#2563EB"/>
              </linearGradient>
            </defs>
            <path d="M20 10 L50 40 L80 10 L65 25 L50 60 L35 25 Z" fill="url(#logoGradient)"/>
          </svg>
          <span class="nav-title">SwiftPlays</span>
        </div>

        <div class="nav-buttons">
          <button class="btn btn-outline">Connexion</button>
          <button class="btn btn-primary">Inscription</button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">

        <h1 class="hero-title">
          Des modes de compétition
          <span class="text-gradient">jamais vus ailleurs</span>
        </h1>

        <p class="hero-description">
          SwiftPlays révolutionne le gaming compétitif avec des formats uniques,
          des championnats innovants et une expérience que vous ne trouverez nulle part ailleurs.
        </p>

        <div class="hero-buttons">
          <button class="btn btn-primary btn-large">
            Découvrir les modes
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div class="hero-stats">
          <div class="stat">
            <div class="stat-number">24/7</div>
            <div class="stat-label">Compétitions</div>
          </div>
          <div class="stat">
            <div class="stat-number">100%</div>
            <div class="stat-label">Innovation</div>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="floating-card card-1">
          <div class="card-icon">🏆</div>
          <div class="card-title">Ladder Dynamique</div>
          <div class="card-description">Classement ELO en temps réel</div>
        </div>

        <div class="floating-card card-2">
          <div class="card-icon">⚡</div>
          <div class="card-title">Modes Swift</div>
          <div class="card-description">Formats de jeu exclusifs</div>
        </div>

        <div class="floating-card card-3">
          <div class="card-icon">👥</div>
          <div class="card-title">Équipes Pro</div>
          <div class="card-description">Gestion avancée</div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Ce qui rend SwiftPlays unique</h2>
          <p class="section-description">
            Des fonctionnalités pensées par et pour les gamers compétitifs
          </p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h3 class="feature-title">Modes Swift Exclusifs</h3>
            <p class="feature-description">
              Des formats de compétition révolutionnaires que vous ne verrez nulle part ailleurs.
              Innovation garantie à chaque match.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3 class="feature-title">Système d'Équipes Avancé</h3>
            <p class="feature-description">
              Créez votre équipe, gérez les transferts, définissez les rôles.
              Un système complet pour les vrais stratèges.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h3 class="feature-title">Championnats Innovants</h3>
            <p class="feature-description">
              Des championnats par divisions avec des formats uniques.
              Calendriers automatiques et récompenses exclusives.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 class="feature-title">Ladder Compétitif</h3>
            <p class="feature-description">
              Matchmaking intelligent avec système ELO avancé.
              Grimpez les échelons et prouvez votre valeur.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <h3 class="feature-title">Intégration Discord</h3>
            <p class="feature-description">
              Bot Discord intégré pour une expérience fluide.
              Notifications, commandes et synchronisation complète.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l2 7h7l-5.5 4 2 7L12 15.5 6.5 20l2-7L3 9h7l2-7z"/>
              </svg>
            </div>
            <h3 class="feature-title">Tournois Dynamiques</h3>
            <p class="feature-description">
              Brackets interactifs, phases automatiques, seeds intelligents.
              L'expérience tournoi réinventée.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Prêt à révolutionner votre expérience gaming ?</h2>
          <p class="cta-description">
            Rejoignez la nouvelle génération de gamers compétitifs sur SwiftPlays
          </p>
          <div class="cta-buttons">
            <button class="btn btn-primary btn-large">
              Commencer maintenant
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
            <button class="btn btn-outline btn-large">En savoir plus</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-logo">
            <svg width="32" height="32" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#5BA3E0"/>
                  <stop offset="100%" style="stop-color:#2563EB"/>
                </linearGradient>
              </defs>
              <path d="M20 10 L50 40 L80 10 L65 25 L50 60 L35 25 Z" fill="url(#footerLogoGradient)"/>
            </svg>
            <span class="footer-title">SwiftPlays</span>
          </div>
          <p class="footer-description">
            La plateforme de compétition gaming nouvelle génération
          </p>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2025 SwiftPlays. Tous droits réservés.</p>
          <div class="footer-links">
            <a href="#" class="footer-link">Mentions légales</a>
            <a href="#" class="footer-link">Confidentialité</a>
            <a href="#" class="footer-link">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>

useHead({
  title: 'SwiftPlays | Accueil',
  meta: [
    {
      name: 'description',
      content: 'Découvrez SwiftPlays, la plateforme qui révolutionne le gaming compétitif avec des modes de jeux exclusifs, des championnats innovants et une expérience unique.'
    }
  ]
})
</script>

<style lang="scss" scoped></style>