import { ArrowRight, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/lib/store'
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
          {field('title', 'Event name', 'Family Cup')}
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
      <div className="flex items-center justify-between">
        <Button
          variant="danger"
          onClick={() => {
            if (confirm('Start a brand-new game night? This clears the roster, teams and every score.'))
              useStore.getState().resetAll()
          }}
        >
          <RotateCcw /> New game night
        </Button>
        <Button variant="primary" size="lg" onClick={onNext}>
          Roster &amp; teams <ArrowRight />
        </Button>
      </div>
    </div>
  )
}
