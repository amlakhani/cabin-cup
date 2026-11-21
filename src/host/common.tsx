import { useState, type ReactNode } from 'react'
import { Minus, Pause, Play, Plus, RotateCcw, TimerReset, Lock, Unlock, Swords, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, TEAM_IDS, type TeamId, type Placement } from '@/lib/store'
import { useTeam, useTimerRemaining } from '@/lib/hooks'
import { cn, fmtTime, ordinal } from '@/lib/utils'
import { GAMES } from '@/lib/games'
import {
  setView,
  finalPlacement,
  lockResults,
  resolveTie,
  setOverride,
  setTiebreak,
  unlockResults,
  clearTies,
} from '@/lib/actions'

export function Section({
  title,
  hint,
  action,
  children,
  className,
}: {
  title: string
  hint?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-[var(--radius-card)] border border-line bg-panel p-5', className)}>
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.015em]">{title}</h2>
          {hint && <p className="mt-1 text-[13px] leading-relaxed text-dust">{hint}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function TeamDot({ t, className }: { t: TeamId; className?: string }) {
  const team = useTeam(t)
  return <span className={cn('inline-block size-2.5 shrink-0 rounded-full', className)} style={{ background: team.hex }} />
}

export function TeamName({ t, className }: { t: TeamId; className?: string }) {
  const team = useTeam(t)
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <TeamDot t={t} />
      {team.name}
    </span>
  )
}

/* ---------- timer ---------- */
export function TimerControl({ presets }: { presets: { label: string; seconds: number; name?: string }[] }) {
  const timer = useTimerRemaining()
  const { startTimer, pauseTimer, resumeTimer, clearTimer, addTime } = useStore.getState()
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-line bg-ink p-3">
      <div
        className={cn(
          'min-w-[92px] font-display text-[32px] font-semibold tabular-nums tracking-[-0.02em]',
          timer?.done && 'text-bad',
          !timer && 'text-dust/60',
        )}
        aria-live="off"
      >
        {timer ? fmtTime(timer.remainingMs) : '0:00'}
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant="primary"
            onClick={() => {
              startTimer(p.name ?? p.label, p.seconds)
              if (useStore.getState().view !== 'play') setView('play')
            }}
          >
            <Play /> {p.label}
          </Button>
        ))}
        {timer && !timer.done && (
          <Button size="sm" onClick={() => (timer.running ? pauseTimer() : resumeTimer())}>
            {timer.running ? <Pause /> : <Play />} {timer.running ? 'Pause' : 'Resume'}
          </Button>
        )}
        {timer && (
          <>
            <Button size="sm" variant="ghost" onClick={() => addTime(10)}>
              <TimerReset /> +10s
            </Button>
            <Button size="sm" variant="ghost" onClick={clearTimer} aria-label="Clear timer">
              <X /> Clear
            </Button>
          </>
        )}
      </div>
      {timer && <span className="ml-auto text-xs text-dust">{timer.label}</span>}
    </div>
  )
}

/* ---------- number stepper ---------- */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  size = 'md',
}: {
  value: number | null | undefined
  onChange: (v: number | null) => void
  min?: number
  max?: number
  size?: 'md' | 'lg'
}) {
  const v = value ?? null
  const big = size === 'lg'
  return (
    <div className="inline-flex items-center gap-1.5">
      <Button
        size="icon"
        className={big ? 'size-11' : ''}
        aria-label="Decrease"
        disabled={v == null || v <= min}
        onClick={() => onChange(Math.max(min, (v ?? 0) - 1))}
      >
        <Minus />
      </Button>
      <input
        inputMode="numeric"
        className={cn(
          'w-16 rounded-[10px] border border-line bg-ink text-center font-display font-semibold tabular-nums outline-none focus:border-line-strong',
          big ? 'h-11 text-2xl' : 'h-9 text-lg',
        )}
        value={v ?? ''}
        placeholder="–"
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '')
          onChange(raw === '' ? null : Math.min(max, Number(raw)))
        }}
      />
      <Button
        size="icon"
        className={big ? 'size-11' : ''}
        aria-label="Increase"
        disabled={v != null && v >= max}
        onClick={() => onChange(Math.min(max, (v ?? 0) + 1))}
      >
        <Plus />
      </Button>
    </div>
  )
}

