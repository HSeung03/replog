import { useQuery } from '@tanstack/react-query'
import { getCalendar } from '../api/workoutLogs'

export default function useCalendar(year, month) {
  const { data } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => getCalendar(year, month + 1).then((res) => res.data),
  })

  return {
    workoutDates: new Set(data || []),
    sessionCount: data?.length || 0,
  }
}
