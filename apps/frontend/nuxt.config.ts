export default defineNuxtConfig({
  devtools: { enabled: false }, // Désactiver en prod

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/image'
  ],

  // CSS - COMMENTÉ pour l'instant
  // css: ['~/assets/scss/main.scss'],

  typescript: {
    typeCheck: false
  },

  compatibilityDate: '2025-07-16',

  devServer: {
    port: 3000
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NODE_ENV === 'production'
          ? 'https://swiftplays.fr/api'
          : 'http://localhost:3001'
    }
  }
})