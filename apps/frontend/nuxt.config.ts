export default defineNuxtConfig({
  devtools: { enabled: true },

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
      apiBase: 'http://localhost:3001'
    }
  }
})