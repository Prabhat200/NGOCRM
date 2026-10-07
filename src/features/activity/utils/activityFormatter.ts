import { ActivityLogItem, FormattedActivity } from '../types/activity.types'

/**
 * Format date in organizational timezone with explicit absolute timestamp
 * Example: "7 October 2026, 5:42 PM"
 */
export function formatActivityDate(dateString: string, timezone: string = 'Asia/Kathmandu'): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }

    return new Intl.DateTimeFormat('en-US', options).format(date)
  } catch {
    return dateString
  }
}

/**
 * Relative time calculation for secondary display (e.g. "10 minutes ago", "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
  try {
    const now = new Date().getTime()
    const past = new Date(dateString).getTime()
    const diffMs = now - past

    if (diffMs < 0) return 'just now'
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays}d ago`
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths}mo ago`
    return `${Math.floor(diffMonths / 12)}y ago`
  } catch {
    return ''
  }
}

/**
 * Centralized Activity Formatter:
 * Converts raw database audit records into human-readable activity stories.
 */
export function formatActivity(log: ActivityLogItem, timezone: string = 'Asia/Kathmandu'): FormattedActivity {
  const actor = log.actor_name || 'System'
  const meta = log.metadata || {}
  const action = log.action
  const entityType = log.entity_type
  const entityId = log.entity_id

  let description = ''
  let resourceTitle: string | undefined = undefined
  let resourceLink: string | undefined = undefined
  let badgeVariant: FormattedActivity['badgeVariant'] = 'default'

  // Extract common metadata fields safely
  const docTitle = (meta.document_title as string) || (meta.title as string) || undefined
  const occasionTitle = (meta.occasion_title as string) || (meta.title as string) || undefined
  const memberName = (meta.member_name as string) || (meta.name as string) || undefined
  const groupName = (meta.group_name as string) || (meta.name as string) || undefined
  const roleName = (meta.role_name as string) || (meta.name as string) || undefined
  const categoryName = (meta.category_name as string) || (meta.name as string) || undefined
  const typeName = (meta.type_name as string) || (meta.name as string) || undefined
  const versionNo = meta.version_number ? `v${meta.version_number}` : (meta.version as string) || undefined

  switch (action) {
    // Documents
    case 'document.created':
      description = `created document`
      resourceTitle = docTitle ? `"${docTitle}"` : undefined
      if (entityId) resourceLink = `/documents/${entityId}`
      badgeVariant = 'blue'
      break

    case 'document.updated':
      description = `updated details for`
      resourceTitle = docTitle ? `"${docTitle}"` : 'a document'
      if (entityId) resourceLink = `/documents/${entityId}`
      badgeVariant = 'blue'
      break

    case 'document.downloaded':
      description = `downloaded`
      resourceTitle = docTitle ? `"${docTitle}"` : 'document file'
      if (entityId) resourceLink = `/documents/${entityId}`
      badgeVariant = 'emerald'
      break

    case 'document.version_uploaded':
      description = `uploaded ${versionNo ? `version ${versionNo}` : 'a new version'} of`
      resourceTitle = docTitle ? `"${docTitle}"` : 'a document'
      if (entityId) resourceLink = `/documents/${entityId}`
      badgeVariant = 'blue'
      break

    case 'document.archived':
      description = `archived document`
      resourceTitle = docTitle ? `"${docTitle}"` : undefined
      if (entityId) resourceLink = `/documents/${entityId}`
      badgeVariant = 'amber'
      break

    case 'document.restored':
      description = `restored document`
      resourceTitle = docTitle ? `"${docTitle}"` : undefined
      if (entityId) resourceLink = `/documents/${entityId}`
      badgeVariant = 'emerald'
      break

    case 'document.access_granted':
      description = `granted access to`
      resourceTitle = docTitle ? `"${docTitle}"` : 'document'
      if (entityId) resourceLink = `/documents/${entityId}`
      badgeVariant = 'purple'
      break

    case 'document.access_removed':
      description = `revoked access to`
      resourceTitle = docTitle ? `"${docTitle}"` : 'document'
      if (entityId) resourceLink = `/documents/${entityId}`
      badgeVariant = 'amber'
      break

    // Occasions
    case 'occasion.created':
      description = `created occasion`
      resourceTitle = occasionTitle ? `"${occasionTitle}"` : undefined
      if (entityId) resourceLink = `/occasions/${entityId}`
      badgeVariant = 'emerald'
      break

    case 'occasion.updated':
      description = `updated occasion`
      resourceTitle = occasionTitle ? `"${occasionTitle}"` : undefined
      if (entityId) resourceLink = `/occasions/${entityId}`
      badgeVariant = 'blue'
      break

    case 'occasion.archived':
      description = `archived occasion`
      resourceTitle = occasionTitle ? `"${occasionTitle}"` : undefined
      if (entityId) resourceLink = `/occasions/${entityId}`
      badgeVariant = 'amber'
      break

    case 'occasion.restored':
      description = `restored occasion`
      resourceTitle = occasionTitle ? `"${occasionTitle}"` : undefined
      if (entityId) resourceLink = `/occasions/${entityId}`
      badgeVariant = 'emerald'
      break

    // Members
    case 'member.created':
      description = `added member`
      resourceTitle = memberName ? `"${memberName}"` : undefined
      if (entityId) resourceLink = `/members/${entityId}`
      badgeVariant = 'purple'
      break

    case 'member.updated':
      description = `updated member profile for`
      resourceTitle = memberName ? `"${memberName}"` : undefined
      if (entityId) resourceLink = `/members/${entityId}`
      badgeVariant = 'blue'
      break

    case 'member.archived':
      description = `archived member`
      resourceTitle = memberName ? `"${memberName}"` : undefined
      if (entityId) resourceLink = `/members/${entityId}`
      badgeVariant = 'amber'
      break

    case 'member.restored':
      description = `restored member`
      resourceTitle = memberName ? `"${memberName}"` : undefined
      if (entityId) resourceLink = `/members/${entityId}`
      badgeVariant = 'emerald'
      break

    // Groups
    case 'group.created':
      description = `created group`
      resourceTitle = groupName ? `"${groupName}"` : undefined
      if (entityId) resourceLink = `/groups/${entityId}`
      badgeVariant = 'purple'
      break

    case 'group.updated':
      description = `updated group`
      resourceTitle = groupName ? `"${groupName}"` : undefined
      if (entityId) resourceLink = `/groups/${entityId}`
      badgeVariant = 'blue'
      break

    case 'group.member_added':
      description = `added ${memberName || 'a member'} to`
      resourceTitle = groupName ? `"${groupName}"` : 'group'
      if (entityId) resourceLink = `/groups/${entityId}`
      badgeVariant = 'emerald'
      break

    case 'group.member_removed':
      description = `removed ${memberName || 'a member'} from`
      resourceTitle = groupName ? `"${groupName}"` : 'group'
      if (entityId) resourceLink = `/groups/${entityId}`
      badgeVariant = 'amber'
      break

    case 'group.archived':
      description = `archived group`
      resourceTitle = groupName ? `"${groupName}"` : undefined
      if (entityId) resourceLink = `/groups/${entityId}`
      badgeVariant = 'amber'
      break

    case 'group.restored':
      description = `restored group`
      resourceTitle = groupName ? `"${groupName}"` : undefined
      if (entityId) resourceLink = `/groups/${entityId}`
      badgeVariant = 'emerald'
      break

    // Users & Roles
    case 'user.invited':
      description = `invited ${meta.email ? (meta.email as string) : 'a user'} to the portal`
      badgeVariant = 'purple'
      break

    case 'user.activated':
      description = `activated portal user account`
      badgeVariant = 'emerald'
      break

    case 'user.suspended':
      description = `suspended portal user account`
      badgeVariant = 'rose'
      break

    case 'user.disabled':
      description = `disabled portal user account`
      badgeVariant = 'rose'
      break

    case 'user.roles_changed':
    case 'role.assigned':
      description = `updated role assignments for portal user`
      badgeVariant = 'purple'
      break

    case 'role.created':
      description = `created new portal role`
      resourceTitle = roleName ? `"${roleName}"` : undefined
      badgeVariant = 'purple'
      break

    case 'role.deleted':
      description = `deleted portal role`
      resourceTitle = roleName ? `"${roleName}"` : undefined
      badgeVariant = 'rose'
      break

    case 'role.permissions_updated':
      description = `updated permission matrix for role`
      resourceTitle = roleName ? `"${roleName}"` : undefined
      badgeVariant = 'purple'
      break

    // Administration & Settings
    case 'organization.updated':
      description = `updated organization profile & settings`
      badgeVariant = 'blue'
      break

    case 'document_category.created':
      description = `created document category`
      resourceTitle = categoryName ? `"${categoryName}"` : undefined
      badgeVariant = 'blue'
      break

    case 'document_category.updated':
      description = `updated document category`
      resourceTitle = categoryName ? `"${categoryName}"` : undefined
      badgeVariant = 'blue'
      break

    case 'document_category.deactivated':
      description = `deactivated document category`
      resourceTitle = categoryName ? `"${categoryName}"` : undefined
      badgeVariant = 'amber'
      break

    case 'document_category.reactivated':
      description = `reactivated document category`
      resourceTitle = categoryName ? `"${categoryName}"` : undefined
      badgeVariant = 'emerald'
      break

    case 'occasion_type.created':
      description = `created occasion type`
      resourceTitle = typeName ? `"${typeName}"` : undefined
      badgeVariant = 'blue'
      break

    case 'occasion_type.updated':
      description = `updated occasion type`
      resourceTitle = typeName ? `"${typeName}"` : undefined
      badgeVariant = 'blue'
      break

    case 'occasion_type.deactivated':
      description = `deactivated occasion type`
      resourceTitle = typeName ? `"${typeName}"` : undefined
      badgeVariant = 'amber'
      break

    case 'occasion_type.reactivated':
      description = `reactivated occasion type`
      resourceTitle = typeName ? `"${typeName}"` : undefined
      badgeVariant = 'emerald'
      break

    // Safe fallback for unlisted actions
    default: {
      const readable = action.replace(/[._]/g, ' ')
      description = `performed ${readable}`
      resourceTitle = (meta.title as string) || (meta.name as string) || undefined
      badgeVariant = 'default'
      break
    }
  }

  return {
    actor,
    description,
    resourceTitle,
    resourceLink,
    resourceType: entityType,
    timestamp: formatActivityDate(log.created_at, timezone),
    relativeTime: getRelativeTime(log.created_at),
    badgeVariant,
  }
}
