import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, TextField, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton,
  List, ListItem, ListItemText, Divider, Tabs, Tab,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getBodyRecords, createBodyRecord, deleteBodyRecord } from '../../api/bodyRecords'

export default function BodyPage() {
  const [records, setRecords] = useState([])
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState({
    measured_at: new Date().toISOString().slice(0, 10),
    weight: '',
    muscle_mass: '',
    body_fat: '',
  })

  const fetchRecords = async () => {
    const res = await getBodyRecords()
    setRecords(res.data)
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const handleCreate = async () => {
    await createBodyRecord(form)
    setOpen(false)
    setForm({
      measured_at: new Date().toISOString().slice(0, 10),
      weight: '',
      muscle_mass: '',
      body_fat: '',
    })
    fetchRecords()
  }

  const handleDelete = async (id) => {
    await deleteBodyRecord(id)
    fetchRecords()
  }

  const chartData = records.map((r) => ({
    date: r.measured_at,
    몸무게: Number(r.weight),
    근육량: Number(r.muscle_mass),
    체지방률: Number(r.body_fat),
  }))

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">신체 기록</Typography>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setOpen(true)}>
          기록 추가
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="그래프" />
        <Tab label="기록 목록" />
      </Tabs>

      {/* 그래프 탭 */}
      {tab === 0 && (
        <Box>
          {records.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" mt={5}>
              기록을 추가하면 그래프가 표시됩니다.
            </Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" mb={1}>몸무게 (kg)</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="몸무게" stroke="#90caf9" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" mb={1}>근육량 (kg)</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="근육량" stroke="#a5d6a7" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" mb={1}>체지방률 (%)</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="체지방률" stroke="#ef9a9a" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
          )}
        </Box>
      )}

      {/* 기록 목록 탭 */}
      {tab === 1 && (
        <List disablePadding>
          {records.slice().reverse().map((record, idx) => (
            <Box key={record.id}>
              <ListItem
                disablePadding
                sx={{ py: 1 }}
                secondaryAction={
                  <IconButton size="small" onClick={() => handleDelete(record.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={record.measured_at}
                  secondary={`${record.weight}kg · 근육량 ${record.muscle_mass}kg · 체지방 ${record.body_fat}%`}
                />
              </ListItem>
              {idx < records.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}

      {/* 기록 추가 다이얼로그 */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>신체 기록 추가</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="측정 날짜"
              type="date"
              value={form.measured_at}
              onChange={(e) => setForm({ ...form, measured_at: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="몸무게 (kg)"
              type="number"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              fullWidth
            />
            <TextField
              label="근육량 (kg)"
              type="number"
              value={form.muscle_mass}
              onChange={(e) => setForm({ ...form, muscle_mass: e.target.value })}
              fullWidth
            />
            <TextField
              label="체지방률 (%)"
              type="number"
              value={form.body_fat}
              onChange={(e) => setForm({ ...form, body_fat: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!form.weight || !form.muscle_mass || !form.body_fat}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
