import api, { getCsrfCookie } from './axios'

export const register = async (data) => {
  await getCsrfCookie()
  return api.post('/register', data)
}

export const login = async (data) => {
  await getCsrfCookie()
  return api.post('/login', data)
}

export const logout = () => api.post('/logout')

export const getMe = () => api.get('/me')
