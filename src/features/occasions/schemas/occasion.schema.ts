import { z } from 'zod'

export const createOccasionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Occasion name is required.')
      .max(255, 'Name cannot exceed 255 characters.'),
    occasion_type_id: z.string().uuid('Please select an occasion type.').optional().or(z.literal('')),
    start_date: z.string().optional().or(z.literal('')),
    end_date: z.string().optional().or(z.literal('')),
    location: z.string().trim().max(255, 'Location cannot exceed 255 characters.').optional().or(z.literal('')),
    description: z.string().trim().max(2000, 'Description cannot exceed 2000 characters.').optional().or(z.literal('')),
    status: z.enum(['planned', 'ongoing', 'completed', 'cancelled', 'archived']),
    fiscal_year: z.string().trim().max(50, 'Fiscal year cannot exceed 50 characters.').optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.end_date >= data.start_date
      }
      return true
    },
    {
      message: 'End date cannot be earlier than start date.',
      path: ['end_date'],
    }
  )

export type CreateOccasionFormValues = z.infer<typeof createOccasionSchema>

export const editOccasionSchema = createOccasionSchema
export type EditOccasionFormValues = z.infer<typeof editOccasionSchema>

export const addParticipantSchema = z.object({
  member_id: z.string().uuid('Please select a member.'),
  role: z.string().trim().max(100, 'Role cannot exceed 100 characters.').optional().or(z.literal('')),
})

export type AddParticipantFormValues = z.infer<typeof addParticipantSchema>
