import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ContactsListPage } from '@/features/crm/contacts/pages/ContactsListPage'
import { ContactDetailPage } from '@/features/crm/contacts/pages/ContactDetailPage'
import { ComingSoonPage } from '@/components/feedback/ComingSoonPage'

// Flat route list regardless of src/features/ nesting or Sidebar grouping (see navConfig.ts) --
// nav visuals, feature-folder organization, and URL structure are independent concerns.
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/contacts', element: <ContactsListPage /> },
          { path: '/contacts/:id', element: <ContactDetailPage /> },
          { path: '/tasks', element: <ComingSoonPage moduleName="Tasks" /> },
          { path: '/notes', element: <ComingSoonPage moduleName="Notes" /> },
          { path: '/inbox', element: <ComingSoonPage moduleName="Inbox" /> },
          { path: '/channels', element: <ComingSoonPage moduleName="Channels" /> },
          { path: '/campaigns', element: <ComingSoonPage moduleName="Campaigns" /> },
          { path: '/templates', element: <ComingSoonPage moduleName="Templates" /> },
          { path: '/broadcast', element: <ComingSoonPage moduleName="Broadcast" /> },
          { path: '/automation', element: <ComingSoonPage moduleName="Automation" /> },
          { path: '/analytics', element: <ComingSoonPage moduleName="Analytics" /> },
          { path: '/team', element: <ComingSoonPage moduleName="Team" /> },
          { path: '/billing', element: <ComingSoonPage moduleName="Billing" /> },
          { path: '/workspace', element: <ComingSoonPage moduleName="Workspace" /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
