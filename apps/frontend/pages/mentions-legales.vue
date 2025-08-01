<template>
  <div class="legal-page">
    <div class="legal-container">
      <header class="legal-header">
        <h1 class="legal-title">Mentions Légales</h1>
        <p class="legal-subtitle">Informations légales obligatoires</p>
      </header>

      <main class="legal-content">
        <section class="legal-section">
          <h2 class="section-title">Éditeur du site</h2>
          <div class="section-content">
            <p><strong>Nom du site :</strong> SwiftPlays</p>
            <p><strong>URL :</strong> https://swiftplays.fr</p>
            <p><strong>Propriétaire :</strong> [À compléter]</p>
            <p><strong>Adresse :</strong> [À compléter]</p>
            <p><strong>Email :</strong> contact@swiftplays.fr</p>
          </div>
        </section>

        <section class="legal-section">
          <h2 class="section-title">Hébergement</h2>
          <div class="section-content">
            <p><strong>Hébergeur :</strong> [À compléter]</p>
            <p><strong>Adresse :</strong> [À compléter]</p>
            <p><strong>Téléphone :</strong> [À compléter]</p>
          </div>
        </section>

        <section class="legal-section">
          <h2 class="section-title">Propriété intellectuelle</h2>
          <div class="section-content">
            <p>
              L'ensemble de ce site relève de la législation française et internationale 
              sur le droit d'auteur et la propriété intellectuelle. Tous les droits de 
              reproduction sont réservés, y compris pour les documents téléchargeables 
              et les représentations iconographiques et photographiques.
            </p>
          </div>
        </section>

        <section class="legal-section">
          <h2 class="section-title">Données personnelles</h2>
          <div class="section-content">
            <p>
              Les informations recueillies sur ce site sont enregistrées dans un fichier 
              informatisé par SwiftPlays pour la gestion des comptes utilisateurs. 
              Elles sont conservées pendant la durée nécessaire aux finalités pour 
              lesquelles elles sont collectées et traitées.
            </p>
            
            <p>
              Conformément à la loi « informatique et libertés », vous pouvez exercer 
              votre droit d'accès aux données vous concernant et les faire rectifier 
              en contactant : contact@swiftplays.fr
            </p>
          </div>
        </section>

        <section class="legal-section">
          <h2 class="section-title">Cookies</h2>
          <div class="section-content">
            <p>
              Ce site utilise des cookies pour améliorer l'expérience utilisateur 
              et assurer le bon fonctionnement de nos services. En continuant à 
              naviguer sur ce site, vous acceptez l'utilisation de cookies.
            </p>
          </div>
        </section>
      </main>

      <footer class="legal-footer">
        <NuxtLink to="/" class="back-home-btn">
          ← Retour à l'accueil
        </NuxtLink>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Mentions Légales - SwiftPlays',
  description: 'Mentions légales et informations juridiques de SwiftPlays.'
})
</script>

<style scoped lang="scss">
.legal-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%);
  padding: 2rem 1rem;
}

.legal-container {
  max-width: 800px;
  margin: 0 auto;
}

.legal-header {
  text-align: center;
  margin-bottom: 3rem;
  
  .legal-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #3B82D6;
    margin-bottom: 1rem;
  }
  
  .legal-subtitle {
    color: #9CA3AF;
    font-size: 1.1rem;
    margin: 0;
  }
}

.legal-content {
  .legal-section {
    background: rgba(26, 26, 26, 0.5);
    border: 1px solid rgba(59, 130, 214, 0.2);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    
    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #F3F4F6;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #3B82D6;
      padding-bottom: 0.5rem;
    }
    
    .section-content {
      p {
        color: #D1D5DB;
        line-height: 1.7;
        margin-bottom: 1rem;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        strong {
          color: #F3F4F6;
          font-weight: 600;
        }
      }
    }
  }
}

.legal-footer {
  text-align: center;
  margin-top: 3rem;
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

@media (max-width: 768px) {
  .legal-page {
    padding: 1rem 0.5rem;
  }
  
  .legal-header .legal-title {
    font-size: 2rem;
  }
  
  .legal-content .legal-section {
    padding: 1.5rem;
  }
}
</style>