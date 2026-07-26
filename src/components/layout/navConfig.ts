import {
  LayoutDashboard,
  Users,
  ListChecks,
  StickyNote,
  Inbox,
  Radio,
  Megaphone,
  FileText,
  Send,
  Workflow,
  BarChart3,
  UsersRound,
  CreditCard,
  Building2,
  type LucideIcon,
} from 'lucide-react'

export interface NavLeaf {
  type: 'link'
  label: string
  path: string
  status: 'real' | 'coming-soon'
  icon: LucideIcon
}

export interface NavGroup {
  type: 'group'
  label: string
  children: NavLeaf[]
}

export type NavEntry = NavLeaf | NavGroup

// Sidebar nesting rule (see docs/architecture.md §8): a domain renders as a collapsible group
// when it has >=2 visible children today; otherwise a bare link. Promoting a flat item to a group
// later (e.g. Team) is a one-entry edit here, not a Sidebar redesign.
export const navConfig: NavEntry[] = [
  { type: 'link', label: 'Dashboard', path: '/', status: 'real', icon: LayoutDashboard },
  {
    type: 'group',
    label: 'CRM',
    children: [
      { type: 'link', label: 'Contacts', path: '/contacts', status: 'real', icon: Users },
      { type: 'link', label: 'Tasks', path: '/tasks', status: 'real', icon: ListChecks },
      { type: 'link', label: 'Notes', path: '/notes', status: 'real', icon: StickyNote },
    ],
  },
  {
    type: 'group',
    label: 'Communication',
    children: [
      { type: 'link', label: 'Inbox', path: '/inbox', status: 'coming-soon', icon: Inbox },
      { type: 'link', label: 'Channels', path: '/channels', status: 'coming-soon', icon: Radio },
    ],
  },
  {
    type: 'group',
    label: 'Marketing',
    children: [
      { type: 'link', label: 'Campaigns', path: '/campaigns', status: 'coming-soon', icon: Megaphone },
      { type: 'link', label: 'Templates', path: '/templates', status: 'coming-soon', icon: FileText },
      { type: 'link', label: 'Broadcast', path: '/broadcast', status: 'coming-soon', icon: Send },
    ],
  },
  { type: 'link', label: 'Automation', path: '/automation', status: 'coming-soon', icon: Workflow },
  { type: 'link', label: 'Analytics', path: '/analytics', status: 'real', icon: BarChart3 },
  { type: 'link', label: 'Team', path: '/team', status: 'coming-soon', icon: UsersRound },
  { type: 'link', label: 'Billing', path: '/billing', status: 'coming-soon', icon: CreditCard },
  { type: 'link', label: 'Workspace', path: '/workspace', status: 'real', icon: Building2 },
]
