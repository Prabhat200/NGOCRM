import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { PageHeader } from '@/components/shared/PageHeader'
import { MemberForm } from '../components/MemberForm'
import { useCreateMember } from '../hooks/useMembers'
import type { MemberFormValues } from '../schemas/member.schema'

export function CreateMemberPage() {
  const navigate = useNavigate()
  const { organization, hasPermission } = useAuth()
  const canCreate = hasPermission('members.create')

  const [formError, setFormError] = useState<string | null>(null)
  const createMutation = useCreateMember()

  if (!canCreate) {
    return (
      <div className="p-8 text-center rounded-xl border border-rose-200 bg-rose-50/50 space-y-3 max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Access Denied</h3>
        <p className="text-xs text-rose-700">
          You do not have permission to add new members to this organization.
        </p>
        <Link
          to="/members"
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Back to Directory
        </Link>
      </div>
    )
  }

  const handleSubmit = async (values: MemberFormValues) => {
    if (!organization?.id) {
      setFormError('Organization context is missing. Please re-authenticate.')
      return
    }

    setFormError(null)
    try {
      const newMemberId = await createMutation.mutateAsync({
        values,
        organizationId: organization.id,
      })
      navigate(`/members/${newMemberId}`)
    } catch (err: any) {
      setFormError(err.message || 'We could not save this member.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/members"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Members</span>
        </Link>
      </div>

      <PageHeader
        title="Add Member"
        description="Add a new member to the organization's directory."
      />

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
        <MemberForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/members')}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Member"
        />
      </div>
    </div>
  )
}
