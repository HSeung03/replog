import { Text, StyleSheet } from 'react-native'
import BottomSheet, { SheetTitle, SheetActions } from './BottomSheet'
import ErrorText from './ErrorText'
import { colors } from '../theme'

/*
 * "정말 지울까요?" 시트. 일지 삭제와 종목 삭제가 같은 모양을 각자 그리고 있었다.
 * description 대신 children을 주면 본문을 통째로 갈아끼울 수 있다(종목 삭제는
 * 함께 사라질 기록 개수를 경고 상자로 보여준다).
 */
export default function ConfirmSheet({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  error,
  busy = false,
  children,
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetTitle>{title}</SheetTitle>
      {children ?? (!!description && <Text style={styles.description}>{description}</Text>)}
      {!!error && <ErrorText centered>{error}</ErrorText>}
      <SheetActions
        onCancel={onClose}
        onConfirm={onConfirm}
        confirmLabel={confirmLabel}
        confirmVariant="danger"
        busy={busy}
      />
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  description: { fontSize: 14, color: colors.textSub },
})
