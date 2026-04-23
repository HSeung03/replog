import './src/i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './src/contexts/AuthContext'
import AppNavigator from './src/navigation/AppNavigator'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </QueryClientProvider>
  )
}
