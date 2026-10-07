import { Link } from 'react-router-dom'
import { Users2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'

export function GroupsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <Users2 className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Groups & Committees Integration</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Committees, working groups, departments, and member roster management.
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Users2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Dedicated Groups & Committees Module</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Group management, committee rosters, appointment of leadership roles (e.g. Chair, Secretary, Member),
              and group-based document access policies are managed in the centralized Groups module.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Confidential Access Boundaries</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Documents can be shared exclusively with specific active committees.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Unified Member Rosters</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Members can belong to multiple committees with distinct roles in each group.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Manage all committees, teams, and departments</span>
          <Link
            to="/groups"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs transition-colors"
          >
            <span>Open Groups & Committees Module</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
