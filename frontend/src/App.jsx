import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CircularProgress, Box } from '@mui/material'
import Layout from './components/Layout'

import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import CalendarPage from './pages/Calendar/CalendarPage'
import LogPage from './pages/Log/LogPage'
import ExercisesPage from './pages/Exercises/ExercisesPage'
import TemplatesPage from './pages/Templates/TemplatesPage'
import BodyPage from './pages/Body/BodyPage'
import ChallengePage from './pages/Challenge/ChallengePage'
import MorePage from './pages/More/MorePage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return user ? <Navigate to="/" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      <Route path="/" element={<PrivateRoute><Layout><CalendarPage /></Layout></PrivateRoute>} />
      <Route path="/log/:date" element={<PrivateRoute><Layout><LogPage /></Layout></PrivateRoute>} />
      <Route path="/exercises" element={<PrivateRoute><Layout><ExercisesPage /></Layout></PrivateRoute>} />
      <Route path="/templates" element={<PrivateRoute><Layout><TemplatesPage /></Layout></PrivateRoute>} />
      <Route path="/body" element={<PrivateRoute><Layout><BodyPage /></Layout></PrivateRoute>} />
      <Route path="/challenge" element={<PrivateRoute><Layout><ChallengePage /></Layout></PrivateRoute>} />
      <Route path="/more" element={<PrivateRoute><Layout><MorePage /></Layout></PrivateRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
