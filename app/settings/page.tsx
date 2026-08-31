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
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">Settings</h1>
          <p className="mt-2 text-slate-400">Manage your operations profile and notification preferences.</p>
        </div>

        <form onSubmit={savePreferences} className="space-y-6">
          {/* Profile Settings */}
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/20 p-3">
                <Shield className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                <p className="mt-1 text-sm text-slate-400">These details are used for operational updates and reports.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Display Name</span>
                  <input
                    type="text"
                    value={preferences.name}
                    onChange={(e) => setPreferences({ ...preferences, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Work Email</span>
                  <input
                    type="email"
                    value={preferences.email}
                    onChange={(e) => setPreferences({ ...preferences, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Time Zone</span>
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white transition focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                >
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                  <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
                </select>
              </label>
            </div>
          </div>

          {/* Notifications Settings */}
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/20 p-3">
                <Bell className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Notifications</h2>
                <p className="mt-1 text-sm text-slate-400">Choose what updates you want to receive.</p>
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
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 transition hover:border-slate-600/50"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-slate-400">{description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[key as keyof typeof preferences] as boolean}
                    onChange={(e) => setPreferences({ ...preferences, [key]: e.target.checked })}
                    className="h-5 w-5 rounded cursor-pointer accent-cyan-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Save Section */}
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Ready to save?</h3>
                <p className="mt-1 text-sm text-slate-400">Your preferences are stored locally in this browser.</p>
              </div>
              <div className="flex items-center gap-4">
                {saved && (
                  <span className="flex items-center gap-2 text-sm text-emerald-400">
                    <Check className="h-5 w-5" />
                    Saved
                  </span>
                )}
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-600 hover:to-blue-600"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="surface-glass rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-rose-500/20 p-3">
              <LogOut className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Sign Out</h2>
              <p className="mt-1 text-sm text-slate-400">End your current session</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 py-3 font-semibold text-rose-300 transition hover:bg-rose-500/20"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
