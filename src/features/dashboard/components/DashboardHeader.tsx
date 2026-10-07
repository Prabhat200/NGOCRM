import { useAuth } from '@/features/auth/context'
import { getTimeGreeting } from '@/lib/utils/dateTime'

export function DashboardHeader() {
  const { user, profile, member, organization } = useAuth()

  // Display user's human name (member full name -> profile display name -> email local part)
  const displayName =
    member?.full_name ||
    profile?.display_name ||
    user?.email?.split('@')[0] ||
    'Member'

  const greeting = getTimeGreeting(displayName, organization?.timezone)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {greeting}
        </h1>
        <p className="mt-1.5 text-base text-slate-600">
          {organization ? (
            <>
              Here&apos;s an overview of records and operations for{' '}
              <span className="font-semibold text-slate-800">{organization.name}</span>.
            </>
          ) : (
            "Here's what's happening in your organization."
          )}
        </p>
      </div>
    </div>
  )
}
