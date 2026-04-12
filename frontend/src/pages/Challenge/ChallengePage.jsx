import { useState, useEffect } from 'react'
import { Box, Typography, Paper, Chip, CircularProgress } from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import LockIcon from '@mui/icons-material/Lock'
import { getOneRm } from '../../api/oneRm'

const EXERCISE_LABELS = {
  '벤치프레스': '벤치프레스',
  '스쿼트': '스쿼트',
  '데드리프트': '데드리프트',
}

export default function ChallengePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOneRm()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box p={2}>
      <Typography variant="h6" fontWeight="bold" mb={1}>1RM 챌린지</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        최근 2주 내 운동 기록이 있어야 활성화됩니다.
      </Typography>

      <Box display="flex" flexDirection="column" gap={2}>
        {Object.entries(EXERCISE_LABELS).map(([key, label]) => {
          const info = data?.[key]
          const available = info?.available

          return (
            <Paper key={key} sx={{ p: 2.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography fontWeight="bold" variant="subtitle1">{label}</Typography>
                {available
                  ? <Chip icon={<EmojiEventsIcon />} label="활성" color="success" size="small" />
                  : <Chip icon={<LockIcon />} label="비활성" size="small" />
                }
              </Box>

              {available ? (
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {info.best_1rm} kg
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {info.best_set?.weight}kg × {info.best_set?.reps}회 기준 · {info.best_set?.date}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {info?.reason || '기록이 없습니다.'}
                </Typography>
              )}
            </Paper>
          )
        })}
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" mt={3} textAlign="center">
        Brzycki 공식: weight × 36 / (37 - reps)
      </Typography>
    </Box>
  )
}
