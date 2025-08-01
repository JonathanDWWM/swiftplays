<template>
  <div class="about-page">
    <div class="about-container">
      <!-- Header -->
      <header class="about-header">
        <h1 class="about-title">À propos de SwiftPlays</h1>
        <p class="about-subtitle">La plateforme ultime pour les gamers compétitifs</p>
      </header>

      <!-- Contenu principal -->
      <main class="about-content">
        <!-- Section Mission -->
        <section class="about-section">
          <h2 class="section-title">Notre Mission</h2>
          <p class="section-text">
            SwiftPlays a pour mission de créer la meilleure expérience de gaming compétitif 
            en ligne. Nous connectons les joueurs passionnés dans un environnement 
            professionnel et stimulant.
          </p>
        </section>

        <!-- Section Fonctionnalités -->
        <section class="about-section">
          <h2 class="section-title">Ce que nous offrons</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🏆</div>
              <h3 class="feature-title">Tournois</h3>
              <p class="feature-text">Participez à des tournois organisés et remportez des prix.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">👥</div>
              <h3 class="feature-title">Équipes</h3>
              <p class="feature-text">Créez ou rejoignez des équipes avec vos amis.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3 class="feature-title">Classements</h3>
              <p class="feature-text">Suivez vos performances et progressez dans les classements.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <h3 class="feature-title">Matchmaking</h3>
              <p class="feature-text">Trouvez des adversaires de votre niveau automatiquement.</p>
            </div>
          </div>
        </section>

        <!-- Section Contact -->
        <section class="about-section">
          <h2 class="section-title">Nous contacter</h2>
          <p class="section-text">
            Des questions ? Une suggestion ? N'hésitez pas à nous contacter.
          </p>
          <div class="contact-info">
            <p>📧 Contact : <a href="mailto:contact@swiftplays.fr" class="contact-link">contact@swiftplays.fr</a></p>
            <p>💬 Discord : <a href="#" class="contact-link">Rejoindre notre serveur</a></p>
          </div>
        </section>
      </main>

      <!-- Retour accueil -->
      <footer class="about-footer">
        <NuxtLink to="/" class="back-home-btn">
          ← Retour à l'accueil
        </NuxtLink>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'À propos - SwiftPlays',
  description: 'Découvrez SwiftPlays, la plateforme de gaming compétitif qui connecte les joueurs passionnés.'
})
</script>

<style scoped lang="scss">
.about-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%);
  padding: 2rem 1rem;
}

.about-container {
  max-width: 1000px;
  margin: 0 auto;
}

.about-header {
  text-align: center;
  margin-bottom: 4rem;
  
  .about-title {
    font-size: 3rem;
    font-weight: 800;
    color: #3B82D6;
    margin-bottom: 1rem;
    letter-spacing: -0.02em;
  }
  
  .about-subtitle {
    font-size: 1.2rem;
    color: #9CA3AF;
    margin: 0;
  }
}

.about-content {
  .about-section {
    margin-bottom: 4rem;
    
    .section-title {
      font-size: 2rem;
      font-weight: 700;
      color: #F3F4F6;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    
    .section-text {
      font-size: 1.1rem;
      line-height: 1.7;
      color: #D1D5DB;
      text-align: center;
      max-width: 800px;
      margin: 0 auto 2rem auto;
    }
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card {
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(59, 130, 214, 0.4);
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
  
  .feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .feature-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #F3F4F6;
    margin-bottom: 1rem;
  }
  
  .feature-text {
    color: #9CA3AF;
    line-height: 1.6;
    margin: 0;
  }
}

.contact-info {
  background: rgba(26, 26, 26, 0.5);
  border: 1px solid rgba(59, 130, 214, 0.2);
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  margin: 2rem auto 0 auto;
  
  p {
    margin: 0.5rem 0;
    color: #D1D5DB;
    font-size: 1rem;
  }
  
  .contact-link {
    color: #3B82D6;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s ease;
    
    &:hover {
      color: #60A5FA;
    }
  }
}

.about-footer {
  text-align: center;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(59, 130, 214, 0.1);
  
  .back-home-btn {
    display: inline-block;
    background: linear-gradient(135deg, #3B82D6 0%, #2563EB 100%);
    color: white;
    text-decoration: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
    
    &:hover {
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(59, 130, 214, 0.3);
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .about-page {
    padding: 1rem 0.5rem;
  }
  
  .about-header .about-title {
    font-size: 2.5rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .feature-card {
    padding: 1.5rem;
  }
  
  .about-content .about-section .section-title {
    font-size: 1.7rem;
  }
}
</style>