import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export function AccessDeniedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4 border border-rose-200">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          You don&apos;t have permission to access this page. If you require access, please contact your committee head or portal administrator.
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
