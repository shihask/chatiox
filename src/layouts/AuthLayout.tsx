import { Outlet } from 'react-router-dom'

function BrandHeader() {
  return (
    <div className="mb-10 flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h16v12H8l-4 4V4z" fill="white" />
        </svg>
      </div>
      <span className="text-lg font-extrabold tracking-tight text-foreground">CHATIOX</span>
      <span className="font-label ml-0.5 border-l pl-2.5 text-[10px] tracking-wider text-muted-foreground">
        WORKSPACE ACCESS
      </span>
    </div>
  )
}

function AuthShowcasePanel() {
  return (
    <div
      className="relative hidden flex-1 overflow-hidden lg:flex lg:items-center lg:justify-center"
      style={{
        background: 'oklch(0.16 0.01 260)',
        backgroundImage:
          'linear-gradient(oklch(1 0 0 / 0.05) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.05) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <span className="font-label absolute top-9 left-11 text-[11px] tracking-wider text-white/40">
        CHATIOX / OMNICHANNEL CRM
      </span>
      <div className="absolute top-8 right-11 h-9 w-9 rounded-full border-[1.5px] border-white/25" />
      <div className="absolute right-16 bottom-20 h-5 w-5 bg-warning" />

      <div className="max-w-sm px-8 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Every conversation and contact, in one place
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          WhatsApp, email, and SMS threads next to the lead they belong to -- no more switching
          tabs to remember who someone is.
        </p>
      </div>
    </div>
  )
}

export function AuthLayout() {
  return (
    <div className="flex min-h-svh w-full bg-background">
      <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:max-w-xl lg:px-20">
        <BrandHeader />
        <Outlet />
      </div>
      <AuthShowcasePanel />
    </div>
  )
}
