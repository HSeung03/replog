import { View, Text, KeyboardAvoidingView, ScrollView, Platform, StyleSheet } from 'react-native'
import { colors, radius, shadow } from '../theme'

/*
 * 로그인·회원가입 화면의 껍데기: 로고 + 안내 문구 + 흰 카드 + 아래 링크.
 * 두 화면이 같은 구조와 같은 스타일 시트를 각자 갖고 있었다.
 */
export default function AuthLayout({ subtitle, children, footer, scrollable = false }) {
  const body = (
    <>
      <View style={styles.header}>
        <Text style={styles.logo}>Replog</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.card}>{children}</View>

      {footer}
    </>
  )

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {scrollable ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        <View style={styles.container}>{body}</View>
      )}
    </KeyboardAvoidingView>
  )
}

const base = {
  backgroundColor: colors.background,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 32,
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { ...base, flex: 1 },
  scrollContent: { ...base, flexGrow: 1, paddingVertical: 60 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 36, fontWeight: '800', color: colors.primary },
  subtitle: { fontSize: 14, color: colors.textFaint, marginTop: 6 },
  card: { width: '100%', backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, ...shadow.raised },
})
