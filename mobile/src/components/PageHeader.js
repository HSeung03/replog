import { View, Text, StyleSheet } from 'react-native'
import { colors, common } from '../theme'

/*
 * 탭 화면 상단의 "작은 라벨 + 큰 제목". 캘린더와 기록 화면이 같은 조각을
 * 각자 pageHeader/pageLabel/pageTitle로 선언하고 있었다.
 *
 * left는 제목 앞(뒤로가기 버튼 등), right는 같은 줄 오른쪽 끝에 놓인다.
 */
export default function PageHeader({ label, title, size = 'lg', left, right }) {
  return (
    <View style={styles.header}>
      <Text style={common.eyebrow}>{label}</Text>
      <View style={styles.titleRow}>
        <View style={styles.titleGroup}>
          {left}
          <Text style={[styles.title, size === 'md' && styles.titleMd]}>{title}</Text>
        </View>
        {right}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 2 },
  titleMd: { fontSize: 22 },
})
