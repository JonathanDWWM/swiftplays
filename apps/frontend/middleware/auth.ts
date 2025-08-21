export default defineNuxtRouteMiddleware(async (to, from) => {
  // Vérification côté client uniquement
  if (process.server) return
  
  const authStore = useAuthStore()
  
  // Attendre un tick pour s'assurer que le plugin auth a eu le temps de s'exécuter
  await new Promise(resolve => setTimeout(resolve, 100))
  
  console.log('🔒 Middleware auth - Route:', to.path, 'Authenticated:', authStore.isAuthenticated)
  
  // Vérifier si l'utilisateur est authentifié
  if (!authStore.isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login')
    return navigateTo('/connexion')
  }
  
  console.log('✅ User authenticated, allowing access')
})