export function AuthLoadingScreen() {
  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 select-none"
      aria-live="polite"
      aria-label="Verifying credentials and loading portal"
    >
      <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg mb-4 animate-pulse">
        <img
          src="/logo.jpg"
          alt="Nyano Paila Initiative"
          className="w-full h-full object-cover"
        />
      </div>
      <h2 className="text-base font-semibold text-slate-800 tracking-tight">
        Nyano Paila Initiative
      </h2>
      <p className="text-xs text-slate-500 mt-1">
        Verifying authorization...
      </p>
    </div>
  )
}
