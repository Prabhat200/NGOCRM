import { supabase } from '@/lib/supabase/client'
import type {
  DocumentListItem,
  DocumentDetail,
  DocumentVersion,
  DocumentFilterParams,
  DocumentAccessData,
  DocumentAccessMode,
} from '../types/document.types'
import type {
  CreateDocumentFormValues,
  EditDocumentMetadataFormValues,
} from '../schemas/document.schema'

export interface TaxonomyOptions {
  categories: { id: string; name: string }[]
  occasions: { id: string; name: string }[]
  groups: { id: string; name: string }[]
}

interface RawDocListRow {
  id: string
  organization_id: string
  title: string
  description: string | null
  document_number: string | null
  status: string
  access_mode: string
  confidentiality: string
  document_date: string | null
  updated_at: string
  created_at: string
  archived_at: string | null
  category_id: string | null
  occasion_id: string | null
  current_version_id: string | null
  category?: { id: string; name: string } | null
  occasion?: { id: string; name: string } | null
  current_version?: {
    id: string
    version_number: number
    mime_type: string | null
    file_size: number | null
  } | null
}

export const documentService = {
  /**
   * Fetches paginated, filtered, RLS-protected documents.
   */
  async fetchDocuments(params: DocumentFilterParams): Promise<{
    documents: DocumentListItem[]
    totalCount: number
  }> {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch user's favorite document IDs for this organization
    let userFavoriteIds = new Set<string>()
    if (user) {
      const { data: favs } = await supabase
        .from('document_favorites')
        .select('document_id')
        .eq('user_id', user.id)

      if (favs) {
        userFavoriteIds = new Set(favs.map((f) => f.document_id))
      }
    }

    // 2. Build base query
    let query = supabase
      .from('documents')
      .select(
        `
        id,
        organization_id,
        title,
        description,
        document_number,
        status,
        access_mode,
        confidentiality,
        document_date,
        updated_at,
        created_at,
        archived_at,
        category_id,
        occasion_id,
        current_version_id,
        category:document_categories(id, name),
        occasion:occasions(id, name),
        current_version:document_versions!fk_documents_current_version(
          id,
          version_number,
          mime_type,
          file_size
        )
      `,
        { count: 'exact' }
      )

    // Tab filter
    if (params.viewTab === 'archived') {
      query = query.not('archived_at', 'is', null)
    } else {
      query = query.is('archived_at', null)
    }

    if (params.viewTab === 'favorites') {
      if (userFavoriteIds.size === 0) {
        return { documents: [], totalCount: 0 }
      }
      query = query.in('id', Array.from(userFavoriteIds))
    }

    // Search filter (Rule 6 & 7: title, description, document_number)
    if (params.search?.trim()) {
      const term = params.search.trim().replace(/%/g, '')
      query = query.or(
        `title.ilike.%${term}%,description.ilike.%${term}%,document_number.ilike.%${term}%`
      )
    }

    // Taxonomy filters
    if (params.categoryId) {
      query = query.eq('category_id', params.categoryId)
    }
    if (params.occasionId) {
      query = query.eq('occasion_id', params.occasionId)
    }
    if (params.ownerGroupId) {
      query = query.eq('owner_group_id', params.ownerGroupId)
    }
    if (params.status) {
      query = query.eq('status', params.status as 'draft' | 'under_review' | 'final' | 'archived')
    }
    if (params.accessMode) {
      query = query.eq('access_mode', params.accessMode as 'organization' | 'restricted' | 'private')
    }

    // Sorting and Pagination
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('Failed to fetch documents:', error.message)
      throw error
    }

    const rows = (data || []) as unknown as RawDocListRow[]

    const documents: DocumentListItem[] = rows.map((doc) => ({
      id: doc.id,
      organization_id: doc.organization_id,
      title: doc.title,
      description: doc.description,
      document_number: doc.document_number,
      status: doc.status as DocumentListItem['status'],
      access_mode: doc.access_mode as DocumentListItem['access_mode'],
      confidentiality: doc.confidentiality as DocumentListItem['confidentiality'],
      document_date: doc.document_date,
      updated_at: doc.updated_at,
      created_at: doc.created_at,
      archived_at: doc.archived_at,
      category_id: doc.category_id,
      category_name: doc.category?.name || null,
      occasion_id: doc.occasion_id,
      occasion_name: doc.occasion?.name || null,
      current_version_id: doc.current_version_id,
      current_version_number: doc.current_version?.version_number || null,
      mime_type: doc.current_version?.mime_type || null,
      file_size: doc.current_version?.file_size || null,
      is_favorite: userFavoriteIds.has(doc.id),
    }))

    return {
      documents,
      totalCount: count || 0,
    }
  },

  /**
   * Fetches single document details with version and taxonomy information.
   */
  async fetchDocumentDetail(id: string): Promise<DocumentDetail> {
    const { data, error } = await supabase
      .from('documents')
      .select(
        `
        id,
        organization_id,
        title,
        description,
        document_number,
        status,
        access_mode,
        confidentiality,
        document_date,
        fiscal_year,
        expires_at,
        created_by,
        updated_at,
        created_at,
        archived_at,
        category_id,
        occasion_id,
        owner_group_id,
        current_version_id,
        category:document_categories(id, name),
        occasion:occasions(id, name),
        owner_group:groups(id, name),
        current_version:document_versions!fk_documents_current_version(
          id,
          document_id,
          version_number,
          storage_bucket,
          storage_path,
          original_filename,
          file_extension,
          mime_type,
          file_size,
          checksum,
          change_note,
          uploaded_by,
          uploaded_at
        ),
        document_tags(tag:tags(id, name))
      `
      )
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Failed to fetch document detail:', error?.message)
      throw error || new Error('Document not found')
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Check favorite status
    let isFavorite = false
    if (user) {
      const { data: fav } = await supabase
        .from('document_favorites')
        .select('id')
        .eq('document_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      isFavorite = !!fav
    }

    // Resolve creator name
    let creatorName: string | null = null
    if (data.created_by) {
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('display_name, member:members(full_name)')
        .eq('id', data.created_by)
        .maybeSingle()
      const rawProfile = creatorProfile as unknown as { display_name: string | null; member?: { full_name: string } | null } | null
      creatorName = rawProfile?.member?.full_name || rawProfile?.display_name || 'Staff Member'
    }

    // Extract tags
    interface TagRelation {
      tag: { id: string; name: string } | null
    }
    const rawTags = (data.document_tags || []) as unknown as TagRelation[]
    const tags = rawTags
      .map((t) => t.tag)
      .filter((t): t is { id: string; name: string } => Boolean(t))

    const rawDoc = data as unknown as RawDocListRow & {
      owner_group_id: string | null
      owner_group?: { id: string; name: string } | null
      fiscal_year: string | null
      expires_at: string | null
      created_by: string
      current_version?: DocumentVersion | null
    }

    return {
      id: rawDoc.id,
      organization_id: rawDoc.organization_id,
      title: rawDoc.title,
      description: rawDoc.description,
      document_number: rawDoc.document_number,
      status: rawDoc.status as DocumentListItem['status'],
      access_mode: rawDoc.access_mode as DocumentListItem['access_mode'],
      confidentiality: rawDoc.confidentiality as DocumentListItem['confidentiality'],
      document_date: rawDoc.document_date,
      updated_at: rawDoc.updated_at,
      created_at: rawDoc.created_at,
      archived_at: rawDoc.archived_at,
      category_id: rawDoc.category_id,
      category_name: rawDoc.category?.name || null,
      occasion_id: rawDoc.occasion_id,
      occasion_name: rawDoc.occasion?.name || null,
      owner_group_id: rawDoc.owner_group_id,
      owner_group_name: rawDoc.owner_group?.name || null,
      fiscal_year: rawDoc.fiscal_year,
      expires_at: rawDoc.expires_at,
      created_by: rawDoc.created_by,
      creator_name: creatorName,
      current_version_id: rawDoc.current_version_id,
      current_version_number: rawDoc.current_version?.version_number || null,
      mime_type: rawDoc.current_version?.mime_type || null,
      file_size: rawDoc.current_version?.file_size || null,
      current_version: rawDoc.current_version || null,
      tags,
      is_favorite: isFavorite,
    }
  },

  /**
   * Secure Staged Document Upload Lifecycle (Rule 24, 25, 27).
   */
  async createDocumentWithFile(
    values: CreateDocumentFormValues,
    file: File,
    organizationId: string
  ): Promise<string> {
    // 1. Create logical document record and bootstrap manage access
    const { data: newDocId, error: createError } = await supabase.rpc('create_document', {
      p_title: values.title.trim(),
      p_description: values.description?.trim() || undefined,
      p_document_number: values.document_number?.trim() || undefined,
      p_category_id: values.category_id || undefined,
      p_occasion_id: values.occasion_id || undefined,
      p_owner_group_id: values.owner_group_id || undefined,
      p_document_date: values.document_date || undefined,
      p_fiscal_year: values.fiscal_year?.trim() || undefined,
      p_status: values.status,
      p_access_mode: values.access_mode,
      p_confidentiality: values.confidentiality,
      p_expires_at: values.expires_at || undefined,
    })

    if (createError || !newDocId) {
      console.error('Document creation RPC failed:', createError)
      throw new Error(createError?.message || 'Failed to initialize document record.')
    }

    const documentId = newDocId as string
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    // Standard Storage path: {organization_id}/{document_id}/{version_id}/{filename}
    const storagePath = `${organizationId}/${documentId}/v1/${cleanFileName}`

    // 2. Upload file to private Storage bucket
    const { error: uploadError } = await supabase.storage
      .from('ngo-documents')
      .upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload failed:', uploadError)
      // Cleanup orphan document on upload failure
      await supabase.from('documents').delete().eq('id', documentId)
      throw new Error(`File upload failed: ${uploadError.message}. Please try again.`)
    }

    // 3. Atomically create v1 and point current_version_id
    const ext = cleanFileName.includes('.') ? cleanFileName.split('.').pop() || null : null
    const { error: versionError } = await supabase.rpc('create_document_version', {
      p_document_id: documentId,
      p_original_filename: file.name,
      p_storage_path: storagePath,
      p_file_size: file.size,
      p_mime_type: file.type || undefined,
      p_file_extension: ext || undefined,
      p_change_note: values.change_note?.trim() || 'Initial version',
    })

    if (versionError) {
      console.error('Version metadata creation failed:', versionError)
      throw new Error(`Version finalization failed: ${versionError.message}`)
    }

    return documentId
  },

  /**
   * Uploads a new sequential version to an existing document (Rule 46 & 48).
   */
  async uploadNewVersion(
    documentId: string,
    file: File,
    organizationId: string,
    changeNote?: string
  ): Promise<void> {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const timestamp = Date.now()
    const storagePath = `${organizationId}/${documentId}/${timestamp}/${cleanFileName}`

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('ngo-documents')
      .upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`)
    }

    // 2. Create version record concurrency-safely via RPC
    const ext = cleanFileName.includes('.') ? cleanFileName.split('.').pop() || null : null
    const { error: versionError } = await supabase.rpc('create_document_version', {
      p_document_id: documentId,
      p_original_filename: file.name,
      p_storage_path: storagePath,
      p_file_size: file.size,
      p_mime_type: file.type || undefined,
      p_file_extension: ext || undefined,
      p_change_note: changeNote?.trim() || undefined,
    })

    if (versionError) {
      throw new Error(`Version creation failed: ${versionError.message}`)
    }
  },

  /**
   * Fetches full version history for a document.
   */
  async fetchDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    const { data, error } = await supabase
      .from('document_versions')
      .select(
        `
        id,
        document_id,
        version_number,
        storage_bucket,
        storage_path,
        original_filename,
        file_extension,
        mime_type,
        file_size,
        checksum,
        change_note,
        uploaded_by,
        uploaded_at
      `
      )
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })

    if (error) {
      console.error('Failed to fetch versions:', error.message)
      throw error
    }

    const rows = data || []
    const userIds = Array.from(new Set(rows.map((r) => r.uploaded_by)))

    // Lookup uploader names
    const profileMap = new Map<string, string>()
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, member:members(full_name)')
        .in('id', userIds)

      if (profiles) {
        for (const p of profiles as Array<{ id: string; display_name: string | null; member?: { full_name: string } | null }>) {
          profileMap.set(p.id, p.member?.full_name || p.display_name || 'Staff Member')
        }
      }
    }

    return rows.map((v) => ({
      ...v,
      uploader_name: profileMap.get(v.uploaded_by) || 'Staff Member',
    }))
  },

  /**
   * Securely downloads a document version file and triggers an audit log entry (Rule 38 & 39).
   */
  async downloadFile(
    documentId: string,
    storagePath: string,
    originalFilename: string,
    versionId?: string
  ): Promise<void> {
    // 1. Download file blob from private storage
    const { data: blob, error: downloadError } = await supabase.storage
      .from('ngo-documents')
      .download(storagePath)

    if (downloadError || !blob) {
      throw new Error(downloadError?.message || 'Failed to download document file.')
    }

    // 2. Record audit log via secure RPC
    await supabase.rpc('log_document_download', {
      p_document_id: documentId,
      p_version_id: versionId || undefined,
    })

    // 3. Trigger browser download safely
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = originalFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  },

  /**
   * Toggles favorite status for current user.
   */
  async toggleFavorite(documentId: string, organizationId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthenticated')

    const { data: existing } = await supabase
      .from('document_favorites')
      .select('id')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('document_favorites')
        .delete()
        .eq('document_id', documentId)
        .eq('user_id', user.id)
      return false
    } else {
      await supabase.from('document_favorites').insert({
        organization_id: organizationId,
        document_id: documentId,
        user_id: user.id,
      })
      return true
    }
  },

  /**
   * Archives a document (Rule 50).
   */
  async archiveDocument(documentId: string): Promise<void> {
    const { error } = await supabase.rpc('archive_document', {
      p_document_id: documentId,
    })
    if (error) {
      throw new Error(error.message)
    }
  },

  /**
   * Restores an archived document (Rule 51).
   */
  async restoreDocument(documentId: string): Promise<void> {
    const { error } = await supabase.rpc('restore_document', {
      p_document_id: documentId,
    })
    if (error) {
      throw new Error(error.message)
    }
  },

  /**
   * Updates safe document metadata (Rule 40).
   */
  async updateMetadata(
    documentId: string,
    values: EditDocumentMetadataFormValues
  ): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({
        title: values.title.trim(),
        description: values.description?.trim() || null,
        document_number: values.document_number?.trim() || null,
        category_id: values.category_id || null,
        occasion_id: values.occasion_id || null,
        owner_group_id: values.owner_group_id || null,
        document_date: values.document_date || null,
        fiscal_year: values.fiscal_year?.trim() || null,
        status: values.status,
        confidentiality: values.confidentiality,
        expires_at: values.expires_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (error) {
      throw new Error(error.message)
    }
  },

  /**
   * Fetches active access grants for a document.
   */
  async fetchDocumentAccessList(documentId: string): Promise<DocumentAccessData> {
    const { data, error } = await supabase.rpc('get_document_access_list', {
      p_document_id: documentId,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data as unknown as DocumentAccessData
  },

  /**
   * Manages document access mode and individual/group/role grants (Rule 42 & 43).
   */
  async updateAccess(
    documentId: string,
    accessMode: DocumentAccessMode | undefined,
    userGrants: Array<{ user_id: string; access_level: string; action?: 'grant' | 'revoke' }> = [],
    groupGrants: Array<{ group_id: string; access_level: string; action?: 'grant' | 'revoke' }> = [],
    roleGrants: Array<{ role_id: string; access_level: string; action?: 'grant' | 'revoke' }> = []
  ): Promise<void> {
    const { error } = await supabase.rpc('manage_document_access', {
      p_document_id: documentId,
      p_access_mode: accessMode || undefined,
      p_user_grants: userGrants,
      p_group_grants: groupGrants,
      p_role_grants: roleGrants,
    })

    if (error) {
      throw new Error(error.message)
    }
  },

  /**
   * Fetches taxonomy dropdown options (categories, occasions, groups) for the current organization.
   */
  async fetchTaxonomyOptions(): Promise<TaxonomyOptions> {
    const [catsRes, occsRes, groupsRes] = await Promise.all([
      supabase.from('document_categories').select('id, name').order('name'),
      supabase.from('occasions').select('id, name').is('archived_at', null).order('name'),
      supabase.from('groups').select('id, name').is('archived_at', null).order('name'),
    ])

    return {
      categories: catsRes.data || [],
      occasions: occsRes.data || [],
      groups: groupsRes.data || [],
    }
  },
}
