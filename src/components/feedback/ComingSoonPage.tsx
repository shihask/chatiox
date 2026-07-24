import { Construction } from 'lucide-react'

export function ComingSoonPage({ moduleName }: { moduleName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-24 text-center">
      <Construction className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{moduleName} is coming soon</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        This module isn&apos;t built yet. Check back in a future release.
      </p>
    </div>
  )
}
