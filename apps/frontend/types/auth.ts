export interface User {
    id: string
    email: string
    password?: never
    createdAt: string
    updatedAt: string
}

export interface LoginCredentials {
    email: string
    password: string
    rememberMe?: boolean
}

export interface RegisterCredentials {
    email: string
    password: string
    pseudo: string
}

export interface AuthTokens {
    accessToken: string
    refreshToken: string
}

export interface AuthResponse {
    user: User
    tokens: AuthTokens
}

export interface AuthError {
    message: string
    field?: string
    code?: string
}

export interface AuthState {
    user: User | null
    accessToken: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: AuthError | null
}