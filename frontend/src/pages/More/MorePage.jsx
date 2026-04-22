import { useNavigate } from 'react-router-dom'
import { List, LayoutList, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../api/auth'
import { useTranslation } from 'react-i18next'

export default function MorePage() {
  const navigate = useNavigate()
  const { user, logout: logoutAuth } = useAuth()
  const { t } = useTranslation()

  const handleLogout = async () => {
    await logout()
    logoutAuth()
    navigate('/login')
  }

  return (
    <div className="flex flex-col gap-3">

      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-[#3730A3] text-2xl font-bold mb-3">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <p className="text-lg font-bold text-slate-900">{user?.name}</p>
        <p className="text-sm text-slate-400 mt-0.5">{user?.email}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        <button
          onClick={() => navigate('/exercises')}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <List size={18} className="text-[#3730A3]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-slate-900">{t('more.exercises')}</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{t('more.exercisesDesc')}</p>
          </div>
          <ChevronRight size={16} className="text-slate-300 shrink-0" />
        </button>

        <div className="border-t border-slate-100 mx-5" />

        <button
          onClick={() => navigate('/templates')}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <LayoutList size={18} className="text-[#3730A3]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-slate-900">{t('more.templates')}</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{t('more.templatesDesc')}</p>
          </div>
          <ChevronRight size={16} className="text-slate-300 shrink-0" />
        </button>

        <div className="border-t border-slate-100" />

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <LogOut size={18} className="text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-red-500">{t('more.logout')}</p>
            <p className="text-[11px] font-semibold text-red-300 uppercase tracking-wide mt-0.5">{t('more.logoutDesc')}</p>
          </div>
        </button>

      </div>

      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-300 py-2">
        Replog v1.0.0
      </p>

    </div>
  )
}
