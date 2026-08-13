import * as SQLite from 'expo-sqlite'

let db = null

export const getDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('replog.db')
    await initDB(db)
    await migrateDB(db)
  }
  return db
}

// CREATE TABLE IF NOT EXISTS는 이미 만들어진 테이블에 컬럼을 더해주지 않는다.
// 기존 설치에도 반영되도록 빠진 컬럼만 골라 붙인다.
const migrateDB = async (db) => {
  const columns = await db.getAllAsync('PRAGMA table_info(sync_queue)')
  if (!columns.some((c) => c.name === 'attempts')) {
    await db.execAsync('ALTER TABLE sync_queue ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0')
  }
}

const initDB = async (db) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_logs (
      local_id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      record_date TEXT NOT NULL,
      memo TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      local_id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      log_local_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL,
      reps INTEGER,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (log_local_id) REFERENCES workout_logs(local_id)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `)
}

export const getLocalLog = async (date) => {
  const db = await getDB()
  return await db.getFirstAsync(
    'SELECT * FROM workout_logs WHERE record_date = ?', [date]
  )
}

export const getLogByLocalId = async (localId) => {
  const db = await getDB()
  return await db.getFirstAsync('SELECT * FROM workout_logs WHERE local_id = ?', [localId])
}

export const getLocalSets = async (logLocalId) => {
  const db = await getDB()
  return await db.getAllAsync(
    'SELECT * FROM workout_sets WHERE log_local_id = ? ORDER BY set_number ASC', [logLocalId]
  )
}

export const insertLog = async (date, memo = '') => {
  const db = await getDB()
  const result = await db.runAsync(
    'INSERT INTO workout_logs (record_date, memo, synced) VALUES (?, ?, 0)', [date, memo]
  )
  return result.lastInsertRowId
}

export const updateLogMemo = async (localId, memo) => {
  const db = await getDB()
  await db.runAsync('UPDATE workout_logs SET memo = ?, synced = 0 WHERE local_id = ?', [memo, localId])
}

export const updateLogServerId = async (localId, serverId) => {
  const db = await getDB()
  await db.runAsync('UPDATE workout_logs SET server_id = ?, synced = 1 WHERE local_id = ?', [serverId, localId])
}

export const insertSet = async (logLocalId, exerciseId, setNumber, weight, reps) => {
  const db = await getDB()
  const result = await db.runAsync(
    'INSERT INTO workout_sets (log_local_id, exercise_id, set_number, weight, reps, synced) VALUES (?, ?, ?, ?, ?, 0)',
    [logLocalId, exerciseId, setNumber, weight, reps]
  )
  return result.lastInsertRowId
}

export const updateSet = async (localId, data) => {
  const db = await getDB()
  await db.runAsync(
    'UPDATE workout_sets SET weight = ?, reps = ?, synced = 0 WHERE local_id = ?',
    [data.weight, data.reps, localId]
  )
}

export const updateSetServerId = async (localId, serverId) => {
  const db = await getDB()
  await db.runAsync('UPDATE workout_sets SET server_id = ?, synced = 1 WHERE local_id = ?', [serverId, localId])
}

export const deleteSet = async (localId) => {
  const db = await getDB()
  await db.runAsync('DELETE FROM workout_sets WHERE local_id = ?', [localId])
}

export const deleteLog = async (localId) => {
  const db = await getDB()
  await db.runAsync('DELETE FROM workout_sets WHERE log_local_id = ?', [localId])
  await db.runAsync('DELETE FROM workout_logs WHERE local_id = ?', [localId])
}

// 서버에서 받아온 일지를 로컬 DB에 합친다.
//
// 이게 없으면 서버 응답이 화면 상태에만 얹히고 로컬 DB는 그대로 남는다.
// 그러면 서버에서 받아온 행에는 local_id가 없어 삭제/수정이 로컬에 반영되지
// 않고, 다음에 오프라인으로 열 때 지웠던 세트가 되살아난다.
//
// 규칙은 하나다: 아직 서버에 못 올린 것(synced = 0)은 절대 덮어쓰지 않는다.
export const reconcileServerLog = async (date, serverLog) => {
  const db = await getDB()

  if (!serverLog) {
    // 서버에는 이 날짜 기록이 없다. 다른 기기에서 지운 경우이므로
    // 동기화가 끝난 행만 정리하고, 올리지 못한 로컬 기록은 남긴다.
    await db.runAsync(
      `DELETE FROM workout_sets
        WHERE synced = 1
          AND log_local_id IN (SELECT local_id FROM workout_logs WHERE record_date = ?)`,
      [date]
    )
    await db.runAsync(
      `DELETE FROM workout_logs
        WHERE record_date = ? AND synced = 1
          AND NOT EXISTS (SELECT 1 FROM workout_sets WHERE log_local_id = workout_logs.local_id)`,
      [date]
    )
    return
  }

  const local = await db.getFirstAsync('SELECT * FROM workout_logs WHERE record_date = ?', [date])

  let logLocalId
  if (local) {
    logLocalId = local.local_id
    if (local.synced === 1) {
      await db.runAsync(
        'UPDATE workout_logs SET server_id = ?, memo = ? WHERE local_id = ?',
        [serverLog.id, serverLog.memo ?? '', logLocalId]
      )
    } else {
      // 메모 수정이 아직 밀려 있다. server_id만 채우고 내용은 건드리지 않는다.
      await db.runAsync('UPDATE workout_logs SET server_id = ? WHERE local_id = ?', [serverLog.id, logLocalId])
    }
  } else {
    const inserted = await db.runAsync(
      'INSERT INTO workout_logs (server_id, record_date, memo, synced) VALUES (?, ?, ?, 1)',
      [serverLog.id, date, serverLog.memo ?? '']
    )
    logLocalId = inserted.lastInsertRowId
  }

  const serverSets = serverLog.sets ?? []
  const serverIds = serverSets.map((s) => s.id)

  // 서버에서 사라진 세트는 로컬에서도 지운다.
  // server_id가 없는 행은 아직 못 올린 것이므로 건드리지 않는다.
  const placeholders = serverIds.map(() => '?').join(',')
  await db.runAsync(
    `DELETE FROM workout_sets
      WHERE log_local_id = ?
        AND server_id IS NOT NULL
        ${serverIds.length ? `AND server_id NOT IN (${placeholders})` : ''}`,
    [logLocalId, ...serverIds]
  )

  for (const s of serverSets) {
    const existing = await db.getFirstAsync(
      'SELECT local_id, synced FROM workout_sets WHERE server_id = ?',
      [s.id]
    )

    if (!existing) {
      await db.runAsync(
        `INSERT INTO workout_sets
           (server_id, log_local_id, exercise_id, set_number, weight, reps, synced)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [s.id, logLocalId, s.exercise_id, s.set_number, Number(s.weight), Number(s.reps)]
      )
    } else if (existing.synced === 1) {
      // synced = 0이면 아직 못 올린 수정이 있으니 서버 값으로 덮지 않는다.
      await db.runAsync(
        `UPDATE workout_sets
            SET log_local_id = ?, exercise_id = ?, set_number = ?, weight = ?, reps = ?
          WHERE local_id = ?`,
        [logLocalId, s.exercise_id, s.set_number, Number(s.weight), Number(s.reps), existing.local_id]
      )
    }
  }
}

