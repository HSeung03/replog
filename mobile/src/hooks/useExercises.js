import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getExercises, createExercise, deleteExercise } from '../api/exercises'

export default function useExercises() {
  const queryClient = useQueryClient()

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => getExercises().then((res) => res.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['exercises'] })

  const create = async (form) => {
    const tempId = `temp-${Date.now()}`
    const prev = queryClient.getQueryData(['exercises'])
    queryClient.setQueryData(['exercises'], (old = []) => [...old, { id: tempId, ...form }])
    try {
      await createExercise(form)
    } catch (e) {
      queryClient.setQueryData(['exercises'], prev)
      throw e
    } finally {
      invalidate()
    }
  }

  // force 없이 부르면, 기록된 세트가 있는 종목은 서버가 409로 거절한다.
  // 호출부는 409를 받아 삭제될 개수를 사용자에게 보여준 뒤 force로 다시 부른다.
  const remove = async (id, force = false) => {
    const prev = queryClient.getQueryData(['exercises'])
    queryClient.setQueryData(['exercises'], (old = []) => old.filter((e) => e.id !== id))
    try {
      await deleteExercise(id, force)
    } catch (e) {
      queryClient.setQueryData(['exercises'], prev)
      throw e
    } finally {
      invalidate()
    }
  }

  return { exercises, create, remove }
}
