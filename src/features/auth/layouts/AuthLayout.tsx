import { type ReactNode } from 'react'

export interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="mx-auto w-20 h-20 rounded-2xl overflow-hidden shadow-lg mb-4">
          <img
            src="/logo.jpg"
            alt="Nyano Paila Initiative"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Nyano Paila Initiative
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Secure Internal Document &amp; Governance Portal
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {children}
      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        <p>Authorized personnel only &bull; Access is logged and monitored</p>
      </div>
    </div>
  )
}
