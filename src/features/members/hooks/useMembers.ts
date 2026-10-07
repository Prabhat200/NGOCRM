import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memberService } from '../services/member.service'
import type { MemberFiltersState } from '../types/member.types'
import type { MemberFormValues } from '../schemas/member.schema'

export function useMembers(filters: MemberFiltersState, canViewSensitive: boolean = false) {
  return useQuery({
    queryKey: ['members', 'list', filters, canViewSensitive],
    queryFn: () => memberService.fetchMembers(filters, canViewSensitive),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  })
}

export function useMember(memberId?: string, canViewSensitive: boolean = false) {
  return useQuery({
    queryKey: ['members', 'detail', memberId, canViewSensitive],
    queryFn: () => memberService.fetchMemberDetail(memberId!, canViewSensitive),
    enabled: Boolean(memberId),
    staleTime: 30 * 1000,
  })
}

export function useSafeMemberDirectory() {
  return useQuery({
    queryKey: ['members', 'safe-directory'],
    queryFn: () => memberService.fetchSafeMemberDirectory(),
    staleTime: 5 * 60 * 1000,
  })
}

export function usePortalRoles() {
  return useQuery({
    queryKey: ['portal', 'roles'],
    queryFn: () => memberService.fetchPortalRoles(),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ values, organizationId }: { values: MemberFormValues; organizationId: string }) =>
      memberService.createMember(values, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, values }: { memberId: string; values: MemberFormValues }) =>
      memberService.updateMember(memberId, values),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['members', 'detail', variables.memberId] })
    },
  })
}

export function useArchiveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) => memberService.archiveMember(memberId),
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['members', 'detail', memberId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useRestoreMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) => memberService.restoreMember(memberId),
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['members', 'detail', memberId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useInvitePortalUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      memberId,
      email,
      roleId,
    }: {
      memberId: string
      email: string
      roleId: string
    }) => memberService.invitePortalUser(memberId, email, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members', 'detail', variables.memberId] })
      queryClient.invalidateQueries({ queryKey: ['members', 'list'] })
    },
  })
}

export function useUpdatePortalStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      newStatus,
    }: {
      userId: string
      newStatus: 'active' | 'suspended' | 'disabled'
      memberId?: string
    }) => memberService.updatePortalStatus(userId, newStatus),
    onSuccess: (_, variables) => {
      if (variables.memberId) {
        queryClient.invalidateQueries({ queryKey: ['members', 'detail', variables.memberId] })
      }
      queryClient.invalidateQueries({ queryKey: ['members', 'list'] })
    },
  })
}

export function useUpdatePortalRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      roleIds,
    }: {
      userId: string
      roleIds: string[]
      memberId?: string
    }) => memberService.updatePortalRoles(userId, roleIds),
    onSuccess: (_, variables) => {
      if (variables.memberId) {
        queryClient.invalidateQueries({ queryKey: ['members', 'detail', variables.memberId] })
      }
      queryClient.invalidateQueries({ queryKey: ['members', 'list'] })
    },
  })
}
