export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // Debug
  console.log('🔐 Initialising auth plugin')
  
  try {
    // Initialiser l'authentification au démarrage de l'application
    const success = await authStore.initAuth()
    console.log('🔐 Auth init result:', success)
    
    if (success) {
      console.log('✅ User authenticated:', authStore.user?.pseudo)
      console.log('🔐 Auth state after init:', {
        isAuthenticated: authStore.isAuthenticated,
        user: authStore.user?.pseudo,
        hasToken: !!authStore.accessToken
      })
    } else {
      console.log('❌ User not authenticated')
      // S'assurer que l'état est bien défini comme non authentifié
      authStore.clearAuth()
    }
  } catch (error) {
    console.error('🔐 Auth plugin error:', error)
    authStore.clearAuth()
  }
})