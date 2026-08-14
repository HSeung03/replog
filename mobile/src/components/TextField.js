import { View, Text, TextInput, StyleSheet } from 'react-native'
import { colors, radius } from '../theme'

/*
 * 앱의 입력 칸은 전부 같은 모양이다. 로그인·회원가입 화면과 시트 네 곳이
 * 각자 같은 input 스타일을 선언하고 있었다.
 *
 *   form   위에 라벨이 붙는 폼 입력 (로그인, 회원가입)
 *   sheet  라벨 없이 아래 여백만 두는 시트 입력
 */
export default function TextField({ label, variant = 'form', style, ...props }) {
  return (
    <View>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, variant === 'sheet' && styles.sheetInput, style]}
        placeholderTextColor={colors.textFaint}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.textBody, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.sunken,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.text,
  },
  sheetInput: { marginBottom: 12 },
})
