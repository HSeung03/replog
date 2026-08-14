import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import Button from './Button'
import { colors } from '../theme'

export default function BottomSheet({ visible, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

export function SheetTitle({ children }) {
  return <Text style={styles.title}>{children}</Text>
}

/*
 * 시트 하단의 취소/확인 줄. 다섯 시트가 같은 두 버튼을 각자 그리고 있었다.
 * confirmVariant로 확인 버튼을 위험(빨강)으로 바꾼다.
 */
export function SheetActions({
  onCancel,
  onConfirm,
  confirmLabel,
  cancelLabel,
  confirmDisabled = false,
  confirmVariant = 'confirm',
  busy = false,
}) {
  const { t } = useTranslation()

  return (
    <View style={styles.actions}>
      <Button
        variant="cancel"
        title={cancelLabel ?? t('common.cancel')}
        onPress={onCancel}
        disabled={busy}
      />
      <Button
        variant={confirmVariant}
        title={confirmLabel}
        onPress={onConfirm}
        disabled={confirmDisabled || busy}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 8 },
})
