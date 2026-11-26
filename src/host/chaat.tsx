import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Copy, Minus, Plus, Smartphone, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, TEAM_IDS, COLORS, type ChaatData, type TeamId } from '@/lib/store'
import { updateGame, setView } from '@/lib/actions'

const pulse = (p: Parameters<ReturnType<typeof useStore.getState>['emit']>[0]) => useStore.getState().emit(p)
import { cn } from '@/lib/utils'
import { Section, Segmented, TeamDot, TeamName } from './common'

export function chaatCardUrl(d: ChaatData, names: Record<TeamId, string>, colors: Record<TeamId, string>) {
  const u = new URL('/thanksgiving/card', location.origin)
  u.searchParams.set('a', names.A)
  u.searchParams.set('b', names.B)
  u.searchParams.set('ac', colors.A)
  u.searchParams.set('bc', colors.B)
  u.searchParams.set('t', String(d.turnSec))
  u.searchParams.set('s', String(d.skips))
  return u.toString()
}

export function ChaatController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as ChaatData)
  const teams = useStore((s) => s.teams)
  const set = (fn: (x: ChaatData) => void) => updateGame<ChaatData>(index, fn)
  const [pts, setPts] = useState(0)
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const short = (t: TeamId) => teams[t].name.replace(/^Team /, '')
  const names = { A: teams.A.name, B: teams.B.name, C: teams.C.name }
  const colors = { A: COLORS[teams.A.color].hex, B: COLORS[teams.B.color].hex, C: COLORS[teams.C.color].hex }
  const url = chaatCardUrl(d, names, colors)
  const other = (t: TeamId): TeamId => (t === 'A' ? 'B' : 'A')
  const allDone = TEAM_IDS.every((t) => d.turns[t] >= d.rounds)

  useEffect(() => {
    QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#1c120b', light: '#f6efe3' } })
      .then(setQr)
      .catch(() => setQr(''))
  }, [url])

  const bank = () => {
    const t = d.up
    set((x) => {
      x.scores[t] += pts
      x.turns[t] += 1
      x.log.push({ team: t, pts })
      x.up = other(t)
    })
    pulse({ kind: 'correct', team: t, text: `${pts >= 0 ? '+' : ''}${pts} this turn` })
    setPts(0)
    if (useStore.getState().view !== 'play') setView('play')
  }

  return (
    <>
      <Section
        title="Open the card on a phone or iPad"
        hint="Scan with the camera. The phone runs the timer and cards on its own; you add each turn’s score here."
      >
        <div className="grid items-center gap-5 md:grid-cols-[180px_1fr]">
          <div className="overflow-hidden rounded-[14px] bg-cream p-2 [&_svg]:block [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="grid gap-3">
            <div className="flex items-start gap-2 rounded-[10px] border border-line bg-ink px-3 py-2 text-[12px] text-sand">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-dust" />
              <span className="min-w-0 break-all">{url}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(url)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
              >
                <Copy /> {copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
            <div className="grid gap-2 text-[13px] text-sand">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-24">Turn length</span>
                <Segmented
                  value={d.turnSec}
                  onChange={(v) => set((x) => void (x.turnSec = v))}
                  options={[45, 60, 90].map((n) => ({ label: `${n}s`, value: n }))}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-24">Skips per turn</span>
                <Segmented
                  value={d.skips}
                  onChange={(v) => set((x) => void (x.skips = v))}
                  options={[
                    { label: '1', value: 1 },
                    { label: '3', value: 3 },
                    { label: 'Unlimited', value: -1 },
                  ]}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-24">Turns each</span>
                <Segmented
                  value={d.rounds}
                  onChange={(v) => set((x) => void (x.rounds = v))}
                  options={[3, 4, 5, 6].map((n) => ({ label: String(n), value: n }))}
                />
              </div>
              <p className="text-[12px] text-dust">Change these before scanning; the QR code updates with them.</p>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title={allDone ? 'All turns played' : `${short(d.up)} are up · turn ${Math.min(d.turns[d.up] + 1, d.rounds)} of ${d.rounds}`}
        hint="When the phone says Time’s up, enter its score and add it."
        action={
          <div className="flex gap-1">
            {TEAM_IDS.map((t) => (
              <Button key={t} size="sm" variant={d.up === t ? 'primary' : 'ghost'} onClick={() => set((x) => void (x.up = t))}>
                <TeamDot t={t} /> {short(t)}
              </Button>
            ))}
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-line bg-ink px-4 py-3">
          <TeamName t={d.up} className="font-display text-lg font-semibold" />
          <div className="ml-auto flex items-center gap-2">
            <Button size="icon" variant="secondary" aria-label="Minus one" onClick={() => setPts((p) => p - 1)}>
              <Minus />
            </Button>
            <span className={cn('w-14 text-center font-display text-3xl font-bold tabular-nums', pts < 0 && 'text-bad')}>
              {pts > 0 ? `+${pts}` : pts}
            </span>
            <Button size="icon" variant="secondary" aria-label="Plus one" onClick={() => setPts((p) => p + 1)}>
              <Plus />
            </Button>
          </div>
          <Button variant="primary" size="lg" onClick={bank}>
            Add {pts >= 0 ? `+${pts}` : pts} to {short(d.up)}
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              onClick={() => setPts(n)}
              className={cn(
                'press h-8 min-w-9 rounded-[8px] border px-2 text-[13px] font-semibold tabular-nums',
                pts === n ? 'border-cream bg-cream text-night' : 'border-line text-sand hover:border-line-strong',
              )}
            >
              +{n}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {TEAM_IDS.map((t) => (
            <div key={t} className="rounded-[12px] border border-line px-4 py-3">
              <div className="flex items-center justify-between">
                <TeamName t={t} className="text-sm font-semibold" />
                <span className="text-xs text-dust">
                  {d.turns[t]}/{d.rounds} turns
                </span>
              </div>
              <div className="mt-1 font-display text-3xl font-bold tabular-nums">{d.scores[t]}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="ghost"
            disabled={!d.log.length}
            onClick={() =>
              set((x) => {
                const l = x.log.pop()
                if (!l) return
                x.scores[l.team] -= l.pts
                x.turns[l.team] = Math.max(0, x.turns[l.team] - 1)
                x.up = l.team
              })
            }
          >
            <Undo2 /> Undo last turn
          </Button>
          {d.log.length > 0 && (
            <span className="text-xs text-dust">
              Last: {short(d.log[d.log.length - 1].team)} {d.log[d.log.length - 1].pts >= 0 ? '+' : ''}
              {d.log[d.log.length - 1].pts}
            </span>
          )}
        </div>
      </Section>
    </>
  )
}
