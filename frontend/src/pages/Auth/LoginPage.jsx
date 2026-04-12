import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import { login } from '../../api/auth'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await login(form)
      setUser(res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.')
    }
  }

  return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" px={2}>
      <Box display="flex" alignItems="center" gap={1} mb={4}>
        <FitnessCenterIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="800" color="primary">Replog</Typography>
      </Box>

      <Paper sx={{ p: 3.5, width: '100%', maxWidth: 380 }}>
        <Typography variant="h6" fontWeight="bold" mb={0.5}>로그인</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          오늘도 운동하러 왔군요 💪
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          <TextField label="이메일" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth />
          <TextField label="비밀번호" name="password" type="password" value={form.password} onChange={handleChange} required fullWidth />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 0.5 }}>
            로그인
          </Button>
          <Typography variant="body2" textAlign="center" color="text.secondary">
            계정이 없으신가요?{' '}
            <Link to="/register" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
              회원가입
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
