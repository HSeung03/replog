import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box, Typography, Button, IconButton, TextField, MenuItem,
  Select, FormControl, InputLabel, Divider, Paper, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItemButton, ListItemText, Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ViewListIcon from '@mui/icons-material/ViewList'
import { getLog, createLog, updateLog, deleteLog, addSet, updateSet, deleteSet } from '../../api/workoutLogs'
import { getExercises } from '../../api/exercises'
import { getTemplates } from '../../api/templates'

export default function LogPage() {
  const { date } = useParams()
  const [log, setLog] = useState(null)
  const [exercises, setExercises] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [memo, setMemo] = useState('')
  const [memoSaved, setMemoSaved] = useState(false)

  // 템플릿에서 불러온 종목 (세트 없이 표시용)
  const [pendingExercises, setPendingExercises] = useState([])

  // 세트 추가 다이얼로그
  const [open, setOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('')
  const [setForm, setSetForm] = useState({ reps: '', weight: '' })

  // 세트 수정 다이얼로그
  const [editOpen, setEditOpen] = useState(false)
  const [editingSet, setEditingSet] = useState(null)
  const [editForm, setEditForm] = useState({ reps: '', weight: '' })

  // 일지 삭제 확인 다이얼로그
  const [deleteLogOpen, setDeleteLogOpen] = useState(false)

  // 템플릿 선택 다이얼로그
  const [templateOpen, setTemplateOpen] = useState(false)

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
    getTemplates().then((res) => setTemplates(res.data))
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
    // 세트 추가 후 pendingExercises에서 해당 종목 제거
    setPendingExercises((prev) => prev.filter((ex) => ex.id !== selectedExercise))
    setOpen(false)
    setSetForm({ reps: '', weight: '' })
    fetchLog()
  }

  const handleDeleteSet = async (setId) => {
    await deleteSet(log.id, setId)
    fetchLog()
  }

  const handleOpenEditSet = (set) => {
    setEditingSet(set)
    setEditForm({ reps: String(set.reps), weight: String(set.weight) })
    setEditOpen(true)
  }

  const handleUpdateSet = async () => {
    await updateSet(log.id, editingSet.id, {
      reps: Number(editForm.reps),
      weight: Number(editForm.weight),
    })
    setEditOpen(false)
    setEditingSet(null)
    fetchLog()
  }

  const handleDeleteLog = async () => {
    await deleteLog(log.id)
    setLog(null)
    setMemo('')
    setPendingExercises([])
    setDeleteLogOpen(false)
  }

  const handleOpenDialog = (exerciseId) => {
    setSelectedExercise(exerciseId || '')

    // 이전 세트 값 자동 복사
    if (exerciseId && log?.sets) {
      const prevSets = log.sets
        .filter((s) => s.exercise_id === exerciseId)
        .sort((a, b) => b.set_number - a.set_number)
      if (prevSets.length > 0) {
        setSetForm({ reps: String(prevSets[0].reps), weight: String(prevSets[0].weight) })
        setOpen(true)
        return
      }
    }

    setSetForm({ reps: '', weight: '' })
    setOpen(true)
  }

  // 템플릿 불러오기
  const handleLoadTemplate = (template) => {
    const existingIds = new Set([
      ...(log?.sets?.map((s) => s.exercise_id) || []),
      ...pendingExercises.map((e) => e.id),
    ])
    const newExercises = template.exercises?.filter((ex) => !existingIds.has(ex.id)) || []
    setPendingExercises((prev) => [...prev, ...newExercises])
    setTemplateOpen(false)
  }

  // Brzycki 1RM 공식
  const calc1RM = (weight, reps) => {
    if (reps <= 0 || reps >= 37) return null
    if (reps === 1) return weight
    return Math.round((weight * 36) / (37 - reps) * 10) / 10
  }

  // 종목별 세트 그룹핑
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">{date}</Typography>
        {log && (
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteLogOpen(true)}
          >
            일지 삭제
          </Button>
        )}
      </Box>

      {/* 메모 */}
      <Box display="flex" gap={1} mb={2}>
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

      {/* 템플릿 불러오기 */}
      {templates.length > 0 && (
        <Button
          variant="outlined"
          startIcon={<ViewListIcon />}
          fullWidth
          sx={{ mb: 2 }}
          onClick={() => setTemplateOpen(true)}
        >
          템플릿 불러오기
        </Button>
      )}

      {/* 빈 상태 */}
      {Object.keys(grouped).length === 0 && pendingExercises.length === 0 && (
        <Typography color="text.secondary" textAlign="center" mt={5} mb={3}>
          아직 기록된 운동이 없습니다.
        </Typography>
      )}

      {/* 세트 있는 종목 */}
      {Object.entries(grouped).map(([name, sets]) => (
        <Paper key={name} sx={{ p: 2, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography fontWeight="bold">{name}</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpenDialog(sets[0].exercise_id)}>
              세트 추가
            </Button>
          </Box>
          <Divider sx={{ mb: 1 }} />
          {sets.sort((a, b) => a.set_number - b.set_number).map((set) => {
            const orm = calc1RM(set.weight, set.reps)
            return (
              <Box key={set.id} display="flex" alignItems="center" justifyContent="space-between" py={0.5}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 50 }}>
                  {set.set_number}세트
                </Typography>
                <Box>
                  <Typography variant="body2" component="span">{set.weight}kg × {set.reps}회</Typography>
                  {orm && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      1RM ~{orm}kg
                    </Typography>
                  )}
                </Box>
                <Box>
                  <IconButton size="small" onClick={() => handleOpenEditSet(set)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteSet(set.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )
          })}
        </Paper>
      ))}

      {/* 템플릿에서 불러온 종목 (세트 없음) */}
      {pendingExercises.map((ex) => (
        <Paper key={ex.id} sx={{ p: 2, mb: 2, borderStyle: 'dashed', borderColor: 'divider', borderWidth: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography fontWeight="bold">{ex.name}</Typography>
              <Chip label={ex.category} size="small" variant="outlined" sx={{ mt: 0.5 }} />
            </Box>
            <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpenDialog(ex.id)}>
              세트 추가
            </Button>
          </Box>
        </Paper>
      ))}

      {/* 운동 추가 버튼 */}
      <Button variant="contained" startIcon={<AddIcon />} fullWidth onClick={() => handleOpenDialog(null)}>
        운동 추가
      </Button>

      {/* 세트 추가 다이얼로그 */}
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

      {/* 세트 수정 다이얼로그 */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingSet?.set_number}세트 수정</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="무게 (kg)"
              type="number"
              value={editForm.weight}
              onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
              fullWidth
            />
            <TextField
              label="횟수"
              type="number"
              value={editForm.reps}
              onChange={(e) => setEditForm({ ...editForm, reps: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleUpdateSet}
            disabled={!editForm.reps || !editForm.weight}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 일지 전체 삭제 확인 다이얼로그 */}
      <Dialog open={deleteLogOpen} onClose={() => setDeleteLogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>일지 삭제</DialogTitle>
        <DialogContent>
          <Typography>{date} 일지를 전체 삭제할까요?</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            모든 세트 기록이 삭제되며 복구할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteLogOpen(false)}>취소</Button>
          <Button variant="contained" color="error" onClick={handleDeleteLog}>
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 템플릿 선택 다이얼로그 */}
      <Dialog open={templateOpen} onClose={() => setTemplateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>템플릿 불러오기</DialogTitle>
        <DialogContent>
          <List disablePadding>
            {templates.map((template) => (
              <ListItemButton key={template.id} onClick={() => handleLoadTemplate(template)}>
                <ListItemText
                  primary={template.name}
                  secondary={template.exercises?.map((ex) => ex.name).join(' · ')}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateOpen(false)}>취소</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
