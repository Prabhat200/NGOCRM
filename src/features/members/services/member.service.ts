import { supabase } from '@/lib/supabase/client'
import { formatFullName } from '@/lib/utils/nameFormatter'
import type {
  MemberFiltersState,
  MemberListItem,
  MemberDetail,
  MembersListResponse,
  PortalStatus,
  MemberGroupAssociation,
  MemberPortalRole,
} from '../types/member.types'
import type { MemberFormValues } from '../schemas/member.schema'

export const memberService = {
  /**
   * Fetch paginated members list with safe privacy enforcement (Rule 10, 11, 48, 75).
   */
  async fetchMembers(
    filters: MemberFiltersState,
    canViewSensitive: boolean
  ): Promise<MembersListResponse> {
    const page = filters.page || 1
    const pageSize = filters.pageSize || 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Privacy-aware column selection: ordinary users never fetch notes, address, phone
    const selectCols = canViewSensitive
      ? 'id, first_name, middle_name, last_name, membership_number, position_title, status, email, phone, archived_at, created_at, updated_at'
      : 'id, first_name, middle_name, last_name, position_title, status, archived_at, created_at, updated_at'

    let query = supabase.from('members').select(selectCols, { count: 'exact' })

    // View tab (Rule 2)
    if (filters.viewTab === 'archived') {
      query = query.not('archived_at', 'is', null)
    } else {
      query = query.is('archived_at', null)
    }

    // Status filter
    if (filters.status) {
      query = query.eq('status', filters.status as any)
    }

    // Position filter
    if (filters.position?.trim()) {
      query = query.ilike('position_title', `%${filters.position.trim()}%`)
    }

    // Search filter (Rule 8)
    if (filters.search?.trim()) {
      const term = filters.search.trim().replace(/%/g, '')
      if (canViewSensitive) {
        query = query.or(
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%,position_title.ilike.%${term}%,membership_number.ilike.%${term}%,email.ilike.%${term}%`
        )
      } else {
        query = query.or(
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%,position_title.ilike.%${term}%`
        )
      }
    }

    // Sort order
    query = query
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true })
      .range(from, to)

    const { data: rawMembers, count, error } = await query

    if (error) {
      console.error('Failed to fetch members:', error.message)
      throw error
    }

    const rows = (rawMembers as any[]) || []
    const memberIds = rows.map((m) => m.id)

    // Resolve Groups Associations for returned members
    const groupsByMemberId: Record<string, MemberGroupAssociation[]> = {}
    if (memberIds.length > 0) {
      const { data: gmRows } = await supabase
        .from('group_members')
        .select('member_id, role_in_group, group:groups(id, name, is_active, archived_at)')
        .in('member_id', memberIds)
        .eq('is_active', true)

      if (gmRows) {
        for (const row of gmRows as any[]) {
          const g = row.group
          if (g && g.is_active && !g.archived_at) {
            if (!groupsByMemberId[row.member_id]) {
              groupsByMemberId[row.member_id] = []
            }
            groupsByMemberId[row.member_id].push({
              group_id: g.id,
              group_name: g.name,
              role_in_group: row.role_in_group,
            })
          }
        }
      }
    }

    // Resolve Linked Portal Profiles & Statuses (Rule 18)
    const portalByMemberId: Record<
      string,
      { status: PortalStatus; userId: string; roles: MemberPortalRole[] }
    > = {}
    if (memberIds.length > 0) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, member_id, status, user_roles(role:roles(id, name, slug))')
        .in('member_id', memberIds)

      if (profileRows) {
        for (const p of profileRows as any[]) {
          if (p.member_id) {
            const roles: MemberPortalRole[] = []
            if (p.user_roles) {
              for (const ur of p.user_roles) {
                if (ur.role) {
                  roles.push({
                    id: ur.role.id,
                    name: ur.role.name,
                    slug: ur.role.slug,
                  })
                }
              }
            }
            portalByMemberId[p.member_id] = {
              status: p.status as PortalStatus,
              userId: p.id,
              roles,
            }
          }
        }
      }
    }

    const members: MemberListItem[] = (rawMembers || []).map((m: any) => {
      const portalInfo = portalByMemberId[m.id]
      return {
        id: m.id,
        first_name: m.first_name,
        middle_name: m.middle_name || null,
        last_name: m.last_name,
        full_name: formatFullName(m.first_name, m.middle_name, m.last_name),
        membership_number: m.membership_number || null,
        position_title: m.position_title || null,
        status: m.status,
        groups: groupsByMemberId[m.id] || [],
        portal_status: portalInfo?.status || 'no_access',
        portal_user_id: portalInfo?.userId || null,
        portal_roles: portalInfo?.roles || [],
        archived_at: m.archived_at || null,
        email: canViewSensitive ? m.email || null : null,
        phone: canViewSensitive ? m.phone || null : null,
        created_at: m.created_at,
        updated_at: m.updated_at,
      }
    })

    // Filter by group or portalStatus if requested
    let filteredList = members
    if (filters.groupId) {
      filteredList = filteredList.filter((m) =>
        m.groups.some((g) => g.group_id === filters.groupId)
      )
    }
    if (filters.portalStatus) {
      filteredList = filteredList.filter((m) => m.portal_status === filters.portalStatus)
    }

    return {
      members: filteredList,
      totalCount: count ?? filteredList.length,
    }
  },

  /**
   * Fetch member detail by ID respecting privacy boundaries (Rule 15, 16, 75).
   */
  async fetchMemberDetail(memberId: string, canViewSensitive: boolean): Promise<MemberDetail> {
    const selectCols = canViewSensitive
      ? 'id, first_name, middle_name, last_name, membership_number, position_title, status, email, phone, address, joined_at, left_at, notes, archived_at, created_at, updated_at'
      : 'id, first_name, middle_name, last_name, position_title, status, joined_at, archived_at, created_at, updated_at'

    const { data: rawMember, error } = await supabase
      .from('members')
      .select(selectCols)
      .eq('id', memberId)
      .single()

    if (error || !rawMember) {
      console.error('Failed to fetch member detail:', error?.message)
      throw new Error(error?.message || 'Member not found.')
    }

    const m = rawMember as any

    // Resolve Groups
    const { data: gmRows } = await supabase
      .from('group_members')
      .select('group_id, role_in_group, group:groups(id, name, is_active, archived_at)')
      .eq('member_id', memberId)
      .eq('is_active', true)

    const groups: MemberGroupAssociation[] = []
    if (gmRows) {
      for (const row of gmRows as any[]) {
        const g = row.group
        if (g && g.is_active && !g.archived_at) {
          groups.push({
            group_id: g.id,
            group_name: g.name,
            role_in_group: row.role_in_group,
          })
        }
      }
    }

    // Resolve Portal Access
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, status, user_roles(role:roles(id, name, slug))')
      .eq('member_id', memberId)
      .maybeSingle()

    const portalRoles: MemberPortalRole[] = []
    if (profile && (profile as any).user_roles) {
      for (const ur of (profile as any).user_roles) {
        if (ur.role) {
          portalRoles.push({
            id: ur.role.id,
            name: ur.role.name,
            slug: ur.role.slug,
          })
        }
      }
    }

    return {
      id: m.id,
      first_name: m.first_name,
      middle_name: m.middle_name || null,
      last_name: m.last_name,
      full_name: formatFullName(m.first_name, m.middle_name, m.last_name),
      membership_number: canViewSensitive ? m.membership_number || null : null,
      position_title: m.position_title || null,
      status: m.status,
      groups,
      portal_status: (profile?.status as PortalStatus) || 'no_access',
      portal_user_id: profile?.id || null,
      portal_roles: portalRoles,
      archived_at: m.archived_at || null,
      created_at: m.created_at,
      updated_at: m.updated_at,
      email: canViewSensitive ? m.email || null : null,
      phone: canViewSensitive ? m.phone || null : null,
      address: canViewSensitive ? m.address || null : null,
      joined_at: m.joined_at || null,
      left_at: canViewSensitive ? m.left_at || null : null,
      notes: canViewSensitive ? m.notes || null : null,
      can_view_sensitive: canViewSensitive,
    }
  },

  /**
   * Create Member Record (Rule 12, 14).
   */
  async createMember(values: MemberFormValues, organizationId: string): Promise<string> {
    const { data: newMember, error } = await supabase
      .from('members')
      .insert({
        organization_id: organizationId,
        first_name: values.first_name.trim(),
        middle_name: values.middle_name?.trim() || null,
        last_name: values.last_name.trim(),
        membership_number: values.membership_number?.trim() || null,
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        address: values.address?.trim() || null,
        position_title: values.position_title?.trim() || null,
        joined_at: values.joined_at || null,
        left_at: values.left_at || null,
        status: values.status,
        notes: values.notes?.trim() || null,
      })
      .select('id')
      .single()

    if (error || !newMember) {
      console.error('Create member failed:', error)
      throw new Error(error?.message || 'Failed to create member.')
    }

    return newMember.id
  },

  /**
   * Update Member Record (Rule 24).
   */
  async updateMember(memberId: string, values: MemberFormValues): Promise<void> {
    const { error } = await supabase
      .from('members')
      .update({
        first_name: values.first_name.trim(),
        middle_name: values.middle_name?.trim() || null,
        last_name: values.last_name.trim(),
        membership_number: values.membership_number?.trim() || null,
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        address: values.address?.trim() || null,
        position_title: values.position_title?.trim() || null,
        joined_at: values.joined_at || null,
        left_at: values.left_at || null,
        status: values.status,
        notes: values.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId)

    if (error) {
      console.error('Update member failed:', error)
      throw new Error(error.message || 'Failed to update member.')
    }
  },

  /**
   * Archive Member (Rule 25).
   */
  async archiveMember(memberId: string): Promise<void> {
    const { error } = await supabase.rpc('archive_member', { p_member_id: memberId })
    if (error) {
      console.error('Archive member RPC failed:', error)
      throw new Error(error.message || 'Failed to archive member.')
    }
  },

  /**
   * Restore Member (Rule 27).
   */
  async restoreMember(memberId: string): Promise<void> {
    const { error } = await supabase.rpc('restore_member', { p_member_id: memberId })
    if (error) {
      console.error('Restore member RPC failed:', error)
      throw new Error(error.message || 'Failed to restore member.')
    }
  },

  /**
   * Send Portal Invitation via secure invite-member Edge Function (Rule 19, 20).
   */
  async invitePortalUser(memberId: string, email: string, roleId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('invite-member', {
      body: {
        member_id: memberId,
        email: email.trim(),
        role_id: roleId,
      },
    })

    if (error) {
      console.error('Invite member function error:', error)
      throw new Error(error.message || 'Failed to send portal invitation.')
    }
  },

  /**
   * Suspend / Disable / Restore Portal Account Status (Rule 22).
   */
  async updatePortalStatus(userId: string, newStatus: 'active' | 'suspended' | 'disabled'): Promise<void> {
    const { error } = await supabase.rpc('set_user_status', {
      p_target_user_id: userId,
      p_new_status: newStatus,
    })

    if (error) {
      console.error('Set user status RPC failed:', error)
      throw new Error(error.message || 'Failed to update user portal status.')
    }
  },

  /**
   * Assign Portal Roles with Super Admin privilege escalation guard (Rule 23).
   */
  async updatePortalRoles(userId: string, roleIds: string[]): Promise<void> {
    const { error } = await supabase.rpc('set_user_roles', {
      p_target_user_id: userId,
      p_role_ids: roleIds,
    })

    if (error) {
      console.error('Set user roles RPC failed:', error)
      throw new Error(error.message || 'Failed to assign portal roles.')
    }
  },

  /**
   * Fetch Available Portal Roles.
   */
  async fetchPortalRoles(): Promise<MemberPortalRole[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name, slug')
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch roles:', error.message)
      throw error
    }

    return (data || []).map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
    }))
  },

  /**
   * Safe Member Directory for pickers and participant selectors (Rule 10, 52, 55).
   */
  async fetchSafeMemberDirectory(): Promise<Array<{ id: string; full_name: string; position_title: string | null; email: string | null }>> {
    const { data, error } = await supabase
      .from('members')
      .select('id, first_name, middle_name, last_name, position_title, email')
      .eq('status', 'active')
      .is('archived_at', null)
      .order('first_name', { ascending: true })

    if (error) {
      console.error('Failed to fetch safe member directory:', error.message)
      throw error
    }

    return (data || []).map((m) => ({
      id: m.id,
      full_name: formatFullName(m.first_name, m.middle_name, m.last_name),
      position_title: m.position_title || null,
      email: m.email || null,
    }))
  },
}
