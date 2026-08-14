import { Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import useExerciseLabel from '../hooks/useExerciseLabel'
import { colors, radius } from '../theme'

/*
 * 시트 안에서 종목을 고르는 목록. 세트 추가 시트(하나만 고름)와 템플릿 시트
 * (여러 개 고름)가 같은 목록을 각자 그리고 있었다.
 *
 * selectedIds는 고른 종목의 id 배열이다. 하나만 고르는 쪽도 배열 하나로 넘긴다.
 */
export default function ExercisePicker({
  exercises,
  selectedIds = [],
  onSelect,
  showRemoveIcon = false,
  maxHeight = 200,
  style,
}) {
  const { exerciseName } = useExerciseLabel()
  const selected = new Set(selectedIds)

  return (
    <ScrollView style={[{ maxHeight }, style]}>
      {exercises.map((ex) => {
        const isSelected = selected.has(ex.id)
        return (
          <TouchableOpacity
            key={ex.id}
            style={[styles.item, isSelected && styles.itemSelected]}
            onPress={() => onSelect(ex)}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {exerciseName(ex.name)}
            </Text>
            {showRemoveIcon && isSelected && (
              <Ionicons name="close" size={12} color={colors.primary} />
            )}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm + 2,
    marginBottom: 4,
    backgroundColor: colors.sunken,
  },
  itemSelected: { backgroundColor: colors.primarySoft },
  label: { fontSize: 13, fontWeight: '600', color: colors.textBody },
  labelSelected: { color: colors.primary },
})
