'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, Bell, Shield, LogOut } from 'lucide-react'

const preferenceDefaults = {
  name: 'Operations Manager',
  email: 'ops@nmdlogistics.com',
  timezone: 'Asia/Kolkata',
  orderUpdates: true,
  assignmentUpdates: true,
  dailySummary: false,
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState(preferenceDefaults)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('nmd-preferences')
    if (stored) {
      setPreferences({ ...preferenceDefaults, ...JSON.parse(stored) })
    }
  }, [])

  const savePreferences = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    localStorage.setItem('nmd-preferences', JSON.stringify(preferences))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
          <p className="mt-2 text-muted-foreground">Manage your operations profile and notification preferences.</p>
        </div>

        <form onSubmit={savePreferences} className="space-y-6">
          {/* Profile Settings */}
          <div className="surface-glass rounded-lg p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-3 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
                <p className="mt-1 text-sm text-muted-foreground">These details are used for operational updates and reports.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Display Name</span>
                  <input
                    type="text"
                    value={preferences.name}
                    onChange={(e) => setPreferences({ ...preferences, name: e.target.value })}
                    className="min-h-11 w-full rounded-md border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Work Email</span>
                  <input
                    type="email"
                    value={preferences.email}
                    onChange={(e) => setPreferences({ ...preferences, email: e.target.value })}
                    className="min-h-11 w-full rounded-md border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </label>
              </div>

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
                <p className="mt-1 text-sm text-muted-foreground">Choose what updates you want to receive.</p>
              </div>
            </div>

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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Ready to save?</h3>
                <p className="mt-1 text-sm text-muted-foreground">Your preferences are stored locally in this browser.</p>
              </div>
              <div className="flex items-center gap-4">
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

        {/* Danger Zone */}
        <div className="surface-glass rounded-lg border border-danger/30 bg-danger/5 p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-md bg-danger p-3 text-danger-foreground">
              <LogOut className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Sign Out</h2>
              <p className="mt-1 text-sm text-muted-foreground">End your current session</p>
            </div>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-md border border-danger/40 bg-danger px-4 py-2.5 font-semibold text-danger-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
