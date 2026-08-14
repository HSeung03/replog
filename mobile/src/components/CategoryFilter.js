import { View, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import Chip from './Chip'
import { CATEGORY_KEYS } from '../constants/categories'

export const ALL = 'all'

/*
 * 카테고리 고르는 줄. 세 화면이 각자 ['all', ...CATEGORY_KEYS].map(...)을
 * 돌리고 있었다. 카테고리 이름은 locales의 categories.* 한 곳에서 온다
 * (이전에는 exercises.categories와 templates.categories로 같은 목록이
 * 두 벌 있었다).
 *
 * wrap=true면 가로 스크롤 대신 여러 줄로 접는다(종목 추가 시트).
 */
export default function CategoryFilter({
  value,
  onChange,
  size = 'md',
  includeAll = true,
  allLabel,
  wrap = false,
  style,
}) {
  const { t } = useTranslation()
  const keys = includeAll ? [ALL, ...CATEGORY_KEYS] : CATEGORY_KEYS

  const chips = keys.map((key) => (
    <Chip
      key={key}
      size={size}
      label={key === ALL && allLabel ? allLabel : t(`categories.${key}`)}
      active={value === key}
      onPress={() => onChange(key)}
    />
  ))

  if (wrap) return <View style={[styles.wrap, style]}>{chips}</View>

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={styles.scrollContent}
    >
      {chips}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  scrollContent: { gap: 8, paddingVertical: 4, alignItems: 'center' },
})
