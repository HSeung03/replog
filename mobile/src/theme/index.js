/*
 * 화면 전체가 쓰는 색·간격·그림자 토큰.
 *
 * 이전에는 같은 색이 화면마다 리터럴로 흩어져 있었다('#3730A3'이 7개 파일,
 * '#94a3b8'이 8개 파일). 색 하나를 바꾸려면 전부 찾아 고쳐야 했고, 한 곳만
 * 놓치면 그 화면만 예전 색으로 남았다. 여기 한 곳만 손대면 된다.
 */
import { StyleSheet } from 'react-native'

export const colors = {
  // 브랜드
  primary: '#3730A3',
  primaryDark: '#1E1B4B',
  primarySoft: '#eef2ff',

  // 배경
  background: '#F2F4F7',
  surface: '#fff',
  sunken: '#f8fafc',
  muted: '#f1f5f9',

  // 글자
  text: '#0f172a',
  textStrong: '#1e293b',
  textBody: '#334155',
  textSub: '#475569',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  textGhost: '#cbd5e1',

  // 선
  border: '#e2e8f0',

  // 상태
  danger: '#ef4444',
  dangerDark: '#b91c1c',
  dangerSoft: '#fef2f2',
  dangerFaint: '#fca5a5',
  dangerText: '#dc2626',
  success: '#059669',
  successSoft: '#ecfdf5',
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 20,
  round: 999,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
}

// 카드에 얹는 그림자. iOS(shadow*)와 안드로이드(elevation)를 함께 준다.
export const shadow = {
  card: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  soft: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  raised: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
}

// 여러 화면이 그대로 다시 쓰는 조각들.
export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, ...shadow.card },
  // 화면 제목 위에 붙는 작은 대문자 라벨
  eyebrow: { fontSize: 10, fontWeight: '700', color: colors.textFaint, letterSpacing: 2, textTransform: 'uppercase' },
  empty: { textAlign: 'center', color: colors.textFaint, fontSize: 14, paddingVertical: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  fill: { flex: 1 },
})
