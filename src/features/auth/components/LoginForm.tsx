import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/api/apiClient'
import { useAuth } from '@/features/auth/context/useAuth'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/auth.schema'

const fieldLabelClass = 'font-label text-[11px] font-medium tracking-wider text-muted-foreground uppercase'

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await login(values)
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'
      void navigate(from, { replace: true })
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
  })

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
      {serverError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email" className={fieldLabelClass}>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@business.com"
          className="h-[42px]"
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className={fieldLabelClass}>
          Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className="h-[42px]"
          {...register('password')}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="mt-2 h-11 w-full text-[13.5px] font-bold" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New to Chatiox?{' '}
        <Link to="/signup" className="font-semibold text-foreground underline underline-offset-4">
          Create a workspace
        </Link>
      </p>
    </form>
  )
}
