import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { useAuth } from '../../contexts/AuthContext'
import { login as loginApi, googleLogin as googleLoginApi } from '../../api/auth'
import { useTranslation } from 'react-i18next'

GoogleSignin.configure({
  iosClientId: '233986109518-cqhebgq5knmkqqil53fvg23ssdd80qjt.apps.googleusercontent.com',
  androidClientId: '233986109518-njjqritu83q9vmgkn0894rfoh0dfeq7r.apps.googleusercontent.com',
  webClientId: '233986109518-0qdfufi0hbimij82u8pifulsvb5k7a5f.apps.googleusercontent.com',
})

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const { t } = useTranslation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const idToken = userInfo.data?.idToken
      if (!idToken) throw new Error('No id_token')
      const res = await googleLoginApi(idToken)
      login(res.data.token, res.data.user)
    } catch (e) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return
      setError('구글 로그인에 실패했습니다.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.email || !form.password) { setError(t('login.errors.emptyFields')); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError(t('login.errors.invalidEmail')); return }

    setLoading(true)
    try {
      const res = await loginApi(form)
      login(res.data.token, res.data.user)
    } catch (err) {
      if (!err.response) setError(t('common.serverError'))
      else if (err.response.status === 401 || err.response.status === 422) setError(t('login.errors.wrongCredentials'))
      else setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.logo}>Replog</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('login.email')}</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor="#94a3b8"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>{t('login.password')}</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          value={form.password}
          onChangeText={(v) => setForm({ ...form, password: v })}
          secureTextEntry
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('login.loginButton')}</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>또는</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={googleLoading}>
        {googleLoading ? <ActivityIndicator color="#334155" /> : (
          <View style={styles.googleBtnInner}>
            <Image source={require('../../../assets/google-logo.png')} style={styles.googleLogo} />
            <Text style={styles.googleBtnText}>Google로 로그인</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>{t('login.noAccount')} <Text style={styles.linkBold}>{t('login.register')}</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 36, fontWeight: '800', color: '#3730A3' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 6 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, color: '#0f172a' },
  error: { fontSize: 12, color: '#ef4444', textAlign: 'center', marginTop: 8 },
  btn: { backgroundColor: '#1E1B4B', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: '#94a3b8' },
  googleBtn: { width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  googleBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  googleLogo: { width: 20, height: 20 },
  googleBtnText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  link: { marginTop: 20, fontSize: 13, color: '#94a3b8' },
  linkBold: { color: '#3730A3', fontWeight: '700' },
})
