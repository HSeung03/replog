import { useState, useEffect, useCallback } from 'react'
import NetInfo from '@react-native-community/netinfo'
import {
  getLocalLog, getLocalSets, insertLog, updateLogMemo, deleteLog as deleteLocalLog,
  insertSet, updateSet as updateLocalSet, deleteSet as deleteLocalSet,
  updateLogServerId, updateSetServerId, addToSyncQueue,
} from '../db/localDB'
import { syncPendingQueue } from '../db/syncManager'
import { getLog, createLog, updateLog, deleteLog, addSet, updateSet, deleteSet } from '../api/workoutLogs'

const toUILog = (localLog, sets) => ({
  local_id: localLog.local_id,
  id: localLog.server_id || null,
  record_date: localLog.record_date,
  memo: localLog.memo,
  sets: sets.map(s => ({
    ...s,
    id: s.server_id || `local-${s.local_id}`,
    local_id: s.local_id,
  })),
})

export default function useLog(date) {
  const [log, setLog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadLog = useCallback(async () => {
    setIsLoading(true)
    try {
      // 로컬 DB에서 먼저 로드 → 즉시 화면 반영
      const localLog = await getLocalLog(date)
      if (localLog) {
        const sets = await getLocalSets(localLog.local_id)
        setLog(toUILog(localLog, sets))
      } else {
        setLog(null)
      }

      // 네트워크 있으면 서버 동기화 후 최신 데이터로 갱신
      const state = await NetInfo.fetch()
      if (state.isConnected) {
        await syncPendingQueue()
        const res = await getLog(date)
        if (res.status === 204) {
          setLog(null)
        } else {
          setLog(res.data)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [date])

  useEffect(() => {
    loadLog()
  }, [loadLog])

  const ensureLocalLog = async (memo = '') => {
    let localLog = await getLocalLog(date)
    if (!localLog) {
      const localId = await insertLog(date, memo)
      localLog = { local_id: localId, server_id: null, record_date: date, memo }
    }
    return localLog
  }

  const saveLog = async (memo) => {
    const localLog = await ensureLocalLog(memo)
    await updateLogMemo(localLog.local_id, memo)

    setLog(prev =>
      prev
        ? { ...prev, memo }
        : { local_id: localLog.local_id, id: null, record_date: date, memo, sets: [] }
    )

    const state = await NetInfo.fetch()
    if (state.isConnected) {
      if (localLog.server_id) {
        await updateLog(localLog.server_id, { memo })
      } else {
        const res = await createLog({ record_date: date, memo })
        await updateLogServerId(localLog.local_id, res.data.id)
        setLog(prev => prev ? { ...prev, id: res.data.id } : prev)
      }
    } else {
      await addToSyncQueue('createLog', { logLocalId: localLog.local_id, date, memo })
    }
  }

  const removeLog = async () => {
    if (!log) return
    const prevLog = log
    setLog(null)

    const localLog = await getLocalLog(date)
    if (localLog) await deleteLocalLog(localLog.local_id)

    const state = await NetInfo.fetch()
    if (state.isConnected && prevLog.id) {
      try {
        await deleteLog(prevLog.id)
      } catch (e) {
        setLog(prevLog)
      }
    } else if (prevLog.id) {
      await addToSyncQueue('deleteLog', { serverId: prevLog.id })
    }
  }

  const addLogSet = async (exerciseId, setData, memo = '') => {
    const localLog = await ensureLocalLog(memo)
    const existingSets = (log?.sets || []).filter(s => s.exercise_id === exerciseId)
    const setNumber = existingSets.length + 1

    // 로컬 DB 즉시 저장
    const localSetId = await insertSet(localLog.local_id, exerciseId, setNumber, setData.weight, setData.reps)
    const tempSet = {
      id: `local-${localSetId}`,
      local_id: localSetId,
      exercise_id: exerciseId,
      set_number: setNumber,
      ...setData,
    }

    // 화면 즉시 반영
    setLog(prev =>
      prev
        ? { ...prev, sets: [...(prev.sets || []), tempSet] }
        : { local_id: localLog.local_id, id: null, record_date: date, memo, sets: [tempSet] }
    )

    // 백그라운드 서버 동기화
    const state = await NetInfo.fetch()
    if (state.isConnected) {
      try {
        let serverId = localLog.server_id
        if (!serverId) {
          const res = await createLog({ record_date: date, memo })
          serverId = res.data.id
          await updateLogServerId(localLog.local_id, serverId)
          setLog(prev => prev ? { ...prev, id: serverId } : prev)
        }
        const res = await addSet(serverId, { exercise_id: exerciseId, set_number: setNumber, ...setData })
        await updateSetServerId(localSetId, res.data.id)
        setLog(prev => prev ? {
          ...prev,
          sets: prev.sets.map(s => s.local_id === localSetId ? { ...s, id: res.data.id } : s),
        } : prev)
      } catch (e) {
        // 서버 실패 시 큐에 저장 (logLocalId로 저장해서 동기화 시 최신 server_id 조회)
        await addToSyncQueue('addSet', {
          localSetId,
          logLocalId: localLog.local_id,
          exerciseId,
          setNumber,
          weight: setData.weight,
          reps: setData.reps,
        })
      }
    } else {
      await addToSyncQueue('addSet', {
        localSetId,
        logLocalId: localLog.local_id,
        exerciseId,
        setNumber,
        weight: setData.weight,
        reps: setData.reps,
      })
    }
  }

  const updateLogSet = async (setId, data) => {
    const prevLog = log
    setLog(prev => prev ? {
      ...prev,
      sets: prev.sets.map(s => s.id === setId ? { ...s, ...data } : s),
    } : prev)

    const set = log?.sets?.find(s => s.id === setId)
    if (set?.local_id) await updateLocalSet(set.local_id, data)

    // local-xxx ID면 아직 서버 미동기화 → 큐에 저장
    if (typeof setId !== 'number') {
      await addToSyncQueue('updateSet', { logServerId: log?.id, setServerId: set?.server_id, data })
      return
    }

    const state = await NetInfo.fetch()
    if (state.isConnected && log?.id) {
      try {
        await updateSet(log.id, setId, data)
      } catch (e) {
        setLog(prevLog)
        await addToSyncQueue('updateSet', { logServerId: log.id, setServerId: setId, data })
      }
    } else {
      await addToSyncQueue('updateSet', { logServerId: log?.id, setServerId: setId, data })
    }
  }

  const removeLogSet = async (setId) => {
    const prevLog = log
    const set = log?.sets?.find(s => s.id === setId)
    setLog(prev => prev ? { ...prev, sets: prev.sets.filter(s => s.id !== setId) } : prev)

    if (set?.local_id) await deleteLocalSet(set.local_id)

    if (typeof setId !== 'number') return

    const state = await NetInfo.fetch()
    if (state.isConnected && log?.id) {
      try {
        await deleteSet(log.id, setId)
      } catch (e) {
        setLog(prevLog)
        await addToSyncQueue('deleteSet', { logServerId: log.id, setServerId: setId })
      }
    } else {
      await addToSyncQueue('deleteSet', { logServerId: log?.id, setServerId: setId })
    }
  }

  const removeExerciseSets = async (sets) => {
    const prevLog = log
    const setIds = sets.map(s => s.id)
    setLog(prev => prev ? { ...prev, sets: prev.sets.filter(s => !setIds.includes(s.id)) } : prev)

    for (const s of sets) {
      if (s.local_id) await deleteLocalSet(s.local_id)
    }

    const serverSets = sets.filter(s => typeof s.id === 'number')
    if (!serverSets.length || !log?.id) return

    const state = await NetInfo.fetch()
    if (state.isConnected) {
      try {
        await Promise.all(serverSets.map(s => deleteSet(log.id, s.id)))
      } catch (e) {
        setLog(prevLog)
      }
    } else {
      for (const s of serverSets) {
        await addToSyncQueue('deleteSet', { logServerId: log.id, setServerId: s.id })
      }
    }
  }

  return { log, isLoading, saveLog, removeLog, addLogSet, updateLogSet, removeLogSet, removeExerciseSets }
}
