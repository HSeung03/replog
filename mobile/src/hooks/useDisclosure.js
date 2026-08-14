import { useCallback, useState } from 'react'

/*
 * 시트 하나의 열림/닫힘. 기록 화면에만 이 useState가 네 개 있었다.
 * onOpen에 준비 작업(폼 초기화 등)을 넘길 수 있다.
 */
export default function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return { isOpen, open, close }
}
