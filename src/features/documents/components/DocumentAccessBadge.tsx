import { Globe, Shield, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DocumentAccessMode } from '../types/document.types'

export interface DocumentAccessBadgeProps {
  accessMode: DocumentAccessMode
  className?: string
}

export function DocumentAccessBadge({ accessMode, className }: DocumentAccessBadgeProps) {
  switch (accessMode) {
    case 'organization':
      return (
        <Badge
          variant="secondary"
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80',
            className
          )}
        >
          <Globe className="w-3 h-3 text-blue-600" aria-hidden="true" />
          <span>Organization</span>
        </Badge>
      )
    case 'restricted':
      return (
        <Badge
          variant="secondary"
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80',
            className
          )}
        >
          <Shield className="w-3 h-3 text-amber-600" aria-hidden="true" />
          <span>Restricted</span>
        </Badge>
      )
    case 'private':
      return (
        <Badge
          variant="secondary"
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200/80',
            className
          )}
        >
          <Lock className="w-3 h-3 text-purple-600" aria-hidden="true" />
          <span>Private</span>
        </Badge>
      )
    default:
      return null
  }
}
