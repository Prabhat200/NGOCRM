import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchDocumentCategories,
  createDocumentCategory,
  updateDocumentCategory,
  fetchOccasionTypes,
  createOccasionType,
  updateOccasionType,
  fetchSystemPermissions,
  fetchRolesWithDetails,
  updateRolePermissions,
  createCustomRole,
  deleteCustomRole,
  updateOrganization,
} from '../services/settings.service'
import { OrganizationSettingsFormValues } from '../types/settings.types'

// Categories
export function useDocumentCategories() {
  return useQuery({
    queryKey: ['settings', 'document-categories'],
    queryFn: fetchDocumentCategories,
    staleTime: 1000 * 60,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, description, icon }: { name: string; description?: string; icon?: string }) =>
      createDocumentCategory(name, description, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'document-categories'] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      name,
      description,
      icon,
      isActive,
    }: {
      id: string
      name: string
      description?: string
      icon?: string
      isActive: boolean
    }) => updateDocumentCategory(id, name, description, icon, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'document-categories'] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

// Occasion Types
export function useOccasionTypes() {
  return useQuery({
    queryKey: ['settings', 'occasion-types'],
    queryFn: fetchOccasionTypes,
    staleTime: 1000 * 60,
  })
}

export function useCreateOccasionType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, description, icon }: { name: string; description?: string; icon?: string }) =>
      createOccasionType(name, description, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'occasion-types'] })
      queryClient.invalidateQueries({ queryKey: ['occasions', 'types'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useUpdateOccasionType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      name,
      description,
      icon,
      isActive,
    }: {
      id: string
      name: string
      description?: string
      icon?: string
      isActive: boolean
    }) => updateOccasionType(id, name, description, icon, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'occasion-types'] })
      queryClient.invalidateQueries({ queryKey: ['occasions', 'types'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

// Roles & Permissions
export function useSystemPermissions() {
  return useQuery({
    queryKey: ['settings', 'permissions'],
    queryFn: fetchSystemPermissions,
    staleTime: 1000 * 60 * 10, // 10 minutes (static catalog)
  })
}

export function useRolesWithDetails() {
  return useQuery({
    queryKey: ['settings', 'roles'],
    queryFn: fetchRolesWithDetails,
    staleTime: 1000 * 30,
  })
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] })
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useCreateCustomRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      name,
      description,
      permissionIds,
    }: {
      name: string
      description?: string
      permissionIds: string[]
    }) => createCustomRole(name, description, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useDeleteCustomRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => deleteCustomRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

// Organization
export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: OrganizationSettingsFormValues) => updateOrganization(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}
