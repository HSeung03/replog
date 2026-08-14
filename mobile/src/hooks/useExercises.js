import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getExercises, createExercise, deleteExercise } from '../api/exercises'
import { queryKeys } from '../api/queryKeys'
import { optimisticListOptions } from './optimisticList'

export default function useExercises() {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.exercises

  const { data: exercises = [] } = useQuery({
    queryKey,
    queryFn: () => getExercises().then((res) => res.data),
  })

  const createMutation = useMutation(
    optimisticListOptions({
      queryClient,
      queryKey,
      mutationFn: (form) => createExercise(form),
      // 서버가 id를 주기 전까지 임시 id로 목록에 끼워 넣는다. onSettled의
      // 무효화가 진짜 id로 바꿔 준다.
      apply: (list, form) => [...list, { id: `temp-${Date.now()}`, ...form }],
    })
  )

  // force 없이 부르면, 기록된 세트가 있는 종목은 서버가 409로 거절한다.
  // 호출부는 409를 받아 삭제될 개수를 사용자에게 보여준 뒤 force로 다시 부른다.
  const removeMutation = useMutation(
    optimisticListOptions({
      queryClient,
      queryKey,
      mutationFn: ({ id, force }) => deleteExercise(id, force),
      apply: (list, { id }) => list.filter((e) => e.id !== id),
      // 종목이 사라지면 그 종목을 담고 있던 템플릿도 달라진다.
      onDone: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates }),
    })
  )

  return {
    exercises,
    create: (form) => createMutation.mutateAsync(form),
    remove: (id, force = false) => removeMutation.mutateAsync({ id, force }),
  }
}
