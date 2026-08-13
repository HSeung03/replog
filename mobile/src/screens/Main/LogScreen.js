import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { todayStr } from '../../utils/date'
import { parseSetInput } from '../../utils/setInput'
import i18n from '../../i18n'
import { translateExerciseName, translateCategory } from '../../i18n/exerciseNames'
import BottomSheet, { sheetStyles } from '../../components/BottomSheet'
import useLog from '../../hooks/useLog'
import useExercises from '../../hooks/useExercises'
import useTemplates from '../../hooks/useTemplates'
import { CATEGORY_KEYS, CATEGORY_VALUES } from '../../constants/categories'

const calc1RM = (weight, reps) => {
  if (reps <= 0 || reps >= 37) return null
  if (reps === 1) return weight
  return Math.round((weight * 36) / (37 - reps) * 10) / 10
}

export default function LogScreen({ route, navigation }) {
  const { t } = useTranslation()

  // 캘린더에서 특정 날짜를 골라 들어온 경우(스택 화면)에는 그 날짜를 그대로
  // 쓰고, 탭으로 바로 들어온 경우에는 화면에 들어올 때마다 오늘을 다시
  // 계산한다. (앱을 켜둔 채 자정을 넘겨도 오늘로 따라간다)
  const routeDate = route.params?.date
  const isDetail = !!routeDate
  const [today, setToday] = useState(todayStr)
  useFocusEffect(useCallback(() => { setToday(todayStr()) }, []))

  const date = routeDate ?? today

  const { log, isLoading, saveLog, removeLog, addLogSet, updateLogSet, removeLogSet, removeExerciseSets } = useLog(date)
  const { exercises } = useExercises()
  const { templates } = useTemplates()

  const [memo, setMemo] = useState('')
  const [memoSaved, setMemoSaved] = useState(false)
  const [pendingExercises, setPendingExercises] = useState([])

  const [addOpen, setAddOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('')
  const [setForm, setSetForm] = useState({ reps: '', weight: '' })
  const [addCategory, setAddCategory] = useState('all')
  const [addError, setAddError] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editingSet, setEditingSet] = useState(null)
  const [editForm, setEditForm] = useState({ reps: '', weight: '' })
  const [editError, setEditError] = useState('')

  const [deleteLogOpen, setDeleteLogOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)

  useEffect(() => { setMemo(log?.memo || '') }, [log?.id])

  const handleSaveMemo = async () => {
    await saveLog(memo)
    setMemoSaved(true)
    setTimeout(() => setMemoSaved(false), 2000)
  }

  const openAddSheet = (exerciseId = '') => {
    setSelectedExercise(exerciseId === '' ? '' : String(exerciseId))
    setSetForm({ reps: '', weight: '' })
    setAddError('')
    setAddOpen(true)
  }

  const handleAddSet = async () => {
    const parsed = parseSetInput(setForm)
    if (!parsed.ok) return setAddError(t(parsed.error))

    try {
      await addLogSet(Number(selectedExercise), parsed.value, memo)
    } catch {
      // 서버가 거절한 입력이다. 시트를 닫지 않고 이유를 남겨둔다.
      return setAddError(t('log.errors.saveRejected'))
    }

    setPendingExercises((prev) => prev.filter((ex) => ex.id !== Number(selectedExercise)))
    setAddOpen(false); setSetForm({ reps: '', weight: '' }); setAddCategory('all'); setAddError('')
  }

  const handleUpdateSet = async () => {
    const parsed = parseSetInput(editForm)
    if (!parsed.ok) return setEditError(t(parsed.error))

    try {
      await updateLogSet(editingSet.id, parsed.value)
    } catch {
      return setEditError(t('log.errors.saveRejected'))
    }

    setEditOpen(false); setEditingSet(null); setEditError('')
  }

  const handleDeleteLog = async () => {
    await removeLog()
    setMemo(''); setPendingExercises([]); setDeleteLogOpen(false)
  }

  const handleLoadTemplate = (template) => {
    const existingIds = new Set([...(log?.sets?.map((s) => s.exercise_id) || []), ...pendingExercises.map((e) => e.id)])
    const newExercises = template.exercises?.filter((ex) => !existingIds.has(ex.id)) || []
    setPendingExercises((prev) => [...prev, ...newExercises])
    setTemplateOpen(false)
  }

  // 로컬 DB에서 올라온 세트에는 exercise 객체가 없고 exercise_id만 있다.
  // 종목 목록은 이미 캐시돼 있으므로 여기서 이름을 붙인다.
  const exerciseById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex])), [exercises])

  // 이름이 아니라 exercise_id로 묶는다. 기본 종목과 같은 이름("벤치프레스")으로
  // 커스텀 종목을 만들 수 있어서, 이름을 키로 쓰면 서로 다른 두 종목의 세트가
  // 한 그룹으로 합쳐진다. 그러면 세트 번호가 1,2,1,2로 뒤섞이고 "+ 세트 추가"가
  // sets[0].exercise_id를 쓰므로 어느 쪽에 붙을지가 정렬 순서에 좌우된다.
  // 이름은 표시용으로만 쓴다.
  const groups = useMemo(() => {
    const byId = new Map()

    for (const set of log?.sets || []) {
      if (!byId.has(set.exercise_id)) {
        const exercise = set.exercise ?? exerciseById.get(set.exercise_id)
        byId.set(set.exercise_id, {
          exerciseId: set.exercise_id,
          name: translateExerciseName(exercise?.name, i18n.language) || t('log.unknown'),
          sets: [],
        })
      }
      byId.get(set.exercise_id).sets.push(set)
    }

    for (const group of byId.values()) {
      group.sets.sort((a, b) => a.set_number - b.set_number)
    }

    return [...byId.values()]
  }, [log?.sets, exerciseById, t])

  const allSets = groups.flatMap((g) => g.sets)
  const totalVolume = allSets.reduce((sum, s) => sum + s.weight * s.reps, 0)
  const totalSets = allSets.length
  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })

  if (isLoading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#3730A3" /></View>

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageLabel}>{t('log.label')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {/* 스택으로 열린 경우(캘린더에서 날짜 선택)에는 돌아갈 길을 만든다 */}
              {isDetail && navigation?.canGoBack?.() && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Ionicons name="chevron-back" size={20} color="#475569" />
                </TouchableOpacity>
              )}
              <Text style={styles.pageTitle}>{dateLabel}</Text>
            </View>
            {log && <TouchableOpacity onPress={() => setDeleteLogOpen(true)}><Text style={styles.deleteText}>{t('common.delete')}</Text></TouchableOpacity>}
          </View>
        </View>

        <View style={styles.card}>
          <TextInput style={styles.memo} placeholder={t('log.memoPlaceholder')} placeholderTextColor="#94a3b8" value={memo} onChangeText={setMemo} multiline numberOfLines={2} />

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

          {groups.length === 0 && pendingExercises.length === 0 && (
            <Text style={styles.emptyText}>{t('log.empty')}</Text>
          )}

          {groups.map(({ exerciseId, name, sets }) => (
            <View key={exerciseId} style={styles.exerciseGroup}>
              <View style={styles.exerciseHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.exerciseName}>{name}</Text>
                  <TouchableOpacity onPress={() => removeExerciseSets(sets)}>
                    <Ionicons name="trash-outline" size={13} color="#cbd5e1" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => openAddSheet(exerciseId)}>
                  <Text style={styles.addSetText}>+ {t('log.addSet')}</Text>
                </TouchableOpacity>
              </View>
              {sets.map((set) => {
                const orm = calc1RM(set.weight, set.reps)
                return (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNum}>{set.set_number}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.setData}>{set.weight}kg × {set.reps}</Text>
                      {orm && <Text style={styles.orm}>EST. 1RM: {orm}kg</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => { setEditingSet(set); setEditForm({ reps: String(set.reps), weight: String(set.weight) }); setEditError(''); setEditOpen(true) }}>
                        <Ionicons name="pencil-outline" size={13} color="#94a3b8" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => removeLogSet(set.id)}>
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
                <Text style={styles.pendingName}>{translateExerciseName(ex.name, i18n.language)}</Text>
                <Text style={styles.pendingCat}>{translateCategory(ex.category, i18n.language)}</Text>
              </View>
              <TouchableOpacity style={styles.pendingBtn} onPress={() => openAddSheet(ex.id)}>
                <Text style={styles.pendingBtnText}>+ {t('log.addSet')}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addExBtn} onPress={() => openAddSheet()}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addExBtnText}>{t('log.addExercise')}</Text>
          </TouchableOpacity>
        </View>

        {totalVolume > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t('log.totalVolume')}</Text>
              <Text style={styles.statValue}>{totalVolume.toLocaleString()}<Text style={styles.statUnit}> kg</Text></Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t('log.totalSets')}</Text>
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
            <Text style={styles.selectedExText}>{translateExerciseName(exercises.find((e) => String(e.id) === selectedExercise)?.name, i18n.language)}</Text>
            <TouchableOpacity onPress={() => setSelectedExercise('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}
        {!selectedExercise && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }} contentContainerStyle={{ gap: 8, paddingVertical: 4, alignItems: 'center' }}>
              {['all', ...CATEGORY_KEYS].map((key) => (
                <TouchableOpacity key={key} onPress={() => setAddCategory(key)} style={[styles.catFilterBtn, addCategory === key && styles.catFilterBtnActive]}>
                  <Text style={[styles.catFilterText, addCategory === key && styles.catFilterTextActive]}>{t('exercises.categories.' + key)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={{ maxHeight: 200, marginBottom: 4 }}>
              {exercises
                .filter((ex) => addCategory === 'all' || ex.category === CATEGORY_VALUES[addCategory])
                .map((ex) => (
                  <TouchableOpacity key={ex.id} style={[styles.exItem, selectedExercise === String(ex.id) && styles.exItemSelected]} onPress={() => setSelectedExercise(String(ex.id))}>
                    <Text style={styles.exItemText}>{translateExerciseName(ex.name, i18n.language)}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </>
        )}
        <TextInput style={sheetStyles.input} placeholder={t('log.weight')} placeholderTextColor="#94a3b8" keyboardType="numeric" value={setForm.weight} onChangeText={(v) => { setSetForm({ ...setForm, weight: v }); setAddError('') }} />
        <TextInput style={sheetStyles.input} placeholder={t('log.reps')} placeholderTextColor="#94a3b8" keyboardType="numeric" value={setForm.reps} onChangeText={(v) => { setSetForm({ ...setForm, reps: v }); setAddError('') }} />
        {!!addError && <Text style={styles.formError}>{addError}</Text>}
        <View style={sheetStyles.btnRow}>
          <TouchableOpacity style={sheetStyles.cancelBtn} onPress={() => setAddOpen(false)}><Text style={sheetStyles.cancelText}>{t('common.cancel')}</Text></TouchableOpacity>
          <TouchableOpacity style={[sheetStyles.confirmBtn, (!selectedExercise || !setForm.reps || !setForm.weight) && sheetStyles.confirmBtnDisabled]} onPress={handleAddSet} disabled={!selectedExercise || !setForm.reps || !setForm.weight}>
            <Text style={sheetStyles.confirmText}>{t('common.add')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)}>
        <Text style={sheetStyles.title}>{editingSet?.set_number} {t('log.editSet')}</Text>
        <TextInput style={sheetStyles.input} placeholder={t('log.weight')} placeholderTextColor="#94a3b8" keyboardType="numeric" value={editForm.weight} onChangeText={(v) => { setEditForm({ ...editForm, weight: v }); setEditError('') }} />
        <TextInput style={sheetStyles.input} placeholder={t('log.reps')} placeholderTextColor="#94a3b8" keyboardType="numeric" value={editForm.reps} onChangeText={(v) => { setEditForm({ ...editForm, reps: v }); setEditError('') }} />
        {!!editError && <Text style={styles.formError}>{editError}</Text>}
        <View style={sheetStyles.btnRow}>
          <TouchableOpacity style={sheetStyles.cancelBtn} onPress={() => setEditOpen(false)}><Text style={sheetStyles.cancelText}>{t('common.cancel')}</Text></TouchableOpacity>
          <TouchableOpacity style={[sheetStyles.confirmBtn, (!editForm.reps || !editForm.weight) && sheetStyles.confirmBtnDisabled]} onPress={handleUpdateSet} disabled={!editForm.reps || !editForm.weight}>
            <Text style={sheetStyles.confirmText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <BottomSheet visible={deleteLogOpen} onClose={() => setDeleteLogOpen(false)}>
        <Text style={sheetStyles.title}>{t('log.deleteLog')}</Text>
        <Text style={styles.deleteDesc}>{t('log.deleteDesc')}</Text>
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
            <Text style={styles.tmplSub}>{tmpl.exercises?.map((ex) => translateExerciseName(ex.name, i18n.language)).join(' · ')}</Text>
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
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
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
  formError: { fontSize: 13, color: '#dc2626', marginTop: -4 },
  tmplItem: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  tmplName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  tmplSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
})
