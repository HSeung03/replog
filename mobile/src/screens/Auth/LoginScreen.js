import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { login as loginApi } from '../../api/auth'
import { useTranslation } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleLang = async () => {
    const next = i18n.language === 'ko' ? 'ja' : 'ko'
    i18n.changeLanguage(next)
    await AsyncStorage.setItem('lang', next)
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
      <TouchableOpacity style={styles.langBtn} onPress={toggleLang}>
        <Text style={styles.langText}>{i18n.language === 'ko' ? '🇯🇵 日本語' : '🇰🇷 한국어'}</Text>
      </TouchableOpacity>

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

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>{t('login.noAccount')} <Text style={styles.linkBold}>{t('login.register')}</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F7', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  langBtn: { position: 'absolute', top: 60, right: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  langText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 36, fontWeight: '800', color: '#3730A3' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 6 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, color: '#0f172a' },
  error: { fontSize: 12, color: '#ef4444', textAlign: 'center', marginTop: 8 },
  btn: { backgroundColor: '#1E1B4B', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  link: { marginTop: 20, fontSize: 13, color: '#94a3b8' },
  linkBold: { color: '#3730A3', fontWeight: '700' },
})
