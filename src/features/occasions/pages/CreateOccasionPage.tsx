import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  createOccasionSchema,
  type CreateOccasionFormValues,
} from '../schemas/occasion.schema'
import {
  useCreateOccasion,
  useOccasionTypes,
  useSafeMemberDirectory,
} from '../hooks/useOccasions'

interface InitialParticipant {
  member_id: string
  name: string
  position?: string | null
  role?: string
}

export function CreateOccasionPage() {
  const navigate = useNavigate()
  const { data: types = [] } = useOccasionTypes()
  const { data: directory = [] } = useSafeMemberDirectory()

  const [participants, setParticipants] = useState<InitialParticipant[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [participantRole, setParticipantRole] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const createOccasionMutation = useCreateOccasion()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOccasionFormValues>({
    resolver: zodResolver(createOccasionSchema),
    defaultValues: {
      name: '',
      occasion_type_id: '',
      start_date: '',
      end_date: '',
      location: '',
      status: 'planned',
      fiscal_year: '',
      description: '',
    },
  })

  const handleAddParticipant = () => {
    if (!selectedMemberId) return
    const member = directory.find((m) => m.id === selectedMemberId)
    if (!member) return

    if (!participants.some((p) => p.member_id === selectedMemberId)) {
      setParticipants((prev) => [
        ...prev,
        {
          member_id: member.id,
          name: member.full_name,
          position: member.position_title,
          role: participantRole.trim() || undefined,
        },
      ])
    }

    setSelectedMemberId('')
    setParticipantRole('')
  }

  const handleRemoveParticipant = (memberId: string) => {
    setParticipants((prev) => prev.filter((p) => p.member_id !== memberId))
  }

  const onSubmit = async (values: CreateOccasionFormValues) => {
    setErrorMsg(null)
    try {
      const initialMembers = participants.map((p) => ({
        member_id: p.member_id,
        role: p.role,
      }))

      const newId = await createOccasionMutation.mutateAsync({
        values,
        initialMembers,
      })

      navigate(`/occasions/${newId}`)
    } catch (err: any) {
      console.error('Failed to create occasion:', err)
      setErrorMsg(err?.message || "We couldn't save the occasion. Please try again.")
    }
  }

  const availableMembers = directory.filter(
    (m) => !participants.some((p) => p.member_id === m.id)
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/occasions"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to occasions</span>
        </Link>
      </div>

      <PageHeader
        title="Create Occasion"
        description="Schedule or record an organizational event, meeting, or activity."
      />

      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 shadow-xs"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Occasion Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g. Annual General Meeting 2026, Blood Donation Camp"
                disabled={createOccasionMutation.isPending}
              />
              {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
            </div>

            {/* Type & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="occasion_type_id">Occasion Type</Label>
                <select
                  id="occasion_type_id"
                  {...register('occasion_type_id')}
                  disabled={createOccasionMutation.isPending}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select type...</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {errors.occasion_type_id && (
                  <p className="text-xs text-rose-600">{errors.occasion_type_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Initial Status</Label>
                <select
                  id="status"
                  {...register('status')}
                  disabled={createOccasionMutation.isPending}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="planned">Planned</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Start and End Dates (Rule 14) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date')}
                  disabled={createOccasionMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register('end_date')}
                  disabled={createOccasionMutation.isPending}
                />
                {errors.end_date && (
                  <p className="text-xs text-rose-600">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            {/* Location & Fiscal Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location">Location / Venue</Label>
                <Input
                  id="location"
                  placeholder="e.g. Kathmandu Hall / Zoom Link"
                  {...register('location')}
                  disabled={createOccasionMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fiscal_year">Fiscal Year</Label>
                <Input
                  id="fiscal_year"
                  placeholder="e.g. 2026/27"
                  {...register('fiscal_year')}
                  disabled={createOccasionMutation.isPending}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description & Purpose</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Background, objectives, or agenda items for this program..."
                {...register('description')}
                disabled={createOccasionMutation.isPending}
                className="w-full text-xs rounded-lg border border-slate-200 p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Initial Participants Section (Rule 15 & 16) */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">People Involved (Optional)</h2>
              <p className="text-xs text-slate-500">
                Assign coordinators, committee members, or volunteers to this occasion.
              </p>
            </div>

            {/* Participant Add Input Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end p-3 rounded-xl bg-slate-50/75 border border-slate-200/80">
              <div className="sm:col-span-6 space-y-1">
                <Label htmlFor="pick-member" className="text-[11px] text-slate-600">
                  Select Member
                </Label>
                <select
                  id="pick-member"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Choose a member...</option>
                  {availableMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} {m.position_title ? `(${m.position_title})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4 space-y-1">
                <Label htmlFor="pick-role" className="text-[11px] text-slate-600">
                  Occasion Role
                </Label>
                <Input
                  id="pick-role"
                  value={participantRole}
                  onChange={(e) => setParticipantRole(e.target.value)}
                  placeholder="e.g. Coordinator, Speaker"
                  className="text-xs h-8.5 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddParticipant}
                  disabled={!selectedMemberId}
                  className="w-full text-xs h-8.5 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </Button>
              </div>
            </div>

            {/* Participants Added List */}
            {participants.length > 0 && (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white overflow-hidden">
                {participants.map((p) => (
                  <div key={p.member_id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-900">{p.name}</span>
                      {p.position && (
                        <span className="text-[11px] text-slate-500 ml-1.5">({p.position})</span>
                      )}
                      {p.role && (
                        <span className="ml-2 text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/50">
                          {p.role}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.member_id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      aria-label={`Remove ${p.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/occasions')}
            disabled={createOccasionMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createOccasionMutation.isPending}>
            {createOccasionMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            <span>Save Occasion</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
