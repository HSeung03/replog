import { Box } from '@mui/material'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <Box sx={{ pb: 7 }}>
      {children}
      <BottomNav />
    </Box>
  )
}
