/**
 * Formats a member's full name handling first, middle, and last names cleanly
 * without awkward double spaces (Rule 52).
 */
export function formatFullName(
  firstName?: string | null,
  middleName?: string | null,
  lastName?: string | null
): string {
  const parts = [firstName?.trim(), middleName?.trim(), lastName?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : 'Unnamed Member'
}

/**
 * Extracts 1-2 character uppercase initials from a name (Rule 53).
 */
export function getInitials(name?: string | null): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
