import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { navConfig, type NavLeaf } from '@/components/layout/navConfig'

function NavLinkItem({ item, onNavigate }: { item: NavLeaf; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {item.label}
    </NavLink>
  )
}

function SidebarNavContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="px-3 py-2 text-lg font-semibold text-sidebar-foreground">Chatiox</div>
      {navConfig.map((entry) => {
        if (entry.type === 'link') {
          return <NavLinkItem key={entry.path} item={entry} onNavigate={onNavigate} />
        }
        return (
          <div key={entry.label} className="mt-2 space-y-1">
            <p className="px-3 text-xs font-semibold tracking-wide text-sidebar-foreground/50 uppercase">
              {entry.label}
            </p>
            {entry.children.map((child) => (
              <NavLinkItem key={child.path} item={child} onNavigate={onNavigate} />
            ))}
          </div>
        )
      })}
    </>
  )
}

/** Desktop sidebar -- hidden below md, where the mobile drawer (MobileSidebarNav) takes over. */
export function Sidebar() {
  return (
    <nav className="hidden h-full w-60 shrink-0 flex-col gap-1 border-r bg-sidebar p-3 md:flex">
      <SidebarNavContent />
    </nav>
  )
}

/** Same nav content, rendered inside the mobile drawer's Sheet -- see AppShell.tsx. */
export function MobileSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col gap-1 bg-sidebar p-3">
      <SidebarNavContent onNavigate={onNavigate} />
    </nav>
  )
}
