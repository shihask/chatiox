import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/providers/AppProviders'
import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { router } from '@/router/routes'

function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AppProviders>
    </ErrorBoundary>
  )
}

export default App
