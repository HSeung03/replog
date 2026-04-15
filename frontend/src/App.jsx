import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'

import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import CalendarPage from './pages/Calendar/CalendarPage'
import LogPage from './pages/Log/LogPage'
import MorePage from './pages/More/MorePage'
import ExercisesPage from './pages/Exercises/ExercisesPage'
import TemplatesPage from './pages/Templates/TemplatesPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F2F4F7]">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-[#3730A3] rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F2F4F7]">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-[#3730A3] rounded-full animate-spin" />
    </div>
  )
  return user ? <Navigate to="/" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/" element={<PrivateRoute><Layout><CalendarPage /></Layout></PrivateRoute>} />
      <Route path="/log/:date" element={<PrivateRoute><Layout><LogPage /></Layout></PrivateRoute>} />
      <Route path="/more" element={<PrivateRoute><Layout><MorePage /></Layout></PrivateRoute>} />
      <Route path="/exercises" element={<PrivateRoute><Layout><ExercisesPage /></Layout></PrivateRoute>} />
      <Route path="/templates" element={<PrivateRoute><Layout><TemplatesPage /></Layout></PrivateRoute>} />
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
