import { StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import TextField from './TextField'
import ErrorText from './ErrorText'
import { colors } from '../theme'

// 무게/횟수 두 칸 + 에러 문구. 세트 추가 시트와 수정 시트가 함께 쓴다.
export default function SetInputs({ form }) {
  const { t } = useTranslation()

  return (
    <>
      <TextField
        variant="sheet"
        placeholder={t('log.weight')}
        keyboardType="numeric"
        value={form.values.weight}
        onChangeText={(v) => form.setField('weight', v)}
      />
      <TextField
        variant="sheet"
        placeholder={t('log.reps')}
        keyboardType="numeric"
        value={form.values.reps}
        onChangeText={(v) => form.setField('reps', v)}
      />
      <ErrorText style={styles.error}>{form.error}</ErrorText>
    </>
  )
}

const styles = StyleSheet.create({
  error: { fontSize: 13, color: colors.dangerText, marginTop: -4 },
})
