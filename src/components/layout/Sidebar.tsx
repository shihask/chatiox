import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navConfig, type NavLeaf } from '@/components/layout/navConfig'

const SIDEBAR_COLLAPSED_KEY = 'chatiox:sidebarCollapsed'

function getStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function NavLinkItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavLeaf
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group/nav-item flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-2.5 py-2 text-sm font-medium text-sidebar-foreground/90 transition-colors hover:bg-white/5',
          collapsed && 'justify-center px-0',
          isActive && 'border-warning bg-white/8 text-white',
        )
      }
    >
      <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {!collapsed && item.status === 'coming-soon' && (
        <span className="rounded border border-warning/40 px-1 py-0.5 font-label text-[9px] font-semibold text-warning">
          SOON
        </span>
      )}
    </NavLink>
  )
}

function SidebarNavContent({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  return (
    <>
      {navConfig.map((entry) => {
        if (entry.type === 'link') {
          return (
            <NavLinkItem key={entry.path} item={entry} collapsed={collapsed} onNavigate={onNavigate} />
          )
        }
        return (
          <div key={entry.label} className="mt-3 space-y-0.5">
            {!collapsed && (
              <p className="font-label px-2.5 pb-1.5 text-[10px] font-medium text-sidebar-foreground/40 uppercase">
                {entry.label}
              </p>
            )}
            {entry.children.map((child) => (
              <NavLinkItem key={child.path} item={child} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        )
      })}
    </>
  )
}

function BrandMark({ collapsed }: { collapsed?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-[58px] shrink-0 items-center gap-2.5 border-b border-white/8 px-4',
        collapsed && 'justify-center px-0',
      )}
    >
      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h16v12H8l-4 4V4z" fill="white" />
        </svg>
      </div>
      {!collapsed && (
        <span className="text-sm font-extrabold tracking-wide text-white">CHATIOX</span>
      )}
    </div>
  )
}

/** Desktop sidebar -- hidden below md, where the mobile drawer (MobileSidebarNav) takes over. */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(getStoredCollapsed)

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        /* localStorage unavailable -- collapse state just won't persist across reloads */
      }
      return next
    })
  }

  return (
    <nav
      className={cn(
        'hidden shrink-0 flex-col bg-sidebar transition-[width] duration-200 md:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <BrandMark collapsed={collapsed} />
      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        <SidebarNavContent collapsed={collapsed} />
      </div>
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex h-11 shrink-0 items-center justify-center border-t border-white/8 text-sidebar-foreground/60 transition-colors hover:bg-white/5 hover:text-white"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
      </button>
    </nav>
  )
}

/** Same nav content, rendered inside the mobile drawer's Sheet -- see AppShell.tsx. */
export function MobileSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col bg-sidebar">
      <BrandMark />
      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        <SidebarNavContent onNavigate={onNavigate} />
      </div>
    </nav>
  )
}
