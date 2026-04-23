import api from './axios'

export const getExercises = () => api.get('/exercises')
export const createExercise = (data) => api.post('/exercises', data)
export const deleteExercise = (id) => api.delete(`/exercises/${id}`)
