import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getMe } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  useEffect(() => {
    // 구글 OAuth 콜백: URL에 token 파라미터가 있으면 저장
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('auth_token', token)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true

    if (!localStorage.getItem('auth_token')) {
      setLoading(false)
      return
    }

    getMe()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('auth_token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('auth_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
