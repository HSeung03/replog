import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { register } from '../../api/auth'
import Input from '../../components/ui/Input'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.email || !form.password || !form.password_confirmation) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }
    if (form.password !== form.password_confirmation) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    try {
      const res = await register(form)
      setUser(res.data.user)
      navigate('/')
    } catch (err) {
      if (!err.response) {
        setError('서버에 연결할 수 없습니다.')
      } else if (err.response.status === 422) {
        const errors = err.response.data?.errors
        const first = errors ? Object.values(errors)[0]?.[0] : null
        setError(first || err.response.data?.message || '입력 정보를 확인해주세요.')
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
          <p className="text-sm text-slate-400 mt-2">새 계정을 만드세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm px-6 py-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="이름"
              type="text"
              placeholder="홍길동"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
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
            <Input
              label="비밀번호 확인"
              type="password"
              placeholder="••••••••"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            />

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#1E1B4B] text-white text-sm font-bold hover:bg-[#3730A3] transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? '처리 중...' : '회원가입'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-5">
          이미 계정이 있으신가요?{' '}
          <button onClick={() => navigate('/login')} className="text-[#3730A3] font-bold hover:underline">
            로그인
          </button>
        </p>

      </div>
    </div>
  )
}
