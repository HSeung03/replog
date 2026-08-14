import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import useExercises from '../../hooks/useExercises'
import useDisclosure from '../../hooks/useDisclosure'
import useExerciseLabel from '../../hooks/useExerciseLabel'
import Screen from '../../components/Screen'
import ScreenHeader from '../../components/ScreenHeader'
import BottomSheet, { SheetTitle, SheetActions } from '../../components/BottomSheet'
import ConfirmSheet from '../../components/ConfirmSheet'
import CategoryFilter, { ALL } from '../../components/CategoryFilter'
import TextField from '../../components/TextField'
import { CATEGORY_KEYS, CATEGORY_VALUES, BADGE_COLORS, BADGE_TEXT } from '../../constants/categories'
import { colors, common, radius } from '../../theme'

const DEFAULT_CATEGORY = CATEGORY_KEYS[0]

export default function ExercisesScreen({ navigation }) {
  const { t } = useTranslation()
  const { exercises, create, remove } = useExercises()
  const { exerciseName, categoryName } = useExerciseLabel()

  const [selectedCategory, setSelectedCategory] = useState(ALL)

  const addSheet = useDisclosure()
  const [form, setForm] = useState({ name: '', category: DEFAULT_CATEGORY })

  // 삭제는 2단계다. 먼저 확인만 받고, 기록이 딸린 종목이면 서버가 409로
  // 삭제될 개수를 알려준다. 그때 경고를 보여주고 한 번 더 확인받는다.
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteImpact, setDeleteImpact] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const openAdd = () => {
    setForm({ name: '', category: DEFAULT_CATEGORY })
    addSheet.open()
  }

  const handleCreate = async () => {
    if (!form.name) return
    try {
      // 서버는 아직 카테고리를 한국어 값으로 저장한다(constants/categories 참고).
      await create({ name: form.name, category: CATEGORY_VALUES[form.category] })
    } catch {
      // 실패하면 목록에서 사라진다. 시트는 열어 둔 채로 둔다.
      return
    }
    addSheet.close()
  }

  const openDelete = (exercise) => {
    setDeleteTarget(exercise)
    setDeleteImpact(null)
    setDeleteError('')
  }

  const closeDelete = () => {
    setDeleteTarget(null)
    setDeleteImpact(null)
    setDeleteError('')
  }

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      await remove(deleteTarget.id, deleteImpact !== null)
      closeDelete()
    } catch (e) {
      const impact = e.response?.status === 409 ? e.response.data : null
      if (impact && deleteImpact === null) {
        // 첫 시도에서만 경고로 승격한다. 이미 경고를 본 뒤라면 실패로 취급.
        setDeleteImpact({
          setsCount: impact.sets_count ?? 0,
          templatesCount: impact.templates_count ?? 0,
        })
      } else {
        setDeleteError(t('exercises.deleteFailed'))
      }
    } finally {
      setDeleting(false)
    }
  }

  const filtered = selectedCategory === ALL
    ? exercises
    : exercises.filter((ex) => ex.category === CATEGORY_VALUES[selectedCategory])

  return (
    <Screen>
      <ScreenHeader
        label={t('exercises.subtitle')}
        title={t('exercises.title')}
        onBack={() => navigation.goBack()}
        onRight={openAdd}
      />

      <CategoryFilter
        size="lg"
        value={selectedCategory}
        onChange={setSelectedCategory}
        style={styles.filterScroll}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={common.empty}>{t('exercises.noExercises')}</Text>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={common.fill}>
              <Text style={styles.itemName}>{exerciseName(item.name)}</Text>
              {!!item.is_default && <Text style={styles.defaultBadge}>DEFAULT</Text>}
            </View>
            <View style={styles.itemRight}>
              <View style={[styles.catBadge, { backgroundColor: BADGE_COLORS[item.category] ?? colors.muted }]}>
                <Text style={[styles.catBadgeText, { color: BADGE_TEXT[item.category] ?? colors.textMuted }]}>
                  {categoryName(item.category)}
                </Text>
              </View>
              {/* 기본 종목은 지울 수 없다 */}
              {!item.is_default && (
                <TouchableOpacity onPress={() => openDelete(item)}>
                  <Ionicons name="trash-outline" size={14} color={colors.textGhost} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      <BottomSheet visible={addSheet.isOpen} onClose={addSheet.close}>
        <SheetTitle>{t('exercises.addTitle')}</SheetTitle>
        <TextField
          variant="sheet"
          placeholder={t('exercises.namePlaceholder')}
          value={form.name}
          onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
        />
        <CategoryFilter
          wrap
          size="sm"
          includeAll={false}
          value={form.category}
          onChange={(category) => setForm((prev) => ({ ...prev, category }))}
        />
        <SheetActions
          onCancel={addSheet.close}
          onConfirm={handleCreate}
          confirmLabel={t('common.add')}
          confirmDisabled={!form.name}
        />
      </BottomSheet>

      <ConfirmSheet
        visible={!!deleteTarget}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title={t('exercises.deleteTitle')}
        confirmLabel={t('common.delete')}
        error={deleteError}
        busy={deleting}
      >
        {deleteImpact ? (
          <View style={styles.warnBox}>
            <Text style={styles.warnText}>
              {t('exercises.deleteWarning', {
                name: exerciseName(deleteTarget?.name),
                setCount: deleteImpact.setsCount,
              })}
            </Text>
            {deleteImpact.templatesCount > 0 && (
              <Text style={styles.warnSub}>
                {t('exercises.deleteTemplateWarning', { templateCount: deleteImpact.templatesCount })}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.deleteDesc}>
            {t('exercises.deleteSimpleDesc', { name: exerciseName(deleteTarget?.name) })}
          </Text>
        )}
      </ConfirmSheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  filterScroll: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 44 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  separator: { height: 1, backgroundColor: colors.sunken, marginHorizontal: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 1,
  },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.text },
  defaultBadge: { fontSize: 10, fontWeight: '700', color: colors.textFaint, marginTop: 2, letterSpacing: 1 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  catBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  deleteDesc: { fontSize: 14, color: colors.textSub },
  warnBox: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 14, gap: 6 },
  warnText: { fontSize: 14, fontWeight: '600', color: colors.dangerDark, lineHeight: 20 },
  warnSub: { fontSize: 12, color: colors.danger },
})
