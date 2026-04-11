import api from './axios'

export const getCalendar = (year, month) =>
  api.get('/workout-logs/calendar', { params: { year, month } })

export const getLog = (date) => api.get(`/workout-logs/${date}`)

export const createLog = (data) => api.post('/workout-logs', data)

export const updateLog = (id, data) => api.patch(`/workout-logs/${id}`, data)

export const deleteLog = (id) => api.delete(`/workout-logs/${id}`)

export const addSet = (logId, data) =>
  api.post(`/workout-logs/${logId}/sets`, data)

export const updateSet = (logId, setId, data) =>
  api.patch(`/workout-logs/${logId}/sets/${setId}`, data)

export const deleteSet = (logId, setId) =>
  api.delete(`/workout-logs/${logId}/sets/${setId}`)
