import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/context'
import { useUpdateOrganization } from '../hooks/useSettings'
import { Building2, Save, CheckCircle2, AlertCircle } from 'lucide-react'

const organizationSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters'),
  short_name: z.string().trim().optional(),
  logo_url: z.string().trim().url('Must be a valid URL').or(z.literal('')).optional(),
  email: z.string().trim().email('Invalid email address').or(z.literal('')).optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  registration_no: z.string().trim().optional(),
  website: z.string().trim().url('Must be a valid website URL').or(z.literal('')).optional(),
  timezone: z.string().min(1, 'Please select a timezone'),
})

type OrganizationFormData = z.infer<typeof organizationSchema>

const COMMON_TIMEZONES = [
  { label: 'Kathmandu (UTC+05:45)', value: 'Asia/Kathmandu' },
  { label: 'New Delhi / Kolkata (UTC+05:30)', value: 'Asia/Kolkata' },
  { label: 'Dhaka (UTC+06:00)', value: 'Asia/Dhaka' },
  { label: 'Bangkok / Jakarta (UTC+07:00)', value: 'Asia/Bangkok' },
  { label: 'Singapore / Hong Kong (UTC+08:00)', value: 'Asia/Singapore' },
  { label: 'Tokyo (UTC+09:00)', value: 'Asia/Tokyo' },
  { label: 'London / GMT (UTC+00:00)', value: 'Europe/London' },
  { label: 'New York / Eastern (UTC-05:00)', value: 'America/New_York' },
  { label: 'UTC (Universal Coordinated Time)', value: 'UTC' },
]

export function OrganizationSettingsPage() {
  const { organization: authOrg, hasPermission, refreshAuth } = useAuth()
  const canManage = hasPermission('settings.manage')
  const updateOrgMutation = useUpdateOrganization()

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch complete organization record from organizations table
  const { data: orgData } = useQuery({
    queryKey: ['settings', 'organization', authOrg?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .single()

      if (error) throw error
      return data
    },
    enabled: Boolean(authOrg?.id),
    staleTime: 1000 * 60,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      short_name: '',
      logo_url: '',
      email: '',
      phone: '',
      address: '',
      registration_no: '',
      website: '',
      timezone: 'Asia/Kathmandu',
    },
  })

  // Synchronize form values once complete organization record is fetched
  useEffect(() => {
    if (orgData) {
      reset({
        name: orgData.name || '',
        short_name: orgData.short_name || '',
        logo_url: orgData.logo_url || '',
        email: orgData.email || '',
        phone: orgData.phone || '',
        address: orgData.address || '',
        registration_no: orgData.registration_no || '',
        website: orgData.website || '',
        timezone: orgData.timezone || 'Asia/Kathmandu',
      })
    }
  }, [orgData, reset])

  const onSubmit = async (data: OrganizationFormData) => {
    if (!canManage) return
    setSavedSuccess(false)
    setErrorMessage(null)

    try {
      await updateOrgMutation.mutateAsync({
        name: data.name,
        short_name: data.short_name || undefined,
        logo_url: data.logo_url || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        registration_no: data.registration_no || undefined,
        website: data.website || undefined,
        timezone: data.timezone,
      })

      await refreshAuth()
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 4000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'We couldn’t update the organization settings.')
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organization Profile & Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your NGO's official identity, registration information, and regional defaults.
          </p>
        </div>

        {!canManage && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Read-only mode
          </span>
        )}
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Organization settings have been saved successfully and logged to audit.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-medium text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
        {/* Read-Only Organization Identifier (Never editable) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
          <div>
            <span className="font-semibold text-slate-700">Organization Tenant Identifier:</span>
            <span className="text-slate-500 ml-1.5 font-mono text-[11px] select-all">
              {authOrg?.id || 'Resolved from session'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 italic">Immutable system key</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Organization Name */}
          <div className="sm:col-span-2 space-y-1.5">
            <label htmlFor="name" className="block text-xs font-semibold text-slate-700">
              Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              disabled={!canManage}
              {...register('name')}
              placeholder="e.g. Nepal Youth Development Initiative"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
            />
            {errors.name && <p className="text-[11px] text-rose-600">{errors.name.message}</p>}
          </div>

          {/* Short Name / Acronym */}
          <div className="space-y-1.5">
            <label htmlFor="short_name" className="block text-xs font-semibold text-slate-700">
              Short Name / Acronym
            </label>
            <input
              id="short_name"
              type="text"
              disabled={!canManage}
              {...register('short_name')}
              placeholder="e.g. NYDI"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Registration Number */}
          <div className="space-y-1.5">
            <label htmlFor="registration_no" className="block text-xs font-semibold text-slate-700">
              Registration Number
            </label>
            <input
              id="registration_no"
              type="text"
              disabled={!canManage}
              {...register('registration_no')}
              placeholder="e.g. DAO/KTM/48291"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Official Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
              Official Email
            </label>
            <input
              id="email"
              type="email"
              disabled={!canManage}
              {...register('email')}
              placeholder="e.g. info@ngo.org.np"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
            />
            {errors.email && <p className="text-[11px] text-rose-600">{errors.email.message}</p>}
          </div>

          {/* Official Phone */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-700">
              Official Phone
            </label>
            <input
              id="phone"
              type="text"
              disabled={!canManage}
              {...register('phone')}
              placeholder="e.g. +977-1-4412345"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <label htmlFor="website" className="block text-xs font-semibold text-slate-700">
              Official Website
            </label>
            <input
              id="website"
              type="url"
              disabled={!canManage}
              {...register('website')}
              placeholder="e.g. https://www.ngo.org.np"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
            />
            {errors.website && <p className="text-[11px] text-rose-600">{errors.website.message}</p>}
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5">
            <label htmlFor="logo_url" className="block text-xs font-semibold text-slate-700">
              Branding Logo URL
            </label>
            <input
              id="logo_url"
              type="url"
              disabled={!canManage}
              {...register('logo_url')}
              placeholder="e.g. https://example.com/logo.png"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
            />
            {errors.logo_url && <p className="text-[11px] text-rose-600">{errors.logo_url.message}</p>}
          </div>

          {/* Physical Address */}
          <div className="sm:col-span-2 space-y-1.5">
            <label htmlFor="address" className="block text-xs font-semibold text-slate-700">
              Registered Physical Address
            </label>
            <input
              id="address"
              type="text"
              disabled={!canManage}
              {...register('address')}
              placeholder="e.g. Ward No. 3, Pulchowk, Lalitpur, Nepal"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Timezone */}
          <div className="sm:col-span-2 space-y-1.5">
            <label htmlFor="timezone" className="block text-xs font-semibold text-slate-700">
              Default Operational Timezone <span className="text-rose-500">*</span>
            </label>
            <select
              id="timezone"
              disabled={!canManage}
              {...register('timezone')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              Changing timezone adjusts how timestamps and dates are presented across the application.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        {canManage && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={!isDirty || isSubmitting || updateOrgMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting || updateOrgMutation.isPending ? 'Saving...' : 'Save Organization Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
