import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronLeft, X } from 'lucide-react'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../api/templates'
import { getExercises } from '../../api/exercises'
import { useTranslation } from 'react-i18next'

const CATEGORY_KEYS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'cardio']
const CATEGORY_VALUES = { chest: '가슴', back: '등', legs: '하체', shoulders: '어깨', arms: '팔', cardio: '유산소' }

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

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [templates, setTemplates] = useState([])
  const [exercises, setExercises] = useState([])
  const [open, setOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [name, setName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState([])
  const [selectedEx, setSelectedEx] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const fetchTemplates = async () => {
    const res = await getTemplates()
    setTemplates(res.data)
  }

  useEffect(() => {
    fetchTemplates()
    getExercises().then((res) => setExercises(res.data))
  }, [])

  const openCreate = () => {
    setEditingTemplate(null)
    setName('')
    setSelectedExercises([])
    setSelectedEx('')
    setSelectedCategory('')
    setOpen(true)
  }

  const openEdit = (template) => {
    setEditingTemplate(template)
    setName(template.name)
    setSelectedExercises(template.exercises || [])
    setSelectedEx('')
    setSelectedCategory('')
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingTemplate(null)
    setName('')
    setSelectedExercises([])
    setSelectedEx('')
    setSelectedCategory('')
  }

  const handleAddExercise = () => {
    if (!selectedEx) return
    const ex = exercises.find((e) => e.id === Number(selectedEx))
    if (!ex || selectedExercises.find((e) => e.id === ex.id)) return
    setSelectedExercises([...selectedExercises, ex])
    setSelectedEx('')
  }

  const handleSave = async () => {
    const data = { name, exercises: selectedExercises.map((ex) => ({ exercise_id: ex.id })) }
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, data)
    } else {
      await createTemplate(data)
    }
    handleClose()
    fetchTemplates()
  }

  const selectedCategoryValue = selectedCategory ? CATEGORY_VALUES[selectedCategory] : ''

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/more')}
          className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center"
        >
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('templates.subtitle')}</p>
          <h1 className="text-xl font-bold text-slate-900">{t('templates.title')}</h1>
        </div>
        <button
          onClick={openCreate}
          className="w-9 h-9 rounded-xl bg-[#1E1B4B] flex items-center justify-center"
        >
          <Plus size={16} className="text-white" strokeWidth={2.5} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">{t('templates.noTemplates')}</p>
          </div>
        ) : (
          templates.map((template, idx) => (
            <div key={template.id}>
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => openEdit(template)}
                >
                  <p className="text-sm font-bold text-slate-900">{template.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {template.exercises?.map((ex) => ex.name).join(' · ')}
                  </p>
                </button>
                <button
                  onClick={() => deleteTemplate(template.id).then(fetchTemplates)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0 ml-3"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {idx < templates.length - 1 && <div className="border-t border-slate-50 mx-5" />}
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onClose={handleClose}>
        <h3 className="text-base font-bold text-slate-900 mb-4">
          {editingTemplate ? t('templates.editTitle') : t('templates.addTitle')}
        </h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder={t('templates.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#3730A3] transition-colors"
          />
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setSelectedEx('') }}
              className="w-28 px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none shrink-0"
            >
              <option value="">{t('templates.categoryPlaceholder')}</option>
              {CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>{t(`templates.categories.${key}`)}</option>
              ))}
            </select>
            <select
              value={selectedEx}
              onChange={(e) => setSelectedEx(e.target.value)}
              className="flex-1 px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none"
            >
              <option value="">{t('templates.exercisePlaceholder')}</option>
              {exercises
                .filter((ex) => !selectedCategoryValue || ex.category === selectedCategoryValue)
                .map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
            </select>
            <button
              onClick={handleAddExercise}
              disabled={!selectedEx}
              className="px-4 py-3 rounded-xl bg-[#1E1B4B] text-white text-sm font-semibold disabled:opacity-40"
            >{t('common.add')}</button>
          </div>
          {selectedExercises.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedExercises.map((ex) => (
                <span key={ex.id} className="flex items-center gap-1 text-xs bg-indigo-50 text-[#3730A3] px-2.5 py-1 rounded-full font-semibold">
                  {ex.name}
                  <button
                    onClick={() => setSelectedExercises(selectedExercises.filter((e) => e.id !== ex.id))}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-1">
            <button onClick={handleClose} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">{t('common.cancel')}</button>
            <button
              onClick={handleSave}
              disabled={!name}
              className="flex-1 py-3 rounded-xl bg-[#1E1B4B] text-white text-sm font-semibold disabled:opacity-40"
            >{t('common.save')}</button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
