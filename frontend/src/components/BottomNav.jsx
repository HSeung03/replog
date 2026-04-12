import { useNavigate, useLocation } from 'react-router-dom'
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import ListIcon from '@mui/icons-material/List'
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

const today = new Date().toISOString().slice(0, 10)

const tabs = [
  { label: '캘린더', icon: <CalendarMonthIcon />, path: '/' },
  { label: '오늘', icon: <FitnessCenterIcon />, path: `/log/${today}` },
  { label: '종목', icon: <ListIcon />, path: '/exercises' },
  { label: '신체', icon: <MonitorWeightIcon />, path: '/body' },
  { label: '더보기', icon: <MoreHorizIcon />, path: '/more' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const current = tabs.findIndex((t) => t.path === location.pathname)

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }} elevation={3}>
      <BottomNavigation
        value={current === -1 ? false : current}
        onChange={(_, idx) => navigate(tabs[idx].path)}
      >
        {tabs.map((tab) => (
          <BottomNavigationAction
            key={tab.path}
            label={tab.label}
            icon={tab.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
