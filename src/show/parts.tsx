import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore, COLORS, TEAM_IDS, TEAM_GRID, type TeamId, teamName} from '@/lib/store'
import { useTeam, useTimerRemaining } from '@/lib/hooks'
import { standings } from '@/lib/scoring'
import { NumberTicker } from '@/components/fx/number-ticker'
import { cn, fmtTime } from '@/lib/utils'
import { GAMES } from '@/lib/games'
import { Swords } from 'lucide-react'

export const ease = [0.23, 1, 0.32, 1] as const

export const rise = {
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
}

/* ---------- big timer ---------- */
export function BigTimer({ className, size = 'lg' }: { className?: string; size?: 'md' | 'lg' | 'xl' }) {
  const t = useTimerRemaining()
  if (!t) return null
  const secs = Math.ceil(t.remainingMs / 1000)
  const pct = t.duration ? t.remainingMs / t.duration : 0
  const low = secs <= 10 && !t.done
  const sz = size === 'xl' ? 'text-[13rem]' : size === 'lg' ? 'text-[9rem]' : 'text-[5.5rem]'
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className={cn(
          'font-display font-bold tabular-nums leading-none tracking-[-0.04em] transition-colors duration-300',
          sz,
          t.done ? 'text-bad' : low ? 'text-warn' : 'text-cream',
        )}
        role="timer"
        aria-live="off"
      >
        {t.done ? 'Time!' : fmtTime(t.remainingMs)}
      </div>
      <div className="mt-4 h-2 w-[60%] min-w-48 overflow-hidden rounded-full bg-cream/10">
        <div
          className={cn('h-full rounded-full', t.done ? 'bg-bad' : low ? 'bg-warn' : 'bg-cream')}
          style={{ width: `${pct * 100}%`, transition: t.running ? 'width 120ms linear' : 'width 300ms var(--ease-out)' }}
        />
      </div>
      <div className="mt-3 text-[1.35rem] text-sand">
        {t.label}
        {!t.running && !t.done && ' · paused'}
      </div>
    </div>
  )
}

/* ---------- sound ---------- */
export function useTimerSound(enabled: boolean) {
  const t = useTimerRemaining()
  const last = useRef<number | null>(null)
  const ctx = useRef<AudioContext | null>(null)
  useEffect(() => {
    const unlock = () => {
      if (!ctx.current) ctx.current = new AudioContext()
      ctx.current.resume()
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])
  const secs = t ? Math.ceil(t.remainingMs / 1000) : null
  useEffect(() => {
    if (!enabled || secs == null || !t?.running && !t?.done) {
      last.current = secs
      return
    }
    if (last.current !== null && secs < last.current) {
      if (secs <= 3 && secs >= 1) beep(ctx.current, 880, 0.12)
      if (secs === 0) beep(ctx.current, 330, 0.7, 'sawtooth')
    }
    last.current = secs
  }, [secs, enabled, t?.running, t?.done])
}

function beep(ctx: AudioContext | null, freq: number, dur: number, type: OscillatorType = 'sine') {
  if (!ctx || ctx.state !== 'running') return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0.0001, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
  o.connect(g).connect(ctx.destination)
  o.start()
  o.stop(ctx.currentTime + dur + 0.05)
}

/* ---------- team bits ---------- */
export function TeamPill({ t, className }: { t: TeamId; className?: string }) {
  const team = useTeam(t)
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-[0.9em] py-[0.3em] font-semibold', className)}
      style={{ background: team.hex, color: team.inkHex }}
    >
      {team.name}
    </span>
  )
}

export function TeamLabel({ t, className }: { t: TeamId; className?: string }) {
  const team = useTeam(t)
  return (
    <span className={cn('inline-flex items-center gap-[0.45em]', className)}>
      <span className="inline-block size-[0.55em] rounded-full" style={{ background: team.hex }} />
      {team.name}
    </span>
  )
}

