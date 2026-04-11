import { Typography, Box } from '@mui/material'
import { useParams } from 'react-router-dom'

export default function LogPage() {
  const { date } = useParams()
  return (
    <Box p={2}>
      <Typography variant="h5">{date} 운동 기록</Typography>
    </Box>
  )
}
