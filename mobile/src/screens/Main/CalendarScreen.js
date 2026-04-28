import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import useCalendar from '../../hooks/useCalendar'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const days = []
  for (let i = startDow; i > 0; i--) days.push({ date: new Date(year, month, 1 - i), current: false })
  for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), current: true })
  const remaining = days.length % 7 === 0 ? 0 : 7 - (days.length % 7)
  for (let i = 1; i <= remaining; i++) days.push({ date: new Date(year, month + 1, i), current: false })
  return days
}

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function CalendarScreen({ navigation }) {
  const { t } = useTranslation()
  const now = new Date()
  const [current, setCurrent] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const { workoutDates, sessionCount } = useCalendar(current.year, current.month)

  const days = buildCalendar(current.year, current.month)
  const todayStr = toDateStr(now)
  const DAYS = t('calendar.days', { returnObjects: true })
  const monthLabel = `${MONTHS[current.month]} ${current.year}`
  const activityText = sessionCount > 0 ? `이번 달 ${sessionCount}회 운동했어요` : t('calendar.noRecord')

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageLabel}>{t('calendar.label')}</Text>
          <Text style={styles.pageTitle}>{t('calendar.title')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.monthNav}>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.navBtn} onPress={() => setCurrent(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 })}>
                <Ionicons name="chevron-back" size={16} color="#475569" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navBtn, current.year === now.getFullYear() && current.month === now.getMonth() && styles.navBtnDisabled]}
                disabled={current.year === now.getFullYear() && current.month === now.getMonth()}
                onPress={() => setCurrent(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 })}
              >
                <Ionicons name="chevron-forward" size={16} color="#475569" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.daysHeader}>
            {DAYS.map((d) => <Text key={d} style={styles.dayLabel}>{d}</Text>)}
          </View>

          <View style={styles.grid}>
            {days.map((item, idx) => {
              const dateStr = toDateStr(item.date)
              const isToday = dateStr === todayStr
              const hasWorkout = workoutDates.has(dateStr)
              const isFuture = dateStr > todayStr
              const isCurrentMonth = item.current
              return (
                <TouchableOpacity
                  key={idx}
                  disabled={isFuture}
                  onPress={() => navigation.navigate('Log', { date: dateStr })}
                  style={styles.dayCell}
                >
                  <View style={[styles.dayNum, isToday && styles.today]}>
                    <Text style={[styles.dayText, isToday && styles.todayText, (!isCurrentMonth || isFuture) && styles.fadedText]}>
                      {item.date.getDate()}
                    </Text>
                  </View>
                  <View style={[styles.dot, hasWorkout ? styles.dotActive : styles.dotHidden]} />
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.zapIcon}>
            <Ionicons name="flash" size={20} color="#3730A3" />
          </View>
          <View>
            <Text style={styles.streakLabel}>{t('calendar.monthlyActivity')}</Text>
            <Text style={styles.streakText}>{activityText}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F4F7' },
  container: { padding: 16 },
  pageHeader: { marginBottom: 16 },
  pageLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  daysHeader: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 4, gap: 4 },
  dayNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  today: { backgroundColor: '#1E1B4B' },
  dayText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  todayText: { color: '#fff' },
  fadedText: { color: '#cbd5e1' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#3730A3' },
  dotHidden: { backgroundColor: 'transparent' },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fff', borderRadius: 20, padding: 16, marginTop: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  zapIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  streakLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase' },
  streakText: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 2 },
})
