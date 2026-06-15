import NetInfo from '@react-native-community/netinfo'
import { getSyncQueue, removeFromSyncQueue, updateLogServerId, updateSetServerId, getLogByLocalId } from './localDB'
import { createLog, addSet, updateSet, deleteSet, deleteLog } from '../api/workoutLogs'

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
      // 실패 시 다음 동기화에서 재시도
    }
  }
}

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
      if (!payload.logServerId || !payload.setServerId) throw new Error('missing server ids')
      await updateSet(payload.logServerId, payload.setServerId, payload.data)
      break
    }
    case 'deleteSet': {
      if (!payload.logServerId || !payload.setServerId) throw new Error('missing server ids')
      await deleteSet(payload.logServerId, payload.setServerId)
      break
    }
    case 'deleteLog': {
      if (!payload.serverId) throw new Error('missing server id')
      await deleteLog(payload.serverId)
      break
    }
  }
}
