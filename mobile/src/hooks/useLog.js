import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import NetInfo from '@react-native-community/netinfo'
import {
  getLocalLog, getLocalSets, insertLog, updateLogMemo, deleteLog as deleteLocalLog,
  insertSet, updateSet as updateLocalSet, deleteSet as deleteLocalSet,
  updateLogServerId, updateSetServerId, addToSyncQueue, reconcileServerLog,
  cancelQueuedSetOperations, cancelQueuedLogOperations,
} from '../db/localDB'
import { syncPendingQueue, flushOrQueue } from '../db/syncManager'
import { getLog, createLog, updateLog, deleteLog, addSet, updateSet, deleteSet } from '../api/workoutLogs'
import { queryKeys } from '../api/queryKeys'

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

// 화면이 보는 일지는 언제나 로컬 DB에서 만든다. 서버 응답을 화면에 바로
// 꽂으면 그 세트들에 local_id가 없어서, 이어지는 수정·삭제가 로컬에 남지
// 않고 다음 오프라인 조회에서 되살아난다(MO-01).
const readLocalLog = async (date) => {
  const localLog = await getLocalLog(date)
  if (!localLog) return null
  return toUILog(localLog, await getLocalSets(localLog.local_id))
}

const swallow = (promise) => promise.catch(() => {})

// 밀린 큐를 비우고 서버 일지를 로컬에 합친다. 오프라인이면 아무것도 하지 않는다.
const pullFromServer = async (date) => {
  const state = await NetInfo.fetch()
  if (!state.isConnected) return false

  await syncPendingQueue()
  const res = await getLog(date)
  await reconcileServerLog(date, res.status === 204 ? null : res.data)
  return true
}

/*
 * 하루치 일지.
 *
 * 조회는 두 겹이다.
 *   log      로컬 DB만 읽는다. 오프라인에서도 즉시 뜨고, 화면은 이것만 그린다.
 *   log-sync 서버와 맞춘다. 결과를 직접 그리지 않고 로컬 DB에 합친 뒤 위
 *            쿼리를 무효화한다. 실패해도 화면은 로컬 데이터 그대로 남는다.
 *
 * 쓰기는 전부 (로컬 DB에 먼저 쓰고 → 화면 갱신 → 서버로 보내거나 큐에 적재)
 * 순서다. 서버 왕복을 기다리지 않으므로 화면은 즉시 반응하고, 되돌릴 일이
 * 생기면 rollback이 로컬 DB까지 함께 되돌린다.
 */
