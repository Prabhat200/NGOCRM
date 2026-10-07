import { useState } from 'react'
import { Plus, Users, UserMinus, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AddParticipantDialog } from './AddParticipantDialog'
import {
  useOccasionMembers,
  useAddParticipant,
  useRemoveParticipant,
} from '../hooks/useOccasions'
import type { AddParticipantFormValues } from '../schemas/occasion.schema'

interface OccasionMembersProps {
  occasionId: string
  canEdit: boolean
}

export function OccasionMembers({ occasionId, canEdit }: OccasionMembersProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const { data: members = [], isLoading } = useOccasionMembers(occasionId)

  const addParticipantMutation = useAddParticipant()
  const removeParticipantMutation = useRemoveParticipant()

  const handleAddParticipant = async (values: AddParticipantFormValues) => {
    await addParticipantMutation.mutateAsync({
      occasionId,
      memberId: values.member_id,
      role: values.role,
    })
    setIsAddOpen(false)
  }

  const handleRemove = async (memberId: string) => {
    await removeParticipantMutation.mutateAsync({
      occasionId,
      memberId,
    })
  }

  const existingMemberIds = members.map((m) => m.member_id)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              People & Participants Involved
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Organizers, volunteers, guests, and attendees assigned to this occasion.
            </p>
          </div>

          {canEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="gap-1.5 text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Person</span>
            </Button>
          )}
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-slate-100 flex items-center justify-between"
                >
                  <div className="space-y-1.5 flex-1 pr-4">
                    <Skeleton className="h-4 w-1/3 rounded" />
                    <Skeleton className="h-3 w-1/4 rounded" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">No participants recorded</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                  Record members, committee coordinators, or volunteers involved in this activity.
                </p>
              </div>
              {canEdit && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddOpen(true)}
                    className="gap-1.5 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Participant</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((person) => (
                <div
                  key={person.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {person.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-900 truncate">
                        {person.name}
                      </span>
                      {person.position && (
                        <span className="block text-[11px] text-slate-500 truncate">
                          {person.position}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {person.role ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                        <Shield className="w-3 h-3 text-blue-500" />
                        <span>{person.role}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Participant</span>
                    )}

                    {canEdit && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(person.member_id)}
                        disabled={removeParticipantMutation.isPending}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-7 w-7 p-0 rounded-lg transition-colors"
                        aria-label={`Remove ${person.name} from occasion`}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Participant Dialog */}
      <AddParticipantDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddParticipant}
        isSubmitting={addParticipantMutation.isPending}
        existingMemberIds={existingMemberIds}
      />
    </>
  )
}
