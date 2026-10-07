import { supabase } from '@/lib/supabase/client'
import { formatFullName } from '@/lib/utils/nameFormatter'
import type {
  GroupFiltersState,
  GroupListItem,
  GroupDetail,
  GroupMemberItem,
  GroupsListResponse,
} from '../types/group.types'
import type { GroupFormValues } from '../schemas/group.schema'

export const groupService = {
  /**
   * Fetch paginated list of groups with RLS-protected document counts (Rule 41 & 42).
   */
  async fetchGroups(filters: GroupFiltersState): Promise<GroupsListResponse> {
    const page = filters.page || 1
    const pageSize = filters.pageSize || 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('groups')
      .select(
        `
        id,
        name,
        description,
        type,
        is_active,
        archived_at,
        created_at,
        updated_at,
        group_members(count)
      `,
        { count: 'exact' }
      )

    // View Tab
    if (filters.viewTab === 'archived') {
      query = query.not('archived_at', 'is', null)
    } else {
      query = query.is('archived_at', null)
    }

    // Type filter
    if (filters.type) {
      query = query.eq('type', filters.type as any)
    }

    // Search filter (Rule 31)
    if (filters.search?.trim()) {
      const term = filters.search.trim().replace(/%/g, '')
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    }

    query = query.order('name', { ascending: true }).range(from, to)

    const { data: rawGroups, count, error } = await query

    if (error) {
      console.error('Failed to fetch groups:', error.message)
      throw error
    }

    const groupIds = (rawGroups || []).map((g) => g.id)

    // Secure Document Counts: Query documents owned by these groups (Rule 41 & 42)
    const docCountsByGroup: Record<string, number> = {}
    if (groupIds.length > 0) {
      const { data: docRows } = await supabase
        .from('documents')
        .select('owner_group_id')
        .in('owner_group_id', groupIds)

      if (docRows) {
        for (const row of docRows) {
          if (row.owner_group_id) {
            docCountsByGroup[row.owner_group_id] =
              (docCountsByGroup[row.owner_group_id] || 0) + 1
          }
        }
      }
    }

    const groups: GroupListItem[] = (rawGroups || []).map((row: any) => {
      const memberCount = row.group_members?.[0]?.count ?? 0
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        is_active: row.is_active,
        archived_at: row.archived_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        member_count: memberCount,
        document_count: docCountsByGroup[row.id] || 0,
      }
    })

    return {
      groups,
      totalCount: count ?? 0,
    }
  },

  /**
   * Fetch single group detail by ID.
   */
  async fetchGroupDetail(groupId: string): Promise<GroupDetail> {
    const { data: rawGroup, error } = await supabase
      .from('groups')
      .select(
        `
        id,
        name,
        description,
        type,
        is_active,
        archived_at,
        created_at,
        updated_at,
        created_by,
        group_members(count)
      `
      )
      .eq('id', groupId)
      .single()

    if (error || !rawGroup) {
      console.error('Failed to fetch group detail:', error?.message)
      throw new Error(error?.message || 'Group not found.')
    }

    // Resolve creator name
    let creatorName: string | null = null
    if (rawGroup.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', rawGroup.created_by)
        .maybeSingle()
      creatorName = profile?.display_name || null
    }

    // Secure Document Count
    const { count: docCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('owner_group_id', groupId)

    const memberCount = (rawGroup as any).group_members?.[0]?.count ?? 0

    return {
      id: rawGroup.id,
      name: rawGroup.name,
      description: rawGroup.description,
      type: rawGroup.type,
      is_active: rawGroup.is_active,
      archived_at: rawGroup.archived_at,
      created_at: rawGroup.created_at,
      updated_at: rawGroup.updated_at,
      created_by: rawGroup.created_by,
      creator_name: creatorName,
      member_count: memberCount,
      document_count: docCount ?? 0,
    }
  },

  /**
   * Fetch members of a group with role in group (Rule 36).
   */
  async fetchGroupMembers(groupId: string): Promise<GroupMemberItem[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select(
        `
        id,
        member_id,
        role_in_group,
        joined_at,
        is_active,
        created_at,
        member:members(id, first_name, middle_name, last_name, position_title)
      `
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch group members:', error.message)
      throw error
    }

    return (data || []).map((row: any) => {
      const m = row.member
      const name = m
        ? formatFullName(m.first_name, m.middle_name, m.last_name)
        : 'Unknown Member'
      return {
        id: row.id,
        member_id: row.member_id,
        name,
        position: m?.position_title || null,
        role_in_group: row.role_in_group || null,
        joined_at: row.joined_at || null,
        is_active: row.is_active,
        created_at: row.created_at,
      }
    })
  },

  /**
   * Create Group Record (Rule 33).
   */
  async createGroup(values: GroupFormValues, organizationId: string): Promise<string> {
    const { data: newGroup, error } = await supabase
      .from('groups')
      .insert({
        organization_id: organizationId,
        name: values.name.trim(),
        type: values.type,
        description: values.description?.trim() || null,
      })
      .select('id')
      .single()

    if (error || !newGroup) {
      console.error('Create group failed:', error)
      throw new Error(error?.message || 'Failed to create group.')
    }

    return newGroup.id
  },

  /**
   * Update Group Record.
   */
  async updateGroup(groupId: string, values: GroupFormValues): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .update({
        name: values.name.trim(),
        type: values.type,
        description: values.description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)

    if (error) {
      console.error('Update group failed:', error)
      throw new Error(error.message || 'Failed to update group.')
    }
  },

  /**
   * Archive Group via RPC (Rule 44).
   */
  async archiveGroup(groupId: string): Promise<void> {
    const { error } = await supabase.rpc('archive_group', { p_group_id: groupId })
    if (error) {
      console.error('Archive group RPC failed:', error)
      throw new Error(error.message || 'Failed to archive group.')
    }
  },

  /**
   * Restore Group via RPC (Rule 46).
   */
  async restoreGroup(groupId: string): Promise<void> {
    const { error } = await supabase.rpc('restore_group', { p_group_id: groupId })
    if (error) {
      console.error('Restore group RPC failed:', error)
      throw new Error(error.message || 'Failed to restore group.')
    }
  },

  /**
   * Add / Update Group Member via RPC (Rule 37, 38).
   */
  async addGroupMember(
    groupId: string,
    memberId: string,
    roleInGroup?: string,
    joinedAt?: string
  ): Promise<void> {
    const { error } = await supabase.rpc('add_group_member', {
      p_group_id: groupId,
      p_member_id: memberId,
      p_role_in_group: roleInGroup?.trim() || undefined,
      p_joined_at: joinedAt || undefined,
    })

    if (error) {
      console.error('Add group member RPC failed:', error)
      throw new Error(error.message || 'Failed to add group member.')
    }
  },

  /**
   * Remove Group Member via RPC (Rule 39).
   */
  async removeGroupMember(groupId: string, memberId: string): Promise<void> {
    const { error } = await supabase.rpc('remove_group_member', {
      p_group_id: groupId,
      p_member_id: memberId,
    })

    if (error) {
      console.error('Remove group member RPC failed:', error)
      throw new Error(error.message || 'Failed to remove group member.')
    }
  },
}