/* ---------- chrome ---------- */
export function TopBar() {
  const s = useStore()
  const st = standings(s)
  return (
    <div className="relative z-10 flex items-center justify-between px-12 pt-8 text-[1.1rem]">
      <div className="font-display font-semibold tracking-[-0.015em] text-sand">
        {s.settings.title} <span className="text-dust">· {s.settings.subtitle}</span>
      </div>
      <div className="flex items-center gap-2" aria-label={`Game ${s.current + 1} of ${GAMES.length}`}>
        {GAMES.map((g, i) => (
          <span
            key={g.id}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === s.current ? 'w-8 bg-cream' : s.games[i].result ? 'w-2 bg-cream/50' : 'w-2 bg-cream/15',
            )}
          />
        ))}
      </div>
      <div className="flex items-center gap-5">
        {TEAM_IDS.map((t) => (
          <span key={t} className="flex items-center gap-2">
            <TeamLabel t={t} className="text-sand" />
            <NumberTicker value={st.totals[t]} className="font-display font-bold text-cream" />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- pulse toast ---------- */
export function PulseToast() {
  const pulse = useStore((s) => s.pulse)
  const teams = useStore((s) => s.teams)
  const [shown, setShown] = useState<typeof pulse>(null)
  const firstId = useRef(pulse?.id)
  useEffect(() => {
    if (!pulse || pulse.id === firstId.current || Date.now() - pulse.id > 3000) return
    if (pulse.kind === 'flip' || pulse.kind === 'call') return
    setShown(pulse)
    const id = setTimeout(() => setShown(null), 1800)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse?.id])
  const color = shown?.team ? COLORS[teams[shown.team].color] : null
  const text =
    shown &&
    (shown.kind === 'correct' && !shown.text
      ? 'Correct!'
      : shown.kind === 'pass'
        ? 'Pass'
        : `${shown.team ? teamName(teams, shown.team) : ''} ${shown.text ?? ''}`.trim())
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center">
      <AnimatePresence>
        {shown && (
          <motion.div
            key={shown.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease }}
            className="rounded-full px-10 py-4 font-display text-[2.6rem] font-bold tracking-[-0.02em] shadow-[0_20px_50px_-10px_rgb(0_0_0/0.6)]"
            style={
              shown.kind === 'pass'
                ? { background: '#2f2920', color: '#f6efe3' }
                : { background: color?.hex ?? '#f6efe3', color: color?.ink ?? '#100e0b' }
            }
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function TiebreakBanner({ index }: { index: number }) {
  const on = useStore((s) => s.games[index].tiebreak)
  return (
    <AnimatePresence>
      {on && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute inset-x-0 top-24 z-30 mx-auto flex w-fit items-center gap-4 rounded-full border border-warn/40 bg-[#2b2311] px-8 py-4 text-[1.7rem]"
        >
          <Swords className="size-8 text-warn" />
          <span className="font-display font-bold text-warn">Tiebreaker</span>
          <span className="text-cream">{GAMES[index].tiebreak}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ScoreColumns({
  scores,
  unit,
  hidden,
  compact,
}: {
  scores: Partial<Record<TeamId, number | null>>
  unit?: string
  hidden?: boolean
  compact?: boolean
}) {
  return (
    <div className={`grid ${TEAM_GRID} gap-6`}>
      {TEAM_IDS.map((t) => (
        <ScoreTile key={t} t={t} value={scores[t] ?? null} unit={unit} hidden={hidden} compact={compact} />
      ))}
    </div>
  )
}

function ScoreTile({ t, value, unit, hidden, compact }: { t: TeamId; value: number | null; unit?: string; hidden?: boolean; compact?: boolean }) {
  const team = useTeam(t)
  return (
    <div
      className={cn('rounded-[1.2rem] border', compact ? 'px-6 py-4' : 'px-8 py-6')}
      style={{ borderColor: `${team.hex}55`, background: `linear-gradient(180deg, ${team.hex}1f, ${team.hex}08)` }}
    >
      <div className={cn('font-display font-semibold leading-tight tracking-[-0.02em]', compact ? 'text-[1.4rem]' : 'text-[2rem]')} style={{ color: team.hex }}>
        {team.name}
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className={cn('font-display font-bold leading-none tracking-[-0.04em]', compact ? 'text-[3.4rem]' : 'text-[5.5rem]')}>
          {hidden || value == null ? <span className="text-cream/25">–</span> : <NumberTicker value={value} />}
        </span>
        {unit && <span className="text-[1.4rem] text-sand">{unit}</span>}
      </div>
    </div>
  )
}
