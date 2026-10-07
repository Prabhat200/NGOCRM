import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { AuthLayout } from '../layouts/AuthLayout'
import { supabase } from '@/lib/supabase/client'
import { getFriendlyAuthErrorMessage } from '../utils/auth-errors'
import { useAuth } from '../context'

const acceptInviteSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>

export function AcceptInvitePage() {
  const navigate = useNavigate()
  const { session, profile, member, refreshProfile } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(true)
  const [hasValidInvite, setHasValidInvite] = useState(false)

  useEffect(() => {
    const verifyInvite = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()

        if (currentSession || session) {
          setHasValidInvite(true)
        } else {
          // Check for tokens in hash
          const hash = window.location.hash
          if (hash.includes('access_token=') || hash.includes('type=invite')) {
            setHasValidInvite(true)
          } else if (hash.includes('error=')) {
            setServerError('This invitation link is no longer valid or has expired.')
          } else {
            // Short grace period for Supabase auth listener to exchange hash
            setTimeout(async () => {
              const { data: { session: delayedSession } } = await supabase.auth.getSession()
              setHasValidInvite(!!delayedSession)
              setIsVerifying(false)
            }, 700)
            return
          }
        }
      } catch (err) {
        console.error('Failed to verify invitation session:', err)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyInvite()
  }, [session])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: AcceptInviteFormValues) => {
    setServerError(null)
    try {
      // 1. Set account password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (updateError) {
        setServerError(getFriendlyAuthErrorMessage(updateError))
        return
      }

      // 2. Activate profile atomically via RPC
      const { error: rpcError } = await supabase.rpc('activate_my_invited_profile')

      if (rpcError) {
        console.error('Failed to activate profile:', rpcError)
        // If RPC failed but user password was updated, check if already active
        setServerError(getFriendlyAuthErrorMessage(rpcError))
        return
      }

      // 3. Refresh in-memory auth state
      await refreshProfile()
      setIsSuccess(true)
    } catch (err) {
      setServerError(getFriendlyAuthErrorMessage(err))
    }
  }

  // Display user name: linked member full name -> profile display name -> email
  const recipientName =
    member?.full_name ||
    profile?.display_name ||
    session?.user?.email ||
    'Team Member'

  if (isVerifying) {
    return (
      <AuthLayout>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="py-12 text-center">
            <div className="w-8 h-8 mx-auto border-3 border-blue-700 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-xs text-slate-500">Verifying invitation credentials...</p>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-14 h-14 rounded-xl overflow-hidden shadow-sm mb-3">
            <img src="/favicon.jpg" alt="Nyano Paila Initiative" className="w-full h-full object-cover" />
          </div>
          <CardTitle className="text-xl">Welcome to Nyano Paila Portal</CardTitle>
          <CardDescription>
            Complete your account setup to access organizational records.
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
                  <p className="font-semibold text-emerald-900">Account Activated</p>
                  <p>
                    Your account has been successfully configured. You now have active access to the portal.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                className="w-full mt-2"
                size="lg"
                onClick={() => navigate('/', { replace: true })}
              >
                Enter Portal
              </Button>
            </div>
          ) : !hasValidInvite && serverError ? (
            <div className="space-y-4">
              <div
                role="alert"
                className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-rose-900">Invalid Invitation Link</p>
                  <p className="mt-0.5">
                    This invitation link is no longer valid. Please ask an administrator to send you a new invitation.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="text-slate-500 block mb-0.5">Setting up portal access for:</span>
                <span className="font-semibold text-slate-900 text-sm">{recipientName}</span>
                {session?.user?.email && (
                  <span className="block text-slate-500 text-[11px] mt-0.5">{session.user.email}</span>
                )}
              </div>

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
                    Create Password
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
                  Activate Account
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
