import { supabase } from '@/lib/supabase/client'
import type {
  OccasionFiltersState,
  OccasionListItem,
  OccasionDetail,
  OccasionMemberItem,
  OccasionType,
  OccasionsListResponse,
  SafeMemberDirectoryItem,
} from '../types/occasion.types'
import type { CreateOccasionFormValues, EditOccasionFormValues } from '../schemas/occasion.schema'

export const occasionService = {
  /**
   * Fetch paginated list of occasions respecting RLS and view filters.
   */
  async fetchOccasions(filters: OccasionFiltersState): Promise<OccasionsListResponse> {
    const page = filters.page || 1
    const pageSize = filters.pageSize || 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('occasions')
      .select(
        `
        id,
        name,
        description,
        occasion_type_id,
        start_date,
        end_date,
        location,
        status,
        fiscal_year,
        archived_at,
        created_at,
        updated_at,
        occasion_type:occasion_types(name, icon),
        occasion_members(count)
      `,
        { count: 'exact' }
      )

    // View tab logic
    if (filters.viewTab === 'archived') {
      query = query.not('archived_at', 'is', null)
    } else {
      query = query.is('archived_at', null)

      if (filters.viewTab === 'upcoming') {
        const todayStr = new Date().toISOString().split('T')[0]
        query = query.gte('start_date', todayStr).neq('status', 'cancelled')
      } else if (filters.viewTab === 'completed') {
        query = query.eq('status', 'completed')
      }
    }

    // Search filter across name, description, location (Rule 8)
    if (filters.search?.trim()) {
      const term = filters.search.trim().replace(/%/g, '')
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`)
    }

    // Taxonomy and attribute filters
    if (filters.typeId) {
      query = query.eq('occasion_type_id', filters.typeId)
    }
    if (filters.status) {
      query = query.eq('status', filters.status as any)
    }
    if (filters.fiscalYear?.trim()) {
      query = query.eq('fiscal_year', filters.fiscalYear.trim())
    }

    // Sort: recent/upcoming first
    query = query
      .order('start_date', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error('Failed to fetch occasions:', error.message)
      throw error
    }

    const occasionIds = (data || []).map((row) => row.id)

    // Secure Document Counts (Rule 21 & 22: Count ONLY accessible documents through RLS)
    const docCountsByOccasion: Record<string, number> = {}
    if (occasionIds.length > 0) {
      const { data: docRows } = await supabase
        .from('documents')
        .select('occasion_id')
        .in('occasion_id', occasionIds)

      if (docRows) {
        for (const row of docRows) {
          if (row.occasion_id) {
            docCountsByOccasion[row.occasion_id] = (docCountsByOccasion[row.occasion_id] || 0) + 1
          }
        }
      }
    }

    const occasions: OccasionListItem[] = (data || []).map((row: any) => {
      const memberCount = row.occasion_members?.[0]?.count ?? 0
      const typeInfo = Array.isArray(row.occasion_type)
        ? row.occasion_type[0]
        : row.occasion_type

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        occasion_type_id: row.occasion_type_id,
        type_name: typeInfo?.name || null,
        type_icon: typeInfo?.icon || null,
        start_date: row.start_date,
        end_date: row.end_date,
        location: row.location,
        status: row.status,
        fiscal_year: row.fiscal_year,
        archived_at: row.archived_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        document_count: docCountsByOccasion[row.id] || 0,
        member_count: memberCount,
      }
    })

    return {
      occasions,
      totalCount: count ?? 0,
    }
  },

  /**
   * Fetch single occasion detail by ID.
   */
  async fetchOccasion(id: string): Promise<OccasionDetail> {
    const { data, error } = await supabase
      .from('occasions')
      .select(
        `
        id,
        name,
        description,
        occasion_type_id,
        start_date,
        end_date,
        location,
        status,
        fiscal_year,
        archived_at,
        created_at,
        updated_at,
        created_by,
        occasion_type:occasion_types(name, icon),
        occasion_members(count)
      `
      )
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Failed to fetch occasion detail:', error?.message)
      throw new Error(error?.message || 'Occasion not found.')
    }

    // Resolve creator name if available
    let creatorName: string | null = null
    if (data.created_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.created_by)
        .maybeSingle()
      creatorName = profile?.display_name || null
    }

    // Secure Document Count (strictly RLS-filtered)
    const { count: docCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('occasion_id', id)

    const memberCount = (data as any).occasion_members?.[0]?.count ?? 0
    const typeInfo = Array.isArray((data as any).occasion_type)
      ? (data as any).occasion_type[0]
      : (data as any).occasion_type

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      occasion_type_id: data.occasion_type_id,
      type_name: typeInfo?.name || null,
      type_icon: typeInfo?.icon || null,
      start_date: data.start_date,
      end_date: data.end_date,
      location: data.location,
      status: data.status,
      fiscal_year: data.fiscal_year,
      archived_at: data.archived_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by,
      creator_name: creatorName,
      document_count: docCount ?? 0,
      member_count: memberCount,
    }
  },

  /**
   * Fetch occasion participants (Rule 15, 27, 48: safe directory fields only).
   */
  async fetchOccasionMembers(occasionId: string): Promise<OccasionMemberItem[]> {
    const { data, error } = await supabase
      .from('occasion_members')
      .select(
        `
        id,
        member_id,
        role,
        created_at,
        member:members(id, first_name, last_name, position_title)
      `
      )
      .eq('occasion_id', occasionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch occasion members:', error.message)
      throw error
    }

    return (data || []).map((row: any) => {
      const m = row.member
      const fullName = m ? `${m.first_name || ''} ${m.last_name || ''}`.trim() : 'Unknown Member'
      return {
        id: row.id,
        member_id: row.member_id,
        name: fullName || 'Unnamed Member',
        position: m?.position_title || null,
        role: row.role || null,
        created_at: row.created_at,
      }
    })
  },

  /**
   * Fetch active occasion types for taxonomy select.
   */
  async fetchOccasionTypes(): Promise<OccasionType[]> {
    const { data, error } = await supabase
      .from('occasion_types')
      .select('id, name, description, icon, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch occasion types:', error.message)
      throw error
    }

    return data || []
  },

  /**
   * Safe Member Directory (Rule 15 & 48: only safe non-sensitive columns).
   */
  async fetchSafeMemberDirectory(): Promise<SafeMemberDirectoryItem[]> {
    const { data, error } = await supabase
      .from('members')
      .select('id, first_name, last_name, position_title, email')
      .eq('status', 'active')
      .is('archived_at', null)
      .order('first_name', { ascending: true })

    if (error) {
      console.error('Failed to fetch member directory:', error.message)
      throw error
    }

    return (data || []).map((m) => ({
      id: m.id,
      full_name: `${m.first_name || ''} ${m.last_name || ''}`.trim(),
      position_title: m.position_title || null,
      email: m.email || null,
    }))
  },

  /**
   * Create Occasion via secure database RPC (Rule 17).
   */
  async createOccasion(
    values: CreateOccasionFormValues,
    initialMembers: Array<{ member_id: string; role?: string }> = []
  ): Promise<string> {
    const { data, error } = await supabase.rpc('create_occasion', {
      p_name: values.name.trim(),
      p_description: values.description?.trim() || undefined,
      p_occasion_type_id: values.occasion_type_id || undefined,
      p_start_date: values.start_date || undefined,
      p_end_date: values.end_date || undefined,
      p_location: values.location?.trim() || undefined,
      p_status: values.status,
      p_fiscal_year: values.fiscal_year?.trim() || undefined,
      p_members: initialMembers as any,
    })

    if (error || !data) {
      console.error('Create occasion RPC failed:', error)
      throw new Error(error?.message || 'Failed to create occasion.')
    }

    return data as string
  },

  /**
   * Update Occasion metadata via secure database RPC (Rule 30).
   */
  async updateOccasion(id: string, values: EditOccasionFormValues): Promise<void> {
    const { error } = await supabase.rpc('update_occasion', {
      p_occasion_id: id,
      p_name: values.name.trim(),
      p_description: values.description?.trim() || undefined,
      p_occasion_type_id: values.occasion_type_id || undefined,
      p_start_date: values.start_date || undefined,
      p_end_date: values.end_date || undefined,
      p_location: values.location?.trim() || undefined,
      p_status: values.status,
      p_fiscal_year: values.fiscal_year?.trim() || undefined,
    })

    if (error) {
      console.error('Update occasion RPC failed:', error)
      throw new Error(error.message || 'Failed to update occasion.')
    }
  },

  /**
   * Archive Occasion via secure database RPC (Rule 31).
   */
  async archiveOccasion(id: string): Promise<void> {
    const { error } = await supabase.rpc('archive_occasion', {
      p_occasion_id: id,
    })

    if (error) {
      console.error('Archive occasion RPC failed:', error)
      throw new Error(error.message || 'Failed to archive occasion.')
    }
  },

  /**
   * Restore Occasion via secure database RPC (Rule 32).
   */
  async restoreOccasion(id: string): Promise<void> {
    const { error } = await supabase.rpc('restore_occasion', {
      p_occasion_id: id,
    })

    if (error) {
      console.error('Restore occasion RPC failed:', error)
      throw new Error(error.message || 'Failed to restore occasion.')
    }
  },

  /**
   * Add Participant via secure database RPC (Rule 28).
   */
  async addParticipant(occasionId: string, memberId: string, role?: string): Promise<void> {
    const { error } = await supabase.rpc('add_occasion_member', {
      p_occasion_id: occasionId,
      p_member_id: memberId,
      p_role: role?.trim() || undefined,
    })

    if (error) {
      console.error('Add participant RPC failed:', error)
      throw new Error(error.message || 'Failed to add participant.')
    }
  },

  /**
   * Remove Participant via secure database RPC (Rule 29).
   */
  async removeParticipant(occasionId: string, memberId: string): Promise<void> {
    const { error } = await supabase.rpc('remove_occasion_member', {
      p_occasion_id: occasionId,
      p_member_id: memberId,
    })

    if (error) {
      console.error('Remove participant RPC failed:', error)
      throw new Error(error.message || 'Failed to remove participant.')
    }
  },
}
