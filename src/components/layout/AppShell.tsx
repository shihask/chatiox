import { useState, type ReactNode } from 'react'
import { MobileSidebarNav, Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { CreateContactDialogProvider } from '@/features/crm/contacts/context/CreateContactDialogProvider'

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  return (
    <CreateContactDialogProvider>
      <div className="flex h-svh">
        <Sidebar />
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <MobileSidebarNav onNavigate={() => { setMobileNavOpen(false); }} />
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar
            onMenuClick={() => { setMobileNavOpen(true); }}
            onSearchClick={() => { setPaletteOpen(true); }}
          />
          <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">{children}</main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </CreateContactDialogProvider>
  )
}
