import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { login } from '../../api/auth'
import Input from '../../components/ui/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }

    setLoading(true)
    try {
      const res = await login(form)
      setUser(res.data.user)
      navigate('/')
    } catch (err) {
      if (!err.response) {
        setError('서버에 연결할 수 없습니다.')
      } else if (err.response.status === 401 || err.response.status === 422) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else {
        setError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-[390px]">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#3730A3]">Replog</h1>
          <p className="text-sm text-slate-400 mt-2">운동 기록을 시작하세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm px-6 py-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="이메일"
              type="text"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="비밀번호"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#1E1B4B] text-white text-sm font-bold hover:bg-[#3730A3] transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-5">
          계정이 없으신가요?{' '}
          <button onClick={() => navigate('/register')} className="text-[#3730A3] font-bold hover:underline">
            회원가입
          </button>
        </p>

      </div>
    </div>
  )
}
