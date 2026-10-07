import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function PageContainer({ className, children, ...props }: PageContainerProps) {
  return (
    <div
      className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full', className)}
      {...props}
    >
      {children}
    </div>
  )
}
