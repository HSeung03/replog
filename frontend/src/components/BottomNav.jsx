import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Plus, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const today = new Date().toISOString().slice(0, 10)

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const isHome = location.pathname === '/'
  const isProfile = location.pathname === '/more'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
      <nav className="flex items-center justify-around px-4 safe-area-bottom">

        <button
          onClick={() => navigate('/')}
          className="flex flex-col items-center gap-1 py-3 flex-1"
        >
          <Home
            size={22}
            strokeWidth={isHome ? 2.5 : 1.8}
            className={isHome ? 'text-[#3730A3]' : 'text-slate-400'}
          />
          <span className={`text-[10px] font-bold uppercase tracking-wide ${isHome ? 'text-[#3730A3]' : 'text-slate-400'}`}>
            {t('nav.home')}
          </span>
        </button>

        <button
          onClick={() => navigate(`/log/${today}`)}
          className="flex flex-col items-center gap-1 py-2 flex-1"
        >
          <div className="w-12 h-12 rounded-full bg-[#1E1B4B] flex items-center justify-center shadow-lg">
            <Plus size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {t('nav.log')}
          </span>
        </button>

        <button
          onClick={() => navigate('/more')}
          className="flex flex-col items-center gap-1 py-3 flex-1"
        >
          <User
            size={22}
            strokeWidth={isProfile ? 2.5 : 1.8}
            className={isProfile ? 'text-[#3730A3]' : 'text-slate-400'}
          />
          <span className={`text-[10px] font-bold uppercase tracking-wide ${isProfile ? 'text-[#3730A3]' : 'text-slate-400'}`}>
            {t('nav.profile')}
          </span>
        </button>

      </nav>
    </div>
  )
}
