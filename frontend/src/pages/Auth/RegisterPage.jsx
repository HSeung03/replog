import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import { register } from '../../api/auth'
import { useAuth } from '../../contexts/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await register(form)
      setUser(res.data.user)
      navigate('/')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        setError(Object.values(errors).flat().join(' '))
      } else {
        setError('회원가입에 실패했습니다.')
      }
    }
  }

  return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" px={2}>
      <Box display="flex" alignItems="center" gap={1} mb={4}>
        <FitnessCenterIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="800" color="primary">Replog</Typography>
      </Box>

      <Paper sx={{ p: 3.5, width: '100%', maxWidth: 380 }}>
        <Typography variant="h6" fontWeight="bold" mb={0.5}>회원가입</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          나만의 운동 기록을 시작해보세요
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          <TextField label="이름" name="name" value={form.name} onChange={handleChange} required fullWidth />
          <TextField label="이메일" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth />
          <TextField label="비밀번호" name="password" type="password" value={form.password} onChange={handleChange} required fullWidth />
          <TextField label="비밀번호 확인" name="password_confirmation" type="password" value={form.password_confirmation} onChange={handleChange} required fullWidth />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 0.5 }}>
            시작하기
          </Button>
          <Typography variant="body2" textAlign="center" color="text.secondary">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
              로그인
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
