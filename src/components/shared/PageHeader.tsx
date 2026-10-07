import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  badge?: ReactNode
  breadcrumbs?: ReactNode
  primaryAction?: ReactNode
  secondaryContent?: ReactNode
  actions?: ReactNode // For backward compatibility
  className?: string
}

export function PageHeader({
  title,
  description,
  badge,
  breadcrumbs,
  primaryAction,
  secondaryContent,
  actions,
  className,
}: PageHeaderProps) {
  const actionContent = primaryAction || actions

  return (
    <div className={cn('pb-6 border-b border-slate-200 space-y-3', className)}>
      {breadcrumbs && <div>{breadcrumbs}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="mt-1.5 text-base text-slate-600 max-w-3xl leading-relaxed">{description}</p>
          )}
        </div>

        {(actionContent || secondaryContent) && (
          <div className="flex items-center gap-3 shrink-0">
            {secondaryContent}
            {actionContent}
          </div>
        )}
      </div>
    </div>
  )
}
