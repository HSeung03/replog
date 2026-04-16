import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { login as loginApi } from '../../api/auth'
import Input from '../../components/ui/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('error') === 'oauth_failed') {
      setError('구글 로그인에 실패했습니다. 다시 시도해주세요.')
    }
  }, [location.search])

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
      const res = await loginApi(form)
      login(res.data.token, res.data.user)
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

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">또는</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <a
              href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/api/auth/google/redirect`}
              className="w-full py-4 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.96 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              구글로 로그인
            </a>
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
