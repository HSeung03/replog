import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { colors, radius } from '../theme'

/*
 * 앱에 있는 버튼은 사실 네 종류뿐인데, 화면마다 btn/btnText/cancelBtn/confirmBtn/
 * dangerBtn/addExBtn 이름으로 같은 스타일이 다시 선언돼 있었다.
 *
 *   primary   진한 남색 채움 (로그인, 회원가입, 종목 추가)
 *   confirm   시트 하단의 확인 (primary와 같은 색, 시트 높이에 맞춘 것)
 *   cancel    회색 채움
 *   danger    빨강 채움
 */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  children,
}) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'cancel' ? colors.textSub : '#fff'} />
      ) : (
        children ?? <Text style={[styles.label, styles[`${variant}Label`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
  label: { fontSize: 14, fontWeight: '700' },

  primary: { backgroundColor: colors.primaryDark, borderRadius: radius.lg, paddingVertical: 16 },
  primaryLabel: { color: '#fff' },

  confirm: { flex: 1, backgroundColor: colors.primaryDark, borderRadius: 14, paddingVertical: 14 },
  confirmLabel: { color: '#fff', fontWeight: '600' },

  cancel: { flex: 1, backgroundColor: colors.muted, borderRadius: 14, paddingVertical: 14 },
  cancelLabel: { color: colors.textSub, fontWeight: '600' },

  danger: { flex: 1, backgroundColor: colors.danger, borderRadius: 14, paddingVertical: 14 },
  dangerLabel: { color: '#fff', fontWeight: '600' },

  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: 14 },
  outlineLabel: { color: colors.textBody },
})
