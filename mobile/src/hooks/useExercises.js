import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getExercises, createExercise, deleteExercise } from '../api/exercises'

export default function useExercises() {
  const queryClient = useQueryClient()

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => getExercises().then((res) => res.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['exercises'] })

  const create = async (form) => { await createExercise(form); invalidate() }
  const remove = async (id) => { await deleteExercise(id); invalidate() }

  return { exercises, create, remove }
}
