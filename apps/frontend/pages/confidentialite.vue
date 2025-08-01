<template>
  <div class="privacy-page">
    <div class="privacy-container">
      <header class="privacy-header">
        <h1 class="privacy-title">Politique de Confidentialité</h1>
        <p class="privacy-subtitle">Protection et traitement de vos données personnelles</p>
      </header>

      <main class="privacy-content">
        <section class="privacy-section">
          <h2 class="section-title">Collecte des données</h2>
          <div class="section-content">
            <p>
              SwiftPlays collecte les données personnelles suivantes lors de votre inscription :
            </p>
            <ul>
              <li>Adresse email</li>
              <li>Pseudo/nom d'utilisateur</li>
              <li>Mot de passe (chiffré)</li>
              <li>Données de connexion (adresse IP, navigateur)</li>
            </ul>
          </div>
        </section>

        <section class="privacy-section">
          <h2 class="section-title">Utilisation des données</h2>
          <div class="section-content">
            <p>Vos données personnelles sont utilisées pour :</p>
            <ul>
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Vous permettre d'accéder aux services de la plateforme</li>
              <li>Vous envoyer des notifications importantes</li>
              <li>Améliorer nos services</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
          </div>
        </section>

        <section class="privacy-section">
          <h2 class="section-title">Partage des données</h2>
          <div class="section-content">
            <p>
              SwiftPlays s'engage à ne pas vendre, louer ou céder vos données personnelles 
              à des tiers sans votre consentement explicite, sauf dans les cas suivants :
            </p>
            <ul>
              <li>Obligation légale ou réglementaire</li>
              <li>Protection de nos droits et sécurité</li>
              <li>Prestataires techniques (hébergement, email) sous contrat de confidentialité</li>
            </ul>
          </div>
        </section>

        <section class="privacy-section">
          <h2 class="section-title">Conservation des données</h2>
          <div class="section-content">
            <p>
              Vos données personnelles sont conservées pendant la durée nécessaire 
              aux finalités pour lesquelles elles ont été collectées, et conformément 
              aux obligations légales.
            </p>
            <p>
              En cas de suppression de votre compte, vos données personnelles sont 
              effacées dans un délai maximum de 30 jours.
            </p>
          </div>
        </section>

        <section class="privacy-section">
          <h2 class="section-title">Vos droits</h2>
          <div class="section-content">
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul>
              <li><strong>Droit d'accès :</strong> connaître les données que nous détenons sur vous</li>
              <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
              <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
              <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à : 
              <strong>contact@swiftplays.fr</strong>
            </p>
          </div>
        </section>

        <section class="privacy-section">
          <h2 class="section-title">Cookies</h2>
          <div class="section-content">
            <p>
              SwiftPlays utilise des cookies techniques nécessaires au fonctionnement 
              du site (authentification, préférences utilisateur).
            </p>
            <p>
              Aucun cookie publicitaire ou de tracking n'est utilisé sans votre 
              consentement préalable.
            </p>
          </div>
        </section>

        <section class="privacy-section">
          <h2 class="section-title">Contact</h2>
          <div class="section-content">
            <p>
              Pour toute question concernant cette politique de confidentialité, 
              vous pouvez nous contacter à :
            </p>
            <p><strong>Email :</strong> contact@swiftplays.fr</p>
          </div>
        </section>
      </main>

      <footer class="privacy-footer">
        <p class="last-update">Dernière mise à jour : [À compléter]</p>
        <NuxtLink to="/" class="back-home-btn">
          ← Retour à l'accueil
        </NuxtLink>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Politique de Confidentialité - SwiftPlays',
  description: 'Découvrez comment SwiftPlays protège et traite vos données personnelles.'
})
</script>

<style scoped lang="scss">
.privacy-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%);
  padding: 2rem 1rem;
}

.privacy-container {
  max-width: 800px;
  margin: 0 auto;
}

.privacy-header {
  text-align: center;
  margin-bottom: 3rem;
  
  .privacy-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #3B82D6;
    margin-bottom: 1rem;
  }
  
  .privacy-subtitle {
    color: #9CA3AF;
    font-size: 1.1rem;
    margin: 0;
  }
}

.privacy-content {
  .privacy-section {
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
      
      ul {
        color: #D1D5DB;
        margin: 1rem 0;
        padding-left: 1.5rem;
        
        li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
          
          strong {
            color: #F3F4F6;
          }
        }
      }
    }
  }
}

.privacy-footer {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(59, 130, 214, 0.1);
  
  .last-update {
    color: #9CA3AF;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
  
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
  .privacy-page {
    padding: 1rem 0.5rem;
  }
  
  .privacy-header .privacy-title {
    font-size: 2rem;
  }
  
  .privacy-content .privacy-section {
    padding: 1.5rem;
  }
}
</style>