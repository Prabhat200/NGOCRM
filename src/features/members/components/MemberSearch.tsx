import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

export interface MemberSearchProps {
  value: string
  onChange: (value: string) => void
  canViewSensitive?: boolean
  className?: string
}

export function MemberSearch({
  value,
  onChange,
  canViewSensitive = false,
  className,
}: MemberSearchProps) {
  const [prevValue, setPrevValue] = useState(value)
  const [localValue, setLocalValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    setLocalValue(value)
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [localValue, onChange, value])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  const placeholder = canViewSensitive
    ? 'Search by name, position, member #, or email...'
    : 'Search members by name or position...'

  return (
    <div className={`relative ${className || ''}`}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
        aria-hidden="true"
      />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search members"
        className="pl-9 pr-9 text-xs h-9 bg-white border-slate-200 focus-visible:ring-blue-600 rounded-lg"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
