import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { calc1RM } from '../utils/logStats'
import { colors, radius } from '../theme'

// 세트 한 줄: 번호 · 무게×횟수 · 예상 1RM · 수정/삭제.
export default function SetRow({ set, onEdit, onDelete }) {
  const orm = calc1RM(set.weight, set.reps)

  return (
    <View style={styles.row}>
      <Text style={styles.number}>{set.set_number}</Text>
      <View style={styles.body}>
        <Text style={styles.data}>{set.weight}kg × {set.reps}</Text>
        {orm && <Text style={styles.orm}>EST. 1RM: {orm}kg</Text>}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(set)}>
          <Ionicons name="pencil-outline" size={13} color={colors.textFaint} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete(set)}>
          <Ionicons name="trash-outline" size={13} color={colors.textFaint} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.sunken, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  number: { fontSize: 12, fontWeight: '600', color: colors.textFaint, width: 20 },
  body: { flex: 1 },
  data: { fontSize: 14, fontWeight: '700', color: colors.textStrong },
  orm: { fontSize: 11, color: colors.textFaint, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
})
