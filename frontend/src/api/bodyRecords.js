import api from './axios'

export const getBodyRecords = () => api.get('/body-records')
export const createBodyRecord = (data) => api.post('/body-records', data)
export const updateBodyRecord = (id, data) => api.patch(`/body-records/${id}`, data)
export const deleteBodyRecord = (id) => api.delete(`/body-records/${id}`)
