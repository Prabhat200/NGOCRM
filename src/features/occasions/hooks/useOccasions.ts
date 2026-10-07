import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { occasionService } from '../services/occasion.service'
import type { OccasionFiltersState } from '../types/occasion.types'
import type { CreateOccasionFormValues, EditOccasionFormValues } from '../schemas/occasion.schema'

export function useOccasions(filters: OccasionFiltersState) {
  return useQuery({
    queryKey: ['occasions', 'list', filters],
    queryFn: () => occasionService.fetchOccasions(filters),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  })
}

export function useOccasion(id?: string) {
  return useQuery({
    queryKey: ['occasions', 'detail', id],
    queryFn: () => occasionService.fetchOccasion(id!),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  })
}

export function useOccasionMembers(occasionId?: string) {
  return useQuery({
    queryKey: ['occasions', 'members', occasionId],
    queryFn: () => occasionService.fetchOccasionMembers(occasionId!),
    enabled: Boolean(occasionId),
    staleTime: 30 * 1000,
  })
}

export function useOccasionTypes() {
  return useQuery({
    queryKey: ['occasions', 'types'],
    queryFn: () => occasionService.fetchOccasionTypes(),
    staleTime: 10 * 60 * 1000,
  })
}

export function useSafeMemberDirectory() {
  return useQuery({
    queryKey: ['occasions', 'safe-members'],
    queryFn: () => occasionService.fetchSafeMemberDirectory(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateOccasion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      values,
      initialMembers,
    }: {
      values: CreateOccasionFormValues
      initialMembers?: Array<{ member_id: string; role?: string }>
    }) => occasionService.createOccasion(values, initialMembers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occasions', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateOccasion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: EditOccasionFormValues }) =>
      occasionService.updateOccasion(id, values),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['occasions', 'detail', id] })
      queryClient.invalidateQueries({ queryKey: ['occasions', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useArchiveOccasion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => occasionService.archiveOccasion(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['occasions', 'detail', id] })
      queryClient.invalidateQueries({ queryKey: ['occasions', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useRestoreOccasion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => occasionService.restoreOccasion(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['occasions', 'detail', id] })
      queryClient.invalidateQueries({ queryKey: ['occasions', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useAddParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      occasionId,
      memberId,
      role,
    }: {
      occasionId: string
      memberId: string
      role?: string
    }) => occasionService.addParticipant(occasionId, memberId, role),
    onSuccess: (_, { occasionId }) => {
      queryClient.invalidateQueries({ queryKey: ['occasions', 'members', occasionId] })
      queryClient.invalidateQueries({ queryKey: ['occasions', 'detail', occasionId] })
    },
  })
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ occasionId, memberId }: { occasionId: string; memberId: string }) =>
      occasionService.removeParticipant(occasionId, memberId),
    onSuccess: (_, { occasionId }) => {
      queryClient.invalidateQueries({ queryKey: ['occasions', 'members', occasionId] })
      queryClient.invalidateQueries({ queryKey: ['occasions', 'detail', occasionId] })
    },
  })
}
