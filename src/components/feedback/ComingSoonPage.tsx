import { PackageIcon } from 'lucide-react'

export function ComingSoonPage({ moduleName, features }: { moduleName: string; features?: string[] }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border bg-secondary">
        <PackageIcon className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-[17px] font-extrabold text-foreground">{moduleName} is on its way</h2>
        {features && features.length > 0 && (
          <p className="mt-1.5 text-[13px] text-muted-foreground">Here&apos;s what&apos;s coming in this module:</p>
        )}
      </div>
      {features && features.length > 0 && (
        <div className="flex w-full max-w-80 flex-col gap-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2.5 rounded-md border bg-card px-3.5 py-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-[13px] text-foreground/80">{feature}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
