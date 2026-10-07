export function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="p-4 bg-white border border-slate-200/80 rounded-xl animate-pulse flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-64 sm:w-96" />
              <div className="h-3 bg-slate-100 rounded w-32" />
            </div>
          </div>
          <div className="h-5 bg-slate-100 rounded-full w-16 hidden sm:block" />
        </div>
      ))}
    </div>
  )
}
