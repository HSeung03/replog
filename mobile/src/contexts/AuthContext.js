import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQueryClient } from '@tanstack/react-query'
import { clearLocalData } from '../db/localDB'
import { setUnauthorizedHandler } from '../api/axios'
import { getMe } from '../api/auth'

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

  // 서버가 토큰을 더 이상 받아주지 않을 때(401) 끊는 경로.
  //
  // 여기서는 로컬 DB를 지우지 않는다. 아직 서버에 올리지 못한 기록이
  // 남아 있을 수 있고, 사용자가 고른 것도 아닌 로그아웃으로 그걸 날리면
  // 되돌릴 방법이 없다. 다른 계정으로 로그인하면 login()이 그때 지운다.
  const endSession = useCallback(async () => {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user'])
    queryClient.clear()
    setToken(null)
    setUser(null)
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(endSession)
    return () => setUnauthorizedHandler(null)
  }, [endSession])

  // 저장된 토큰이 있다는 것만으로 로그인 상태로 판정하면, 서버에서 토큰이
  // 사라진 뒤에도 정상 화면이 뜨고 모든 요청만 조용히 실패한다.
  // 부팅 직후 한 번 확인한다. 실패해도 화면을 막지 않는다 - 오프라인이면
  // 네트워크 오류로 끝나고(응답이 없으니 인터셉터도 반응하지 않는다),
  // 401일 때만 위 핸들러가 세션을 끊는다.
  const validated = useRef(false)
  useEffect(() => {
    if (!token || validated.current) return
    validated.current = true
    getMe().catch(() => {})
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
