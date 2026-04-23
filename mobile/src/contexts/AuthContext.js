import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('auth_token'),
      AsyncStorage.getItem('auth_user'),
    ]).then(([t, u]) => {
      if (t) setToken(t)
      if (u) setUser(JSON.parse(u))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const login = async (newToken, newUser) => {
    await AsyncStorage.setItem('auth_token', newToken)
    await AsyncStorage.setItem('auth_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token')
    await AsyncStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
