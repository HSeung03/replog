import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { register } from '../../api/auth'
import { useTranslation } from 'react-i18next'

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth()
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.email || !form.password || !form.password_confirmation) { setError(t('register.errors.emptyFields')); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError(t('register.errors.invalidEmail')); return }
    if (form.password !== form.password_confirmation) { setError(t('register.errors.passwordMismatch')); return }
    if (form.password.length < 8) { setError(t('register.errors.passwordTooShort')); return }

    setLoading(true)
    try {
      const res = await register(form)
      login(res.data.token, res.data.user)
    } catch (err) {
      if (!err.response) setError(`연결 실패: ${err.message} / ${err.code}`)
      else if (err.response.status === 422) {
        const errors = err.response.data?.errors
        const first = errors ? Object.values(errors)[0]?.[0] : null
        setError(first || t('register.errors.validationFailed'))
      } else setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Replog</Text>
          <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
        </View>

        <View style={styles.card}>
          {[
            { key: 'name', label: t('register.name'), placeholder: t('register.namePlaceholder'), secure: false },
            { key: 'email', label: t('register.email'), placeholder: 'your@email.com', secure: false },
            { key: 'password', label: t('register.password'), placeholder: '••••••••', secure: true },
            { key: 'password_confirmation', label: t('register.passwordConfirm'), placeholder: '••••••••', secure: true },
          ].map(({ key, label, placeholder, secure }) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                value={form[key]}
                onChangeText={(v) => setForm({ ...form, [key]: v })}
                secureTextEntry={secure}
                autoCapitalize="none"
                keyboardType={key === 'email' ? 'email-address' : 'default'}
              />
            </View>
          ))}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('register.registerButton')}</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>{t('register.haveAccount')} <Text style={styles.linkBold}>{t('register.login')}</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F2F4F7', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 60 },
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
