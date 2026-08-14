import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, radius } from '../theme'

/*
 * 눌러서 고르는 알약 버튼. 네 곳(종목 목록 필터, 종목 추가 시트, 세트 추가
 * 시트, 템플릿 시트)이 filterBtn/catFilterBtn/catBtn 이름으로 같은 것을
 * 조금씩 다른 크기로 선언하고 있었다. 크기만 세 가지다.
 *
 *   lg       흰 배경 + 테두리 (목록 위 필터 줄)
 *   md       회색 채움, 높이 34
 *   sm       회색 채움, 패딩만
 */
export default function Chip({ label, active = false, onPress, size = 'md' }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.base, styles[size], active && styles.active, active && size === 'lg' && styles.activeLg]}
    >
      <Text style={[styles.label, styles[`${size}Label`], active && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.primaryDark },
  activeLg: { borderColor: colors.primaryDark },
  label: { fontWeight: '700', color: colors.textMuted },
  activeLabel: { color: '#fff' },

  lg: { paddingHorizontal: 16, height: 36, minWidth: 52, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  lgLabel: { fontSize: 13 },

  md: { paddingHorizontal: 14, height: 34, backgroundColor: colors.muted },
  mdLabel: { fontSize: 12 },

  sm: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.muted },
  smLabel: { fontSize: 12 },
})
