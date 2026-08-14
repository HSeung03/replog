/*
 * 쿼리 키는 여기 한 곳에서만 만든다. 문자열을 화면마다 직접 적으면
 * 한쪽은 ['exercises'], 다른 쪽은 ['exercise'] 같은 오타가 조용히 캐시를
 * 갈라놓는다(무효화가 안 먹고 화면이 안 갱신된다).
 */
export const queryKeys = {
  exercises: ['exercises'],
  templates: ['templates'],

  // 달력은 달 단위로 캐시한다. 접두사 ['calendar']로 한 번에 무효화한다.
  calendarAll: ['calendar'],
  calendar: (year, month) => ['calendar', year, month],

  // 화면이 그리는 일지. 항상 로컬 DB에서 온다.
  log: (date) => ['log', date],

  // 서버 동기화. log 키의 하위로 두면 일지를 무효화할 때마다 네트워크를
  // 다시 타므로 일부러 다른 뿌리에 둔다.
  logSync: (date) => ['log-sync', date],
}
