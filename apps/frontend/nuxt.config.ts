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

  css: [
    resolve(__dirname, 'assets/scss/main.scss')
  ],

  vite: {
    plugins: [
      tsconfigPaths()
    ]
  },

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