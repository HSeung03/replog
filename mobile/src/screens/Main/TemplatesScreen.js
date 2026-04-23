import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import BottomSheet, { sheetStyles } from '../../components/BottomSheet'
import useTemplates from '../../hooks/useTemplates'
import useExercises from '../../hooks/useExercises'
import { CATEGORY_KEYS, CATEGORY_VALUES } from '../../constants/categories'

export default function TemplatesScreen({ navigation }) {
  const { t } = useTranslation()
  const { templates, create, update, remove } = useTemplates()
  const { exercises } = useExercises()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [name, setName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')

  const openCreate = () => { setEditingTemplate(null); setName(''); setSelectedExercises([]); setSelectedCategory(''); setModalOpen(true) }
  const openEdit = (tmpl) => { setEditingTemplate(tmpl); setName(tmpl.name); setSelectedExercises(tmpl.exercises || []); setSelectedCategory(''); setModalOpen(true) }
  const handleClose = () => { setModalOpen(false); setEditingTemplate(null); setName(''); setSelectedExercises([]); setSelectedCategory('') }

  const handleSave = async () => {
    const data = { name, exercises: selectedExercises.map((ex) => ({ exercise_id: ex.id })) }
    if (editingTemplate) await update(editingTemplate.id, data)
    else await create(data)
    handleClose()
  }

  const filteredExercises = exercises.filter((ex) => !selectedCategory || ex.category === CATEGORY_VALUES[selectedCategory])

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader label={t('templates.subtitle')} title={t('templates.title')} onBack={() => navigation.goBack()} onRight={openCreate} />

      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('templates.noTemplates')}</Text>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => openEdit(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSub} numberOfLines={1}>{item.exercises?.map((ex) => ex.name).join(' · ')}</Text>
            </View>
            <TouchableOpacity onPress={() => remove(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={14} color="#cbd5e1" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <BottomSheet visible={modalOpen} onClose={handleClose}>
        <Text style={sheetStyles.title}>{editingTemplate ? t('templates.editTitle') : t('templates.addTitle')}</Text>
        <TextInput style={sheetStyles.input} placeholder={t('templates.namePlaceholder')} placeholderTextColor="#94a3b8" value={name} onChangeText={setName} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity onPress={() => setSelectedCategory('')} style={[styles.catBtn, !selectedCategory && styles.catBtnActive]}>
            <Text style={[styles.catBtnText, !selectedCategory && styles.catBtnTextActive]}>{t('templates.categoryPlaceholder')}</Text>
          </TouchableOpacity>
          {CATEGORY_KEYS.map((key) => (
            <TouchableOpacity key={key} onPress={() => setSelectedCategory(key)} style={[styles.catBtn, selectedCategory === key && styles.catBtnActive]}>
              <Text style={[styles.catBtnText, selectedCategory === key && styles.catBtnTextActive]}>{t(`templates.categories.${key}`)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={{ maxHeight: 160, marginBottom: 12 }}>
          {filteredExercises.map((ex) => {
            const isSelected = selectedExercises.find((e) => e.id === ex.id)
            return (
              <TouchableOpacity
                key={ex.id}
                style={[styles.exItem, isSelected && styles.exItemSelected]}
                onPress={() => setSelectedExercises(isSelected ? selectedExercises.filter((e) => e.id !== ex.id) : [...selectedExercises, ex])}
              >
                <Text style={[styles.exItemText, isSelected && styles.exItemTextSelected]}>{ex.name}</Text>
                {isSelected && <Ionicons name="close" size={12} color="#3730A3" />}
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {selectedExercises.length > 0 && (
          <View style={styles.selectedRow}>
            {selectedExercises.map((ex) => (
              <TouchableOpacity key={ex.id} style={styles.selectedChip} onPress={() => setSelectedExercises(selectedExercises.filter((e) => e.id !== ex.id))}>
                <Text style={styles.selectedChipText}>{ex.name}</Text>
                <Ionicons name="close" size={10} color="#3730A3" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={sheetStyles.btnRow}>
          <TouchableOpacity style={sheetStyles.cancelBtn} onPress={handleClose}>
            <Text style={sheetStyles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[sheetStyles.confirmBtn, !name && sheetStyles.confirmBtnDisabled]} onPress={handleSave} disabled={!name}>
            <Text style={sheetStyles.confirmText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F7' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingVertical: 40 },
  separator: { height: 1, backgroundColor: '#f8fafc' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  itemSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  deleteBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
  catBtnActive: { backgroundColor: '#1E1B4B' },
  catBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  catBtnTextActive: { color: '#fff' },
  exItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4, backgroundColor: '#f8fafc' },
  exItemSelected: { backgroundColor: '#eef2ff' },
  exItemText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  exItemTextSelected: { color: '#3730A3' },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  selectedChipText: { fontSize: 12, fontWeight: '700', color: '#3730A3' },
})
