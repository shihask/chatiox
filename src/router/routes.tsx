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
import { TeamPage } from '@/features/administration/team-members/TeamPage'
import { ChannelsPage } from '@/features/communication/channels/ChannelsPage'
import { InboxPage } from '@/features/communication/inbox/InboxPage'
import { TemplatesPage } from '@/features/marketing/templates/TemplatesPage'
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
          { path: '/inbox', element: <InboxPage /> },
          { path: '/inbox/:conversationId', element: <InboxPage /> },
          { path: '/channels', element: <ChannelsPage /> },
          {
            path: '/campaigns',
            element: (
              <ComingSoonPage
                moduleName="Campaigns"
                features={['WhatsApp & email broadcast campaigns', 'Audience segments from Contacts', 'Delivery & open analytics']}
              />
            ),
          },
          { path: '/templates', element: <TemplatesPage /> },
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
          { path: '/team', element: <TeamPage /> },
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
