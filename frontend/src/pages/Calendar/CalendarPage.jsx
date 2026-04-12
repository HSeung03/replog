import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, CircularProgress } from '@mui/material'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { getCalendar } from '../../api/workoutLogs'
import './calendar.css'

export default function CalendarPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchEvents = async (year, month) => {
    setLoading(true)
    try {
      const res = await getCalendar(year, month)
      const dates = res.data
      setEvents(dates.map((date) => ({
        title: '',
        date,
        display: 'list-item',
      })))
    } catch {
      // 기록 없으면 빈 캘린더
    } finally {
      setLoading(false)
    }
  }

  const handleDatesSet = (info) => {
    const mid = new Date((info.start.getTime() + info.end.getTime()) / 2)
    fetchEvents(mid.getFullYear(), mid.getMonth() + 1)
  }

  const handleDateClick = (info) => {
    navigate(`/log/${info.dateStr}`)
  }

  return (
    <Box p={2}>
      <Typography variant="h6" fontWeight="bold" mb={2}>Replog</Typography>
      {loading && (
        <Box display="flex" justifyContent="center" mb={1}>
          <CircularProgress size={20} />
        </Box>
      )}
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ko"
        headerToolbar={{
          left: 'prev',
          center: 'title',
          right: 'next',
        }}
        height="auto"
        events={events}
        dateClick={handleDateClick}
        datesSet={handleDatesSet}
      />
    </Box>
  )
}
