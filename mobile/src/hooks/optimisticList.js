/*
 * 목록을 낙관적으로 바꾸는 뮤테이션의 표준 설정.
 *
 * 종목과 템플릿 훅이 (백업 → 화면에 미리 반영 → 실패하면 되돌림 → 무효화)
 * 라는 같은 절차를 각자 try/catch로 손수 적고 있었다. 네 번 반복되던 것을
 * 여기 한 곳으로 모은다.
 *
 *   apply(list, variables) → 서버 응답을 기다리는 동안 화면에 보일 목록
 */
export const optimisticListOptions = ({ queryClient, queryKey, mutationFn, apply, onDone }) => ({
  mutationFn,

  onMutate: async (variables) => {
    // 진행 중인 조회가 뒤늦게 도착해 방금 반영한 화면을 덮어쓰지 않도록 멈춘다.
    await queryClient.cancelQueries({ queryKey })
    const previous = queryClient.getQueryData(queryKey)
    queryClient.setQueryData(queryKey, (old = []) => apply(old, variables))
    return { previous }
  },

  onError: (_error, _variables, context) => {
    if (context?.previous !== undefined) queryClient.setQueryData(queryKey, context.previous)
  },

  // 성공이든 실패든 서버 값으로 다시 맞춘다(임시 id를 진짜 id로 바꾸는 것도 여기).
  onSettled: () => {
    onDone?.()
    return queryClient.invalidateQueries({ queryKey })
  },
})
