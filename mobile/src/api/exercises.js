import api from './axios'

export const getExercises = () => api.get('/exercises')
export const createExercise = (data) => api.post('/exercises', data)
// force=true는 "기록이 함께 지워지는 걸 알고 있다"는 뜻이다.
// 없이 부르면 참조가 있을 때 서버가 409와 함께 삭제될 개수를 알려준다.
export const deleteExercise = (id, force = false) =>
  api.delete(`/exercises/${id}`, force ? { params: { force: 1 } } : undefined)
