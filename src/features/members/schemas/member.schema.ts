import { z } from 'zod'

export const memberFormSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, 'First name is required.')
    .max(100, 'First name cannot exceed 100 characters.'),
  middle_name: z.string().trim().max(100).optional().or(z.literal('')),
  last_name: z
    .string()
    .trim()
    .min(1, 'Last name is required.')
    .max(100, 'Last name cannot exceed 100 characters.'),
  membership_number: z.string().trim().max(50).optional().or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('Invalid email address.')
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  address: z.string().trim().max(255).optional().or(z.literal('')),
  position_title: z.string().trim().max(100).optional().or(z.literal('')),
  joined_at: z.string().optional().or(z.literal('')),
  left_at: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'suspended', 'former']),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
})

export type MemberFormValues = z.infer<typeof memberFormSchema>

export const invitePortalUserSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Please enter a valid email address.'),
  role_id: z.string().uuid('Please select a valid portal role.'),
})

export type InvitePortalUserFormValues = z.infer<typeof invitePortalUserSchema>
