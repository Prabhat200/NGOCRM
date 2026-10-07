import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User as UserIcon,
  Mail,
  Building2,
  Shield,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Upload,
  Camera,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '../context'
import { supabase } from '@/lib/supabase/client'
import { getFriendlyAuthErrorMessage } from '../utils/auth-errors'

const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(100, 'Display name cannot exceed 100 characters.')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number cannot exceed 30 characters.')
    .optional()
    .or(z.literal('')),
  avatar_url: z
    .string()
    .trim()
    .url('Please enter a valid URL.')
    .optional()
    .or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { user, profile, member, organization, roles, refreshProfile } = useAuth()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile?.display_name || '',
      phone: profile?.phone || '',
      avatar_url: profile?.avatar_url || '',
    },
  })

  useEffect(() => {
    if (profile) {
      reset({
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || '',
      })
    }
  }, [profile, reset])

  const watchedAvatarUrl = watch('avatar_url')
  const currentAvatar = watchedAvatarUrl || profile?.avatar_url || null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP, GIF).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be 5MB or less.')
      return
    }

    setIsUploadingAvatar(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${user?.id || 'profile'}/${Date.now()}-${cleanName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path)

      const publicUrl = urlData.publicUrl

      setValue('avatar_url', publicUrl, { shouldDirty: true })

      // Persist immediately to profile
      const { error: rpcError } = await supabase.rpc('update_my_profile', {
        p_avatar_url: publicUrl,
      })

      if (rpcError) {
        throw rpcError
      }

      await refreshProfile()
      setSuccessMessage('Profile picture updated successfully.')
    } catch (err: unknown) {
      console.error('Failed to upload profile picture:', err)
      const message = err instanceof Error ? err.message : 'Failed to upload profile picture.'
      setErrorMessage(message)
    } finally {
      setIsUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      setValue('avatar_url', '', { shouldDirty: true })

      const { error: rpcError } = await supabase.rpc('update_my_profile', {
        p_avatar_url: '',
      })

      if (rpcError) {
        throw rpcError
      }

      await refreshProfile()
      setSuccessMessage('Profile picture removed.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove profile picture.'
      setErrorMessage(message)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const onSubmit = async (values: ProfileFormValues) => {
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const { error } = await supabase.rpc('update_my_profile', {
        p_display_name: values.display_name?.trim() || undefined,
        p_phone: values.phone?.trim() || undefined,
        p_avatar_url: values.avatar_url !== undefined ? values.avatar_url.trim() : undefined,
      })

      if (error) {
        setErrorMessage(getFriendlyAuthErrorMessage(error))
        return
      }

      await refreshProfile()
      reset(values)
      setSuccessMessage('Your profile details have been updated.')
    } catch (err) {
      setErrorMessage(getFriendlyAuthErrorMessage(err))
    }
  }

  const primaryRole = roles[0]?.name || 'Portal User'
  const initials = (member?.full_name || profile?.display_name || user?.email || 'U')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden File Input for Avatars */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploadingAvatar}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            title="Click to change profile picture"
            className="relative group w-16 h-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 overflow-hidden cursor-pointer"
          >
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt={profile?.display_name || 'Avatar'}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}

            {/* Quick hover camera indicator */}
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>

            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {member?.full_name || profile?.display_name || 'My Profile'}
              </h1>
              <Badge variant="success" className="capitalize text-[10px]">
                {profile?.status || 'Active'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{primaryRole}</span>
              {organization && (
                <>
                  <span>&bull;</span>
                  <span>{organization.name}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploadingAvatar}
          onClick={() => fileInputRef.current?.click()}
          className="gap-2 text-xs font-semibold self-start sm:self-auto h-9"
        >
          {isUploadingAvatar ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>{currentAvatar ? 'Change Photo' : 'Upload Photo'}</span>
        </Button>
      </div>

      {successMessage && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editable Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Details</CardTitle>
              <CardDescription>
                Update your profile picture, display preferences, and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {/* Profile Picture Uploader Section */}
                <div className="space-y-3 pb-2 border-b border-slate-100">
                  <Label className="text-sm font-semibold text-slate-900 block">
                    Profile Picture
                  </Label>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                    <div className="relative group w-16 h-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 overflow-hidden">
                      {currentAvatar ? (
                        <img
                          src={currentAvatar}
                          alt={profile?.display_name || 'Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}

                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingAvatar}
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2 text-xs h-8.5 bg-white hover:bg-slate-50 border-slate-300 font-semibold text-slate-800"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>{currentAvatar ? 'Upload New Photo' : 'Upload Photo'}</span>
                        </Button>

                        {currentAvatar && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploadingAvatar}
                            onClick={handleRemoveAvatar}
                            className="gap-1.5 text-xs h-8.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </Button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-normal">
                        JPG, PNG, WebP or GIF up to 5MB. Square aspect ratio recommended.
                      </p>
                    </div>
                  </div>

                  {/* Secondary/Optional direct URL toggle */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
                    >
                      {showUrlInput ? 'Hide image URL field' : 'Or enter an image URL instead'}
                    </button>
                    {showUrlInput && (
                      <div className="mt-2 space-y-1">
                        <Input
                          id="avatar_url"
                          type="url"
                          placeholder="https://example.org/avatar.jpg"
                          className="mt-1"
                          error={!!errors.avatar_url}
                          {...register('avatar_url')}
                        />
                        {errors.avatar_url && (
                          <p className="mt-1 text-xs text-rose-600" role="alert">
                            {errors.avatar_url.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="display_name">Preferred Display Name</Label>
                  <Input
                    id="display_name"
                    placeholder="How your name appears in the portal"
                    className="mt-1.5"
                    error={!!errors.display_name}
                    {...register('display_name')}
                  />
                  {errors.display_name && (
                    <p className="mt-1 text-xs text-rose-600" role="alert">
                      {errors.display_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+977-9800000000"
                    className="mt-1.5"
                    error={!!errors.phone}
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-rose-600" role="alert">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={!isDirty || isSubmitting}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Read-Only System Identity */}
        <div className="space-y-6">
          {/* Member & Org Identity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Portal Identity</CardTitle>
              <CardDescription>
                Governance assignment and credentials managed by your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Auth Email</span>
                  <span className="font-medium text-slate-900">{user?.email || '—'}</span>
                </div>
              </div>

              {member && (
                <>
                  <div className="flex items-start gap-2.5 text-slate-700">
                    <UserIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">NGO Member Record</span>
                      <span className="font-medium text-slate-900">{member.full_name}</span>
                      {member.membership_number && (
                        <span className="text-slate-500 block text-[10px]">
                          ID: {member.membership_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {member.position_title && (
                    <div className="flex items-start gap-2.5 text-slate-700">
                      <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <span className="text-slate-400 block text-[11px]">Position Title</span>
                        <span className="font-medium text-slate-900">{member.position_title}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {organization && (
                <div className="flex items-start gap-2.5 text-slate-700">
                  <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Organization</span>
                    <span className="font-medium text-slate-900">{organization.name}</span>
                    <span className="text-slate-500 block text-[10px]">
                      Timezone: {organization.timezone}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px] mb-1.5">Assigned Roles</span>
                <div className="flex flex-wrap gap-1.5">
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <Badge key={r.id} variant="secondary" className="text-[11px] font-normal">
                        <Shield className="w-3 h-3 mr-1 text-slate-500" aria-hidden="true" />
                        {r.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs">No explicit roles assigned</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
