// 세트 입력값 검증.
//
// keyboardType="numeric"은 iOS에서 소수점·기호 입력을 완전히 막지 못하고
// 안드로이드는 자판에 따라 더 열려 있다. 빈 문자열만 걸러내고 Number()를
// 그대로 보내면 "12.5.5" 같은 입력이 NaN → null로 전송되어 422가 돌아오는데,
// 그 실패가 화면에 뜨지 않아 사용자는 저장된 줄 안다.
//
// 상한은 서버 컬럼 범위와 같다(BE-03). 넘으면 MySQL이 22003으로 거절한다.
export const MAX_WEIGHT = 999.99 // decimal(5, 2)
export const MAX_REPS = 65535 // unsignedSmallInteger

// 반환값의 error는 i18n 키다. 화면이 t()로 번역해서 보여준다.
export const parseSetInput = ({ weight, reps }) => {
  const weightText = String(weight ?? '').trim()
  const repsText = String(reps ?? '').trim()

  // Number('')는 0이다. 빈 칸을 0으로 읽어 통과시키면 안 된다.
  if (!weightText || !repsText) {
    return { ok: false, error: 'log.errors.notANumber' }
  }

  const w = Number(weightText)
  const r = Number(repsText)

  if (!Number.isFinite(w) || !Number.isFinite(r)) {
    return { ok: false, error: 'log.errors.notANumber' }
  }

  if (w < 0 || w > MAX_WEIGHT) {
    return { ok: false, error: 'log.errors.weightRange' }
  }

  if (!Number.isInteger(r) || r < 1 || r > MAX_REPS) {
    return { ok: false, error: 'log.errors.repsRange' }
  }

  // 서버 컬럼이 소수점 두 자리까지만 담는다. 그 아래는 저장 시점에 잘리므로
  // 화면에 보이는 값과 저장된 값이 어긋나지 않도록 여기서 맞춰 보낸다.
  return { ok: true, value: { weight: Math.round(w * 100) / 100, reps: r } }
}
