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
          {
            path: '/tasks',
            element: (
              <ComingSoonPage
                moduleName="Tasks"
                features={['Follow-up reminders per contact', 'Due dates & assignees', 'Mark complete from the Contact timeline']}
              />
            ),
          },
          {
            path: '/notes',
            element: (
              <ComingSoonPage
                moduleName="Notes"
                features={['A searchable, workspace-wide notes list', 'Filter notes by contact or author']}
              />
            ),
          },
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
          {
            path: '/analytics',
            element: (
              <ComingSoonPage
                moduleName="Analytics"
                features={['Leads by source', 'Lead status distribution', 'Team performance reports']}
              />
            ),
          },
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
          {
            path: '/workspace',
            element: (
              <ComingSoonPage
                moduleName="Workspace"
                features={['Workspace profile & branding', 'Manage lead statuses & sources', 'General settings']}
              />
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
