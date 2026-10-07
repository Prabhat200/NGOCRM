export interface MappedPermission {
  code: string
  label: string
  description: string
  category: 'Documents' | 'Occasions' | 'Members' | 'Groups' | 'Users & Access' | 'System & Settings'
}

export const PERMISSION_CATALOG: Record<string, MappedPermission> = {
  // Documents
  'documents.view': {
    code: 'documents.view',
    label: 'View documents',
    description: 'Access organizational and permitted documents in the archive',
    category: 'Documents',
  },
  'documents.create': {
    code: 'documents.create',
    label: 'Upload & create documents',
    description: 'Upload new documents and configure initial access rules',
    category: 'Documents',
  },
  'documents.edit': {
    code: 'documents.edit',
    label: 'Edit document metadata',
    description: 'Update document titles, descriptions, categories, and tags',
    category: 'Documents',
  },
  'documents.archive': {
    code: 'documents.archive',
    label: 'Archive documents',
    description: 'Move active documents to the organizational archive',
    category: 'Documents',
  },
  'documents.restore': {
    code: 'documents.restore',
    label: 'Restore archived documents',
    description: 'Restore previously archived documents back to active state',
    category: 'Documents',
  },
  'documents.manage_access': {
    code: 'documents.manage_access',
    label: 'Manage document access',
    description: 'Grant or revoke document access for roles, groups, and members',
    category: 'Documents',
  },
  'documents.upload_version': {
    code: 'documents.upload_version',
    label: 'Upload new versions',
    description: 'Upload subsequent revised files to existing documents',
    category: 'Documents',
  },
  'documents.download': {
    code: 'documents.download',
    label: 'Download document files',
    description: 'Generate secure download links for document binary files',
    category: 'Documents',
  },

  // Occasions
  'occasions.view': {
    code: 'occasions.view',
    label: 'View occasions',
    description: 'View meetings, AGMs, programs, and calendar events',
    category: 'Occasions',
  },
  'occasions.create': {
    code: 'occasions.create',
    label: 'Create occasions',
    description: 'Schedule new meetings, programs, and link participants',
    category: 'Occasions',
  },
  'occasions.edit': {
    code: 'occasions.edit',
    label: 'Edit occasions',
    description: 'Update occasion dates, agendas, and participant rosters',
    category: 'Occasions',
  },
  'occasions.archive': {
    code: 'occasions.archive',
    label: 'Archive occasions',
    description: 'Archive concluded or cancelled occasions',
    category: 'Occasions',
  },

  // Members
  'members.view': {
    code: 'members.view',
    label: 'View member directory',
    description: 'Browse organizational member profiles and positions',
    category: 'Members',
  },
  'members.create': {
    code: 'members.create',
    label: 'Add member records',
    description: 'Register new NGO members into the organizational registry',
    category: 'Members',
  },
  'members.edit': {
    code: 'members.edit',
    label: 'Edit member details',
    description: 'Update contact info, positions, and membership statuses',
    category: 'Members',
  },
  'members.archive': {
    code: 'members.archive',
    label: 'Archive member records',
    description: 'Archive departing or inactive members with history retention',
    category: 'Members',
  },

  // Groups
  'groups.view': {
    code: 'groups.view',
    label: 'View groups & committees',
    description: 'Browse committees, departments, and working teams',
    category: 'Groups',
  },
  'groups.create': {
    code: 'groups.create',
    label: 'Create groups & committees',
    description: 'Establish new committees and departments',
    category: 'Groups',
  },
  'groups.edit': {
    code: 'groups.edit',
    label: 'Edit group details',
    description: 'Update committee mandates, descriptions, and settings',
    category: 'Groups',
  },
  'groups.manage_members': {
    code: 'groups.manage_members',
    label: 'Manage group membership',
    description: 'Assign or remove members and designate team roles',
    category: 'Groups',
  },

  // Users & Access
  'users.view': {
    code: 'users.view',
    label: 'View portal users',
    description: 'Inspect portal accounts, invitations, and active statuses',
    category: 'Users & Access',
  },
  'users.invite': {
    code: 'users.invite',
    label: 'Invite portal users',
    description: 'Send invitation links to members to activate portal logins',
    category: 'Users & Access',
  },
  'users.disable': {
    code: 'users.disable',
    label: 'Suspend & disable users',
    description: 'Temporarily suspend or permanently disable user logins',
    category: 'Users & Access',
  },
  'users.manage_roles': {
    code: 'users.manage_roles',
    label: 'Manage roles & permissions',
    description: 'Assign roles to accounts and configure permission matrices',
    category: 'Users & Access',
  },

  // System & Settings
  'audit.view': {
    code: 'audit.view',
    label: 'View audit activity log',
    description: 'Inspect organizational append-only security and activity logs',
    category: 'System & Settings',
  },
  'settings.view': {
    code: 'settings.view',
    label: 'View settings',
    description: 'Browse organizational configuration and taxonomies',
    category: 'System & Settings',
  },
  'settings.manage': {
    code: 'settings.manage',
    label: 'Manage organization settings',
    description: 'Update NGO profile, categories, occasion types, and branding',
    category: 'System & Settings',
  },
}

export const PERMISSION_CATEGORIES = [
  'Documents',
  'Occasions',
  'Members',
  'Groups',
  'Users & Access',
  'System & Settings',
] as const

export function getMappedPermission(code: string): MappedPermission {
  if (PERMISSION_CATALOG[code]) {
    return PERMISSION_CATALOG[code]
  }

  // Safe fallback for uncatalogued codes
  const parts = code.split('.')
  const cat = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'System & Settings'
  const action = parts[1] ? parts[1].replace(/_/g, ' ') : code

  return {
    code,
    label: `${action.charAt(0).toUpperCase() + action.slice(1)} (${cat})`,
    description: `Permission to perform ${action} within ${cat}`,
    category: (cat as MappedPermission['category']) || 'System & Settings',
  }
}
