import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronLeft } from 'lucide-react'
import { getExercises, createExercise, deleteExercise } from '../../api/exercises'

const CATEGORIES = ['가슴', '등', '하체', '어깨', '팔', '유산소']

const BADGE_COLORS = {
  '가슴':   'bg-blue-50 text-blue-600',
  '등':     'bg-violet-50 text-violet-600',
  '하체':   'bg-emerald-50 text-emerald-600',
  '어깨':   'bg-amber-50 text-amber-600',
  '팔':     'bg-rose-50 text-rose-600',
  '유산소': 'bg-cyan-50 text-cyan-600',
}

function Dialog({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-[430px] bg-white rounded-t-2xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export default function ExercisesPage() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category: '가슴' })

  const fetchExercises = async () => {
    const res = await getExercises()
    setExercises(res.data)
  }

  useEffect(() => { fetchExercises() }, [])

  const handleCreate = async () => {
    await createExercise(form)
    setOpen(false)
    setForm({ name: '', category: '가슴' })
    fetchExercises()
  }

  const filtered = selectedCategory === '전체' ? exercises : exercises.filter((ex) => ex.category === selectedCategory)

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/more')}
          className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center"
        >
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">더보기</p>
          <h1 className="text-xl font-bold text-slate-900">운동 종목</h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-xl bg-[#1E1B4B] flex items-center justify-center"
        >
          <Plus size={16} className="text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {['전체', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-[#1E1B4B] text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">
              {selectedCategory === '전체' ? '등록된 종목이 없습니다.' : `${selectedCategory} 종목이 없습니다.`}
            </p>
          </div>
        ) : (
          filtered.map((ex, idx) => (
            <div key={ex.id}>
              <div className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-bold text-slate-900">{ex.name}</p>
                  {!!ex.is_default && (
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-0.5">기본 제공</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight ${BADGE_COLORS[ex.category] ?? 'bg-slate-100 text-slate-500'}`}>
                    {ex.category}
                  </span>
                  {!ex.is_default && (
                    <button
                      onClick={() => deleteExercise(ex.id).then(fetchExercises)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              {idx < filtered.length - 1 && <div className="border-t border-slate-50 mx-5" />}
            </div>
          ))
        )}
      </div>

      {/* 종목 추가 다이얼로그 */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <h3 className="text-base font-bold text-slate-900 mb-4">종목 추가</h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="종목명 (예: 인클라인 벤치프레스)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#3730A3] transition-colors"
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setForm({ ...form, category: cat })}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  form.category === cat ? 'bg-[#1E1B4B] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">취소</button>
            <button
              onClick={handleCreate}
              disabled={!form.name}
              className="flex-1 py-3 rounded-xl bg-[#1E1B4B] text-white text-sm font-semibold disabled:opacity-40"
            >추가</button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
