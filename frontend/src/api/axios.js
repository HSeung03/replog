import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,        // 쿠키 자동 첨부
  headers: { Accept: 'application/json' },
})

// CSRF 토큰 발급 (로그인 전 1회 호출)
export const getCsrfCookie = () =>
  axios.get('/sanctum/csrf-cookie', { withCredentials: true })

export default api
