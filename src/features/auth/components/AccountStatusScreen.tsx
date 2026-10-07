import { AlertOctagon, UserX, HelpCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '../context'
import type { AccountStatus } from '../types/auth.types'

export interface AccountStatusScreenProps {
  status: AccountStatus
}

export function AccountStatusScreen({ status }: AccountStatusScreenProps) {
  const { signOut } = useAuth()

  if (status === 'invited') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-blue-200 shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <HelpCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg text-slate-900">
              Account Setup Incomplete
            </CardTitle>
            <CardDescription className="text-slate-600">
              Your invitation is awaiting password setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 text-center leading-relaxed">
            Please finish activating your portal account to access organization documents.
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button
              size="sm"
              onClick={() => {
                window.location.href = '/auth/accept-invite'
              }}
            >
              Complete Setup
            </Button>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (status === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertOctagon className="w-6 h-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg text-slate-900">
              Access Suspended
            </CardTitle>
            <CardDescription className="text-slate-600">
              Your portal access has been temporarily suspended.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 text-center leading-relaxed">
            Please contact an organization administrator if you believe this is a mistake or require access to organizational documents.
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (status === 'disabled') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-slate-300 shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-3">
              <UserX className="w-6 h-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-lg text-slate-900">
              Account Disabled
            </CardTitle>
            <CardDescription className="text-slate-600">
              This portal account has been deactivated.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 text-center leading-relaxed">
            Your login identity remains registered, but access permissions have been removed by an administrator.
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // status === 'missing_profile'
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-amber-200 shadow-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <HelpCircle className="w-6 h-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-lg text-slate-900">
            Account Not Configured
          </CardTitle>
          <CardDescription className="text-slate-600">
            Your account is not fully configured for this portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 text-center leading-relaxed">
          An authentication account exists, but no active organization member profile was found linked to your credentials. Please ask your administrator to grant portal access.
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
