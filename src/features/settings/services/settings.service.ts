import { supabase } from '@/lib/supabase/client'
import {
  OrganizationSettingsFormValues,
  DocumentCategory,
  OccasionType,
  SystemPermission,
  RoleWithDetails,
} from '../types/settings.types'
import { getMappedPermission } from '../utils/permissionCatalog'

// ==============================================================================
// 1. ORGANIZATION SETTINGS
// ==============================================================================

export async function updateOrganization(
  values: OrganizationSettingsFormValues
): Promise<void> {
  const { error } = await supabase.rpc('update_organization_settings', {
    p_name: values.name,
    p_short_name: values.short_name || undefined,
    p_email: values.email || undefined,
    p_phone: values.phone || undefined,
    p_address: values.address || undefined,
    p_registration_no: values.registration_no || undefined,
    p_website: values.website || undefined,
    p_timezone: values.timezone || 'Asia/Kathmandu',
    p_logo_url: values.logo_url || undefined,
  })

  if (error) {
    throw new Error(error.message || 'We couldn’t update the organization settings.')
  }
}

// ==============================================================================
// 2. DOCUMENT CATEGORIES
// ==============================================================================

export async function fetchDocumentCategories(): Promise<DocumentCategory[]> {
  const { data, error } = await supabase
    .from('document_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message || 'Could not load document categories.')
  }

  return (data as DocumentCategory[]) || []
}

export async function createDocumentCategory(
  name: string,
  description?: string,
  icon?: string
): Promise<DocumentCategory> {
  const { data, error } = await supabase.rpc('create_document_category', {
    p_name: name,
    p_description: description || undefined,
    p_icon: icon || undefined,
  })

  if (error) {
    throw new Error(error.message || 'Could not create document category.')
  }

  return data as unknown as DocumentCategory
}

export async function updateDocumentCategory(
  id: string,
  name: string,
  description?: string,
  icon?: string,
  isActive: boolean = true
): Promise<DocumentCategory> {
  const { data, error } = await supabase.rpc('update_document_category', {
    p_id: id,
    p_name: name,
    p_description: description || undefined,
    p_icon: icon || undefined,
    p_is_active: isActive,
  })

  if (error) {
    throw new Error(error.message || 'Could not update document category.')
  }

  return data as unknown as DocumentCategory
}

// ==============================================================================
// 3. OCCASION TYPES
// ==============================================================================

export async function fetchOccasionTypes(): Promise<OccasionType[]> {
  const { data, error } = await supabase
    .from('occasion_types')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message || 'Could not load occasion types.')
  }

  return (data as OccasionType[]) || []
}

export async function createOccasionType(
  name: string,
  description?: string,
  icon?: string
): Promise<OccasionType> {
  const { data, error } = await supabase.rpc('create_occasion_type', {
    p_name: name,
    p_description: description || undefined,
    p_icon: icon || undefined,
  })

  if (error) {
    throw new Error(error.message || 'Could not create occasion type.')
  }

  return data as unknown as OccasionType
}

export async function updateOccasionType(
  id: string,
  name: string,
  description?: string,
  icon?: string,
  isActive: boolean = true
): Promise<OccasionType> {
  const { data, error } = await supabase.rpc('update_occasion_type', {
    p_id: id,
    p_name: name,
    p_description: description || undefined,
    p_icon: icon || undefined,
    p_is_active: isActive,
  })

  if (error) {
    throw new Error(error.message || 'Could not update occasion type.')
  }

  return data as unknown as OccasionType
}

// ==============================================================================
// 4. ROLES & PERMISSIONS
// ==============================================================================

export async function fetchSystemPermissions(): Promise<SystemPermission[]> {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('code', { ascending: true })

  if (error) {
    throw new Error(error.message || 'Could not load system permissions.')
  }

  return ((data as { id: string; code: string; description: string }[]) || []).map((p) => {
    const mapped = getMappedPermission(p.code)
    return {
      id: p.id,
      code: p.code,
      description: mapped.description || p.description,
      label: mapped.label,
      category: mapped.category,
    }
  })
}

export async function fetchRolesWithDetails(): Promise<RoleWithDetails[]> {
  // 1. Fetch roles
  const { data: roles, error: rolesErr } = await supabase
    .from('roles')
    .select('*')
    .order('name', { ascending: true })

  if (rolesErr) {
    throw new Error(rolesErr.message || 'Could not load roles.')
  }

  // 2. Fetch role_permissions
  const { data: rolePerms, error: permErr } = await supabase
    .from('role_permissions')
    .select('role_id, permission_id')

  if (permErr) {
    throw new Error(permErr.message || 'Could not load role permissions.')
  }

  // 3. Fetch user counts per role
  const { data: userRoles, error: userRolesErr } = await supabase
    .from('user_roles')
    .select('role_id, user_id')

  if (userRolesErr) {
    throw new Error(userRolesErr.message || 'Could not load assigned role counts.')
  }

  // Group permissions and user counts
  const permMap = new Map<string, string[]>()
  rolePerms?.forEach((rp) => {
    const list = permMap.get(rp.role_id) || []
    list.push(rp.permission_id)
    permMap.set(rp.role_id, list)
  })

  const userCountMap = new Map<string, number>()
  userRoles?.forEach((ur) => {
    userCountMap.set(ur.role_id, (userCountMap.get(ur.role_id) || 0) + 1)
  })

  return (roles || []).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    is_system_role: r.is_system_role,
    created_at: r.created_at,
    assigned_user_count: userCountMap.get(r.id) || 0,
    permission_ids: permMap.get(r.id) || [],
  }))
}

export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<void> {
  const { error } = await supabase.rpc('update_role_permissions', {
    p_role_id: roleId,
    p_permission_ids: permissionIds,
  })

  if (error) {
    throw new Error(error.message || 'This role cannot be modified by your account.')
  }
}

export async function createCustomRole(
  name: string,
  description?: string,
  permissionIds: string[] = []
): Promise<RoleWithDetails> {
  const { data, error } = await supabase.rpc('create_custom_role', {
    p_name: name,
    p_description: description || undefined,
    p_permission_ids: permissionIds,
  })

  if (error) {
    throw new Error(error.message || 'Could not create role.')
  }

  const roleData = data as unknown as {
    id: string
    name: string
    slug: string
    description: string | null
    is_system_role: boolean
    created_at: string
  }

  return {
    ...roleData,
    assigned_user_count: 0,
    permission_ids: permissionIds,
  }
}

export async function deleteCustomRole(roleId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_custom_role', {
    p_role_id: roleId,
  })

  if (error) {
    throw new Error(error.message || 'Could not delete role.')
  }
}