export function TeamScoreRow({
  t,
  value,
  onChange,
  unit,
  max,
}: {
  t: TeamId
  value: number | null | undefined
  onChange: (v: number | null) => void
  unit?: string
  max?: number
}) {
  const team = useTeam(t)
  return (
    <div className="flex items-center justify-between gap-4 rounded-[12px] border border-line bg-ink px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="size-3.5 rounded-[5px]" style={{ background: team.hex }} />
        <div>
          <div className="font-display text-lg font-semibold tracking-[-0.015em]">{team.name}</div>
          {unit && <div className="text-xs text-dust">{unit}</div>}
        </div>
      </div>
      <Stepper value={value} onChange={onChange} size="lg" max={max} />
    </div>
  )
}

/* ---------- results / ties / lock ---------- */
export function ResultPanel({ index }: { index: number }) {
  const s = useStore()
  const g = s.games[index]
  const def = GAMES[index]
  const f = finalPlacement(index, s)
  const [manual, setManual] = useState(false)
  const [pick, setPick] = useState<TeamId[]>([])
  const { startTimer } = useStore.getState()

  const locked = !!g.result

  return (
    <Section
      title="Result"
      hint={locked ? 'Locked. Points are on the board.' : `Points: ${s.settings.points.join(' / ')} for 1st / 2nd / 3rd.`}
      action={
        locked ? (
          <Button size="sm" variant="ghost" onClick={() => unlockResults(index)}>
            <Unlock /> Unlock
          </Button>
        ) : null
      }
    >
      <ol className="grid gap-2">
        {f.ranking.order.map((t, i) => {
          const score = f.sheet.scores[t]
          const tied = f.sheet.complete && f.ranking.ties.some((grp) => grp.includes(t))
          const place = g.result?.placement[t] ?? f.placement?.[t] ?? (tied || !f.sheet.complete ? null : i + 1)
          return (
            <li
              key={t}
              className="flex items-center justify-between rounded-[10px] border border-line bg-ink px-3.5 py-2.5 text-sm"
            >
              <span className="flex items-center gap-3">
                <span className={cn('w-9 font-display font-semibold', tied ? 'text-warn' : 'text-sand')}>
                  {place ? ordinal(place) : tied ? 'Tie' : '–'}
                </span>
                <TeamName t={t} className="font-medium" />
              </span>
              <span className="flex items-center gap-4 tabular-nums">
                <span className="text-sand">
                  {score == null ? '–' : Number.isInteger(score) ? score : score.toFixed(1)}
                  {def.kind === 'tictactoe' && f.sheet.secondary && (
                    <span className="ml-2 text-dust">
                      ({f.sheet.secondary[t] >= 0 ? '+' : ''}
                      {f.sheet.secondary[t]})
                    </span>
                  )}
                </span>
                {g.result && <span className="font-display font-semibold">+{g.result.points[t]}</span>}
              </span>
            </li>
          )
        })}
      </ol>

      {!locked && f.sheet.complete && f.ranking.ties.length > 0 && !g.override && (
        <div className="mt-4 rounded-[12px] border border-warn/30 bg-warn/[0.07] p-4">
          {f.ranking.ties.map((grp) => (
            <div key={grp.join()}>
              <div className="flex items-center gap-2 text-sm font-medium text-warn">
                <Swords className="size-4" /> Tie: {grp.map((t) => s.teams[t].name).join(' & ')}
              </div>
              <p className="mt-1 text-[13px] text-sand">{def.tiebreak}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant={g.tiebreak ? 'primary' : 'secondary'} onClick={() => setTiebreak(index, !g.tiebreak)}>
                  {g.tiebreak ? 'Tiebreaker showing on TV' : 'Show tiebreaker on TV'}
                </Button>
                {def.tiebreakTimer && (
                  <Button size="sm" onClick={() => startTimer('Tiebreaker', def.tiebreakTimer!)}>
                    <Play /> {def.tiebreakTimer}s playoff
                  </Button>
                )}
              </div>
              <div className="mt-3 text-[13px] text-sand">
                {grp.length === 2 ? 'Who won the tiebreaker?' : `Tap teams in finishing order (${pick.length}/${grp.length - 1})`}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {grp.map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant="outline"
                    disabled={pick.includes(t)}
                    onClick={() => {
                      if (grp.length === 2) {
                        resolveTie(index, [t, grp.find((x) => x !== t)!])
                        return
                      }
                      const next = [...pick, t]
                      if (next.length === grp.length - 1) {
                        resolveTie(index, [...next, grp.find((x) => !next.includes(x))!])
                        setPick([])
                      } else setPick(next)
                    }}
                  >
                    <TeamDot t={t} /> {s.teams[t].name}
                    {pick.includes(t) && <span className="text-dust">#{pick.indexOf(t) + 1}</span>}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!locked && g.tieOrder.length > 0 && f.ranking.groups.length > 0 && f.ranking.ties.length === 0 && (
        <button className="mt-3 text-xs text-dust underline underline-offset-4 hover:text-cream" onClick={() => clearTies(index)}>
          Tie settled by tiebreaker. Undo that.
        </button>
      )}

      {!locked && (
        <div className="mt-4">
          {manual ? (
            <ManualPlacement
              initial={g.override}
              onCancel={() => {
                setManual(false)
                setOverride(index, null)
              }}
              onSet={(p) => setOverride(index, p)}
            />
          ) : (
            <button
              className="text-xs text-dust underline underline-offset-4 hover:text-cream"
              onClick={() => setManual(true)}
            >
              Set placement by hand
            </button>
          )}
        </div>
      )}

      {!locked && (
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <span className="text-[13px] text-dust">{f.ready ? 'Ready. This reveals placements on the TV.' : f.reason}</span>
          <Button variant="primary" size="lg" disabled={!f.ready} onClick={() => lockResults(index)}>
            <Lock /> Lock &amp; reveal
          </Button>
        </div>
      )}
    </Section>
  )
}

function ManualPlacement({
  initial,
  onSet,
  onCancel,
}: {
  initial: Placement | null
  onSet: (p: Placement | null) => void
  onCancel: () => void
}) {
  const [p, setP] = useState<Partial<Placement>>(initial ?? {})
  const valid = new Set(Object.values(p)).size === 3 && TEAM_IDS.every((t) => p[t])
  return (
    <div className="rounded-[12px] border border-line bg-ink p-3">
      <div className="grid gap-2">
        {TEAM_IDS.map((t) => (
          <div key={t} className="flex items-center justify-between gap-3">
            <TeamName t={t} className="text-sm" />
            <div className="flex gap-1">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  className={cn(
                    'press h-8 w-11 rounded-[8px] border text-xs font-medium',
                    p[t] === n ? 'border-cream bg-cream text-night' : 'border-line text-sand hover:border-line-strong',
                  )}
                  onClick={() => {
                    const next = { ...p, [t]: n }
                    setP(next)
                    const ok = new Set(Object.values(next)).size === 3 && TEAM_IDS.every((x) => next[x])
                    onSet(ok ? (next as Placement) : null)
                  }}
                >
                  {ordinal(n)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-dust">{valid ? 'Manual placement in use.' : 'Give each team a different place.'}</span>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <RotateCcw /> Use scores instead
        </Button>
      </div>
    </div>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: ReactNode; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-[10px] border border-line bg-ink p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            'press h-8 whitespace-nowrap rounded-[7px] px-3 text-[13px] font-medium',
            value === o.value ? 'bg-raised text-cream shadow-[0_1px_2px_rgb(0_0_0/0.4)]' : 'text-dust hover:text-cream',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
