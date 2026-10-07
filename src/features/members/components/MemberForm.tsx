import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberFormSchema, type MemberFormValues } from '../schemas/member.schema'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface MemberFormProps {
  initialValues?: Partial<MemberFormValues>
  onSubmit: (values: MemberFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function MemberForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save Member',
}: MemberFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      first_name: initialValues?.first_name || '',
      middle_name: initialValues?.middle_name || '',
      last_name: initialValues?.last_name || '',
      membership_number: initialValues?.membership_number || '',
      email: initialValues?.email || '',
      phone: initialValues?.phone || '',
      address: initialValues?.address || '',
      position_title: initialValues?.position_title || '',
      joined_at: initialValues?.joined_at || '',
      left_at: initialValues?.left_at || '',
      status: initialValues?.status || 'active',
      notes: initialValues?.notes || '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-1.5">
          Basic Identity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              First Name <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('first_name')}
              placeholder="e.g. Ram"
              className="text-xs h-9 bg-white"
            />
            {errors.first_name && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Middle Name</label>
            <Input
              {...register('middle_name')}
              placeholder="e.g. Bahadur"
              className="text-xs h-9 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register('last_name')}
              placeholder="e.g. Sharma"
              className="text-xs h-9 bg-white"
            />
            {errors.last_name && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.last_name.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Organizational Details */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-1.5">
          Organization Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Membership Number</label>
            <Input
              {...register('membership_number')}
              placeholder="e.g. MEM-001"
              className="text-xs h-9 bg-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Position / Title</label>
            <Input
              {...register('position_title')}
              placeholder="e.g. President, Coordinator"
              className="text-xs h-9 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('status')}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="former">Former Member</option>
            </select>
            {errors.status && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.status.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Joined Date</label>
            <Input {...register('joined_at')} type="date" className="text-xs h-9 bg-white" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Left Date</label>
            <Input {...register('left_at')} type="date" className="text-xs h-9 bg-white" />
          </div>
        </div>
      </div>

      {/* Contact Details (Admin only) */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-1.5">
          Contact Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Email Address</label>
            <Input
              {...register('email')}
              type="email"
              placeholder="ram@example.org"
              className="text-xs h-9 bg-white"
            />
            {errors.email && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Phone Number</label>
            <Input
              {...register('phone')}
              placeholder="+977-9800000000"
              className="text-xs h-9 bg-white"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Address</label>
          <Input
            {...register('address')}
            placeholder="Kathmandu, Nepal"
            className="text-xs h-9 bg-white"
          />
        </div>
      </div>

      {/* Admin Notes */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Administrative Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Internal notes about this member (only visible to administrators)..."
          className="w-full rounded-lg border border-slate-200 p-2.5 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-y"
        />
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-9 text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
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
