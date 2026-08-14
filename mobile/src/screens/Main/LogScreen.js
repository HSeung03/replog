import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { todayStr } from '../../utils/date'
import { groupSetsByExercise, summarizeSets } from '../../utils/logStats'
import useLog from '../../hooks/useLog'
import useExercises from '../../hooks/useExercises'
import useTemplates from '../../hooks/useTemplates'
import useDisclosure from '../../hooks/useDisclosure'
import useSetForm from '../../hooks/useSetForm'
import useExerciseLabel from '../../hooks/useExerciseLabel'
import Screen from '../../components/Screen'
import PageHeader from '../../components/PageHeader'
import LoadingView from '../../components/LoadingView'
import BottomSheet, { SheetTitle, SheetActions } from '../../components/BottomSheet'
import ConfirmSheet from '../../components/ConfirmSheet'
import CategoryFilter, { ALL } from '../../components/CategoryFilter'
import ExercisePicker from '../../components/ExercisePicker'
import SetInputs from '../../components/SetInputs'
import SetRow from '../../components/SetRow'
import Button from '../../components/Button'
import { CATEGORY_VALUES } from '../../constants/categories'
import { colors, common, radius } from '../../theme'

export default function LogScreen({ route, navigation }) {
  const { t } = useTranslation()
  const { language, exerciseName, categoryName } = useExerciseLabel()

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
  // 템플릿에서 불러왔지만 아직 세트가 하나도 없는 종목들. 서버에 저장되지 않는다.
  const [pendingExercises, setPendingExercises] = useState([])

  const addSheet = useDisclosure()
  const editSheet = useDisclosure()
  const deleteSheet = useDisclosure()
  const templateSheet = useDisclosure()

  const [selectedExercise, setSelectedExercise] = useState(null)
  const [addCategory, setAddCategory] = useState(ALL)
  const [editingSet, setEditingSet] = useState(null)

  const addForm = useSetForm((value) => addLogSet(selectedExercise, value, memo))
  const editForm = useSetForm((value) => updateLogSet(editingSet.id, value))

  useEffect(() => { setMemo(log?.memo || '') }, [log?.id])

  const handleSaveMemo = async () => {
    await saveLog(memo)
    setMemoSaved(true)
    setTimeout(() => setMemoSaved(false), 2000)
  }

  const openAddSheet = (exerciseId = null) => {
    setSelectedExercise(exerciseId)
    setAddCategory(ALL)
    addForm.reset()
    addSheet.open()
  }

  const handleAddSet = async () => {
    if (!(await addForm.submit())) return
    setPendingExercises((prev) => prev.filter((ex) => ex.id !== selectedExercise))
    addSheet.close()
  }

  const openEditSheet = (set) => {
    setEditingSet(set)
    editForm.reset(set)
    editSheet.open()
  }

  const handleUpdateSet = async () => {
    if (await editForm.submit()) editSheet.close()
  }

  const handleDeleteLog = async () => {
    await removeLog()
    setMemo('')
    setPendingExercises([])
    deleteSheet.close()
  }

  // 이미 이 날짜에 있는 종목은 다시 얹지 않는다.
  const handleLoadTemplate = (template) => {
    const existingIds = new Set([
      ...(log?.sets?.map((s) => s.exercise_id) || []),
      ...pendingExercises.map((e) => e.id),
    ])
    setPendingExercises((prev) => [
      ...prev,
      ...(template.exercises?.filter((ex) => !existingIds.has(ex.id)) || []),
    ])
    templateSheet.close()
  }

  // 로컬 DB에서 올라온 세트에는 exercise 객체가 없고 exercise_id만 있다.
  // 종목 목록은 이미 캐시돼 있으므로 여기서 이름을 붙인다.
  const exerciseById = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex])), [exercises])

  const groups = useMemo(
    () => groupSetsByExercise(log?.sets, (exerciseId, set) =>
      exerciseName((set.exercise ?? exerciseById.get(exerciseId))?.name) || t('log.unknown')
    ),
    // exerciseName은 언어가 바뀌면 새로 만들어진다. 그래야 언어를 바꿨을 때
    // 종목 이름이 따라온다.
    [log?.sets, exerciseById, exerciseName, t]
  )

  const { totalSets, totalVolume } = summarizeSets(groups.flatMap((g) => g.sets))
  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString(
    language === 'ja' ? 'ja-JP' : 'ko-KR',
    { month: 'long', day: 'numeric', weekday: 'long' }
  )
  const selectedName = exerciseName(exerciseById.get(selectedExercise)?.name)
  const visibleExercises = exercises.filter(
    (ex) => addCategory === ALL || ex.category === CATEGORY_VALUES[addCategory]
  )

  if (isLoading) return <LoadingView />

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <PageHeader
          size="md"
          label={t('log.label')}
          title={dateLabel}
          // 스택으로 열린 경우(캘린더에서 날짜 선택)에는 돌아갈 길을 만든다
          left={isDetail && navigation?.canGoBack?.() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.textSub} />
            </TouchableOpacity>
          )}
          right={log && (
            <TouchableOpacity onPress={deleteSheet.open}>
              <Text style={styles.deleteText}>{t('common.delete')}</Text>
            </TouchableOpacity>
          )}
        />

        <View style={[common.card, styles.card]}>
          <TextInput
            style={styles.memo}
            placeholder={t('log.memoPlaceholder')}
            placeholderTextColor={colors.textFaint}
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={2}
          />

          {memo !== (log?.memo || '') && (
            <TouchableOpacity
              style={[styles.saveBtn, memoSaved && styles.saveBtnSaved]}
              onPress={handleSaveMemo}
            >
              <Text style={[styles.saveBtnText, memoSaved && styles.saveBtnTextSaved]}>
                {memoSaved ? t('log.saved') : t('log.save')}
              </Text>
            </TouchableOpacity>
          )}

          {templates.length > 0 && (
            <TouchableOpacity style={styles.templateBtn} onPress={templateSheet.open}>
              <Ionicons name="apps" size={14} color={colors.textFaint} />
              <Text style={styles.templateBtnText}>{t('log.loadTemplate')}</Text>
            </TouchableOpacity>
          )}

          {groups.length === 0 && pendingExercises.length === 0 && (
            <Text style={styles.emptyText}>{t('log.empty')}</Text>
          )}

          {groups.map(({ exerciseId, name, sets }) => (
            <View key={exerciseId} style={styles.exerciseGroup}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseTitle}>
                  <Text style={styles.exerciseName}>{name}</Text>
                  <TouchableOpacity onPress={() => removeExerciseSets(sets)}>
                    <Ionicons name="trash-outline" size={13} color={colors.textGhost} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => openAddSheet(exerciseId)}>
                  <Text style={styles.addSetText}>+ {t('log.addSet')}</Text>
                </TouchableOpacity>
              </View>
              {sets.map((set) => (
                <SetRow
                  key={set.id}
                  set={set}
                  onEdit={openEditSheet}
                  onDelete={(s) => removeLogSet(s.id)}
                />
              ))}
            </View>
          ))}

          {pendingExercises.map((ex) => (
            <View key={ex.id} style={styles.pendingItem}>
              <View>
                <Text style={styles.pendingName}>{exerciseName(ex.name)}</Text>
                <Text style={styles.pendingCat}>{categoryName(ex.category)}</Text>
              </View>
              <TouchableOpacity style={styles.pendingBtn} onPress={() => openAddSheet(ex.id)}>
                <Text style={styles.pendingBtnText}>+ {t('log.addSet')}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Button variant="primary" onPress={() => openAddSheet()}>
            <View style={styles.addExBtnInner}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addExBtnText}>{t('log.addExercise')}</Text>
            </View>
          </Button>
        </View>

        {totalVolume > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={common.eyebrow}>{t('log.totalVolume')}</Text>
              <Text style={styles.statValue}>
                {totalVolume.toLocaleString()}<Text style={styles.statUnit}> kg</Text>
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={common.eyebrow}>{t('log.totalSets')}</Text>
              <Text style={styles.statValue}>{totalSets}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <BottomSheet visible={addSheet.isOpen} onClose={addSheet.close}>
        <SheetTitle>{selectedExercise ? t('log.addSet') : t('log.addExercise')}</SheetTitle>

        {selectedExercise ? (
          <View style={styles.selectedExBadge}>
            <Ionicons name="barbell-outline" size={14} color={colors.primary} />
            <Text style={styles.selectedExText}>{selectedName}</Text>
            <TouchableOpacity onPress={() => setSelectedExercise(null)}>
              <Ionicons name="close-circle" size={16} color={colors.textFaint} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CategoryFilter
              value={addCategory}
              onChange={setAddCategory}
              style={styles.catFilter}
            />
            <ExercisePicker
              exercises={visibleExercises}
              selectedIds={selectedExercise ? [selectedExercise] : []}
              onSelect={(ex) => setSelectedExercise(ex.id)}
              style={styles.picker}
            />
          </>
        )}

        <SetInputs form={addForm} />
        <SheetActions
          onCancel={addSheet.close}
          onConfirm={handleAddSet}
          confirmLabel={t('common.add')}
          confirmDisabled={!selectedExercise || !addForm.isComplete}
        />
      </BottomSheet>

      <BottomSheet visible={editSheet.isOpen} onClose={editSheet.close}>
        <SheetTitle>{editingSet?.set_number} {t('log.editSet')}</SheetTitle>
        <SetInputs form={editForm} />
        <SheetActions
          onCancel={editSheet.close}
          onConfirm={handleUpdateSet}
          confirmLabel={t('common.save')}
          confirmDisabled={!editForm.isComplete}
        />
      </BottomSheet>

      <ConfirmSheet
        visible={deleteSheet.isOpen}
        onClose={deleteSheet.close}
        onConfirm={handleDeleteLog}
        title={t('log.deleteLog')}
        description={t('log.deleteDesc')}
        confirmLabel={t('common.delete')}
      />

      <BottomSheet visible={templateSheet.isOpen} onClose={templateSheet.close}>
        <SheetTitle>{t('log.loadTemplate')}</SheetTitle>
        {templates.map((tmpl) => (
          <TouchableOpacity key={tmpl.id} style={styles.tmplItem} onPress={() => handleLoadTemplate(tmpl)}>
            <Text style={styles.tmplName}>{tmpl.name}</Text>
            <Text style={styles.tmplSub}>
              {tmpl.exercises?.map((ex) => exerciseName(ex.name)).join(' · ')}
            </Text>
          </TouchableOpacity>
        ))}
        <Button variant="cancel" title={t('common.close')} onPress={templateSheet.close} />
      </BottomSheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  deleteText: { fontSize: 12, color: colors.textFaint, fontWeight: '600' },
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  card: { gap: 16 },
  memo: { backgroundColor: colors.sunken, borderRadius: radius.md, padding: 14, fontSize: 14, color: colors.text, minHeight: 70 },
  saveBtn: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.muted },
  saveBtnSaved: { backgroundColor: colors.successSoft },
  saveBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSub },
  saveBtnTextSaved: { color: colors.success },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  templateBtnText: { fontSize: 12, fontWeight: '700', color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1 },
  emptyText: { textAlign: 'center', color: colors.textFaint, fontSize: 14, paddingVertical: 16 },
  exerciseGroup: { gap: 8 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: colors.text },
  addSetText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.sunken,
  },
  pendingName: { fontSize: 14, fontWeight: '600', color: colors.textBody },
  pendingCat: { fontSize: 12, color: colors.textFaint, marginTop: 2 },
  pendingBtn: { backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  pendingBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  addExBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addExBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  statCard: { flex: 1, ...common.card, padding: 16 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.primary, marginTop: 4 },
  statUnit: { fontSize: 14, fontWeight: '600', color: colors.textFaint },
  selectedExBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  selectedExText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.primary },
  catFilter: { maxHeight: 44 },
  picker: { marginBottom: 4 },
  tmplItem: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  tmplName: { fontSize: 14, fontWeight: '700', color: colors.text },
  tmplSub: { fontSize: 12, color: colors.textFaint, marginTop: 2 },
})
