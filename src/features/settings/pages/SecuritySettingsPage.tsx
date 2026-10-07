import { Link } from 'react-router-dom'
import {
  LockKeyhole,
  ShieldCheck,
  Database,
  KeyRound,
  FileCheck,
  UserCheck,
  Activity,
  ArrowUpRight,
} from 'lucide-react'

export function SecuritySettingsPage() {
  const securityPillars = [
    {
      title: 'PostgreSQL Row Level Security (RLS)',
      status: 'Active & Enforced',
      description:
        'All database queries across documents, members, occasions, groups, and settings are strictly constrained to the authenticated organization and user permissions.',
      icon: Database,
      variant: 'emerald',
    },
    {
      title: 'Private Encrypted Storage',
      status: 'Private Bucket (S3/Supabase)',
      description:
        'Binary document files are stored in the private "ngo-documents" bucket. File downloads require short-lived, authenticated signed tokens that expire in 120 seconds.',
      icon: FileCheck,
      variant: 'emerald',
    },
    {
      title: 'Invitation-Only Portal Onboarding',
      status: 'Enforced',
      description:
        'Open public registration is disabled. Portal users can only join through cryptographically signed invitation tokens linked directly to active NGO member profiles.',
      icon: UserCheck,
      variant: 'emerald',
    },
    {
      title: 'Append-Only Audit Trails',
      status: 'Immutable',
      description:
        'All critical actions—document uploads, version updates, downloads, permission modifications, and member events—are permanently recorded with no edit or delete UI.',
      icon: Activity,
      variant: 'emerald',
    },
    {
      title: 'Last Super Admin Protection',
      status: 'Server-Side Rule',
      description:
        'The database strictly prevents removing, demoting, or disabling the final active Super Admin account, guaranteeing permanent organizational governance.',
      icon: KeyRound,
      variant: 'emerald',
    },
  ]

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <LockKeyhole className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security & Governance Overview</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time security architecture status and organizational authorization guardrails.
        </p>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {securityPillars.map((pillar) => {
          const Icon = pillar.icon
          return (
            <div
              key={pillar.title}
              className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{pillar.status}</span>
                  </span>
                </div>

                <div>
                  <h2 className="text-xs font-bold text-slate-900">{pillar.title}</h2>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Administrative Shortcuts */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Security Administration Shortcuts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/members"
            className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-2xs transition-all flex items-center justify-between text-xs group cursor-pointer"
          >
            <div>
              <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors block">
                Manage Members & Portal Logins
              </span>
              <span className="text-[11px] text-slate-500">
                Inspect active portal accounts, send invitations, and manage statuses.
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
          </Link>

          <Link
            to="/activity"
            className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-2xs transition-all flex items-center justify-between text-xs group cursor-pointer"
          >
            <div>
              <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors block">
                Organizational Audit Trail
              </span>
              <span className="text-[11px] text-slate-500">
                View timestamped historical activity logs for all resources.
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}
