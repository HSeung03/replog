import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function ScreenHeader({ label, title, onBack, rightIcon = 'add', onRight }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={18} color="#475569" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {onRight && (
        <TouchableOpacity style={styles.rightBtn} onPress={onRight}>
          <Ionicons name={rightIcon} size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  backBtn: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  label: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  rightBtn: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#1E1B4B', alignItems: 'center', justifyContent: 'center' },
})
