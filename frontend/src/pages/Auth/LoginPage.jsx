import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material'
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
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" mb={3} fontWeight="bold">Replog 로그인</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          <TextField label="이메일" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth />
          <TextField label="비밀번호" name="password" type="password" value={form.password} onChange={handleChange} required fullWidth />
          <Button type="submit" variant="contained" fullWidth size="large">로그인</Button>
          <Typography variant="body2" textAlign="center">
            계정이 없으신가요? <Link to="/register">회원가입</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
