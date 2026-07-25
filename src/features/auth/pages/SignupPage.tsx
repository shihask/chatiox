import { SignupForm } from '@/features/auth/components/SignupForm'

export function SignupPage() {
  return (
    <div>
      <h1 className="text-[27px] font-extrabold tracking-tight text-foreground">
        Create your workspace
      </h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">
        Set up Chatiox for your team in under a minute.
      </p>
      <SignupForm />
    </div>
  )
}
