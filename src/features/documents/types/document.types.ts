export type DocumentAccessMode = 'organization' | 'restricted' | 'private'
export type DocumentConfidentiality = 'general' | 'internal' | 'restricted' | 'confidential'
export type DocumentStatus = 'draft' | 'under_review' | 'final' | 'archived'

export interface DocumentListItem {
  id: string
  organization_id: string
  title: string
  description: string | null
  document_number: string | null
  status: DocumentStatus
  access_mode: DocumentAccessMode
  confidentiality: DocumentConfidentiality
  document_date: string | null
  updated_at: string
  created_at: string
  archived_at: string | null
  category_id: string | null
  category_name: string | null
  occasion_id: string | null
  occasion_name: string | null
  current_version_id: string | null
  current_version_number: number | null
  mime_type: string | null
  file_size: number | null
  is_favorite: boolean
}

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  storage_bucket: string
  storage_path: string
  original_filename: string
  file_extension: string | null
  mime_type: string | null
  file_size: number | null
  checksum: string | null
  change_note: string | null
  uploaded_by: string
  uploader_name: string | null
  uploaded_at: string
}

export interface DocumentDetail extends DocumentListItem {
  owner_group_id: string | null
  owner_group_name: string | null
  fiscal_year: string | null
  expires_at: string | null
  created_by: string
  creator_name: string | null
  current_version: DocumentVersion | null
  tags: { id: string; name: string }[]
}

export interface DocumentFilterParams {
  search?: string
  categoryId?: string
  occasionId?: string
  ownerGroupId?: string
  status?: string
  accessMode?: string
  viewTab?: 'all' | 'favorites' | 'archived'
  page?: number
  pageSize?: number
}

export interface DocumentAccessUserGrant {
  id: string
  user_id: string
  access_level: 'view' | 'edit' | 'manage'
  display_name: string
  position_title: string | null
}

export interface DocumentAccessGroupGrant {
  id: string
  group_id: string
  access_level: 'view' | 'edit' | 'manage'
  group_name: string
  group_type: string
}

export interface DocumentAccessRoleGrant {
  id: string
  role_id: string
  access_level: 'view' | 'edit' | 'manage'
  role_name: string
  role_slug: string
}

export interface DocumentAccessData {
  users: DocumentAccessUserGrant[]
  groups: DocumentAccessGroupGrant[]
  roles: DocumentAccessRoleGrant[]
}
