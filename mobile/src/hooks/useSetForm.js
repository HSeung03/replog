import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseSetInput } from '../utils/setInput'

const EMPTY = { weight: '', reps: '' }

/*
 * 세트 추가 시트와 수정 시트가 똑같이 갖고 있던 것: 무게/횟수 두 칸, 에러 문구,
 * 검증(parseSetInput), 그리고 "서버가 거절하면 시트를 닫지 않는다"는 규칙.
 *
 * submit()은 저장에 성공하면 true를 준다. 호출부는 그때만 시트를 닫는다.
 */
export default function useSetForm(onSubmit) {
  const { t } = useTranslation()
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState('')

  // 값을 고치면 이전 에러 문구는 의미가 없다.
  const setField = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setError('')
  }, [])

  const reset = useCallback((initial = EMPTY) => {
    setValues({ weight: String(initial.weight ?? ''), reps: String(initial.reps ?? '') })
    setError('')
  }, [])

  const submit = async () => {
    const parsed = parseSetInput(values)
    if (!parsed.ok) {
      setError(t(parsed.error))
      return false
    }

    try {
      await onSubmit(parsed.value)
      return true
    } catch {
      // 서버가 거절한 입력이다. 시트를 닫지 않고 이유를 남겨둔다.
      setError(t('log.errors.saveRejected'))
      return false
    }
  }

  return {
    values,
    setField,
    error,
    reset,
    submit,
    // 빈 칸이 있으면 확인 버튼을 눌러도 소용없다. 미리 흐리게 만든다.
    isComplete: !!values.weight && !!values.reps,
  }
}
