export const CATEGORY_KEYS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'cardio']

export const CATEGORY_VALUES = {
  chest: '가슴', back: '등', legs: '하체', shoulders: '어깨', arms: '팔', cardio: '유산소',
}

export const CATEGORY_LABELS = {
  all: '전체', ...Object.fromEntries(CATEGORY_KEYS.map((k) => [k, CATEGORY_VALUES[k]])),
}

export const BADGE_COLORS = {
  '가슴': '#dbeafe', '등': '#ede9fe', '하체': '#d1fae5', '어깨': '#fef3c7', '팔': '#ffe4e6', '유산소': '#cffafe',
}

export const BADGE_TEXT = {
  '가슴': '#2563eb', '등': '#7c3aed', '하체': '#059669', '어깨': '#d97706', '팔': '#e11d48', '유산소': '#0891b2',
}
