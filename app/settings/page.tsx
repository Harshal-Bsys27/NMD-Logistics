'use client'

import Image from 'next/image'
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Bell, Camera, Loader2, Shield, LogOut, Mail, Phone, Truck, UserRound, X } from 'lucide-react'
import { useAuth } from '@/hooks'
import { useOperationsData } from '@/hooks/useOperationsData'
import { supabase, supabaseUrl } from '@/lib/supabase/client'
import AvatarCropDialog from '@/components/profile/AvatarCropDialog'

const preferenceDefaults = {
  timezone: 'Asia/Kolkata',
  orderUpdates: true,
  assignmentUpdates: true,
  dailySummary: false,
}

const supportedTimeZones = ['Asia/Kolkata', 'UTC', 'Asia/Dubai']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getOwnedAvatarPath(avatarUrl: string | undefined, userId: string): string | null {
  if (!avatarUrl) return null;
  try {
    const avatar = new URL(avatarUrl);
    const project = new URL(supabaseUrl);
    const prefix = '/storage/v1/object/public/profile-avatars/';
    if (avatar.origin !== project.origin || !avatar.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(avatar.pathname.slice(prefix.length));
    return path.startsWith(`${userId}/`) ? path : null;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const { user, loading, updateAvatar } = useAuth()
  const { drivers, isLoading: isLoadingOperations, error: operationsError } = useOperationsData()
  const driver = user?.role === 'delivery_personnel'
    ? drivers.find((item) => item.user_id === user.id)
    : undefined
  const [preferences, setPreferences] = useState(preferenceDefaults)
  const [saved, setSaved] = useState(false)
  const [preferenceError, setPreferenceError] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [avatarSuccess, setAvatarSuccess] = useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const [cropImageName, setCropImageName] = useState('')
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isAvatarPreviewOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAvatarPreviewOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAvatarPreviewOpen])

  useEffect(() => {
    if (!cropImageUrl) return;
    return () => URL.revokeObjectURL(cropImageUrl);
  }, [cropImageUrl]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user) return

    setAvatarError('')
    setAvatarSuccess('')
    const extensionByType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }
    const extension = extensionByType[file.type]
    if (!extension) {
      setAvatarError('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('The image must be 5 MB or smaller.')
      return
    }

    setCropImageName(file.name)
    setCropImageUrl(URL.createObjectURL(file))
  }

  const handleCroppedAvatar = async (file: Blob) => {
    if (!user) throw new Error('You must be signed in to update your profile photo.')
    setIsUploadingAvatar(true)
    const previousAvatarPath = getOwnedAvatarPath(user.avatar_url, user.id)
    const objectPath = `${user.id}/${crypto.randomUUID()}.jpg`
    try {
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(objectPath, file, {
          cacheControl: '3600',
          contentType: 'image/jpeg',
          upsert: false,
        })
      if (uploadError) throw new Error(`Could not upload photo: ${uploadError.message}`)

      const avatarUrl = `${supabase.storage.from('profile-avatars').getPublicUrl(objectPath).data.publicUrl}?v=${Date.now()}`
      try {
        await updateAvatar(avatarUrl)
      } catch (profileError) {
        const { error: cleanupError } = await supabase.storage.from('profile-avatars').remove([objectPath])
        if (cleanupError) console.error('Unable to remove the uploaded photo after profile update failed:', cleanupError)
        throw profileError
      }

      if (previousAvatarPath && previousAvatarPath !== objectPath) {
        const { error: cleanupError } = await supabase.storage
          .from('profile-avatars')
          .remove([previousAvatarPath])
        if (cleanupError) console.warn('Profile photo updated, but the previous image could not be removed:', cleanupError)
      }
      setAvatarSuccess('Your profile photo has been updated.')
      setCropImageUrl(null)
      setCropImageName('')
    } catch (uploadError) {
      console.error('Unable to update profile photo:', uploadError)
      const message = uploadError instanceof Error ? uploadError.message : 'Unable to update your profile photo.'
      setAvatarError(message)
      throw new Error(message)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const cancelAvatarCrop = () => {
    if (isUploadingAvatar) return
    setCropImageUrl(null)
    setCropImageName('')
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nmd-preferences')
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (isRecord(parsed)) {
          setPreferences((current) => ({
            timezone: typeof parsed.timezone === 'string' && supportedTimeZones.includes(parsed.timezone)
              ? parsed.timezone
              : current.timezone,
            orderUpdates: typeof parsed.orderUpdates === 'boolean' ? parsed.orderUpdates : current.orderUpdates,
            assignmentUpdates: typeof parsed.assignmentUpdates === 'boolean' ? parsed.assignmentUpdates : current.assignmentUpdates,
            dailySummary: typeof parsed.dailySummary === 'boolean' ? parsed.dailySummary : current.dailySummary,
          }))
        }
      }
    } catch (error) {
      console.error('Unable to load saved notification preferences:', error)
    }
  }, [])

  const savePreferences = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPreferenceError('')
    try {
      localStorage.setItem('nmd-preferences', JSON.stringify(preferences))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (error) {
      console.error('Unable to save notification preferences:', error)
      setSaved(false)
      setPreferenceError('Could not save preferences in this browser. Check your browser storage settings and try again.')
    }
  }

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your account</p>
          <h1 className="mt-1 text-3xl font-semibold text-foreground">Profile & settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">View your verified workspace details and manage preferences for this device.</p>
        </div>

        <section aria-labelledby="profile-heading" className="surface-glass rounded-xl border border-border p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><UserRound className="h-6 w-6" /></div>
            <div>
              <h2 id="profile-heading" className="text-xl font-semibold text-foreground">Profile information</h2>
              <p className="mt-1 text-sm text-muted-foreground">Account details assigned to your workspace profile.</p>
            </div>
          </div>

          {loading ? (
            <p role="status" className="text-sm text-muted-foreground">Loading your profile…</p>
          ) : !user ? (
            <p role="alert" className="text-sm text-danger-foreground">Your profile could not be loaded. Sign in again to view your account information.</p>
          ) : (
            <>
              <div className="mb-6 flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/20 px-4 py-5 text-center sm:py-6">
                <button
                  type="button"
                  onClick={() => user.avatar_url && setIsAvatarPreviewOpen(true)}
                  disabled={!user.avatar_url}
                  aria-label={user.avatar_url ? 'View full profile photo' : 'No profile photo uploaded'}
                  title={user.avatar_url ? 'View full photo' : undefined}
                  className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-cyan-500 text-2xl font-semibold text-primary-foreground shadow-md ring-4 ring-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-default sm:text-3xl"
                  style={{ width: 'clamp(6.5rem, 12vw, 8rem)', height: 'clamp(6.5rem, 12vw, 8rem)' }}
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={`${user.full_name || 'Your'} profile photo`}
                      width={112}
                      height={112}
                      unoptimized
                      className="h-full w-full object-cover"
                      style={{ width: '100%', height: '100%', maxWidth: 'none' }}
                    />
                  ) : (
                    user.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || <UserRound className="h-9 w-9" />
                  )}
                </button>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">{user.full_name || 'Profile photo'}</h3>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">{user.role.replace(/_/g, ' ')}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Upload a JPG, PNG, or WebP image up to 5 MB.</p>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void handleAvatarChange(event)}
                    className="sr-only"
                    aria-label="Choose profile photo"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
                  >
                    {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {isUploadingAvatar ? 'Uploading…' : user.avatar_url ? 'Change photo' : 'Upload photo'}
                  </button>
                </div>
              </div>
              {avatarError && <p role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger-foreground">{avatarError}</p>}
              {avatarSuccess && <p role="status" className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success-foreground">{avatarSuccess}</p>}
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Full name', value: user.full_name, icon: UserRound },
                  { label: 'Email address', value: user.email, icon: Mail },
                  { label: 'Phone number', value: user.phone || 'Not provided', icon: Phone },
                  { label: 'Workspace role', value: user.role.replace(/_/g, ' '), icon: Shield },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex min-w-0 items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-semibold capitalize text-foreground">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              {user.role === 'delivery_personnel' && (
                <div className="mt-5">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Driver details</h3>
                  {isLoadingOperations ? (
                    <p role="status" className="text-sm text-muted-foreground">Loading your driver details…</p>
                  ) : operationsError ? (
                    <p role="alert" className="text-sm text-danger-foreground">{operationsError}</p>
                  ) : driver ? (
                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ['Employee ID', driver.employee_id],
                        ['Vehicle', `${driver.vehicle_type.toUpperCase()} · ${driver.vehicle_number}`],
                        ['Availability', driver.current_status.replace(/_/g, ' ')],
                        ['License number', driver.license_number || 'Not provided'],
                        ['Phone verification', driver.phone_verified ? 'Verified' : 'Not verified'],
                        ['Completed deliveries', String(driver.total_deliveries_completed)],
                      ].map(([label, value]) => (
                        <div key={label} className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                          <Truck className="h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                            <dd className="mt-1 break-words text-sm font-semibold capitalize text-foreground">{value}</dd>
                          </div>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning-foreground">
                      Your driver record is not available. Contact your administrator to verify your driver setup.
                    </p>
                  )}
                </div>
              )}
              <p className="mt-4 text-xs leading-5 text-muted-foreground">To change your name or contact details, ask your administrator to update your workspace profile.</p>
            </>
          )}
        </section>

        {isAvatarPreviewOpen && user?.avatar_url && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`${user.full_name || 'Profile'} photo`}
            onClick={() => setIsAvatarPreviewOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsAvatarPreviewOpen(false)}
              aria-label="Close full profile photo"
              className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-3" onClick={(event) => event.stopPropagation()}>
              <Image
                src={user.avatar_url}
                alt={`${user.full_name || 'Your'} profile photo`}
                width={1600}
                height={1600}
                unoptimized
                className="h-auto max-h-[calc(100dvh-6rem)] w-auto max-w-full object-contain"
                style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: 'calc(100dvh - 6rem)' }}
                priority
              />
              <p className="text-sm font-medium text-white/90">{user.full_name || 'Profile photo'}</p>
            </div>
          </div>
        )}

        {cropImageUrl && (
          <AvatarCropDialog
            imageUrl={cropImageUrl}
            imageName={cropImageName}
            onCancel={cancelAvatarCrop}
            onSave={handleCroppedAvatar}
            isSaving={isUploadingAvatar}
          />
        )}

        <form onSubmit={savePreferences} className="space-y-6">
          <div className="surface-glass rounded-lg p-5 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-3 text-primary">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Preferences</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose the timezone and notification preferences for this device.</p>
              </div>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Time Zone</span>
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="min-h-11 w-full rounded-md border border-input bg-background px-4 py-2.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
                >
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                  <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
                </select>
              </label>
            </div>
          </div>

          {/* Notifications Settings */}
          <div className="surface-glass rounded-lg p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-md bg-warning p-3 text-warning-foreground">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose which updates you want enabled when notifications are available.</p>
              </div>
            </div>

            <p className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
              These preferences are saved in this browser. Email and push notification delivery is not connected yet.
            </p>

            <div className="space-y-3">
              {[
                ['orderUpdates', 'Order status updates', 'Get notified when order statuses change'],
                ['assignmentUpdates', 'Driver assignment updates', 'Get notified about new and updated assignments'],
                ['dailySummary', 'Daily operations summary', 'Receive a summary at end of business day'],
              ].map(([key, label, description]) => (
                <label
                  key={key}
                  className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-md border border-border bg-muted/40 p-4 transition hover:border-ring/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[key as keyof typeof preferences] as boolean}
                    onChange={(e) => setPreferences({ ...preferences, [key]: e.target.checked })}
                    className="h-5 w-5 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Save Section */}
          <div className="surface-glass rounded-lg p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Ready to save?</h3>
                <p className="mt-1 text-sm text-muted-foreground">Your preferences are stored locally in this browser.</p>
                {preferenceError && <p role="alert" className="mt-2 text-sm text-danger-foreground">{preferenceError}</p>}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                {saved && (
                  <span className="flex items-center gap-2 text-sm text-success-foreground" role="status">
                    <Check className="h-5 w-5" />
                    Saved
                  </span>
                )}
                <button
                  type="submit"
                  className="min-h-11 rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </form>

        <section aria-labelledby="sign-out-heading" className="surface-glass rounded-xl border border-border p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger-foreground">
                <LogOut className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="sign-out-heading" className="text-base font-semibold text-foreground">Sign out</h2>
                <p className="mt-1 text-sm text-muted-foreground">Sign out of your NMD Logistics account on this device.</p>
              </div>
            </div>
            <Link
              href="/auth/signout"
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-danger/30 bg-background px-5 text-sm font-semibold text-danger-foreground transition hover:border-danger/50 hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 sm:w-auto"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
