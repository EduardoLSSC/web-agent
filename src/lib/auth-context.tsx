import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { API_BASE_URL } from '@/lib/api-base-url'

const STORAGE_KEY = 'easyclass_auth_token'
const LEGACY_STORAGE_KEY = 'letmeask_auth_token'

function readStoredToken(): string | null {
  const current = localStorage.getItem(STORAGE_KEY)
  if (current) {
    return current
  }
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (legacy) {
    localStorage.setItem(STORAGE_KEY, legacy)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return legacy
  }
  return null
}

export type AuthUser = {
  id: string
  name: string
  email: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isReady: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [isReady, setIsReady] = useState(false)

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const apiFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
      const headers = new Headers(init?.headers)
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      const response = await fetch(url, { ...init, headers })
      if (response.status === 401) {
        logout()
        window.location.assign('/login')
      }
      return response
    },
    [token, logout]
  )

  useEffect(() => {
    let cancelled = false
    const t = readStoredToken()
    if (!t) {
      setIsReady(true)
      return
    }
    void (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${t}` },
        })
        if (!response.ok) {
          throw new Error('session')
        }
        const data: { user: AuthUser } = await response.json()
        if (!cancelled) {
          setToken(t)
          setUser(data.user)
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(STORAGE_KEY)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = (await response.json()) as {
      error?: string
      token?: string
      user?: AuthUser
    }
    if (!response.ok) {
      throw new Error(data.error ?? 'Falha ao entrar')
    }
    if (!data.token || !data.user) {
      throw new Error('Resposta inválida do servidor')
    }
    localStorage.setItem(STORAGE_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isReady,
      login,
      logout,
      apiFetch,
    }),
    [user, token, isReady, login, logout, apiFetch]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
