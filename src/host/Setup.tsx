import { useRef, useState } from 'react'
import { ArrowRight, Download, History, RotateCcw, Upload, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore, readBackups, restoreRaw, STORAGE_KEY } from '@/lib/store'
import { EVENT } from '@/lib/event'
import { Section, Stepper } from './common'

export function SetupPage({ onNext }: { onNext: () => void }) {
  const settings = useStore((s) => s.settings)
  const set = useStore((s) => s.set)
  const field = (k: 'title' | 'subtitle' | 'place' | 'date', label: string, placeholder: string) => (
    <label className="grid gap-1.5">
      <span className="text-[13px] text-sand">{label}</span>
      <Input
        value={settings[k]}
        placeholder={placeholder}
        onChange={(e) => set((s) => void (s.settings[k] = e.target.value))}
      />
    </label>
  )
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-[-0.03em]">Event setup</h1>
        <p className="mt-1 text-sm text-sand">
          Name the night, then open the TV window and drag it onto the TV. Everything saves as you type.
        </p>
      </div>
      <Section title="On the welcome screen">
        <div className="grid gap-4 sm:grid-cols-2">
          {field('title', 'Event name', "Crazy Family’s Cabin Cup")}
          {field('subtitle', 'Tagline', 'Game Night')}
          {field('place', 'Where', 'Living room')}
          {field('date', 'When', 'November 2026')}
        </div>
      </Section>
      <Section title="Scoring" hint="Points each game awards for 1st, 2nd and 3rd place.">
        <div className="flex flex-wrap gap-6">
          {(['1st', '2nd', '3rd'] as const).map((label, i) => (
            <div key={label} className="grid gap-1.5">
              <span className="text-[13px] text-sand">{label} place</span>
              <Stepper
                value={settings.points[i]}
                onChange={(v) => set((s) => void (s.settings.points[i] = v ?? 0))}
              />
            </div>
          ))}
        </div>
      </Section>
      <Section title="TV sound" hint="Countdown beeps and a buzzer play from the TV window. Click the TV window once to allow sound.">
        <Button onClick={() => set((s) => void (s.settings.sound = !s.settings.sound))}>
          {settings.sound ? <Volume2 /> : <VolumeX />} Sound {settings.sound ? 'on' : 'off'}
        </Button>
      </Section>
      <SaveRestore />
      <Section
        title="New game night"
        hint="Reset scores keeps your roster, team names, Feud questions and answers, songs and links. Start fresh wipes everything. A copy is saved first either way."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              if (confirm('Clear every score and start the night over? Your roster, teams, questions, answers and songs stay.'))
                useStore.getState().resetAll(true)
            }}
          >
            <RotateCcw /> Reset scores, keep my setup
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Start completely fresh? This clears the roster, teams, questions, answers, songs and every score. (A copy is saved under “Saved copies” in case you change your mind.)'))
                useStore.getState().resetAll(false)
            }}
          >
            Start completely fresh
          </Button>
        </div>
      </Section>
      <div className="flex items-center justify-end">
        <Button variant="primary" size="lg" onClick={onNext}>
          Roster &amp; teams <ArrowRight />
        </Button>
      </div>
    </div>
  )
}

function SaveRestore() {
  const [backups, setBackups] = useState(readBackups)
  const file = useRef<HTMLInputElement>(null)
  const when = (t: number) =>
    new Date(t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  return (
    <Section
      title="Save & restore"
      hint="Everything saves in this browser automatically as you type. Download a backup file to keep a copy, or to move your setup to another laptop."
    >
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return alert('Nothing saved yet.')
            const blob = new Blob([raw], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `${EVENT === 'trailer' ? 'thanksgiving-trailer' : 'cabin-cup'}-backup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`
            a.click()
            setTimeout(() => URL.revokeObjectURL(a.href), 1000)
          }}
        >
          <Download /> Download backup file
        </Button>
        <Button variant="ghost" onClick={() => file.current?.click()}>
          <Upload /> Load a backup file
        </Button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            const raw = await f.text()
            try {
              const parsed = JSON.parse(raw)
              if (!parsed?.state?.games) throw new Error('not a backup')
            } catch {
              return alert('That file isn’t a game night backup.')
            }
            if (confirm('Load this backup? It replaces what’s on this laptop now (a copy of the current setup is saved first).')) restoreRaw(raw)
          }}
        />
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-dust">
          <History className="size-3.5" /> Saved copies (made automatically before any reset)
        </div>
        {backups.length ? (
          <ul className="grid gap-1.5">
            {backups.map((b) => (
              <li key={b.at} className="flex items-center gap-3 rounded-[10px] border border-line bg-ink px-3 py-2 text-[13px]">
                <span className="text-cream">{b.why}</span>
                <span className="text-dust">{when(b.at)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => {
                    if (confirm(`Go back to the copy from ${when(b.at)}? What’s here now gets saved as a copy first.`)) restoreRaw(b.raw)
                  }}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-dust">None yet. One is made every time you reset.</p>
        )}
        <button className="mt-1 text-[12px] text-dust underline-offset-2 hover:underline" onClick={() => setBackups(readBackups())}>
          Refresh list
        </button>
      </div>
    </Section>
  )
}
