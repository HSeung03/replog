import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

/*
 * 로그인과 회원가입 화면이 똑같이 갖고 있던 것들:
 * 폼 상태, 에러 문구, 로딩 플래그, 그리고 아래 세 갈래 에러 분기.
 *
 *   응답 자체가 없음 → 서버에 못 닿음
 *   4xx             → 화면이 정해준 문구
 *   그 외            → 일반 오류
 *
 *   validate(form)  → i18n 키를 돌려주면 요청을 보내지 않고 그 문구를 띄운다
 *   request(form)   → 토큰과 사용자를 담은 응답을 주는 API 호출
 *   errorMessage(err) → 4xx일 때 보여줄 문구(없으면 일반 오류)
 */
export default function useAuthForm({ initialValues, validate, request, errorMessage }) {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [form, setForm] = useState(initialValues)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async () => {
    setError('')

    const invalid = validate?.(form)
    if (invalid) return setError(t(invalid))

    setLoading(true)
    try {
      const res = await request(form)
      await login(res.data.token, res.data.user)
    } catch (err) {
      setError(resolveError(err, t, errorMessage))
    } finally {
      setLoading(false)
    }
  }

  return { form, setField, error, setError, loading, submit }
}

const resolveError = (err, t, errorMessage) => {
  if (!err.response) return t('common.serverError')
  const custom = errorMessage?.(err, t)
  return custom || t('common.error')
}
