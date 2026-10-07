import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { AuthLayout } from '../layouts/AuthLayout'
import { supabase } from '@/lib/supabase/client'
import { getFriendlyAuthErrorMessage } from '../utils/auth-errors'
import { useAuth } from '../context'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { session, refreshProfile } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)

  useEffect(() => {
    // Check if we have an active session or URL tokens
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        // If there's a current session or the AuthContext already has a session
        if (currentSession || session) {
          setHasValidSession(true)
        } else {
          // Check if URL has hash params with access_token or error
          const hash = window.location.hash
          if (hash.includes('access_token=') || hash.includes('type=recovery')) {
            setHasValidSession(true)
          } else if (hash.includes('error=')) {
            setServerError('The password reset link is invalid or has expired.')
          } else {
            // Give Supabase SDK a moment to process the hash if it just loaded
            setTimeout(async () => {
              const { data: { session: delayedSession } } = await supabase.auth.getSession()
              setHasValidSession(!!delayedSession)
              setIsCheckingSession(false)
            }, 600)
            return
          }
        }
      } catch (err) {
        console.error('Failed to verify recovery session:', err)
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [session])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null)
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (error) {
        setServerError(getFriendlyAuthErrorMessage(error))
        return
      }

      setIsSuccess(true)
      await refreshProfile()
    } catch (err) {
      setServerError(getFriendlyAuthErrorMessage(err))
    }
  }

  if (isCheckingSession) {
    return (
      <AuthLayout>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="py-12 text-center">
            <div className="w-8 h-8 mx-auto border-3 border-blue-700 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-xs text-slate-500">Verifying security token...</p>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Set New Password</CardTitle>
          <CardDescription>
            Choose a strong password for your portal account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4">
              <div
                role="status"
                className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-900">Password updated successfully</p>
                  <p>
                    Your new password has been saved. You can now access your organization portal.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                className="w-full mt-2"
                size="lg"
                onClick={() => navigate('/', { replace: true })}
              >
                Go to Dashboard
              </Button>
            </div>
          ) : !hasValidSession && serverError ? (
            <div className="space-y-4">
              <div
                role="alert"
                className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-rose-900">Link Expired or Invalid</p>
                  <p className="mt-0.5">{serverError}</p>
                </div>
              </div>

              <div className="pt-2 text-center space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/forgot-password')}
                >
                  Request New Reset Link
                </Button>
                <div>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 pt-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {serverError && (
                <div
                  role="alert"
                  className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
                  <span>{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div>
                  <Label htmlFor="password" required>
                    New Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="pr-10"
                      error={!!errors.password}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-rose-600" role="alert">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" required>
                    Confirm Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="pr-10"
                      error={!!errors.confirmPassword}
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-rose-600" role="alert">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  size="lg"
                  isLoading={isSubmitting}
                >
                  Update Password
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
