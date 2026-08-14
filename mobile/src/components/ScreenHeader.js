import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, common, radius, shadow } from '../theme'

// 스택으로 열리는 화면(종목·템플릿)의 상단 줄: 뒤로가기 + 라벨/제목 + 액션 버튼.
export default function ScreenHeader({ label, title, onBack, rightIcon = 'add', onRight }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={18} color={colors.textSub} />
      </TouchableOpacity>
      <View style={common.fill}>
        <Text style={[common.eyebrow, styles.label]}>{label}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {onRight && (
        <TouchableOpacity style={styles.rightBtn} onPress={onRight}>
          <Ionicons name={rightIcon} size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  backBtn: { width: 54, height: 54, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  label: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  rightBtn: { width: 54, height: 54, borderRadius: radius.lg, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
})
