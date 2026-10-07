
import { PageHeader } from './PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export interface PlaceholderPageProps {
  title: string
  description: string
  badgeText?: string
}

export function PlaceholderPage({
  title,
  description,
  badgeText = 'Scheduled for implementation',
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
      />
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" aria-hidden="true" />
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 mb-3 border border-blue-200">
              {badgeText}
            </span>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-md">
              This section is configured in the application router and will be connected in a subsequent stage according to the architecture plan.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
