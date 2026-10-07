import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, Search, UserCheck } from 'lucide-react'
import { addParticipantSchema, type AddParticipantFormValues } from '../schemas/occasion.schema'
import { useSafeMemberDirectory } from '../hooks/useOccasions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddParticipantDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: AddParticipantFormValues) => Promise<void>
  isSubmitting: boolean
  existingMemberIds?: string[]
}

export function AddParticipantDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  existingMemberIds = [],
}: AddParticipantDialogProps) {
  const [memberSearch, setMemberSearch] = useState('')
  const { data: directory = [], isLoading } = useSafeMemberDirectory()

  const {
    handleSubmit,
    setValue,
    control,
    register,
    formState: { errors },
  } = useForm<AddParticipantFormValues>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: {
      member_id: '',
      role: '',
    },
  })

  const selectedMemberId = useWatch({ control, name: 'member_id' })

  if (!isOpen) return null

  // Filter out members who are already in the occasion and match search keyword
  const filteredMembers = directory.filter((m) => {
    if (existingMemberIds.includes(m.id)) return false
    if (!memberSearch.trim()) return true
    const term = memberSearch.toLowerCase()
    return (
      m.full_name.toLowerCase().includes(term) ||
      (m.position_title && m.position_title.toLowerCase().includes(term))
    )
  })

  const selectedMember = directory.find((m) => m.id === selectedMemberId)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-participant-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 id="add-participant-title" className="text-base font-bold text-slate-900">
              Add Person Involved
            </h2>
            <p className="text-xs text-slate-500">
              Select an active member and define their role in this occasion.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Member Search & Picker */}
          <div className="space-y-1.5">
            <Label htmlFor="search-member">Select Member *</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input
                id="search-member"
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search member by name or position..."
                className="pl-8 text-xs h-8.5"
              />
            </div>

            {/* Members List Box */}
            <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
              {isLoading ? (
                <p className="text-xs text-slate-400 p-3 text-center">Loading members...</p>
              ) : filteredMembers.length === 0 ? (
                <p className="text-xs text-slate-500 p-3 text-center italic">
                  {directory.length === 0
                    ? 'No active members available.'
                    : 'No matching members found.'}
                </p>
              ) : (
                filteredMembers.map((m) => {
                  const isSelected = selectedMemberId === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setValue('member_id', m.id, { shouldValidate: true })}
                      className={`w-full text-left p-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="block truncate font-medium">{m.full_name}</span>
                        {m.position_title && (
                          <span className="block text-[11px] text-slate-500 truncate">
                            {m.position_title}
                          </span>
                        )}
                      </div>
                      {isSelected && <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
            {errors.member_id && (
              <p className="text-xs text-rose-600">{errors.member_id.message}</p>
            )}
          </div>

          {selectedMember && (
            <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
              Selected: <strong>{selectedMember.full_name}</strong>
              {selectedMember.position_title && ` (${selectedMember.position_title})`}
            </div>
          )}

          {/* Occasion Role (Rule 16) */}
          <div className="space-y-1.5">
            <Label htmlFor="participant-role">Role in Occasion</Label>
            <Input
              id="participant-role"
              {...register('role')}
              placeholder="e.g. Coordinator, Speaker, Volunteer, Guest, Chair"
              className="text-xs h-9"
            />
            <p className="text-[11px] text-slate-400">
              Optional function or assignment during this event.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !selectedMemberId}>
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              <span>Add Person</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
