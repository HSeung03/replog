import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../api/auth'
import Screen from '../../components/Screen'
import { colors, common, radius, shadow } from '../../theme'

// 메뉴 한 줄. 네 줄이 같은 구조를 각자 그리고 있었다.
function MenuRow({ icon, title, description, onPress, danger = false, right }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.primary} />
      </View>
      <View style={common.fill}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        <Text style={[styles.menuDesc, danger && styles.menuDescDanger]}>{description}</Text>
      </View>
      {right ?? <Ionicons name="chevron-forward" size={16} color={colors.textGhost} />}
    </TouchableOpacity>
  )
}

export default function MoreScreen({ navigation }) {
  const { user, logout: logoutAuth } = useAuth()
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'ko' ? 'ja' : 'ko')

  const handleLogout = async () => {
    try { await logout() } catch {}
    // 로컬 DB/캐시 정리가 끝난 뒤에 화면이 전환되도록 기다린다
    await logoutAuth()
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.menuCard}>
          <MenuRow
            icon="list"
            title={t('more.exercises')}
            description={t('more.exercisesDesc')}
            onPress={() => navigation.navigate('Exercises')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="apps"
            title={t('more.templates')}
            description={t('more.templatesDesc')}
            onPress={() => navigation.navigate('Templates')}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="language"
            title={t('more.language')}
            description={t('more.languageDesc')}
            onPress={toggleLanguage}
            right={
              <View style={styles.langBadge}>
                <Text style={styles.langBadgeText}>{i18n.language === 'ko' ? '한국어' : '日本語'}</Text>
              </View>
            }
          />
          <View style={styles.divider} />
          <MenuRow
            danger
            icon="log-out-outline"
            title={t('more.logout')}
            description={t('more.logoutDesc')}
            onPress={handleLogout}
            right={<View />}
          />
        </View>

        <Text style={styles.version}>Replog v1.0.0</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  profileCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, alignItems: 'center', ...shadow.card },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.primary },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.textFaint, marginTop: 4 },
  menuCard: { backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', ...shadow.card },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 16 },
  menuIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  menuIconDanger: { backgroundColor: colors.dangerSoft },
  menuTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  menuTitleDanger: { color: colors.danger },
  menuDesc: { fontSize: 11, fontWeight: '600', color: colors.textFaint, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuDescDanger: { color: colors.dangerFaint },
  divider: { height: 1, backgroundColor: colors.muted, marginHorizontal: 20 },
  langBadge: { backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  langBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  version: { textAlign: 'center', fontSize: 10, fontWeight: '700', color: colors.textGhost, textTransform: 'uppercase', letterSpacing: 2, paddingVertical: 8 },
})
