import * as SQLite from 'expo-sqlite'

let db = null

export const getDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('replog.db')
    await initDB(db)
  }
  return db
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

export const addToSyncQueue = async (action, payload) => {
  const db = await getDB()
  await db.runAsync(
    'INSERT INTO sync_queue (action, payload) VALUES (?, ?)',
    [action, JSON.stringify(payload)]
  )
}

export const getSyncQueue = async () => {
  const db = await getDB()
  return await db.getAllAsync('SELECT * FROM sync_queue ORDER BY created_at ASC')
}

export const removeFromSyncQueue = async (id) => {
  const db = await getDB()
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id])
}
