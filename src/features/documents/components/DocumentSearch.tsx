import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

export interface DocumentSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DocumentSearch({
  value,
  onChange,
  placeholder = 'Search documents by title, description, or number...',
  className,
}: DocumentSearchProps) {
  const [prevValue, setPrevValue] = useState(value)
  const [localValue, setLocalValue] = useState(value)

  // Sync external changes during render
  if (value !== prevValue) {
    setPrevValue(value)
    setLocalValue(value)
  }

  // Debounced search propagation (Rule 7: 300ms)
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
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9 text-xs sm:text-sm bg-white"
        aria-label="Search documents"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
