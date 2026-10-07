import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-blue-700 text-white shadow-xs',
        secondary:
          'border-transparent bg-slate-100 text-slate-800',
        destructive:
          'border-transparent bg-rose-50 text-rose-700 border-rose-200',
        success:
          'border-transparent bg-emerald-50 text-emerald-700 border-emerald-200',
        warning:
          'border-transparent bg-amber-50 text-amber-700 border-amber-200',
        outline: 'text-slate-800 border-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
