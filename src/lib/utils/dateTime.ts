/**
 * Centralized Date, Time, and Greeting Presentation Helpers
 * Supports organization-specific timezones (default: Asia/Kathmandu)
 */

export const DEFAULT_TIMEZONE = 'Asia/Kathmandu'

/**
 * Format a date string or timestamp as an explicit, human-readable date.
 * Example: 'Oct 7, 2026'
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE
): string {
  if (!dateInput) return '—'

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) return '—'

    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return '—'
  }
}

/**
 * Format a date string or timestamp as date and time.
 * Example: 'Oct 7, 2026, 4:30 PM'
 */
export function formatDateTime(
  dateInput: string | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE
): string {
  if (!dateInput) return '—'

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) return '—'

    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  } catch {
    return '—'
  }
}

/**
 * Formats a timestamp into human relative time.
 * Example: 'Just now', '15 minutes ago', '2 hours ago', 'Yesterday', '3 days ago'
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—'

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    if (isNaN(diffMs)) return '—'

    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 45) return 'Just now'
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
    }

    return formatDate(date)
  } catch {
    return '—'
  }
}

/**
 * Returns a time-appropriate greeting based on organization timezone.
 * Example: 'Good morning, Prabhat'
 */
export function getTimeGreeting(displayName?: string | null, timezone: string = DEFAULT_TIMEZONE): string {
  const name = displayName?.trim() || 'there'

  try {
    // Get current hour in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    })
    const hour = parseInt(formatter.format(new Date()), 10)

    if (hour >= 5 && hour < 12) {
      return `Good morning, ${name}`
    } else if (hour >= 12 && hour < 17) {
      return `Good afternoon, ${name}`
    } else if (hour >= 17 && hour < 22) {
      return `Good evening, ${name}`
    }
    return `Welcome back, ${name}`
  } catch {
    return `Welcome back, ${name}`
  }
}
