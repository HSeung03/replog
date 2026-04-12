import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box, Typography, Button, IconButton, TextField, MenuItem,
  Select, FormControl, InputLabel, Divider, Paper, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { getLog, createLog, updateLog, addSet, deleteSet } from '../../api/workoutLogs'
import { getExercises } from '../../api/exercises'

export default function LogPage() {
  const { date } = useParams()
  const [log, setLog] = useState(null)
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [memo, setMemo] = useState('')
  const [memoSaved, setMemoSaved] = useState(false)

  const [open, setOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('')
  const [setForm, setSetForm] = useState({ reps: '', weight: '' })

  const fetchLog = useCallback(async () => {
    try {
      const res = await getLog(date)
      if (res.status === 204) {
        setLog(null)
        setMemo('')
      } else {
        setLog(res.data)
        setMemo(res.data.memo || '')
      }
    } catch {
      setLog(null)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchLog()
    getExercises().then((res) => setExercises(res.data))
  }, [fetchLog])

  const handleSaveMemo = async () => {
    if (!log) {
      const res = await createLog({ record_date: date, memo })
      setLog(res.data)
    } else {
      await updateLog(log.id, { memo })
    }
    setMemoSaved(true)
    setTimeout(() => setMemoSaved(false), 2000)
  }

  const handleAddSet = async () => {
    let currentLog = log
    if (!currentLog) {
      const res = await createLog({ record_date: date, memo })
      currentLog = res.data
      setLog(currentLog)
    }
    const currentSets = currentLog.sets?.filter((s) => s.exercise_id === selectedExercise) || []
    await addSet(currentLog.id, {
      exercise_id: selectedExercise,
      set_number: currentSets.length + 1,
      reps: Number(setForm.reps),
      weight: Number(setForm.weight),
    })
    setOpen(false)
    setSetForm({ reps: '', weight: '' })
    fetchLog()
  }

  const handleDeleteSet = async (setId) => {
    await deleteSet(log.id, setId)
    fetchLog()
  }

  const handleOpenDialog = (exerciseId) => {
    setSelectedExercise(exerciseId || '')
    setSetForm({ reps: '', weight: '' })
    setOpen(true)
  }

  const grouped = log?.sets?.reduce((acc, set) => {
    const name = set.exercise?.name || '알 수 없음'
    if (!acc[name]) acc[name] = []
    acc[name].push(set)
    return acc
  }, {}) || {}

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box p={2}>
      <Typography variant="h6" fontWeight="bold" mb={2}>{date}</Typography>

      <Box display="flex" gap={1} mb={3}>
        <TextField
          label="메모"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          size="small"
          fullWidth
          multiline
          maxRows={3}
        />
        <Button variant="outlined" onClick={handleSaveMemo} sx={{ minWidth: 60 }}>
          {memoSaved ? '저장됨' : '저장'}
        </Button>
      </Box>

      {Object.entries(grouped).map(([name, sets]) => (
        <Paper key={name} sx={{ p: 2, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography fontWeight="bold">{name}</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpenDialog(sets[0].exercise_id)}>
              세트 추가
            </Button>
          </Box>
          <Divider sx={{ mb: 1 }} />
          {sets.sort((a, b) => a.set_number - b.set_number).map((set) => (
            <Box key={set.id} display="flex" alignItems="center" justifyContent="space-between" py={0.5}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 50 }}>
                {set.set_number}세트
              </Typography>
              <Typography variant="body2">{set.weight}kg × {set.reps}회</Typography>
              <IconButton size="small" onClick={() => handleDeleteSet(set.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Paper>
      ))}

      <Button variant="contained" startIcon={<AddIcon />} fullWidth onClick={() => handleOpenDialog(null)}>
        운동 추가
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{selectedExercise ? '세트 추가' : '운동 추가'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>운동 종목</InputLabel>
              <Select
                value={selectedExercise}
                label="운동 종목"
                onChange={(e) => setSelectedExercise(e.target.value)}
                disabled={!!selectedExercise}
              >
                {exercises.map((ex) => (
                  <MenuItem key={ex.id} value={ex.id}>
                    [{ex.category}] {ex.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="무게 (kg)"
              type="number"
              value={setForm.weight}
              onChange={(e) => setSetForm({ ...setForm, weight: e.target.value })}
              fullWidth
            />
            <TextField
              label="횟수"
              type="number"
              value={setForm.reps}
              onChange={(e) => setSetForm({ ...setForm, reps: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleAddSet}
            disabled={!selectedExercise || !setForm.reps || !setForm.weight}
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
