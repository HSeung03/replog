import NetInfo from '@react-native-community/netinfo'
import {
  getSyncQueue, removeFromSyncQueue, bumpSyncAttempt,
  updateLogServerId, updateSetServerId, getLogByLocalId, getSetByLocalId,
} from './localDB'
import { createLog, addSet, updateSet, deleteSet, deleteLog } from '../api/workoutLogs'

// 이만큼 실패하면 큐에서 버린다. 없으면 영영 성공할 수 없는 항목 하나가
// 큐에 눌러앉아 매 동기화마다 재시도되고, 뒤에 쌓인 정상 항목까지
// 함께 끌고 다닌다.
const MAX_ATTEMPTS = 5

// 다시 시도해도 결과가 달라지지 않는 실패. 즉시 버린다.
class PermanentFailure extends Error {}

export const syncPendingQueue = async () => {
  const state = await NetInfo.fetch()
  if (!state.isConnected) return

  const queue = await getSyncQueue()

  // createLog 먼저 처리 후 나머지 처리 (순서 보장)
  const createLogItems = queue.filter(i => i.action === 'createLog')
  const otherItems = queue.filter(i => i.action !== 'createLog')

  for (const item of [...createLogItems, ...otherItems]) {
    try {
      const payload = JSON.parse(item.payload)
      await processQueueItem(item.action, payload)
      await removeFromSyncQueue(item.id)
    } catch (e) {
      if (isPermanent(e)) {
        await removeFromSyncQueue(item.id)
        continue
      }

      const attempts = await bumpSyncAttempt(item.id)
      if (attempts >= MAX_ATTEMPTS) {
        await removeFromSyncQueue(item.id)
      }
      // 그 외에는 큐에 두고 다음 동기화에서 재시도
    }
  }
}

// 4xx는 요청 자체가 잘못됐다는 뜻이라 재시도해도 같은 응답이 온다.
// (408 요청 시간초과와 429 요청량 초과는 시간이 지나면 통과할 수 있다)
//
// 큐에 넣기 전에도 같은 판단이 필요해서 밖으로 내보낸다. 422를 큐에 넣으면
// 화면에는 저장된 것처럼 보이면서 서버에는 영영 올라가지 않는다.
export const isPermanentFailure = (e) => {
  const status = e?.response?.status
  return !!status && status >= 400 && status < 500 && status !== 408 && status !== 429
}

const isPermanent = (e) => e instanceof PermanentFailure || isPermanentFailure(e)

const processQueueItem = async (action, payload) => {
  switch (action) {
    case 'createLog': {
      const res = await createLog({ record_date: payload.date, memo: payload.memo })
      await updateLogServerId(payload.logLocalId, res.data.id)
      break
    }
    case 'addSet': {
      // 동기화 시점에 최신 server_id 조회 (큐 저장 시점에는 null이었을 수 있음)
      const log = await getLogByLocalId(payload.logLocalId)
      if (!log?.server_id) throw new Error('log not synced yet')
      const res = await addSet(log.server_id, {
        exercise_id: payload.exerciseId,
        set_number: payload.setNumber,
        weight: payload.weight,
        reps: payload.reps,
      })
      await updateSetServerId(payload.localSetId, res.data.id)
      break
    }
    case 'updateSet': {
      // server_id는 큐에 담지 않고 여기서 찾는다. 담아두면 오프라인에서
      // 만든 세트를 수정했을 때 null이 박혀 영영 실패하는 항목이 된다.
      const log = await getLogByLocalId(payload.logLocalId)
      const set = await getSetByLocalId(payload.setLocalId)

      // 로컬에서 이미 지워진 세트면 수정할 대상이 없다.
      if (!set) throw new PermanentFailure('set no longer exists')
      if (!log?.server_id || !set.server_id) throw new Error('not synced yet')

      await updateSet(log.server_id, set.server_id, payload.data)
      await updateSetServerId(payload.setLocalId, set.server_id)
      break
    }
    case 'deleteSet': {
      // 삭제는 로컬 행이 이미 사라진 뒤라 server_id를 되찾을 수 없다.
      // 그래서 큐에 담아두되, 없으면 실행할 수 없는 요청이므로 버린다.
      if (!payload.logServerId || !payload.setServerId) {
        throw new PermanentFailure('missing server ids')
      }
      await deleteSet(payload.logServerId, payload.setServerId)
      break
    }
    case 'deleteLog': {
      if (!payload.serverId) throw new PermanentFailure('missing server id')
      await deleteLog(payload.serverId)
      break
    }
  }
}
