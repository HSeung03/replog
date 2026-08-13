import { useState, useEffect, useCallback } from 'react'
import NetInfo from '@react-native-community/netinfo'
import {
  getLocalLog, getLocalSets, insertLog, updateLogMemo, deleteLog as deleteLocalLog,
  insertSet, updateSet as updateLocalSet, deleteSet as deleteLocalSet,
  updateLogServerId, updateSetServerId, addToSyncQueue, reconcileServerLog,
  cancelQueuedSetOperations, cancelQueuedLogOperations,
} from '../db/localDB'
import { syncPendingQueue, isPermanentFailure } from '../db/syncManager'
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

        // 서버 응답을 화면에 바로 얹지 않고 로컬 DB에 먼저 반영한다.
        // 그래야 모든 세트가 local_id를 갖게 되고, 이어지는 수정/삭제가
        // 로컬에도 남아 다음 오프라인 조회에서 되살아나지 않는다.
        await reconcileServerLog(date, res.status === 204 ? null : res.data)

        const merged = await getLocalLog(date)
        setLog(merged ? toUILog(merged, await getLocalSets(merged.local_id)) : null)
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
        // 서버에 반영됐으므로 synced로 되돌린다. 그러지 않으면 이 행은
        // 영원히 "밀린 수정"으로 남아 서버 메모를 다시 받아오지 못한다.
        await updateLogServerId(localLog.local_id, localLog.server_id)
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
    if (localLog) {
      await deleteLocalLog(localLog.local_id)
      // 이 일지에 딸린 대기 요청(세트 추가 등)도 함께 취소한다.
      await cancelQueuedLogOperations(localLog.local_id)
    }

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
        // 서버가 거절한 요청(422 등)은 다시 보내도 결과가 같다. 큐에 넣으면
        // 화면에는 추가된 것처럼 보이면서 서버에는 영영 올라가지 않는다.
        // 로컬 흔적을 지우고 호출부가 사용자에게 알릴 수 있게 던진다.
        if (isPermanentFailure(e)) {
          await deleteLocalSet(localSetId)
          await cancelQueuedSetOperations(localSetId)
          setLog(prev => prev ? { ...prev, sets: prev.sets.filter(s => s.local_id !== localSetId) } : prev)
          throw e
        }

        // 네트워크 실패는 큐에 저장 (logLocalId로 저장해서 동기화 시 최신 server_id 조회)
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

    // 큐에는 로컬 ID만 담는다. 서버 ID를 담으면 아직 못 올린 세트를
    // 수정했을 때 null이 박히고, 그 항목은 영영 성공하지 못한 채
    // 큐에 남아 매 동기화마다 실패한다.
    const queueUpdate = () => addToSyncQueue('updateSet', {
      logLocalId: log?.local_id,
      setLocalId: set?.local_id,
      data,
    })

    // local-xxx ID면 아직 서버 미동기화 → 큐에 저장
    if (typeof setId !== 'number') {
      await queueUpdate()
      return
    }

    const state = await NetInfo.fetch()
    if (state.isConnected && log?.id) {
      try {
        await updateSet(log.id, setId, data)
        if (set?.local_id) await updateSetServerId(set.local_id, setId)
      } catch (e) {
        setLog(prevLog)

        // 서버가 거절한 수정은 재시도해도 같은 응답이다. 화면과 로컬 DB를
        // 되돌리고 호출부에 알린다.
        if (isPermanentFailure(e)) {
          if (set?.local_id) {
            await updateLocalSet(set.local_id, { weight: set.weight, reps: set.reps })
            // 서버 값과 같은 상태로 되돌렸으므로 "밀린 수정" 표시를 지운다.
            await updateSetServerId(set.local_id, setId)
          }
          throw e
        }

        await queueUpdate()
      }
    } else {
      await queueUpdate()
    }
  }

  const removeLogSet = async (setId) => {
    const prevLog = log
    const set = log?.sets?.find(s => s.id === setId)
    setLog(prev => prev ? { ...prev, sets: prev.sets.filter(s => s.id !== setId) } : prev)

    if (set?.local_id) {
      await deleteLocalSet(set.local_id)
      // 아직 못 올린 추가/수정 요청을 취소한다. 남겨두면 오프라인에서
      // 추가했다 지운 세트가 다음 동기화 때 서버에 되살아난다.
      await cancelQueuedSetOperations(set.local_id)
    }

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
    await cancelQueuedSetOperations(sets.map(s => s.local_id))

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
