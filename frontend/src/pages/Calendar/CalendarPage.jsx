import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { getCalendar } from '../../api/workoutLogs'
import { useTranslation } from 'react-i18next'

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const MONTHS_JA = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const days = []

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: d, current: false })
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), current: true })
  }
  const remaining = days.length % 7 === 0 ? 0 : 7 - (days.length % 7)
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), current: false })
  }
  return days
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const now = new Date()
  const [current, setCurrent] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [workoutDates, setWorkoutDates] = useState(new Set())
  const [sessionCount, setSessionCount] = useState(0)

  useEffect(() => {
    getCalendar(current.year, current.month + 1)
      .then((res) => {
        const dates = res.data
        setWorkoutDates(new Set(dates))
        setSessionCount(dates.length)
      })
      .catch(() => {})
  }, [current])

  const days = buildCalendar(current.year, current.month)
  const todayStr = now.toISOString().slice(0, 10)
  const DAYS = t('calendar.days', { returnObjects: true })
  const monthLabel = i18n.language === 'ja'
    ? `${MONTHS_JA[current.month]} ${current.year}`
    : `${MONTHS[current.month]} ${current.year}`

  const prevMonth = () => setCurrent(({ year, month }) => {
    if (month === 0) return { year: year - 1, month: 11 }
    return { year, month: month - 1 }
  })

  const nextMonth = () => setCurrent(({ year, month }) => {
    if (month === 11) return { year: year + 1, month: 0 }
    return { year, month: month + 1 }
  })

  const toDateStr = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const activityText = sessionCount > 0
    ? (i18n.language === 'ja'
        ? `今月${sessionCount}回トレーニングしました`
        : `이번 달 ${sessionCount}회 운동했어요`)
    : t('calendar.noRecord')

  return (
    <div>
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {i18n.language === 'ja' ? 'トレーニング日誌' : '운동 일지'}
        </p>
        <h1 className="text-3xl font-bold text-slate-900 mt-0.5">
          {i18n.language === 'ja' ? 'カレンダー' : '캘린더'}
        </h1>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">{monthLabel}</h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft size={16} className="text-slate-600" />
            </button>
            <button
              onClick={nextMonth}
              disabled={current.year === now.getFullYear() && current.month === now.getMonth()}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((item, idx) => {
            const dateStr = toDateStr(item.date)
            const isToday = dateStr === todayStr
            const hasWorkout = workoutDates.has(dateStr)
            const isCurrentMonth = item.current
            const isFuture = dateStr > todayStr

            return (
              <button
                key={idx}
                onClick={() => !isFuture && navigate(`/log/${dateStr}`)}
                disabled={isFuture}
                className="flex flex-col items-center justify-center py-1.5 gap-1 disabled:cursor-not-allowed"
              >
                <div className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-colors
                  ${isToday ? 'bg-[#1E1B4B] text-white' : ''}
                  ${!isToday && isCurrentMonth && !isFuture ? 'text-slate-800 hover:bg-slate-100' : ''}
                  ${!isCurrentMonth || isFuture ? 'text-slate-300' : ''}
                `}>
                  {item.date.getDate()}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${hasWorkout ? 'bg-[#3730A3]' : 'invisible'}`} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <Zap size={20} className="text-[#3730A3]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {i18n.language === 'ja' ? '今月の活動' : '이번 달 활동'}
          </p>
          <p className="text-base font-bold text-slate-900 mt-0.5">{activityText}</p>
        </div>
      </div>
    </div>
  )
}
