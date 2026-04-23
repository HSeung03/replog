import { Modal, TouchableOpacity, StyleSheet } from 'react-native'

export default function BottomSheet({ visible, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

export const sheetStyles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, color: '#0f172a', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#1E1B4B', alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  dangerBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#ef4444', alignItems: 'center' },
})

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
})
