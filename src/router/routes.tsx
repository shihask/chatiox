import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ContactsListPage } from '@/features/crm/contacts/pages/ContactsListPage'
import { ContactDetailPage } from '@/features/crm/contacts/pages/ContactDetailPage'
import { TasksListPage } from '@/features/crm/tasks/pages/TasksListPage'
import { NotesListPage } from '@/features/crm/notes/pages/NotesListPage'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { WorkspaceSettingsPage } from '@/features/administration/workspace/WorkspaceSettingsPage'
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
          { path: '/tasks', element: <TasksListPage /> },
          { path: '/notes', element: <NotesListPage /> },
          {
            path: '/inbox',
            element: (
              <ComingSoonPage
                moduleName="Inbox"
                features={['Unified WhatsApp, email & SMS threads', 'Reply without leaving the CRM', 'Conversation history tied to each contact']}
              />
            ),
          },
          {
            path: '/channels',
            element: (
              <ComingSoonPage
                moduleName="Channels"
                features={['Connect your WhatsApp number', 'Connect a sending email address', 'Manage channel-level settings']}
              />
            ),
          },
          {
            path: '/campaigns',
            element: (
              <ComingSoonPage
                moduleName="Campaigns"
                features={['WhatsApp & email broadcast campaigns', 'Audience segments from Contacts', 'Delivery & open analytics']}
              />
            ),
          },
          {
            path: '/templates',
            element: (
              <ComingSoonPage
                moduleName="Templates"
                features={['Reusable message templates', 'Per-channel variants', 'Approval status tracking']}
              />
            ),
          },
          {
            path: '/broadcast',
            element: (
              <ComingSoonPage
                moduleName="Broadcast"
                features={['Send-now campaigns to a segment', 'Same delivery tracking as Campaigns']}
              />
            ),
          },
          {
            path: '/automation',
            element: (
              <ComingSoonPage
                moduleName="Automation"
                features={['Trigger-based workflows', 'Auto-replies & follow-up sequences', 'Automation history per contact']}
              />
            ),
          },
          { path: '/analytics', element: <AnalyticsPage /> },
          {
            path: '/team',
            element: (
              <ComingSoonPage
                moduleName="Team"
                features={['Invite teammates', 'Role-based permissions', 'Manage workspace membership']}
              />
            ),
          },
          {
            path: '/billing',
            element: (
              <ComingSoonPage moduleName="Billing" features={['Subscription & plan management', 'Usage tracking', 'Invoices']} />
            ),
          },
          { path: '/workspace', element: <WorkspaceSettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
