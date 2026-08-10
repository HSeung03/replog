import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQueryClient } from '@tanstack/react-query'
import { clearLocalData } from '../db/localDB'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
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

  // 이 기기에 남은 이전 사용자의 흔적을 모두 제거한다.
  // 로컬 DB 삭제가 실패하더라도 토큰 제거는 반드시 진행되어야 하므로 예외를 삼킨다.
  const wipeDeviceData = async () => {
    try {
      await clearLocalData()
    } catch {}
    queryClient.clear()
  }

  const readStoredUser = async () => {
    try {
      const raw = await AsyncStorage.getItem('auth_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const login = async (newToken, newUser) => {
    // 로그아웃 없이 앱이 종료된 경우 등, 다른 계정의 데이터가 남아 있을 수 있다
    const previous = await readStoredUser()
    if (previous?.id && previous.id !== newUser?.id) {
      await wipeDeviceData()
    }

    await AsyncStorage.setItem('auth_token', newToken)
    await AsyncStorage.setItem('auth_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = async () => {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user'])
    await wipeDeviceData()
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
