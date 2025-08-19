export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  
  // Vérifier si l'utilisateur est authentifié
  if (!authStore.isAuthenticated) {
    // Rediriger vers la page de connexion
    return navigateTo('/connexion')
  }
})