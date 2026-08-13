import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = 'https://replog.servegame.com/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
  // 없으면 응답하지 않는 서버에 무한정 매달린다. 화면은 로딩 상태로 멈추고
  // 사용자에게는 아무 일도 일어나지 않는 것처럼 보인다.
  timeout: 10000,
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 토큰이 서버에서 사라진 경우(다른 기기에서 로그아웃 등) 앱은 로그인된
// 화면을 그대로 띄우면서 모든 요청이 조용히 실패한다. 캘린더는 비고,
// 저장은 안 되고, 에러도 안 뜬다. 사용자가 스스로 로그아웃하기 전까지
// 빠져나올 방법이 없어서, 401을 만나면 세션을 끊고 로그인 화면으로 보낸다.
//
// 핸들러는 AuthContext가 등록한다(순환 import를 피하려고 여기서 직접
// logout을 부르지 않는다).
let onUnauthorized = null

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler
}

// 로그인·회원가입 자체의 401은 "자격 증명이 틀렸다"는 정상 응답이다.
// 여기서 로그아웃을 부르면 아직 있지도 않은 세션을 끊는 셈이 된다.
const AUTH_PATHS = ['/login', '/register', '/auth/google']

const isAuthRequest = (config) => {
  const url = config?.url || ''
  return AUTH_PATHS.some((path) => url.startsWith(path))
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && !isAuthRequest(error.config) && onUnauthorized) {
      try {
        await onUnauthorized()
      } catch {}
    }
    return Promise.reject(error)
  }
)

export default api
