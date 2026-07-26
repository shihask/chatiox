import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/api/apiClient'
import { useAuth } from '@/features/auth/context/useAuth'
import { signupSchema, type SignupFormValues } from '@/features/auth/schemas/auth.schema'
import type { InvitePreviewDTO } from '@/features/administration/team-members/types/team-member.types'

const fieldLabelClass = 'font-label text-[11px] font-medium tracking-wider text-muted-foreground uppercase'

interface SignupFormProps {
  inviteToken?: string
  invitePreview?: InvitePreviewDTO
}

export function SignupForm({ inviteToken, invitePreview }: SignupFormProps) {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: invitePreview?.email ?? '', inviteToken },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await signup({ ...values, inviteToken })
      void navigate('/', { replace: true })
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
      {!invitePreview && (
        <div className="space-y-1.5">
          <Label htmlFor="companyName" className={fieldLabelClass}>
            Workspace name
          </Label>
          <Input
            id="companyName"
            autoComplete="organization"
            placeholder="e.g. Sunrise Dental Clinic"
            className="h-[42px]"
            {...register('companyName')}
          />
          {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email" className={fieldLabelClass}>
          Work email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@business.com"
          className="h-[42px]"
          readOnly={Boolean(invitePreview)}
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="h-[42px]"
          {...register('password')}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="mt-2 h-11 w-full text-[13.5px] font-bold" disabled={isSubmitting}>
        {invitePreview
          ? isSubmitting
            ? 'Joining...'
            : 'Join workspace'
          : isSubmitting
            ? 'Creating your workspace...'
            : 'Create Workspace'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have a workspace?{' '}
        <Link to="/login" className="font-semibold text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  )
}
