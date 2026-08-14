import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCalendar } from '../api/workoutLogs'
import { queryKeys } from '../api/queryKeys'

export default function useCalendar(year, month) {
  const { data } = useQuery({
    // month는 자바스크립트 관례대로 0부터다. 서버는 1부터 받는다.
    queryKey: queryKeys.calendar(year, month),
    queryFn: () => getCalendar(year, month + 1).then((res) => res.data),
  })

  const workoutDates = useMemo(() => new Set(data || []), [data])

  return { workoutDates, sessionCount: data?.length || 0 }
}
