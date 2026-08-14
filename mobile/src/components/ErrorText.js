import { Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

// 폼·시트가 각자 선언하던 빨간 안내 문구.
export default function ErrorText({ children, centered = false, style }) {
  if (!children) return null
  return <Text style={[styles.text, centered && styles.centered, style]}>{children}</Text>
}

const styles = StyleSheet.create({
  text: { fontSize: 12, color: colors.danger, marginTop: 8 },
  centered: { textAlign: 'center' },
})
