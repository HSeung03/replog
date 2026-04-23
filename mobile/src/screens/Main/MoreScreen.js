import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../api/auth'
import { useTranslation } from 'react-i18next'

export default function MoreScreen({ navigation }) {
  const { user, logout: logoutAuth } = useAuth()
  const { t } = useTranslation()

  const handleLogout = async () => {
    await logout()
    logoutAuth()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Exercises')}>
            <View style={styles.menuIcon}><Ionicons name="list" size={18} color="#3730A3" /></View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{t('more.exercises')}</Text>
              <Text style={styles.menuDesc}>{t('more.exercisesDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Templates')}>
            <View style={styles.menuIcon}><Ionicons name="apps" size={18} color="#3730A3" /></View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{t('more.templates')}</Text>
              <Text style={styles.menuDesc}>{t('more.templatesDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIcon, styles.menuIconRed]}><Ionicons name="log-out-outline" size={18} color="#ef4444" /></View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitleRed}>{t('more.logout')}</Text>
              <Text style={styles.menuDescRed}>{t('more.logoutDesc')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Replog v1.0.0</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F7' },
  container: { flex: 1, padding: 16, gap: 12 },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#3730A3' },
  name: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  email: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  menuCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 16 },
  menuIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  menuIconRed: { backgroundColor: '#fef2f2' },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  menuDesc: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuTitleRed: { fontSize: 14, fontWeight: '700', color: '#ef4444' },
  menuDescRed: { fontSize: 11, fontWeight: '600', color: '#fca5a5', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 20 },
  version: { textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: 2, paddingVertical: 8 },
})
