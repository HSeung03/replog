/*
 * 일지 화면이 세트 목록에서 뽑아내는 계산. 순수 함수라 화면 없이도 확인할 수 있다.
 */

// Brzycki 공식. 37회 이상은 식이 무너지므로(분모가 0 이하) 표시하지 않는다.
export const calc1RM = (weight, reps) => {
  if (reps <= 0 || reps >= 37) return null
  if (reps === 1) return weight
  return Math.round((weight * 36) / (37 - reps) * 10) / 10
}

/*
 * 세트를 종목별로 묶는다.
 *
 * 이름이 아니라 exercise_id로 묶는 것이 핵심이다. 기본 종목과 같은 이름
 * ("벤치프레스")으로 커스텀 종목을 만들 수 있어서, 이름을 키로 쓰면 서로 다른
 * 두 종목의 세트가 한 그룹으로 합쳐진다. 그러면 세트 번호가 1,2,1,2로 뒤섞이고
 * "+ 세트 추가"가 어느 종목에 붙을지가 정렬 순서에 좌우된다. 이름은 표시용이다.
 *
 *   resolveName(exerciseId, set) → 그룹 머리에 보일 이름
 */
export const groupSetsByExercise = (sets = [], resolveName) => {
  const byId = new Map()

  for (const set of sets) {
    if (!byId.has(set.exercise_id)) {
      byId.set(set.exercise_id, {
        exerciseId: set.exercise_id,
        name: resolveName(set.exercise_id, set),
        sets: [],
      })
    }
    byId.get(set.exercise_id).sets.push(set)
  }

  for (const group of byId.values()) {
    group.sets.sort((a, b) => a.set_number - b.set_number)
  }

  return [...byId.values()]
}

export const summarizeSets = (sets = []) => ({
  totalSets: sets.length,
  totalVolume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
})
