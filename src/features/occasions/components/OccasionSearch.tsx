import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

export interface OccasionSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function OccasionSearch({
  value,
  onChange,
  placeholder = 'Search occasions by name, description, or location...',
  className,
}: OccasionSearchProps) {
  const [prevValue, setPrevValue] = useState(value)
  const [localValue, setLocalValue] = useState(value)

  // Sync external changes during render
  if (value !== prevValue) {
    setPrevValue(value)
    setLocalValue(value)
  }

  // Debounced search propagation (Rule 8: 300ms)
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
        aria-label="Search occasions"
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
