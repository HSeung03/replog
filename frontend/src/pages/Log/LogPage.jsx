import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Edit2, CheckCircle2, LayoutList } from 'lucide-react'
import { getLog, createLog, updateLog, deleteLog, addSet, updateSet, deleteSet } from '../../api/workoutLogs'
import { getExercises } from '../../api/exercises'
import { getTemplates } from '../../api/templates'
import { useTranslation } from 'react-i18next'

const calc1RM = (weight, reps) => {
  if (reps <= 0 || reps >= 37) return null
  if (reps === 1) return weight
  return Math.round((weight * 36) / (37 - reps) * 10) / 10
}

function Dialog({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-[430px] bg-white rounded-t-2xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}

export default function LogPage() {
  const { date } = useParams()
  const { t, i18n } = useTranslation()
  const [log, setLog] = useState(null)
  const [exercises, setExercises] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [memo, setMemo] = useState('')
  const [memoSaved, setMemoSaved] = useState(false)
  const [pendingExercises, setPendingExercises] = useState([])

  const [open, setOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('')
  const [setForm, setSetForm] = useState({ reps: '', weight: '' })

  const [editOpen, setEditOpen] = useState(false)
  const [editingSet, setEditingSet] = useState(null)
  const [editForm, setEditForm] = useState({ reps: '', weight: '' })

  const [deleteLogOpen, setDeleteLogOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)

  const fetchLog = useCallback(async () => {
    try {
      const res = await getLog(date)
      if (res.status === 204) { setLog(null); setMemo('') }
      else { setLog(res.data); setMemo(res.data.memo || '') }
    } catch { setLog(null) }
    finally { setLoading(false) }
  }, [date])

  useEffect(() => {
    fetchLog()
    getExercises().then((res) => setExercises(res.data))
    getTemplates().then((res) => setTemplates(res.data))
  }, [fetchLog])

  const handleSaveMemo = async () => {
    if (!log) { const res = await createLog({ record_date: date, memo }); setLog(res.data) }
    else { await updateLog(log.id, { memo }) }
    setMemoSaved(true)
    setTimeout(() => setMemoSaved(false), 2000)
  }

  const handleAddSet = async () => {
    let currentLog = log
    if (!currentLog) {
      const res = await createLog({ record_date: date, memo })
      currentLog = res.data
      setLog(currentLog)
    }
    const currentSets = currentLog.sets?.filter((s) => s.exercise_id === selectedExercise) || []
    await addSet(currentLog.id, {
      exercise_id: selectedExercise,
      set_number: currentSets.length + 1,
      reps: Number(setForm.reps),
      weight: Number(setForm.weight),
    })
    setPendingExercises((prev) => prev.filter((ex) => ex.id !== selectedExercise))
    setOpen(false)
    setSetForm({ reps: '', weight: '' })
    fetchLog()
  }

  const handleOpenDialog = (exerciseId) => {
    setSelectedExercise(exerciseId || '')
    if (exerciseId && log?.sets) {
      const prevSets = log.sets.filter((s) => s.exercise_id === exerciseId).sort((a, b) => b.set_number - a.set_number)
      if (prevSets.length > 0) {
        setSetForm({ reps: String(prevSets[0].reps), weight: String(prevSets[0].weight) })
        setOpen(true)
        return
      }
    }
    setSetForm({ reps: '', weight: '' })
    setOpen(true)
  }

  const handleUpdateSet = async () => {
    await updateSet(log.id, editingSet.id, { reps: Number(editForm.reps), weight: Number(editForm.weight) })
    setEditOpen(false)
    setEditingSet(null)
    fetchLog()
  }

  const handleDeleteLog = async () => {
    await deleteLog(log.id)
    setLog(null); setMemo(''); setPendingExercises([]); setDeleteLogOpen(false)
  }

  const handleLoadTemplate = (template) => {
    const existingIds = new Set([
      ...(log?.sets?.map((s) => s.exercise_id) || []),
      ...pendingExercises.map((e) => e.id),
    ])
    const newExercises = template.exercises?.filter((ex) => !existingIds.has(ex.id)) || []
    setPendingExercises((prev) => [...prev, ...newExercises])
    setTemplateOpen(false)
  }

  const grouped = log?.sets?.reduce((acc, set) => {
    const name = set.exercise?.name || t('log.unknown')
    if (!acc[name]) acc[name] = []
    acc[name].push(set)
    return acc
  }, {}) || {}

  const totalVolume = Object.values(grouped).flat().reduce((sum, s) => sum + s.weight * s.reps, 0)
  const totalSets = Object.values(grouped).flat().length

  const dateObj = new Date(date + 'T00:00:00')
  const dateLabel = dateObj.toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <div className="w-7 h-7 border-2 border-slate-200 border-t-[#3730A3] rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {i18n.language === 'ja' ? 'トレーニング記録' : '운동 기록'}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{dateLabel}</h1>
        </div>
        {log && (
          <button
            onClick={() => setDeleteLogOpen(true)}
            className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors mt-1"
          >
            {t('common.delete')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-5">

        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder={t('log.memoPlaceholder')}
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 resize-none focus:outline-none focus:bg-slate-100 transition-colors"
        />

        {memo !== (log?.memo || '') && (
          <button
            onClick={handleSaveMemo}
            className={`-mt-3 self-end px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              memoSaved ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {memoSaved ? t('log.saved') : t('log.save')}
          </button>
        )}

        {templates.length > 0 && (
          <button
            onClick={() => setTemplateOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wide hover:border-slate-300 hover:text-slate-500 transition-colors"
          >
            <LayoutList size={14} />
            {t('log.loadTemplate')}
          </button>
        )}

        {Object.keys(grouped).length === 0 && pendingExercises.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-slate-400">
              {i18n.language === 'ja' ? 'まだ記録されたトレーニングはありません。' : '아직 기록된 운동이 없습니다.'}
            </p>
          </div>
        )}

        {Object.entries(grouped).map(([name, sets]) => (
          <div key={name}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 text-base">{name}</p>
                <button
                  onClick={() => Promise.all(sets.map((s) => deleteSet(log.id, s.id))).then(fetchLog)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <button
                onClick={() => handleOpenDialog(sets[0].exercise_id)}
                className="text-xs font-semibold text-[#3730A3] hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                + {t('log.addSet')}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {sets.sort((a, b) => a.set_number - b.set_number).map((set) => {
                const orm = calc1RM(set.weight, set.reps)
                return (
                  <div key={set.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 group">
                    <span className="text-xs font-semibold text-slate-400 w-6 shrink-0">{set.set_number}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{set.weight}kg × {set.reps}</p>
                      {orm && <p className="text-[11px] text-slate-400 mt-0.5">EST. 1RM: {orm}kg</p>}
                    </div>
                    <div className="group-hover:hidden">
                      <CheckCircle2 size={18} className="text-slate-300" />
                    </div>
                    <div className="hidden group-hover:flex gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingSet(set); setEditForm({ reps: String(set.reps), weight: String(set.weight) }); setEditOpen(true) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteSet(log.id, set.id).then(fetchLog)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {pendingExercises.map((ex) => (
          <div key={ex.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
            <div>
              <p className="font-semibold text-slate-700 text-sm">{ex.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{ex.category}</p>
            </div>
            <button
              onClick={() => handleOpenDialog(ex.id)}
              className="text-xs font-semibold text-[#3730A3] bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              + {t('log.addSet')}
            </button>
          </div>
        ))}

        <button
          onClick={() => handleOpenDialog(null)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#1E1B4B] text-white text-sm font-bold uppercase tracking-wide hover:bg-[#3730A3] transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} />
          {t('log.addExercise')}
        </button>
      </div>

      {totalVolume > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {i18n.language === 'ja' ? '総ボリューム' : '총 볼륨'}
            </p>
            <p className="text-2xl font-bold text-[#3730A3] mt-1">{totalVolume.toLocaleString()}<span className="text-sm font-semibold text-slate-400 ml-1">kg</span></p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {i18n.language === 'ja' ? '総セット' : '총 세트'}
            </p>
            <p className="text-2xl font-bold text-[#3730A3] mt-1">{totalSets}</p>
          </div>
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={selectedExercise ? t('log.addSet') : t('log.addExercise')}>
        <div className="flex flex-col gap-3">
          {!selectedExercise && (
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none"
            >
              <option value="">{i18n.language === 'ja' ? '種目選択' : '종목 선택'}</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>[{ex.category}] {ex.name}</option>
              ))}
            </select>
          )}
          <input
            type="number"
            placeholder={t('log.weight')}
            value={setForm.weight}
            onChange={(e) => setSetForm({ ...setForm, weight: e.target.value })}
            className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#3730A3] transition-colors"
          />
          <input
            type="number"
            placeholder={t('log.reps')}
            value={setForm.reps}
            onChange={(e) => setSetForm({ ...setForm, reps: e.target.value })}
            className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#3730A3] transition-colors"
          />
          <div className="flex gap-2 mt-1">
            <button onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors">{t('common.cancel')}</button>
            <button
              onClick={handleAddSet}
              disabled={!selectedExercise || !setForm.reps || !setForm.weight}
              className="flex-1 py-3 rounded-xl bg-[#1E1B4B] text-white text-sm font-semibold hover:bg-[#3730A3] transition-colors disabled:opacity-40"
            >{t('common.add')}</button>
          </div>
        </div>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title={`${editingSet?.set_number} ${i18n.language === 'ja' ? 'セット編集' : '세트 수정'}`}>
        <div className="flex flex-col gap-3">
          <input
            type="number"
            placeholder={t('log.weight')}
            value={editForm.weight}
            onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
            className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#3730A3] transition-colors"
          />
          <input
            type="number"
            placeholder={t('log.reps')}
            value={editForm.reps}
            onChange={(e) => setEditForm({ ...editForm, reps: e.target.value })}
            className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#3730A3] transition-colors"
          />
          <div className="flex gap-2 mt-1">
            <button onClick={() => setEditOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">{t('common.cancel')}</button>
            <button
              onClick={handleUpdateSet}
              disabled={!editForm.reps || !editForm.weight}
              className="flex-1 py-3 rounded-xl bg-[#1E1B4B] text-white text-sm font-semibold disabled:opacity-40"
            >{t('common.save')}</button>
          </div>
        </div>
      </Dialog>

      <Dialog open={deleteLogOpen} onClose={() => setDeleteLogOpen(false)} title={t('log.deleteLog')}>
        <p className="text-sm text-slate-600 mb-4">
          {i18n.language === 'ja'
            ? 'すべてのセット記録が削除され、復元できません。'
            : '모든 세트 기록이 삭제되며 복구할 수 없습니다.'}
        </p>
        <div className="flex gap-2">
          <button onClick={() => setDeleteLogOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">{t('common.cancel')}</button>
          <button onClick={handleDeleteLog} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold">{t('common.delete')}</button>
        </div>
      </Dialog>

      <Dialog open={templateOpen} onClose={() => setTemplateOpen(false)} title={t('log.loadTemplate')}>
        <div className="flex flex-col gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleLoadTemplate(template)}
              className="text-left p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <p className="text-sm font-bold text-slate-900">{template.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{template.exercises?.map((ex) => ex.name).join(' · ')}</p>
            </button>
          ))}
          <button onClick={() => setTemplateOpen(false)} className="mt-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">{t('common.close')}</button>
        </div>
      </Dialog>
    </div>
  )
}
