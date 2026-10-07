import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none text-slate-800 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 inline-flex items-center gap-1',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-rose-600" aria-hidden="true">*</span>}
      </label>
    )
  }
)
Label.displayName = 'Label'
