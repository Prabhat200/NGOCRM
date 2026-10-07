import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { groupFormSchema, type GroupFormValues } from '../schemas/group.schema'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface GroupFormProps {
  initialValues?: Partial<GroupFormValues>
  onSubmit: (values: GroupFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function GroupForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save Group',
}: GroupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: initialValues?.name || '',
      type: initialValues?.type || 'committee',
      description: initialValues?.description || '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">
          Group Name <span className="text-rose-500">*</span>
        </label>
        <Input
          {...register('name')}
          placeholder="e.g. Executive Committee, Finance Team"
          className="text-xs h-9 bg-white"
        />
        {errors.name && (
          <p className="text-[11px] text-rose-500 font-medium">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">
          Group Type <span className="text-rose-500">*</span>
        </label>
        <select
          {...register('type')}
          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
        >
          <option value="committee">Committee (Governance & Advisory)</option>
          <option value="department">Department (Operations & Functional)</option>
          <option value="team">Team (Project & Initiative)</option>
          <option value="custom">Custom Group</option>
        </select>
        {errors.type && (
          <p className="text-[11px] text-rose-500 font-medium">{errors.type.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Brief description of the group's purpose and mandate..."
          className="w-full rounded-lg border border-slate-200 p-2.5 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-y"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-9 text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="h-9 text-xs bg-blue-600 hover:bg-blue-700 gap-1.5"
        >
          {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{submitLabel}</span>
        </Button>
      </div>
    </form>
  )
}
