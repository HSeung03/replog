import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { translateExerciseName, translateCategory } from '../i18n/exerciseNames'

/*
 * 종목·카테고리 이름을 현재 언어로 옮긴다.
 *
 * 이전에는 화면마다 i18n 싱글턴을 따로 import해서 translateExerciseName(name,
 * i18n.language)를 부르고 있었다. 싱글턴을 읽는 코드는 언어가 바뀌어도 그 자체로는
 * 리렌더를 일으키지 않아서, 같은 화면 안에서도 t()를 쓰는 문구만 바뀌고 종목
 * 이름은 남아 있는 식의 어긋남이 생기기 쉬웠다(RF-02 회귀가 그 종류였다).
 *
 * useTranslation이 주는 i18n을 쓰면 언어 변경이 곧 리렌더다.
 */
export default function useExerciseLabel() {
  const { i18n } = useTranslation()
  const language = i18n.language

  const exerciseName = useCallback((name) => translateExerciseName(name, language), [language])
  const categoryName = useCallback((category) => translateCategory(category, language), [language])

  return useMemo(
    () => ({ language, exerciseName, categoryName }),
    [language, exerciseName, categoryName]
  )
}
