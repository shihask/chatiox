import { LoginForm } from '@/features/auth/components/LoginForm'

export function LoginPage() {
  return (
    <div>
      <h1 className="text-[27px] font-extrabold tracking-tight text-foreground">Welcome back</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">
        Sign in to keep every conversation and contact in one place.
      </p>
      <LoginForm />
    </div>
  )
}
