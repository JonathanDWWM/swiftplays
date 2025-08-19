import { defineStore } from 'pinia'
import type {
    AuthState,
    LoginCredentials,
    RegisterCredentials,
    AuthResponse,
    AuthError,
    User
} from '../types/auth'

const REFRESH_TOKEN_KEY = 'swiftplays_refresh_token'
const REMEMBER_ME_KEY = 'swiftplays_remember_me'

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
    }),

    getters: {
        isLoggedIn: (state) => state.isAuthenticated && !!state.user,
        currentUser: (state) => state.user,
        hasError: (state) => !!state.error
    },

    actions: {
        // 🔧 Utilitaires internes
        setLoading(loading: boolean) {
            this.isLoading = loading
            if (loading) this.error = null
        },

        setError(error: AuthError | null) {
            this.error = error
            this.isLoading = false
        },

        setTokens(accessToken: string, refreshToken?: string) {
            this.accessToken = accessToken
            
            // Stocker l'accessToken dans un cookie
            const accessTokenCookie = useCookie('accessToken', {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 // 15 minutes
            })
            accessTokenCookie.value = accessToken
            
            if (refreshToken) {
                localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
            }
        },

        setUser(user: User | null) {
            this.user = user
            this.isAuthenticated = !!user
        },

        clearAuth() {
            this.user = null
            this.accessToken = null
            this.isAuthenticated = false
            this.error = null
            localStorage.removeItem(REFRESH_TOKEN_KEY)
            localStorage.removeItem(REMEMBER_ME_KEY)
            
            // Nettoyer le cookie accessToken
            const accessTokenCookie = useCookie('accessToken')
            accessTokenCookie.value = null
        },

        // 🌐 Appels API
        async apiCall(endpoint: string, options: RequestInit = {}) {
            const apiBase = process.env.NODE_ENV === 'production'
                ? 'https://swiftplays.fr'
                : 'http://localhost:3001'
            const url = `${apiBase}${endpoint}`

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` }),
                    ...options.headers
                },
                ...options
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erreur réseau' }))
                throw new Error(errorData.message || `Erreur HTTP ${response.status}`)
            }

            return response.json()
        },

        // 📝 Inscription
        async register(credentials: RegisterCredentials) {
            try {
                this.setLoading(true)

                const data: AuthResponse = await this.apiCall('/api/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(credentials)
                })

                this.setTokens(data.tokens.accessToken, data.tokens.refreshToken)
                this.setUser(data.user)

                return { success: true }
            } catch (error) {
                const authError: AuthError = {
                    message: error instanceof Error ? error.message : 'Erreur lors de l\'inscription'
                }
                this.setError(authError)
                return { success: false, error: authError }
            }
        },

        // 🔑 Connexion
        async login(credentials: LoginCredentials) {
            try {
                this.setLoading(true)

                const data: AuthResponse = await this.apiCall('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password
                    })
                })

                this.setTokens(data.tokens.accessToken, data.tokens.refreshToken)
                this.setUser(data.user)

                // Gestion "Se souvenir de moi"
                if (credentials.rememberMe) {
                    localStorage.setItem(REMEMBER_ME_KEY, 'true')
                }

                return { success: true }
            } catch (error) {
                const authError: AuthError = {
                    message: error instanceof Error ? error.message : 'Erreur lors de la connexion'
                }
                this.setError(authError)
                return { success: false, error: authError }
            }
        },

        // 🔄 Refresh du token
        async refreshToken() {
            try {
                const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
                if (!refreshToken) throw new Error('Aucun refresh token trouvé')

                const data = await this.apiCall('/api/auth/refresh', {
                    method: 'POST',
                    body: JSON.stringify({ refreshToken })
                })

                this.setTokens(data.accessToken, data.refreshToken)
                return true
            } catch (error) {
                console.error('Erreur refresh token:', error)
                this.clearAuth()
                return false
            }
        },

        // 👤 Récupération du profil utilisateur
        async fetchUserProfile() {
            try {
                const data = await this.apiCall('/api/auth/me')
                this.setUser(data.user)
                return true
            } catch (error) {
                console.error('Erreur récupération profil:', error)
                // Essayer de refresh le token
                const refreshed = await this.refreshToken()
                if (refreshed) {
                    return this.fetchUserProfile()
                }
                return false
            }
        },

        // 🚪 Déconnexion
        async logout() {
            try {
                const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
                if (refreshToken) {
                    await this.apiCall('/api/auth/logout', {
                        method: 'POST',
                        body: JSON.stringify({ refreshToken })
                    })
                }
            } catch (error) {
                console.error('Erreur lors de la déconnexion:', error)
            } finally {
                this.clearAuth()
            }
        },

        // 🔄 Initialisation de l'authentification
        async initAuth() {
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
            // SUPPRIMÉ: const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true'

            if (!refreshToken) {  // ← Vérification seulement du refreshToken
                this.clearAuth()
                return false
            }

            try {
                // Essayer de refresh le token
                const refreshed = await this.refreshToken()
                if (refreshed) {
                    // Récupérer le profil utilisateur
                    return await this.fetchUserProfile()
                }
                return false
            } catch (error) {
                console.error('Erreur initialisation auth:', error)
                this.clearAuth()
                return false
            }
        },

        // 👤 Gestion du profil
        async updateProfile(profileData: {
            pseudo: string
            email: string
            firstName: string | null
            lastName: string | null
        }) {
            this.isLoading = true
            this.error = null

            try {
                const result = await this.apiCall('/api/auth/profile', {
                    method: 'PUT',
                    body: JSON.stringify(profileData)
                })

                if (result.success) {
                    this.user = result.user
                    return true
                } else {
                    this.error = { message: result.message }
                    return false
                }
            } catch (error) {
                console.error('Erreur mise à jour profil:', error)
                this.error = { message: 'Erreur lors de la mise à jour du profil' }
                return false
            } finally {
                this.isLoading = false
            }
        },

        async changePassword(passwordData: {
            currentPassword: string
            newPassword: string
        }) {
            this.isLoading = true
            this.error = null

            try {
                const result = await this.apiCall('/api/auth/password', {
                    method: 'PUT',
                    body: JSON.stringify(passwordData)
                })

                if (result.success) {
                    return true
                } else {
                    this.error = { message: result.message }
                    return false
                }
            } catch (error) {
                console.error('Erreur changement mot de passe:', error)
                this.error = { message: 'Erreur lors du changement de mot de passe' }
                return false
            } finally {
                this.isLoading = false
            }
        }
    }
})