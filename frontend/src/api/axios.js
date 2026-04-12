import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

// 세션 만료(401) 시 로그인 페이지로 이동
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// CSRF 토큰 발급 (로그인 전 1회 호출)
export const getCsrfCookie = () =>
  axios.get('/sanctum/csrf-cookie', { withCredentials: true })

export default api
