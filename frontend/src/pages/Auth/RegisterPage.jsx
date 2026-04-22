import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { register } from '../../api/auth'
import Input from '../../components/ui/Input'
import { useTranslation } from 'react-i18next'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.email || !form.password || !form.password_confirmation) {
      setError(t('register.errors.emptyFields'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t('register.errors.invalidEmail'))
      return
    }
    if (form.password !== form.password_confirmation) {
      setError(t('register.errors.passwordMismatch'))
      return
    }
    if (form.password.length < 8) {
      setError(t('register.errors.passwordTooShort'))
      return
    }

    setLoading(true)
    try {
      const res = await register(form)
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err) {
      if (!err.response) {
        setError(t('common.serverError'))
      } else if (err.response.status === 422) {
        const errors = err.response.data?.errors
        const first = errors ? Object.values(errors)[0]?.[0] : null
        setError(first || err.response.data?.message || t('register.errors.validationFailed'))
      } else {
        setError(t('common.error'))
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
          <p className="text-sm text-slate-400 mt-2">{t('register.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm px-6 py-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label={t('register.name')}
              type="text"
              placeholder={t('register.namePlaceholder')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label={t('register.email')}
              type="text"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label={t('register.password')}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Input
              label={t('register.passwordConfirm')}
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
              {loading ? t('register.processing') : t('register.registerButton')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-5">
          {t('register.haveAccount')}{' '}
          <button onClick={() => navigate('/login')} className="text-[#3730A3] font-bold hover:underline">
            {t('register.login')}
          </button>
        </p>

      </div>
    </div>
  )
}
