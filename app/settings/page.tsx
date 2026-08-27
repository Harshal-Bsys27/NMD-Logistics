'use client'

import { FormEvent, useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import ThemeToggle from '@/components/theme/ThemeToggle'

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
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">Workspace</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">Manage your operations profile and notification preferences.</p>
      </div>

      <form onSubmit={savePreferences} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Profile preferences</h2>
            <p className="mt-1 text-sm text-slate-400">These details are used for operational updates and reports.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-300">
              Display name
              <Input
                value={preferences.name}
                onChange={(event) => setPreferences({ ...preferences, name: event.target.value })}
                required
              />
            </label>
            <label className="text-sm text-slate-300">
              Work email
              <Input
                type="email"
                value={preferences.email}
                onChange={(event) => setPreferences({ ...preferences, email: event.target.value })}
                required
              />
            </label>
          </div>

          <label className="block max-w-md text-sm text-slate-300">
            Time zone
            <Select
              value={preferences.timezone}
              onChange={(event) => setPreferences({ ...preferences, timezone: event.target.value })}
            >
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="UTC">Coordinated Universal Time (UTC)</option>
              <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
            </Select>
          </label>

          <div className="border-t border-slate-800 pt-6">
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            <div className="mt-4 space-y-3">
              {[
                ['orderUpdates', 'Order status updates'],
                ['assignmentUpdates', 'Driver assignment updates'],
                ['dailySummary', 'Daily operations summary'],
              ].map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={preferences[key as keyof typeof preferences] as boolean}
                    onChange={(event) => setPreferences({ ...preferences, [key]: event.target.checked })}
                    className="h-4 w-4 accent-cyan-500"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit">Save preferences</Button>
            {saved && <span className="text-sm text-emerald-400" role="status">Preferences saved</span>}
          </div>
        </Card>

        <Card className="h-fit space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Appearance</h2>
            <p className="mt-1 text-sm text-slate-400">Choose how the operations console looks on this device.</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <span className="text-sm text-slate-200">Theme</span>
            <ThemeToggle />
          </div>
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-300">
            Preferences are saved locally in this browser.
          </div>
        </Card>
      </form>
    </section>
  )
}
