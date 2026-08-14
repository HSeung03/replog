import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import useTemplates from '../../hooks/useTemplates'
import useExercises from '../../hooks/useExercises'
import useDisclosure from '../../hooks/useDisclosure'
import useExerciseLabel from '../../hooks/useExerciseLabel'
import Screen from '../../components/Screen'
import ScreenHeader from '../../components/ScreenHeader'
import BottomSheet, { SheetTitle, SheetActions } from '../../components/BottomSheet'
import CategoryFilter, { ALL } from '../../components/CategoryFilter'
import ExercisePicker from '../../components/ExercisePicker'
import TextField from '../../components/TextField'
import { CATEGORY_VALUES } from '../../constants/categories'
import { colors, common, radius } from '../../theme'

export default function TemplatesScreen({ navigation }) {
  const { t } = useTranslation()
  const { templates, create, update, remove } = useTemplates()
  const { exercises } = useExercises()
  const { exerciseName } = useExerciseLabel()

  const sheet = useDisclosure()
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [name, setName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState([])
  const [category, setCategory] = useState(ALL)

  const openSheet = (template = null) => {
    setEditingTemplate(template)
    setName(template?.name ?? '')
    setSelectedExercises(template?.exercises ?? [])
    setCategory(ALL)
    sheet.open()
  }

  const handleClose = () => {
    sheet.close()
    setEditingTemplate(null)
    setName('')
    setSelectedExercises([])
  }

  const handleSave = async () => {
    const data = { name, exercises: selectedExercises.map((ex) => ({ exercise_id: ex.id })) }
    try {
      if (editingTemplate) await update(editingTemplate.id, data)
      else await create(data)
    } catch {
      // 저장에 실패하면 목록이 원래대로 되돌아간다. 시트는 열어 둔 채로 둔다.
      return
    }
    handleClose()
  }

  const toggleExercise = (exercise) =>
    setSelectedExercises((prev) =>
      prev.some((e) => e.id === exercise.id)
        ? prev.filter((e) => e.id !== exercise.id)
        : [...prev, exercise]
    )

  const visibleExercises = exercises.filter(
    (ex) => category === ALL || ex.category === CATEGORY_VALUES[category]
  )

  return (
    <Screen>
      <ScreenHeader
        label={t('templates.subtitle')}
        title={t('templates.title')}
        onBack={() => navigation.goBack()}
        onRight={() => openSheet()}
      />

      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={common.empty}>{t('templates.noTemplates')}</Text>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => openSheet(item)}>
            <View style={common.fill}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSub} numberOfLines={1}>
                {item.exercises?.map((ex) => exerciseName(ex.name)).join(' · ')}
              </Text>
            </View>
            {/* 실패하면 낙관적 반영이 되돌아가면서 목록에 다시 나타난다 */}
            <TouchableOpacity onPress={() => remove(item.id).catch(() => {})} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={14} color={colors.textGhost} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <BottomSheet visible={sheet.isOpen} onClose={handleClose}>
        <SheetTitle>{editingTemplate ? t('templates.editTitle') : t('templates.addTitle')}</SheetTitle>

        <TextField
          variant="sheet"
          placeholder={t('templates.namePlaceholder')}
          value={name}
          onChangeText={setName}
        />

        <CategoryFilter
          size="sm"
          value={category}
          onChange={setCategory}
          allLabel={t('templates.categoryPlaceholder')}
          style={styles.filter}
        />

        <ExercisePicker
          exercises={visibleExercises}
          selectedIds={selectedExercises.map((ex) => ex.id)}
          onSelect={toggleExercise}
          showRemoveIcon
          maxHeight={160}
          style={styles.picker}
        />

        {selectedExercises.length > 0 && (
          <View style={styles.selectedRow}>
            {selectedExercises.map((ex) => (
              <TouchableOpacity
                key={ex.id}
                style={styles.selectedChip}
                onPress={() => toggleExercise(ex)}
              >
                <Text style={styles.selectedChipText}>{exerciseName(ex.name)}</Text>
                <Ionicons name="close" size={10} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <SheetActions
          onCancel={handleClose}
          onConfirm={handleSave}
          confirmLabel={t('common.save')}
          confirmDisabled={!name}
        />
      </BottomSheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  separator: { height: 1, backgroundColor: colors.sunken },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 1,
  },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemSub: { fontSize: 12, color: colors.textFaint, marginTop: 2 },
  deleteBtn: { width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  filter: { marginBottom: 8 },
  picker: { marginBottom: 12 },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  selectedChipText: { fontSize: 12, fontWeight: '700', color: colors.primary },
})
