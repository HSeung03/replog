import { useState, useCallback, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { getLog, createLog, updateLog, deleteLog, addSet, updateSet, deleteSet } from '../../api/workoutLogs'
import { getExercises } from '../../api/exercises'
import { getTemplates } from '../../api/templates'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BottomSheet, { sheetStyles } from '../../components/BottomSheet'

const calc1RM = (weight, reps) => {
  if (reps <= 0 || reps >= 37) return null
  if (reps === 1) return weight
  return Math.round((weight * 36) / (37 - reps) * 10) / 10
}

export default function LogScreen({ route }) {
  const { date } = route.params
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [memo, setMemo] = useState('')
  const [memoSaved, setMemoSaved] = useState(false)
  const [pendingExercises, setPendingExercises] = useState([])

  const [addOpen, setAddOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('')
  const [setForm, setSetForm] = useState({ reps: '', weight: '' })
  const [addCategory, setAddCategory] = useState('all')

  const [editOpen, setEditOpen] = useState(false)
  const [editingSet, setEditingSet] = useState(null)
  const [editForm, setEditForm] = useState({ reps: '', weight: '' })

  const [deleteLogOpen, setDeleteLogOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)

  const { data: logData, isLoading: loading, refetch: fetchLog } = useQuery({
    queryKey: ['log', date],
    queryFn: async () => {
      const res = await getLog(date)
      if (res.status === 204) return null
      return res.data
    },
  })
  const log = logData ?? null

  useEffect(() => { setMemo(log?.memo || '') }, [log?.id])

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => getExercises().then((res) => res.data),
  })

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => getTemplates().then((res) => res.data),
  })

  const invalidateLog = () => queryClient.invalidateQueries({ queryKey: ['log', date] })

  const handleSaveMemo = async () => {
    if (!log) await createLog({ record_date: date, memo })
    else await updateLog(log.id, { memo })
    setMemoSaved(true)
    setTimeout(() => setMemoSaved(false), 2000)
    invalidateLog()
  }

  const handleAddSet = async () => {
    let currentLog = log
    if (!currentLog) { const res = await createLog({ record_date: date, memo }); currentLog = res.data }
    const currentSets = currentLog.sets?.filter((s) => s.exercise_id === Number(selectedExercise)) || []
    await addSet(currentLog.id, { exercise_id: Number(selectedExercise), set_number: currentSets.length + 1, reps: Number(setForm.reps), weight: Number(setForm.weight) })
    setPendingExercises((prev) => prev.filter((ex) => ex.id !== Number(selectedExercise)))
    setAddOpen(false); setSetForm({ reps: '', weight: '' }); setAddCategory('all'); invalidateLog()
  }

  const handleUpdateSet = async () => {
    await updateSet(log.id, editingSet.id, { reps: Number(editForm.reps), weight: Number(editForm.weight) })
    setEditOpen(false); setEditingSet(null); invalidateLog()
  }

  const handleDeleteLog = async () => {
    await deleteLog(log.id)
    setMemo(''); setPendingExercises([]); setDeleteLogOpen(false); invalidateLog()
  }

  const handleLoadTemplate = (template) => {
    const existingIds = new Set([...(log?.sets?.map((s) => s.exercise_id) || []), ...pendingExercises.map((e) => e.id)])
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

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#3730A3" /></View>

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageLabel}>{i18n.language === 'ja' ? 'トレーニング記録' : '운동 기록'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.pageTitle}>{dateLabel}</Text>
            {log && (
              <TouchableOpacity onPress={() => setDeleteLogOpen(true)}>
                <Text style={styles.deleteText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <TextInput
            style={styles.memo}
            placeholder={t('log.memoPlaceholder')}
            placeholderTextColor="#94a3b8"
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={2}
          />

          {memo !== (log?.memo || '') && (
            <TouchableOpacity style={[styles.saveBtn, memoSaved && styles.saveBtnSaved]} onPress={handleSaveMemo}>
              <Text style={[styles.saveBtnText, memoSaved && styles.saveBtnTextSaved]}>{memoSaved ? t('log.saved') : t('log.save')}</Text>
            </TouchableOpacity>
          )}

          {templates.length > 0 && (
            <TouchableOpacity style={styles.templateBtn} onPress={() => setTemplateOpen(true)}>
              <Ionicons name="apps" size={14} color="#94a3b8" />
              <Text style={styles.templateBtnText}>{t('log.loadTemplate')}</Text>
            </TouchableOpacity>
          )}

          {Object.keys(grouped).length === 0 && pendingExercises.length === 0 && (
            <Text style={styles.emptyText}>{i18n.language === 'ja' ? 'まだ記録されたトレーニングはありません。' : '아직 기록된 운동이 없습니다.'}</Text>
          )}

          {Object.entries(grouped).map(([name, sets]) => (
            <View key={name} style={styles.exerciseGroup}>
              <View style={styles.exerciseHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.exerciseName}>{name}</Text>
                  <TouchableOpacity onPress={() => Promise.all(sets.map((s) => deleteSet(log.id, s.id))).then(fetchLog)}>
                    <Ionicons name="trash-outline" size={13} color="#cbd5e1" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => { setSelectedExercise(String(sets[0].exercise_id)); setSetForm({ reps: '', weight: '' }); setAddOpen(true) }}>
                  <Text style={styles.addSetText}>+ {t('log.addSet')}</Text>
                </TouchableOpacity>
              </View>
              {sets.sort((a, b) => a.set_number - b.set_number).map((set) => {
                const orm = calc1RM(set.weight, set.reps)
                return (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNum}>{set.set_number}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.setData}>{set.weight}kg × {set.reps}</Text>
                      {orm && <Text style={styles.orm}>EST. 1RM: {orm}kg</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => { setEditingSet(set); setEditForm({ reps: String(set.reps), weight: String(set.weight) }); setEditOpen(true) }}>
                        <Ionicons name="pencil-outline" size={13} color="#94a3b8" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => deleteSet(log.id, set.id).then(fetchLog)}>
                        <Ionicons name="trash-outline" size={13} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })}
            </View>
          ))}

          {pendingExercises.map((ex) => (
            <View key={ex.id} style={styles.pendingItem}>
              <View>
                <Text style={styles.pendingName}>{ex.name}</Text>
                <Text style={styles.pendingCat}>{ex.category}</Text>
              </View>
              <TouchableOpacity style={styles.pendingBtn} onPress={() => { setSelectedExercise(String(ex.id)); setSetForm({ reps: '', weight: '' }); setAddOpen(true) }}>
                <Text style={styles.pendingBtnText}>+ {t('log.addSet')}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addExBtn} onPress={() => { setSelectedExercise(''); setSetForm({ reps: '', weight: '' }); setAddOpen(true) }}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addExBtnText}>{t('log.addExercise')}</Text>
          </TouchableOpacity>
        </View>

        {totalVolume > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{i18n.language === 'ja' ? '総ボリューム' : '총 볼륨'}</Text>
              <Text style={styles.statValue}>{totalVolume.toLocaleString()}<Text style={styles.statUnit}> kg</Text></Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{i18n.language === 'ja' ? '総セット' : '총 세트'}</Text>
              <Text style={styles.statValue}>{totalSets}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)}>
        <Text style={sheetStyles.title}>{selectedExercise ? t('log.addSet') : t('log.addExercise')}</Text>
        {!!selectedExercise && (
          <View style={styles.selectedExBadge}>
            <Ionicons name="barbell-outline" size={14} color="#3730A3" />
            <Text style={styles.selectedExText}>{exercises.find((e) => String(e.id) === selectedExercise)?.name}</Text>
            <TouchableOpacity onPress={() => setSelectedExercise('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}
        {!selectedExercise && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }} contentContainerStyle={{ gap: 8, paddingVertical: 4, alignItems: 'center' }}>
              {['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'cardio'].map((key) => {
                const labels = { all: '전체', chest: '가슴', back: '등', legs: '하체', shoulders: '어깨', arms: '팔', cardio: '유산소' }
                const catValues = { chest: '가슴', back: '등', legs: '하체', shoulders: '어깨', arms: '팔', cardio: '유산소' }
                return (
                  <TouchableOpacity key={key} onPress={() => setAddCategory(key)} style={[styles.catFilterBtn, addCategory === key && styles.catFilterBtnActive]}>
                    <Text style={[styles.catFilterText, addCategory === key && styles.catFilterTextActive]}>{labels[key]}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
            <ScrollView style={{ maxHeight: 200, marginBottom: 4 }}>
              {exercises
                .filter((ex) => {
                  if (addCategory === 'all') return true
                  const catValues = { chest: '가슴', back: '등', legs: '하체', shoulders: '어깨', arms: '팔', cardio: '유산소' }
                  return ex.category === catValues[addCategory]
                })
                .map((ex) => (
                  <TouchableOpacity key={ex.id} style={[styles.exItem, selectedExercise === String(ex.id) && styles.exItemSelected]} onPress={() => setSelectedExercise(String(ex.id))}>
                    <Text style={styles.exItemText}>{ex.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </>
        )}
        <TextInput style={sheetStyles.input} placeholder={t('log.weight')} placeholderTextColor="#94a3b8" keyboardType="numeric" value={setForm.weight} onChangeText={(v) => setSetForm({ ...setForm, weight: v })} />
        <TextInput style={sheetStyles.input} placeholder={t('log.reps')} placeholderTextColor="#94a3b8" keyboardType="numeric" value={setForm.reps} onChangeText={(v) => setSetForm({ ...setForm, reps: v })} />
        <View style={sheetStyles.btnRow}>
          <TouchableOpacity style={sheetStyles.cancelBtn} onPress={() => setAddOpen(false)}><Text style={sheetStyles.cancelText}>{t('common.cancel')}</Text></TouchableOpacity>
          <TouchableOpacity style={[sheetStyles.confirmBtn, (!selectedExercise || !setForm.reps || !setForm.weight) && sheetStyles.confirmBtnDisabled]} onPress={handleAddSet} disabled={!selectedExercise || !setForm.reps || !setForm.weight}>
            <Text style={sheetStyles.confirmText}>{t('common.add')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)}>
        <Text style={sheetStyles.title}>{editingSet?.set_number} {i18n.language === 'ja' ? 'セット編集' : '세트 수정'}</Text>
        <TextInput style={sheetStyles.input} placeholder={t('log.weight')} placeholderTextColor="#94a3b8" keyboardType="numeric" value={editForm.weight} onChangeText={(v) => setEditForm({ ...editForm, weight: v })} />
        <TextInput style={sheetStyles.input} placeholder={t('log.reps')} placeholderTextColor="#94a3b8" keyboardType="numeric" value={editForm.reps} onChangeText={(v) => setEditForm({ ...editForm, reps: v })} />
        <View style={sheetStyles.btnRow}>
          <TouchableOpacity style={sheetStyles.cancelBtn} onPress={() => setEditOpen(false)}><Text style={sheetStyles.cancelText}>{t('common.cancel')}</Text></TouchableOpacity>
          <TouchableOpacity style={[sheetStyles.confirmBtn, (!editForm.reps || !editForm.weight) && sheetStyles.confirmBtnDisabled]} onPress={handleUpdateSet} disabled={!editForm.reps || !editForm.weight}>
            <Text style={sheetStyles.confirmText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <BottomSheet visible={deleteLogOpen} onClose={() => setDeleteLogOpen(false)}>
        <Text style={sheetStyles.title}>{t('log.deleteLog')}</Text>
        <Text style={styles.deleteDesc}>{i18n.language === 'ja' ? 'すべてのセット記録が削除され、復元できません。' : '모든 세트 기록이 삭제되며 복구할 수 없습니다.'}</Text>
        <View style={sheetStyles.btnRow}>
          <TouchableOpacity style={sheetStyles.cancelBtn} onPress={() => setDeleteLogOpen(false)}><Text style={sheetStyles.cancelText}>{t('common.cancel')}</Text></TouchableOpacity>
          <TouchableOpacity style={sheetStyles.dangerBtn} onPress={handleDeleteLog}><Text style={sheetStyles.confirmText}>{t('common.delete')}</Text></TouchableOpacity>
        </View>
      </BottomSheet>

      <BottomSheet visible={templateOpen} onClose={() => setTemplateOpen(false)}>
        <Text style={sheetStyles.title}>{t('log.loadTemplate')}</Text>
        {templates.map((tmpl) => (
          <TouchableOpacity key={tmpl.id} style={styles.tmplItem} onPress={() => handleLoadTemplate(tmpl)}>
            <Text style={styles.tmplName}>{tmpl.name}</Text>
            <Text style={styles.tmplSub}>{tmpl.exercises?.map((ex) => ex.name).join(' · ')}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={sheetStyles.cancelBtn} onPress={() => setTemplateOpen(false)}><Text style={sheetStyles.cancelText}>{t('common.close')}</Text></TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F7' },
  container: { padding: 16 },
  pageHeader: { marginBottom: 16 },
  pageLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  deleteText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  memo: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, fontSize: 14, color: '#0f172a', minHeight: 70 },
  saveBtn: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
  saveBtnSaved: { backgroundColor: '#ecfdf5' },
  saveBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  saveBtnTextSaved: { color: '#059669' },
  templateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0' },
  templateBtnText: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingVertical: 16 },
  exerciseGroup: { gap: 8 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  addSetText: { fontSize: 12, fontWeight: '700', color: '#3730A3' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  setNum: { fontSize: 12, fontWeight: '600', color: '#94a3b8', width: 20 },
  setData: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  orm: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pendingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  pendingName: { fontSize: 14, fontWeight: '600', color: '#334155' },
  pendingCat: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  pendingBtn: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  pendingBtnText: { fontSize: 12, fontWeight: '700', color: '#3730A3' },
  addExBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1E1B4B', borderRadius: 16, paddingVertical: 16 },
  addExBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#3730A3', marginTop: 4 },
  statUnit: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  exItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4, backgroundColor: '#f8fafc' },
  exItemSelected: { backgroundColor: '#eef2ff' },
  exItemText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  selectedExBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eef2ff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  selectedExText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#3730A3' },
  catFilterBtn: { paddingHorizontal: 14, height: 34, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  catFilterBtnActive: { backgroundColor: '#1E1B4B' },
  catFilterText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  catFilterTextActive: { color: '#fff' },
  deleteDesc: { fontSize: 14, color: '#475569' },
  tmplItem: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  tmplName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  tmplSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
})
