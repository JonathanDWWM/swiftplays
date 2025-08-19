import { defineNuxtConfig } from 'nuxt/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'

export default defineNuxtConfig({
  devtools: { enabled: false },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/image'
  ],

  imports: {
    dirs: ['stores']
  },

  components: {
    global: true,
    dirs: []
  },

  css: [
    resolve(__dirname, 'assets/scss/main.scss'),
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],

  vite: {
    plugins: [
      tsconfigPaths()
    ],
    ssr: {
      noExternal: ['@fortawesome/vue-fontawesome']
    }
  },

  typescript: {
    strict: true,
    typeCheck: true
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