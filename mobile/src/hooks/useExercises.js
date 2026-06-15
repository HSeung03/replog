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

  const remove = async (id) => {
    const prev = queryClient.getQueryData(['exercises'])
    queryClient.setQueryData(['exercises'], (old = []) => old.filter((e) => e.id !== id))
    try {
      await deleteExercise(id)
    } catch (e) {
      queryClient.setQueryData(['exercises'], prev)
      throw e
    } finally {
      invalidate()
    }
  }

  return { exercises, create, remove }
}
