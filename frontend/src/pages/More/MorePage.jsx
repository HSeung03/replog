import { useNavigate } from 'react-router-dom'
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider, Paper, Avatar } from '@mui/material'
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

      {/* 프로필 카드 */}
      <Paper sx={{ p: 2.5, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            width: 52,
            height: 52,
            bgcolor: 'primary.main',
            fontSize: '1.2rem',
            fontWeight: 700,
          }}
        >
          {user?.name?.[0]?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography fontWeight="bold" fontSize="1rem">{user?.name}</Typography>
          <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
        </Box>
      </Paper>

      <Paper>
        <List disablePadding>
          <ListItemButton onClick={() => navigate('/templates')} sx={{ py: 1.5 }}>
            <ListItemIcon><ViewListIcon color="primary" /></ListItemIcon>
            <ListItemText primary="템플릿 관리" secondary="자주 쓰는 루틴 저장" />
          </ListItemButton>
          <Divider />
          <ListItemButton onClick={handleLogout} sx={{ py: 1.5 }}>
            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
            <ListItemText primary="로그아웃" primaryTypographyProps={{ color: 'error' }} />
          </ListItemButton>
        </List>
      </Paper>
    </Box>
  )
}
