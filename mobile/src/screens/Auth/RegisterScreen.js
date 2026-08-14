import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { register } from '../../api/auth'
import useAuthForm from '../../hooks/useAuthForm'
import { isEmail } from '../../utils/validation'
import AuthLayout from '../../components/AuthLayout'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import ErrorText from '../../components/ErrorText'
import { colors } from '../../theme'

const MIN_PASSWORD_LENGTH = 8

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation()

  const { form, setField, error, loading, submit } = useAuthForm({
    initialValues: { name: '', email: '', password: '', password_confirmation: '' },
    validate: (values) => {
      if (Object.values(values).some((v) => !v)) return 'register.errors.emptyFields'
      if (!isEmail(values.email)) return 'register.errors.invalidEmail'
      if (values.password !== values.password_confirmation) return 'register.errors.passwordMismatch'
      if (values.password.length < MIN_PASSWORD_LENGTH) return 'register.errors.passwordTooShort'
    },
    request: (values) => register(values),
    // 서버가 필드별 이유를 주면 그대로 보여준다("이미 사용 중인 이메일입니다" 등).
    errorMessage: (err) => {
      if (err.response.status !== 422) return null
      const errors = err.response.data?.errors
      return (errors ? Object.values(errors)[0]?.[0] : null) || t('register.errors.validationFailed')
    },
  })

  const fields = [
    { key: 'name', label: t('register.name'), placeholder: t('register.namePlaceholder') },
    { key: 'email', label: t('register.email'), placeholder: 'your@email.com', keyboardType: 'email-address' },
    { key: 'password', label: t('register.password'), placeholder: '••••••••', secureTextEntry: true },
    { key: 'password_confirmation', label: t('register.passwordConfirm'), placeholder: '••••••••', secureTextEntry: true },
  ]

  return (
    <AuthLayout
      scrollable
      subtitle={t('register.subtitle')}
      footer={
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            {t('register.haveAccount')} <Text style={styles.linkBold}>{t('register.login')}</Text>
          </Text>
        </TouchableOpacity>
      }
    >
      {fields.map(({ key, ...props }) => (
        <TextField
          key={key}
          value={form[key]}
          onChangeText={(v) => setField(key, v)}
          autoCapitalize="none"
          {...props}
        />
      ))}

      <ErrorText centered>{error}</ErrorText>

      <Button style={styles.submit} title={t('register.registerButton')} onPress={submit} loading={loading} />
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  submit: { marginTop: 20 },
  link: { marginTop: 20, fontSize: 13, color: colors.textFaint },
  linkBold: { color: colors.primary, fontWeight: '700' },
})
