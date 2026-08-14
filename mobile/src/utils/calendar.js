/*
 * 한 달 달력에 그릴 칸들. 월요일 시작이고, 앞뒤로 이웃 달의 날짜를 채워
 * 항상 7의 배수가 되게 만든다(current: false가 이웃 달 칸이다).
 */
export const buildCalendarDays = (year, month) => {
  const lastDay = new Date(year, month + 1, 0)
  // getDay()는 일요일이 0이다. 월요일을 0으로 옮긴다.
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7
  const days = []

  for (let i = startDow; i > 0; i--) days.push({ date: new Date(year, month, 1 - i), current: false })
  for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), current: true })

  const remaining = days.length % 7 === 0 ? 0 : 7 - (days.length % 7)
  for (let i = 1; i <= remaining; i++) days.push({ date: new Date(year, month + 1, i), current: false })

  return days
}

// 이전/다음 달로 넘어갈 때 연도까지 함께 넘긴다.
export const shiftMonth = ({ year, month }, delta) => {
  const next = month + delta
  if (next < 0) return { year: year - 1, month: 11 }
  if (next > 11) return { year: year + 1, month: 0 }
  return { year, month: next }
}
