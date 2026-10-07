/**
 * Activity Action Code Formatter (Rule 11 & 43)
 * Maps machine-readable audit action codes to friendly human descriptions.
 */

const ACTION_DESCRIPTIONS: Record<string, string> = {
  // Document events
  'document.created': 'created a document',
  'document.updated': 'updated document details',
  'document.version_uploaded': 'uploaded a new document version',
  'document.archived': 'archived a document',
  'document.restored': 'restored a document',
  'document.downloaded': 'downloaded a document file',
  'document.access_modified': 'updated document access permissions',

  // Occasion events
  'occasion.created': 'created an occasion',
  'occasion.updated': 'updated occasion details',
  'occasion.completed': 'marked occasion as completed',
  'occasion.archived': 'archived an occasion',

  // Member events
  'member.created': 'added a new member record',
  'member.updated': 'updated a member profile',
  'member.archived': 'archived a member record',

  // User & Portal access events
  'user.invited': 'sent portal access invitation',
  'user.activated': 'activated portal account',
  'user.suspended': 'suspended portal access',
  'user.disabled': 'disabled portal access',
  'user.role_assigned': 'assigned portal role',
}

/**
 * Format an audit action code into a clear, non-technical sentence fragment.
 * Fallback: 'performed an activity'
 */
export function formatActivityAction(action: string): string {
  if (!action) return 'performed an activity'
  return ACTION_DESCRIPTIONS[action.toLowerCase()] || 'performed an activity'
}

/**
 * Extract an informative title/subject from activity log metadata if available.
 */
export function extractActivityTarget(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) return null

  if (typeof metadata.title === 'string' && metadata.title) {
    return metadata.title
  }
  if (typeof metadata.member_name === 'string' && metadata.member_name) {
    return metadata.member_name
  }
  if (typeof metadata.name === 'string' && metadata.name) {
    return metadata.name
  }
  if (typeof metadata.role_name === 'string' && metadata.role_name) {
    return metadata.role_name
  }
  return null
}
