import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, TextField, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton,
  List, ListItem, ListItemText, Divider, Chip, MenuItem,
  Select, FormControl, InputLabel,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { getTemplates, createTemplate, deleteTemplate } from '../../api/templates'
import { getExercises } from '../../api/exercises'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [exercises, setExercises] = useState([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState([])
  const [selectedEx, setSelectedEx] = useState('')

  const fetchTemplates = async () => {
    const res = await getTemplates()
    setTemplates(res.data)
  }

  useEffect(() => {
    fetchTemplates()
    getExercises().then((res) => setExercises(res.data))
  }, [])

  const handleAddExercise = () => {
    if (!selectedEx) return
    const ex = exercises.find((e) => e.id === selectedEx)
    if (selectedExercises.find((e) => e.id === selectedEx)) return
    setSelectedExercises([...selectedExercises, ex])
    setSelectedEx('')
  }

  const handleRemoveExercise = (id) => {
    setSelectedExercises(selectedExercises.filter((e) => e.id !== id))
  }

  const handleCreate = async () => {
    await createTemplate({
      name,
      exercises: selectedExercises.map((ex) => ({ exercise_id: ex.id })),
    })
    setOpen(false)
    setName('')
    setSelectedExercises([])
    fetchTemplates()
  }

  const handleDelete = async (id) => {
    await deleteTemplate(id)
    fetchTemplates()
  }

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">템플릿</Typography>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setOpen(true)}>
          템플릿 추가
        </Button>
      </Box>

      {templates.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={5}>
          저장된 템플릿이 없습니다.
        </Typography>
      ) : (
        <List disablePadding>
          {templates.map((template, idx) => (
            <Box key={template.id}>
              <Paper sx={{ p: 2, mb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography fontWeight="bold">{template.name}</Typography>
                  <IconButton size="small" onClick={() => handleDelete(template.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {template.exercises?.map((ex) => (
                    <Chip key={ex.id} label={ex.name} size="small" variant="outlined" />
                  ))}
                </Box>
              </Paper>
            </Box>
          ))}
        </List>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>템플릿 추가</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="템플릿 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              placeholder="예: 월요일 가슴 루틴"
            />
            <Box display="flex" gap={1}>
              <FormControl fullWidth>
                <InputLabel>종목 선택</InputLabel>
                <Select
                  value={selectedEx}
                  label="종목 선택"
                  onChange={(e) => setSelectedEx(e.target.value)}
                >
                  {exercises.map((ex) => (
                    <MenuItem key={ex.id} value={ex.id}>
                      [{ex.category}] {ex.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={handleAddExercise} sx={{ minWidth: 50 }}>
                추가
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {selectedExercises.map((ex) => (
                <Chip
                  key={ex.id}
                  label={ex.name}
                  size="small"
                  onDelete={() => handleRemoveExercise(ex.id)}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name}>
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
