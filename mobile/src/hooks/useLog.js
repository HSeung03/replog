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
    if (!log) {
      await createLog({ record_date: date, memo })
    } else {
      queryClient.setQueryData(['log', date], (old) => ({ ...old, memo }))
      try {
        await updateLog(log.id, { memo })
      } catch (e) {
        invalidate()
        throw e
      }
    }
    invalidate()
  }

  const removeLog = async () => {
    const prev = queryClient.getQueryData(['log', date])
    queryClient.setQueryData(['log', date], null)
    try {
      await deleteLog(log.id)
    } catch (e) {
      queryClient.setQueryData(['log', date], prev)
      throw e
    }
    invalidate()
  }

  const ensureLog = async (memo) => {
    if (log) return log
    const res = await createLog({ record_date: date, memo })
    return res.data
  }

  const addLogSet = async (exerciseId, setData, memo) => {
    const current = await ensureLog(memo)
    const existingSets = (log?.sets || []).filter((s) => s.exercise_id === exerciseId)
    const tempSet = { id: `temp-${Date.now()}`, exercise_id: exerciseId, set_number: existingSets.length + 1, ...setData }

    const prev = queryClient.getQueryData(['log', date])
    queryClient.setQueryData(['log', date], (old) => old ? { ...old, sets: [...(old.sets || []), tempSet] } : old)

    try {
      await addSet(current.id, { exercise_id: exerciseId, set_number: existingSets.length + 1, ...setData })
    } catch (e) {
      queryClient.setQueryData(['log', date], prev)
      throw e
    } finally {
      invalidate()
    }
  }

  const updateLogSet = async (setId, data) => {
    const prev = queryClient.getQueryData(['log', date])
    queryClient.setQueryData(['log', date], (old) => old ? {
      ...old,
      sets: old.sets.map((s) => s.id === setId ? { ...s, ...data } : s),
    } : old)
    try {
      await updateSet(log.id, setId, data)
    } catch (e) {
      queryClient.setQueryData(['log', date], prev)
      throw e
    } finally {
      invalidate()
    }
  }

  const removeLogSet = async (setId) => {
    const prev = queryClient.getQueryData(['log', date])
    queryClient.setQueryData(['log', date], (old) => old ? {
      ...old,
      sets: old.sets.filter((s) => s.id !== setId),
    } : old)
    try {
      await deleteSet(log.id, setId)
    } catch (e) {
      queryClient.setQueryData(['log', date], prev)
      throw e
    } finally {
      invalidate()
    }
  }

  const removeExerciseSets = async (sets) => {
    const setIds = sets.map((s) => s.id)
    const prev = queryClient.getQueryData(['log', date])
    queryClient.setQueryData(['log', date], (old) => old ? {
      ...old,
      sets: old.sets.filter((s) => !setIds.includes(s.id)),
    } : old)
    try {
      await Promise.all(sets.map((s) => deleteSet(log.id, s.id)))
    } catch (e) {
      queryClient.setQueryData(['log', date], prev)
      throw e
    } finally {
      invalidate()
    }
  }

  return { log, isLoading, saveLog, removeLog, addLogSet, updateLogSet, removeLogSet, removeExerciseSets }
}