export default function useLog(date) {
  const queryClient = useQueryClient()
  const logKey = queryKeys.log(date)

  const { data: log = null, isPending } = useQuery({
    queryKey: logKey,
    queryFn: () => readLocalLog(date),
  })

  useQuery({
    queryKey: queryKeys.logSync(date),
    queryFn: async () => {
      const synced = await pullFromServer(date)
      await queryClient.invalidateQueries({ queryKey: logKey })
      return synced
    },
    // 화면에 들어올 때마다 서버와 맞춘다. 실패는 화면을 막지 않으므로
    // 재시도로 시간을 끌지 않는다.
    staleTime: 0,
    retry: false,
  })

  // 로컬 DB를 고친 뒤 화면을 그 값으로 맞춘다. 무효화가 아니라 직접 써넣는
  // 이유는, 무효화하면 로딩 상태를 한 번 거치면서 화면이 깜빡이기 때문이다.
  const refresh = useCallback(async () => {
    queryClient.setQueryData(queryKeys.log(date), await readLocalLog(date))
  }, [queryClient, date])

  // 일지가 생기거나 사라지면 달력의 점도 달라진다.
  const refreshCalendar = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.calendarAll }),
    [queryClient]
  )

  const ensureLocalLog = async (memo = '') => {
    const existing = await getLocalLog(date)
    if (existing) return existing
    const localId = await insertLog(date, memo)
    return { local_id: localId, server_id: null, record_date: date, memo }
  }

  const saveLogMutation = useMutation({
    mutationFn: async (memo) => {
      const localLog = await ensureLocalLog(memo)
      await updateLogMemo(localLog.local_id, memo)
      await refresh()

      await flushOrQueue({
        remote: async () => {
          if (localLog.server_id) {
            await updateLog(localLog.server_id, { memo })
            // 서버에 반영됐으므로 synced로 되돌린다. 그러지 않으면 이 행은
            // 영원히 "밀린 수정"으로 남아 서버 메모를 다시 받아오지 못한다.
            await updateLogServerId(localLog.local_id, localLog.server_id)
            return
          }
          const res = await createLog({ record_date: date, memo })
          await updateLogServerId(localLog.local_id, res.data.id)
        },
        queue: () => addToSyncQueue('createLog', { logLocalId: localLog.local_id, date, memo }),
      })
    },
    onSettled: async () => {
      await refresh()
      refreshCalendar()
    },
  })

  const removeLogMutation = useMutation({
    mutationFn: async () => {
      const localLog = await getLocalLog(date)
      const serverId = localLog?.server_id ?? null

      if (localLog) {
        await deleteLocalLog(localLog.local_id)
        // 이 일지에 딸린 대기 요청(세트 추가 등)도 함께 취소한다.
        await cancelQueuedLogOperations(localLog.local_id)
      }
      await refresh()

      if (!serverId) return

      await flushOrQueue({
        remote: () => deleteLog(serverId),
        queue: () => addToSyncQueue('deleteLog', { serverId }),
        // 서버가 거절했다면 그 일지는 지울 수 없는 것이다. 화면만 되돌리면
        // 로컬 DB에 없는 것을 보여주게 되므로, 서버에서 다시 받아 로컬을 채운다.
        rollback: () => pullFromServer(date),
      })
    },
    onSettled: async () => {
      await refresh()
      refreshCalendar()
    },
  })

  const addSetMutation = useMutation({
    mutationFn: async ({ exerciseId, setData, memo = '' }) => {
      const localLog = await ensureLocalLog(memo)
      const currentSets = await getLocalSets(localLog.local_id)
      const setNumber = currentSets.filter(s => s.exercise_id === exerciseId).length + 1

      const localSetId = await insertSet(
        localLog.local_id, exerciseId, setNumber, setData.weight, setData.reps
      )
      await refresh()

      await flushOrQueue({
        remote: async () => {
          let serverId = localLog.server_id
          if (!serverId) {
            const res = await createLog({ record_date: date, memo })
            serverId = res.data.id
            await updateLogServerId(localLog.local_id, serverId)
          }
          const res = await addSet(serverId, { exercise_id: exerciseId, set_number: setNumber, ...setData })
          await updateSetServerId(localSetId, res.data.id)
        },
        // logLocalId로 담아둔다. 동기화 시점에 최신 server_id를 조회한다.
        queue: () => addToSyncQueue('addSet', {
          localSetId,
          logLocalId: localLog.local_id,
          exerciseId,
          setNumber,
          weight: setData.weight,
          reps: setData.reps,
        }),
        // 서버가 거절한 요청은 다시 보내도 결과가 같다. 큐에 남기면 화면에는
        // 추가된 것처럼 보이면서 서버에는 영영 올라가지 않는다.
        rollback: async () => {
          await deleteLocalSet(localSetId)
          await cancelQueuedSetOperations(localSetId)
        },
      })
    },
    onSettled: async () => {
      await refresh()
      refreshCalendar()
    },
  })

  const updateSetMutation = useMutation({
    mutationFn: async ({ setId, data }) => {
      const current = await readLocalLog(date)
      const set = current?.sets?.find(s => s.id === setId)
      if (set?.local_id) await updateLocalSet(set.local_id, data)
      await refresh()

      // 큐에는 로컬 ID만 담는다. 서버 ID를 담으면 아직 못 올린 세트를
      // 수정했을 때 null이 박히고, 그 항목은 영영 성공하지 못한 채
      // 큐에 남아 매 동기화마다 실패한다.
      const queueUpdate = () => addToSyncQueue('updateSet', {
        logLocalId: current?.local_id,
        setLocalId: set?.local_id,
        data,
      })

      // local-xxx ID면 아직 서버에 없는 세트다. 서버 일지가 없을 때도 마찬가지.
      if (typeof setId !== 'number' || !current?.id) return queueUpdate()

      await flushOrQueue({
        remote: async () => {
          await updateSet(current.id, setId, data)
          if (set?.local_id) await updateSetServerId(set.local_id, setId)
        },
        queue: queueUpdate,
        // 서버가 거절한 수정은 재시도해도 같은 응답이다. 로컬 DB를 되돌린다.
        rollback: async () => {
          if (set?.local_id) {
            await updateLocalSet(set.local_id, { weight: set.weight, reps: set.reps })
            // 서버 값과 같은 상태로 되돌렸으므로 "밀린 수정" 표시를 지운다.
            await updateSetServerId(set.local_id, setId)
          }
        },
      })
    },
    onSettled: refresh,
  })

  // 세트 여러 개를 한 번에 지운다(종목 그룹 통째로 지우기 포함).
  // 화면이 넘기는 것은 세트 id뿐이고, 지울 행은 로컬 DB에서 다시 찾는다.
  const removeSetsMutation = useMutation({
    mutationFn: async (setIds) => {
      const current = await readLocalLog(date)
      const logServerId = current?.id ?? null
      const targets = new Set(setIds)
      const sets = (current?.sets || []).filter((s) => targets.has(s.id))

      for (const set of sets) {
        if (set.local_id) await deleteLocalSet(set.local_id)
      }
      // 아직 못 올린 추가/수정 요청을 취소한다. 남겨두면 오프라인에서
      // 추가했다 지운 세트가 다음 동기화 때 서버에 되살아난다.
      await cancelQueuedSetOperations(sets.map(s => s.local_id))
      await refresh()

      const serverSets = sets.filter(s => typeof s.id === 'number')
      if (!serverSets.length || !logServerId) return

      await flushOrQueue({
        remote: () => Promise.all(serverSets.map(s => deleteSet(logServerId, s.id))),
        queue: async () => {
          for (const s of serverSets) {
            await addToSyncQueue('deleteSet', { logServerId, setServerId: s.id })
          }
        },
        // 서버가 거절했다면 그 세트는 이미 없거나 내 것이 아니다. 로컬을
        // 서버 기준으로 다시 맞춘다.
        rollback: () => pullFromServer(date),
      })
    },
    onSettled: refresh,
  })

  return {
    log,
    isLoading: isPending,

    // 저장·삭제 버튼은 실패를 화면에 띄우지 않는다(원래도 그랬다). 여기서
    // 삼키지 않으면 처리되지 않은 거부로 남는다.
    saveLog: (memo) => swallow(saveLogMutation.mutateAsync(memo)),
    removeLog: () => swallow(removeLogMutation.mutateAsync()),
    removeLogSet: (setId) => swallow(removeSetsMutation.mutateAsync([setId])),
    removeExerciseSets: (sets) => swallow(removeSetsMutation.mutateAsync(sets.map((s) => s.id))),

    // 세트 추가·수정은 서버가 거절하면 시트에 이유를 남겨야 하므로 그대로 던진다.
    addLogSet: (exerciseId, setData, memo) => addSetMutation.mutateAsync({ exerciseId, setData, memo }),
    updateLogSet: (setId, data) => updateSetMutation.mutateAsync({ setId, data }),
  }
}
