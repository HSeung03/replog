import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { login as loginApi, googleLogin as googleLoginApi } from '../../api/auth'
import useAuthForm from '../../hooks/useAuthForm'
import { isEmail } from '../../utils/validation'
import AuthLayout from '../../components/AuthLayout'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import ErrorText from '../../components/ErrorText'
import { colors, radius } from '../../theme'

GoogleSignin.configure({
  iosClientId: '233986109518-cqhebgq5knmkqqil53fvg23ssdd80qjt.apps.googleusercontent.com',
  webClientId: '233986109518-0qdfufi0hbimij82u8pifulsvb5k7a5f.apps.googleusercontent.com',
})

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [googleLoading, setGoogleLoading] = useState(false)

  const { form, setField, error, setError, loading, submit } = useAuthForm({
    initialValues: { email: '', password: '' },
    validate: ({ email, password }) => {
      if (!email || !password) return 'login.errors.emptyFields'
      if (!isEmail(email)) return 'login.errors.invalidEmail'
    },
    request: (values) => loginApi(values),
    // 401도 422도 사용자 입장에서는 "아이디나 비밀번호가 틀렸다"는 같은 말이다.
    errorMessage: (err) =>
      [401, 422].includes(err.response.status) ? t('login.errors.wrongCredentials') : null,
  })

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const idToken = userInfo.data?.idToken
      if (!idToken) throw new Error('No id_token')
      const res = await googleLoginApi(idToken)
      await login(res.data.token, res.data.user)
    } catch (e) {
      // 사용자가 스스로 닫은 창은 오류가 아니다.
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return
      setError(t('login.errors.googleFailed'))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <AuthLayout
      subtitle={t('login.subtitle')}
      footer={
        <>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('login.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button variant="outline" style={styles.googleBtn} onPress={handleGoogleLogin} disabled={googleLoading}>
            {googleLoading ? (
              <ActivityIndicator color={colors.textBody} />
            ) : (
              <View style={styles.googleBtnInner}>
                <Image source={require('../../../assets/google-logo.png')} style={styles.googleLogo} />
                <Text style={styles.googleBtnText}>{t('login.googleLogin')}</Text>
              </View>
            )}
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>
              {t('login.noAccount')} <Text style={styles.linkBold}>{t('login.register')}</Text>
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      <TextField
        label={t('login.email')}
        placeholder="your@email.com"
        value={form.email}
        onChangeText={(v) => setField('email', v)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label={t('login.password')}
        placeholder="••••••••"
        value={form.password}
        onChangeText={(v) => setField('password', v)}
        secureTextEntry
      />

      <ErrorText centered>{error}</ErrorText>

      <Button style={styles.submit} title={t('login.loginButton')} onPress={submit} loading={loading} />
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  submit: { marginTop: 20 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: colors.textFaint },
  googleBtn: { width: '100%', borderRadius: radius.lg, marginTop: 12 },
  googleBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  googleLogo: { width: 20, height: 20 },
  googleBtnText: { fontSize: 14, fontWeight: '700', color: colors.textBody },
  link: { marginTop: 20, fontSize: 13, color: colors.textFaint },
  linkBold: { color: colors.primary, fontWeight: '700' },
})
