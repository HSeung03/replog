import { useNavigate } from 'react-router-dom'
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider, Paper } from '@mui/material'
import ViewListIcon from '@mui/icons-material/ViewList'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../api/auth'

export default function MorePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const handleLogout = async () => {
    await logout()
    setUser(null)
    navigate('/login')
  }

  return (
    <Box p={2}>
      <Typography variant="h6" fontWeight="bold" mb={2}>더보기</Typography>

      <Typography variant="body2" color="text.secondary" mb={2}>
        {user?.name} · {user?.email}
      </Typography>

      <Paper>
        <List disablePadding>
          <ListItemButton onClick={() => navigate('/templates')}>
            <ListItemIcon><ViewListIcon /></ListItemIcon>
            <ListItemText primary="템플릿 관리" secondary="자주 쓰는 루틴 저장" />
          </ListItemButton>
          <Divider />
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
            <ListItemText primary="로그아웃" primaryTypographyProps={{ color: 'error' }} />
          </ListItemButton>
        </List>
      </Paper>
    </Box>
  )
}
