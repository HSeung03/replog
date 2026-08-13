/*
 * 카테고리 정의는 여기 한 곳에서만 손댄다.
 *
 * 이전에는 키 목록, 서버 값 매핑, 배지 색 두 벌이 따로 선언돼 있었고
 * 배지 색은 한국어 문자열('가슴')을 키로 썼다. 카테고리를 하나 늘리려면
 * 여러 군데를 고쳐야 했고, 한 곳만 놓치면 배지가 회색으로 빠졌다.
 *
 * 서버는 아직 한국어 값을 저장한다(exercises.category). 그 값을 키로
 * 되돌리는 건 서버 데이터 마이그레이션이 필요한 별개 작업이라, 여기서는
 * value를 매핑으로만 두고 나머지를 전부 여기서 파생시킨다.
 * 백엔드의 허용 목록은 backend/config/exercises.php에 있다.
 */
export const CATEGORIES = [
  { key: 'chest',     value: '가슴',   badgeBg: '#dbeafe', badgeText: '#2563eb' },
  { key: 'back',      value: '등',     badgeBg: '#ede9fe', badgeText: '#7c3aed' },
  { key: 'legs',      value: '하체',   badgeBg: '#d1fae5', badgeText: '#059669' },
  { key: 'shoulders', value: '어깨',   badgeBg: '#fef3c7', badgeText: '#d97706' },
  { key: 'arms',      value: '팔',     badgeBg: '#ffe4e6', badgeText: '#e11d48' },
  { key: 'cardio',    value: '유산소', badgeBg: '#cffafe', badgeText: '#0891b2' },
]

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key)

// 화면의 카테고리 키 → 서버가 저장하는 값
export const CATEGORY_VALUES = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.value]))

// 서버 값 → 배지 색. 목록에 없는 값이 와도 화면이 깨지지 않도록 호출부에서 fallback을 둔다.
export const BADGE_COLORS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.badgeBg]))
export const BADGE_TEXT = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.badgeText]))
