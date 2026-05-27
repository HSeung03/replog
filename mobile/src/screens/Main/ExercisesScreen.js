import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import BottomSheet, { sheetStyles } from '../../components/BottomSheet'
import useExercises from '../../hooks/useExercises'
import { CATEGORY_KEYS, CATEGORY_VALUES, BADGE_COLORS, BADGE_TEXT } from '../../constants/categories'
import i18n from '../../i18n'
import { translateExerciseName, translateCategory } from '../../i18n/exerciseNames'

export default function ExercisesScreen({ navigation }) {
  const { t } = useTranslation()
  const { exercises, create, remove } = useExercises()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category: '가슴' })

  const handleCreate = async () => {
    if (!form.name) return
    await create(form)
    setModalOpen(false)
    setForm({ name: '', category: '가슴' })
  }

  const filtered = selectedCategory === 'all' ? exercises : exercises.filter((ex) => ex.category === CATEGORY_VALUES[selectedCategory])

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader label={t('exercises.subtitle')} title={t('exercises.title')} onBack={() => navigation.goBack()} onRight={() => setModalOpen(true)} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {['all', ...CATEGORY_KEYS].map((key) => (
          <TouchableOpacity key={key} onPress={() => setSelectedCategory(key)} style={[styles.filterBtn, selectedCategory === key && styles.filterBtnActive]}>
            <Text style={[styles.filterText, selectedCategory === key && styles.filterTextActive]}>{t(`exercises.categories.${key}`)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('exercises.noExercises')}</Text>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{translateExerciseName(item.name, i18n.language)}</Text>
              {!!item.is_default && <Text style={styles.defaultBadge}>DEFAULT</Text>}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.catBadge, { backgroundColor: BADGE_COLORS[item.category] ?? '#f1f5f9' }]}>
                <Text style={[styles.catBadgeText, { color: BADGE_TEXT[item.category] ?? '#64748b' }]}>{translateCategory(item.category, i18n.language)}</Text>
              </View>
              {!item.is_default && (
                <TouchableOpacity onPress={() => remove(item.id)}>
                  <Ionicons name="trash-outline" size={14} color="#cbd5e1" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      <BottomSheet visible={modalOpen} onClose={() => setModalOpen(false)}>
        <Text style={sheetStyles.title}>{t('exercises.addTitle')}</Text>
        <TextInput style={sheetStyles.input} placeholder={t('exercises.namePlaceholder')} placeholderTextColor="#94a3b8" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <View style={styles.catRow}>
          {CATEGORY_KEYS.map((key) => (
            <TouchableOpacity key={key} onPress={() => setForm({ ...form, category: CATEGORY_VALUES[key] })} style={[styles.catBtn, form.category === CATEGORY_VALUES[key] && styles.catBtnActive]}>
              <Text style={[styles.catBtnText, form.category === CATEGORY_VALUES[key] && styles.catBtnTextActive]}>{t(`exercises.categories.${key}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={sheetStyles.btnRow}>
          <TouchableOpacity style={sheetStyles.cancelBtn} onPress={() => setModalOpen(false)}>
            <Text style={sheetStyles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[sheetStyles.confirmBtn, !form.name && sheetStyles.confirmBtnDisabled]} onPress={handleCreate} disabled={!form.name}>
            <Text style={sheetStyles.confirmText}>{t('common.add')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F7' },
  filterScroll: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 44 },
  filterContent: { gap: 8, paddingVertical: 4, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 16, height: 36, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', minWidth: 52, alignItems: 'center', justifyContent: 'center' },
  filterBtnActive: { backgroundColor: '#1E1B4B', borderColor: '#1E1B4B' },
  filterText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingVertical: 40 },
  separator: { height: 1, backgroundColor: '#f8fafc', marginHorizontal: 4 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14, marginBottom: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  defaultBadge: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginTop: 2, letterSpacing: 1 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
  catBtnActive: { backgroundColor: '#1E1B4B' },
  catBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  catBtnTextActive: { color: '#fff' },
})
