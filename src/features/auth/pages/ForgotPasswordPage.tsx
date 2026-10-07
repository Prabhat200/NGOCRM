import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { AuthLayout } from '../layouts/AuthLayout'
import { supabase } from '@/lib/supabase/client'
import { getFriendlyAuthErrorMessage } from '../utils/auth-errors'

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null)
    try {
      // Use window.location.origin to point to the current application instance
      const redirectUrl = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: redirectUrl,
      })

      if (error) {
        setServerError(getFriendlyAuthErrorMessage(error))
        return
      }

      // Safe non-enumerating success message
      setIsSubmitted(true)
    } catch (err) {
      setServerError(getFriendlyAuthErrorMessage(err))
    }
  }

  return (
    <AuthLayout>
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
            <KeyRound className="w-5 h-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a recovery link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="space-y-4">
              <div
                role="status"
                className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-900">Check your inbox</p>
                  <p>
                    If an account exists for this email, a recovery link has been sent. Follow the instructions in the email to set a new password.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:underline font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </Link>
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
                  <Label htmlFor="email" required>
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@organization.org"
                    className="mt-1.5"
                    error={!!errors.email}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-rose-600" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  size="lg"
                  isLoading={isSubmitting}
                >
                  Send Recovery Link
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
