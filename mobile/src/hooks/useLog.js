import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getLog, createLog, updateLog, deleteLog, addSet, updateSet, deleteSet } from '../api/workoutLogs'

export default function useLog(date) {
  const queryClient = useQueryClient()

  const { data: log = null, isLoading } = useQuery({
    queryKey: ['log', date],
    queryFn: async () => {
      const res = await getLog(date)
      return res.status === 204 ? null : res.data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['log', date] })

  const saveLog = async (memo) => {
    if (!log) await createLog({ record_date: date, memo })
    else await updateLog(log.id, { memo })
    invalidate()
  }

  const removeLog = async () => { await deleteLog(log.id); invalidate() }

  const ensureLog = async (memo) => {
    if (log) return log
    const res = await createLog({ record_date: date, memo })
    return res.data
  }

  const addLogSet = async (exerciseId, setData, memo) => {
    const current = await ensureLog(memo)
    const existingSets = log?.sets?.filter((s) => s.exercise_id === exerciseId) || []
    await addSet(current.id, { exercise_id: exerciseId, set_number: existingSets.length + 1, ...setData })
    invalidate()
  }

  const updateLogSet = async (setId, data) => { await updateSet(log.id, setId, data); invalidate() }
  const removeLogSet = async (setId) => { await deleteSet(log.id, setId); invalidate() }
  const removeExerciseSets = async (sets) => { await Promise.all(sets.map((s) => deleteSet(log.id, s.id))); invalidate() }

  return { log, isLoading, saveLog, removeLog, addLogSet, updateLogSet, removeLogSet, removeExerciseSets }
}
