// 앱 전체가 쓰는 날짜 표현은 'YYYY-MM-DD' 문자열 하나뿐이다.
// (서버의 record_date 컬럼도 같은 형식이라 그대로 주고받는다)
//
// 여기서 toISOString()을 쓰면 안 된다. UTC로 변환되기 때문에 한국·일본
// (UTC+9)에서는 자정부터 오전 9시 사이에 "어제" 날짜가 나온다.
// 새벽 운동을 기록하면 전날에 저장되는 문제가 여기서 나왔다.

export const toDateStr = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const todayStr = () => toDateStr(new Date())