// 계정이 바뀔 때 이 기기에 남은 기록을 전부 비운다.
// 남겨두면 다음 로그인한 사람에게 이전 사용자의 기록이 보이고,
// 대기 중이던 sync_queue가 새 계정의 토큰으로 실행되어 서버로 올라간다.
export const clearLocalData = async () => {
  const db = await getDB()
  await db.execAsync(`
    DELETE FROM sync_queue;
    DELETE FROM workout_sets;
    DELETE FROM workout_logs;
  `)
}

export const addToSyncQueue = async (action, payload) => {
  const db = await getDB()
  await db.runAsync(
    'INSERT INTO sync_queue (action, payload) VALUES (?, ?)',
    [action, JSON.stringify(payload)]
  )
}

// created_at은 초 단위(strftime('%s'))라 같은 초에 들어간 항목들의 순서를
// 정하지 못한다. 세트를 추가하고 1초 안에 수정하는 건 흔한 조작이고,
// 그때 수정이 추가보다 먼저 실행되면 그대로 실패한다.
// AUTOINCREMENT PK가 삽입 순서를 정확히 담고 있으므로 그걸 쓴다.
export const getSyncQueue = async () => {
  const db = await getDB()
  return await db.getAllAsync('SELECT * FROM sync_queue ORDER BY id ASC')
}

export const removeFromSyncQueue = async (id) => {
  const db = await getDB()
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id])
}

// 실패 횟수를 세서 돌려준다. 영영 성공할 수 없는 항목이 큐에 눌러앉아
// 매 동기화마다 재시도되는 것을 막는 안전장치다.
export const bumpSyncAttempt = async (id) => {
  const db = await getDB()
  await db.runAsync('UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?', [id])
  const row = await db.getFirstAsync('SELECT attempts FROM sync_queue WHERE id = ?', [id])
  return row?.attempts ?? 0
}

export const getSetByLocalId = async (localId) => {
  const db = await getDB()
  return await db.getFirstAsync('SELECT * FROM workout_sets WHERE local_id = ?', [localId])
}

// 세트를 지울 때, 아직 올리지 못한 그 세트의 추가/수정 요청도 함께 취소한다.
// 남겨두면 다음 동기화에서 "지운 세트를 서버에 만드는" 요청이 실행된다.
//
// payload를 SQL에서 파싱하지 않고 JS에서 거른다. 큐는 길어야 수십 건이고,
// SQLite 빌드에 JSON 확장이 있는지에 기대지 않아도 된다.
export const cancelQueuedSetOperations = async (setLocalIds) => {
  const targets = new Set([].concat(setLocalIds).filter((id) => id != null))
  if (targets.size === 0) return

  const db = await getDB()
  const rows = await db.getAllAsync(
    `SELECT id, payload FROM sync_queue WHERE action IN ('addSet', 'updateSet')`
  )

  for (const row of rows) {
    let payload
    try {
      payload = JSON.parse(row.payload)
    } catch {
      continue
    }
    // addSet은 localSetId, updateSet은 setLocalId로 담긴다.
    if (targets.has(payload.localSetId) || targets.has(payload.setLocalId)) {
      await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [row.id])
    }
  }
}

// 일지 전체를 지울 때 그 일지에 딸린 대기 요청을 모두 취소한다.
export const cancelQueuedLogOperations = async (logLocalId) => {
  if (logLocalId == null) return

  const db = await getDB()
  const rows = await db.getAllAsync('SELECT id, payload FROM sync_queue')

  for (const row of rows) {
    let payload
    try {
      payload = JSON.parse(row.payload)
    } catch {
      continue
    }
    if (payload.logLocalId === logLocalId) {
      await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [row.id])
    }
  }
}
