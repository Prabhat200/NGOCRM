import { z } from 'zod'

export const createDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Document title is required.')
    .max(255, 'Title cannot exceed 255 characters.'),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  document_number: z.string().trim().max(100).optional().or(z.literal('')),
  category_id: z.string().uuid('Please select a valid category.').optional().or(z.literal('')),
  occasion_id: z.string().uuid('Please select a valid occasion.').optional().or(z.literal('')),
  owner_group_id: z.string().uuid('Please select a valid committee or group.').optional().or(z.literal('')),
  document_date: z.string().optional().or(z.literal('')),
  fiscal_year: z.string().trim().max(50).optional().or(z.literal('')),
  status: z.enum(['draft', 'final']),
  access_mode: z.enum(['organization', 'restricted', 'private']),
  confidentiality: z.enum(['general', 'internal', 'restricted', 'confidential']),
  expires_at: z.string().optional().or(z.literal('')),
  change_note: z.string().trim().max(500).optional().or(z.literal('')),
})

export type CreateDocumentFormValues = z.infer<typeof createDocumentSchema>

export const editDocumentMetadataSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Document title is required.')
    .max(255, 'Title cannot exceed 255 characters.'),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  document_number: z.string().trim().max(100).optional().or(z.literal('')),
  category_id: z.string().uuid().optional().or(z.literal('')),
  occasion_id: z.string().uuid().optional().or(z.literal('')),
  owner_group_id: z.string().uuid().optional().or(z.literal('')),
  document_date: z.string().optional().or(z.literal('')),
  fiscal_year: z.string().trim().max(50).optional().or(z.literal('')),
  status: z.enum(['draft', 'final', 'under_review', 'archived']),
  confidentiality: z.enum(['general', 'internal', 'restricted', 'confidential']),
  expires_at: z.string().optional().or(z.literal('')),
})

export type EditDocumentMetadataFormValues = z.infer<typeof editDocumentMetadataSchema>

export const uploadVersionSchema = z.object({
  change_note: z.string().trim().max(500).optional().or(z.literal('')),
})

export type UploadVersionFormValues = z.infer<typeof uploadVersionSchema>
