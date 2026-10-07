import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupService } from '../services/group.service'
import type { GroupFiltersState } from '../types/group.types'
import type { GroupFormValues } from '../schemas/group.schema'

export function useGroups(filters: GroupFiltersState) {
  return useQuery({
    queryKey: ['groups', 'list', filters],
    queryFn: () => groupService.fetchGroups(filters),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  })
}

export function useGroup(groupId?: string) {
  return useQuery({
    queryKey: ['groups', 'detail', groupId],
    queryFn: () => groupService.fetchGroupDetail(groupId!),
    enabled: Boolean(groupId),
    staleTime: 30 * 1000,
  })
}

export function useGroupMembers(groupId?: string) {
  return useQuery({
    queryKey: ['groups', 'members', groupId],
    queryFn: () => groupService.fetchGroupMembers(groupId!),
    enabled: Boolean(groupId),
    staleTime: 30 * 1000,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ values, organizationId }: { values: GroupFormValues; organizationId: string }) =>
      groupService.createGroup(values, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, values }: { groupId: string; values: GroupFormValues }) =>
      groupService.updateGroup(groupId, values),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['groups', 'detail', variables.groupId] })
    },
  })
}

export function useArchiveGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) => groupService.archiveGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['groups', 'detail', groupId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useRestoreGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) => groupService.restoreGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['groups', 'detail', groupId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useAddGroupMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      groupId,
      memberId,
      roleInGroup,
      joinedAt,
    }: {
      groupId: string
      memberId: string
      roleInGroup?: string
      joinedAt?: string
    }) => groupService.addGroupMember(groupId, memberId, roleInGroup, joinedAt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'members', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups', 'detail', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      groupService.removeGroupMember(groupId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'members', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups', 'detail', variables.groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}
