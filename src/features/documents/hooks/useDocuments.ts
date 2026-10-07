import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentService } from '../services/document.service'
import type {
  DocumentFilterParams,
  DocumentAccessMode,
} from '../types/document.types'
import type {
  EditDocumentMetadataFormValues,
} from '../schemas/document.schema'

export function useDocuments(params: DocumentFilterParams) {
  return useQuery({
    queryKey: ['documents', 'list', params],
    queryFn: () => documentService.fetchDocuments(params),
    staleTime: 30 * 1000,
  })
}

export function useDocument(id?: string) {
  return useQuery({
    queryKey: ['documents', 'detail', id],
    queryFn: () => documentService.fetchDocumentDetail(id!),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  })
}

export function useDocumentVersions(documentId?: string) {
  return useQuery({
    queryKey: ['documents', 'versions', documentId],
    queryFn: () => documentService.fetchDocumentVersions(documentId!),
    enabled: Boolean(documentId),
    staleTime: 30 * 1000,
  })
}

export function useDocumentTaxonomy() {
  return useQuery({
    queryKey: ['documents', 'taxonomy'],
    queryFn: () => documentService.fetchTaxonomyOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useDocumentAccess(documentId?: string) {
  return useQuery({
    queryKey: ['documents', 'access', documentId],
    queryFn: () => documentService.fetchDocumentAccessList(documentId!),
    enabled: Boolean(documentId),
    staleTime: 30 * 1000,
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ documentId, organizationId }: { documentId: string; organizationId: string }) =>
      documentService.toggleFavorite(documentId, organizationId),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail', documentId] })
    },
  })
}

export function useArchiveDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => documentService.archiveDocument(documentId),
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail', documentId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useRestoreDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => documentService.restoreDocument(documentId),
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail', documentId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateDocumentMetadata() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      documentId,
      values,
    }: {
      documentId: string
      values: EditDocumentMetadataFormValues
    }) => documentService.updateMetadata(documentId, values),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail', documentId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUploadNewVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      documentId,
      file,
      organizationId,
      changeNote,
    }: {
      documentId: string
      file: File
      organizationId: string
      changeNote?: string
    }) => documentService.uploadNewVersion(documentId, file, organizationId, changeNote),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'versions', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateDocumentAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      documentId,
      accessMode,
      userGrants,
      groupGrants,
      roleGrants,
    }: {
      documentId: string
      accessMode?: DocumentAccessMode
      userGrants?: Array<{ user_id: string; access_level: string; action?: 'grant' | 'revoke' }>
      groupGrants?: Array<{ group_id: string; access_level: string; action?: 'grant' | 'revoke' }>
      roleGrants?: Array<{ role_id: string; access_level: string; action?: 'grant' | 'revoke' }>
    }) => documentService.updateAccess(documentId, accessMode, userGrants, groupGrants, roleGrants),
    onSuccess: (_, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'access', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] })
    },
  })
}
