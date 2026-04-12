import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, TextField, MenuItem, Select,
  FormControl, InputLabel, List, ListItem, ListItemText,
  IconButton, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { getExercises, createExercise, deleteExercise } from '../../api/exercises'

const CATEGORIES = ['가슴', '등', '하체', '어깨', '팔', '유산소']

export default function ExercisesPage() {
  const [exercises, setExercises] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category: '가슴' })

  const fetchExercises = async () => {
    const res = await getExercises()
    setExercises(res.data)
  }

  useEffect(() => {
    fetchExercises()
  }, [])

  const handleCreate = async () => {
    await createExercise(form)
    setOpen(false)
    setForm({ name: '', category: '가슴' })
    fetchExercises()
  }

  const handleDelete = async (id) => {
    await deleteExercise(id)
    fetchExercises()
  }

  const filtered = selectedCategory === '전체'
    ? exercises
    : exercises.filter((ex) => ex.category === selectedCategory)

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">운동 종목</Typography>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setOpen(true)}>
          종목 추가
        </Button>
      </Box>

      {/* 카테고리 필터 */}
      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
        {['전체', ...CATEGORIES].map((cat) => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => setSelectedCategory(cat)}
            color={selectedCategory === cat ? 'primary' : 'default'}
            size="small"
          />
        ))}
      </Box>

      {/* 종목 목록 */}
      {filtered.length === 0 && (
        <Typography color="text.secondary" textAlign="center" mt={5}>
          {selectedCategory === '전체' ? '등록된 종목이 없습니다.' : `${selectedCategory} 종목이 없습니다.`}
        </Typography>
      )}
      <List disablePadding>
        {filtered.map((ex, idx) => (
          <Box key={ex.id}>
            <ListItem
              disablePadding
              sx={{ py: 1 }}
              secondaryAction={
                !ex.is_default && (
                  <IconButton size="small" onClick={() => handleDelete(ex.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )
              }
            >
              <ListItemText
                primary={ex.name}
                secondary={
                  <Box component="span" display="flex" alignItems="center" gap={1}>
                    <Chip label={ex.category} size="small" variant="outlined" />
                    {!!ex.is_default && <Chip label="기본" size="small" color="info" variant="outlined" />}
                  </Box>
                }
              />
            </ListItem>
            {idx < filtered.length - 1 && <Divider />}
          </Box>
        ))}
      </List>

      {/* 종목 추가 다이얼로그 */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>종목 추가</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="종목명"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={form.category}
                label="카테고리"
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name}>
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
