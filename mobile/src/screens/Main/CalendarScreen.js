import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import useCalendar from '../../hooks/useCalendar'
import { toDateStr } from '../../utils/date'
import { buildCalendarDays, shiftMonth } from '../../utils/calendar'
import Screen from '../../components/Screen'
import PageHeader from '../../components/PageHeader'
import { colors, common, radius, shadow } from '../../theme'

export default function CalendarScreen({ navigation }) {
  const { t } = useTranslation()
  const now = new Date()
  const [current, setCurrent] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const { workoutDates, sessionCount } = useCalendar(current.year, current.month)

  const days = buildCalendarDays(current.year, current.month)
  const todayStr = toDateStr(now)
  const DAYS = t('calendar.days', { returnObjects: true })
  const MONTHS = t('calendar.months', { returnObjects: true })
  const isThisMonth = current.year === now.getFullYear() && current.month === now.getMonth()
  const activityText = sessionCount > 0
    ? t('calendar.monthCount', { count: sessionCount })
    : t('calendar.noRecord')

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <PageHeader label={t('calendar.label')} title={t('calendar.title')} />

        <View style={common.card}>
          <View style={styles.monthNav}>
            <Text style={styles.monthTitle}>{`${MONTHS[current.month]} ${current.year}`}</Text>
            <View style={styles.navBtns}>
              <TouchableOpacity style={styles.navBtn} onPress={() => setCurrent((c) => shiftMonth(c, -1))}>
                <Ionicons name="chevron-back" size={16} color={colors.textSub} />
              </TouchableOpacity>
              {/* 미래의 달은 볼 것이 없다 */}
              <TouchableOpacity
                style={[styles.navBtn, isThisMonth && styles.navBtnDisabled]}
                disabled={isThisMonth}
                onPress={() => setCurrent((c) => shiftMonth(c, 1))}
              >
                <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.daysHeader}>
            {DAYS.map((d) => <Text key={d} style={styles.dayLabel}>{d}</Text>)}
          </View>

          <View style={styles.grid}>
            {days.map(({ date, current: isCurrentMonth }) => {
              const dateStr = toDateStr(date)
              const isToday = dateStr === todayStr
              const isFuture = dateStr > todayStr
              return (
                <TouchableOpacity
                  key={dateStr}
                  disabled={isFuture}
                  // 탭('Log')이 아니라 스택 화면으로 보낸다. 탭으로 보내면
                  // 그 date가 탭 라우트의 params로 눌러앉아, 이후 하단 "기록"
                  // 탭을 눌러도 계속 그 날짜가 열린다(앱 재시작 전까지).
                  onPress={() => navigation.navigate('LogDetail', { date: dateStr })}
                  style={styles.dayCell}
                >
                  <View style={[styles.dayNum, isToday && styles.today]}>
                    <Text style={[
                      styles.dayText,
                      isToday && styles.todayText,
                      (!isCurrentMonth || isFuture) && styles.fadedText,
                    ]}>
                      {date.getDate()}
                    </Text>
                  </View>
                  <View style={[styles.dot, workoutDates.has(dateStr) && styles.dotActive]} />
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.zapIcon}>
            <Ionicons name="flash" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={common.eyebrow}>{t('calendar.monthlyActivity')}</Text>
            <Text style={styles.streakText}>{activityText}</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  navBtns: { flexDirection: 'row', gap: 8 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  daysHeader: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: colors.textFaint },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 4, gap: 4 },
  dayNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  today: { backgroundColor: colors.primaryDark },
  dayText: { fontSize: 14, fontWeight: '600', color: colors.textStrong },
  todayText: { color: '#fff' },
  fadedText: { color: colors.textGhost },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  dotActive: { backgroundColor: colors.primary },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    marginTop: 12,
    ...shadow.card,
  },
  zapIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  streakText: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
})
