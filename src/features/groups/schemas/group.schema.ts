import { z } from 'zod'

export const groupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Group or committee name is required.')
    .max(255, 'Name cannot exceed 255 characters.'),
  type: z.enum(['committee', 'department', 'team', 'custom']),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters.').optional().or(z.literal('')),
})

export type GroupFormValues = z.infer<typeof groupFormSchema>

export const addGroupMemberSchema = z.object({
  member_id: z.string().uuid('Please select an active member.'),
  role_in_group: z.string().trim().max(100, 'Role cannot exceed 100 characters.').optional().or(z.literal('')),
  joined_at: z.string().optional().or(z.literal('')),
})

export type AddGroupMemberFormValues = z.infer<typeof addGroupMemberSchema>
