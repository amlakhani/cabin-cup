import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Users,
  Settings2,
  Trophy,
  MonitorPlay,
  Undo2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Play,
  Crown,
  Sparkles,
  Tv,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, startHostSync, TEAM_IDS, type ShowView } from '@/lib/store'
import { GAMES } from '@/lib/games'
import { goToGame, setView, resetGame } from '@/lib/actions'
import { standings } from '@/lib/scoring'
import { cn } from '@/lib/utils'
import { BASE, EVENT } from '@/lib/event'
import { EventTabs } from '@/components/EventTabs'
import { ControllerFor } from './controllers'
import { ResultPanel, Section, TeamDot } from './common'
import { SetupPage } from './Setup'
import { TeamsPage } from './Teams'
import { StandingsPage } from './Standings'

type Page = 'setup' | 'teams' | 'game' | 'standings'

const VIEWS: { v: ShowView; label: string; Icon: typeof Tv }[] = [
  { v: 'welcome', label: 'Welcome', Icon: Sparkles },
  { v: 'teams', label: 'Teams', Icon: Users },
  { v: 'rules', label: 'Rules', Icon: BookOpen },
  { v: 'play', label: 'Live', Icon: Play },
  { v: 'result', label: 'Result', Icon: Check },
  { v: 'standings', label: 'Standings', Icon: Trophy },
  { v: 'champion', label: 'Champion', Icon: Crown },
]

export default function HostApp() {
  const [page, setPage] = useState<Page>(() => (useStore.getState().players.length ? 'game' : 'setup'))
  const s = useStore()
  const st = standings(s)

  useEffect(() => startHostSync(), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !(e.target as HTMLElement).closest('input,textarea')) {
        e.preventDefault()
        useStore.getState().undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openTv = () => window.open(`${BASE}/show`, `family-cup-tv-${EVENT}`, 'popup,width=1280,height=720')

  return (
    <div className="flex min-h-dvh bg-night text-cream">
      {/* sidebar */}
      <aside className="sticky top-0 flex h-dvh w-[264px] shrink-0 flex-col border-r border-line bg-ink">
        <div className="px-5 pb-4 pt-5">
          <div className="font-display text-[19px] font-bold tracking-[-0.025em]">{s.settings.title}</div>
          <div className="text-xs text-dust">Host controls</div>
          <EventTabs page="/host" className="mt-3 flex w-full [&>a]:flex-1 [&>a]:justify-center [&>a]:px-1.5 [&>a]:text-[12px]" />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <NavItem active={page === 'setup'} onClick={() => setPage('setup')} Icon={Settings2} label="Event setup" />
          <NavItem
            active={page === 'teams'}
            onClick={() => setPage('teams')}
            Icon={Users}
            label="Roster & teams"
            meta={`${s.players.length}`}
          />
          <NavItem
            active={page === 'standings'}
            onClick={() => setPage('standings')}
            Icon={Trophy}
            label="Standings"
            meta={`${st.played}/${GAMES.length}`}
          />
          <div className="mb-1.5 mt-5 px-2.5 text-[11px] font-medium text-dust">Games</div>
          {GAMES.map((g, i) => {
            const done = !!s.games[i].result
            const active = page === 'game' && s.current === i
            return (
              <button
                key={g.id}
                onClick={() => {
                  setPage('game')
                  if (s.current !== i) goToGame(i)
                }}
                className={cn(
                  'press group flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2 text-left text-[13.5px]',
                  active ? 'bg-raised text-cream' : 'text-sand hover:bg-panel hover:text-cream',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-[7px] border font-mono text-[11px]',
                    done ? 'border-ok/40 bg-ok/10 text-ok' : active ? 'border-line-strong' : 'border-line text-dust',
                  )}
                >
                  {done ? <Check className="size-3.5" /> : g.number}
                </span>
                <span className="truncate">{g.short}</span>
                {s.current === i && <span className="ml-auto size-1.5 rounded-full bg-warn" aria-label="On TV" />}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-line p-3">
          <div className="grid gap-1.5">
            {st.order.map((t) => (
              <div key={t} className="flex items-center justify-between px-2 text-[13px]">
                <span className="flex items-center gap-2 text-sand">
                  <TeamDot t={t} /> {s.teams[t].name}
                </span>
                <span className="font-display font-semibold tabular-nums">{st.totals[t]}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-line bg-night/90 px-6 py-3 backdrop-blur-md">
          <span className="flex items-center gap-2 text-[13px] text-dust">
            <Tv className="size-4" /> TV shows
          </span>
          <div className="flex flex-wrap gap-1 rounded-[11px] border border-line bg-ink p-1">
            {VIEWS.map(({ v, label, Icon }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'press flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium',
                  s.view === v ? 'bg-cream text-night' : 'text-sand hover:text-cream',
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => useStore.getState().undo()} title="Undo (Ctrl/⌘+Z)">
              <Undo2 /> Undo
            </Button>
            <Button size="sm" variant="primary" onClick={openTv}>
              <MonitorPlay /> Open TV window
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1040px] flex-1 px-6 py-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={page === 'game' ? `game-${s.current}` : page}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {page === 'setup' && <SetupPage onNext={() => setPage('teams')} />}
              {page === 'teams' && <TeamsPage onNext={() => { setPage('game'); goToGame(0) }} />}
              {page === 'standings' && <StandingsPage />}
              {page === 'game' && <GamePage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function NavItem({
  active,
  onClick,
  Icon,
  label,
  meta,
}: {
  active: boolean
  onClick: () => void
  Icon: typeof Tv
  label: string
  meta?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'press flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2 text-left text-[13.5px]',
        active ? 'bg-raised text-cream' : 'text-sand hover:bg-panel hover:text-cream',
      )}
    >
      <Icon className="size-4" />
      {label}
      {meta && <span className="ml-auto font-mono text-[11px] text-dust">{meta}</span>}
    </button>
  )
}

function GamePage() {
  const i = useStore((s) => s.current)
  const view = useStore((s) => s.view)
  const result = useStore((s) => s.games[i].result)
  const teams = useStore((s) => s.teams)
  const def = GAMES[i]
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[13px] text-dust">
            Game {def.number} of {GAMES.length} · {def.skills.join(' + ')}
          </div>
          <h1 className="mt-1 font-display text-[34px] font-bold tracking-[-0.03em]">{def.title}</h1>
          <p className="mt-1 text-sm text-sand">{def.format}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={view === 'rules' ? 'primary' : 'secondary'} onClick={() => setView('rules')}>
            <BookOpen /> Rules on TV
          </Button>
          <Button variant={view === 'play' ? 'primary' : 'secondary'} onClick={() => setView('play')}>
            <Play /> Live on TV
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-5">
          <ControllerFor index={i} />
        </div>
        <div className="grid gap-5 lg:sticky lg:top-[76px]">
          <ResultPanel index={i} />
          <Section title="Quick notes">
            <ul className="grid gap-1.5 text-[13px] leading-relaxed text-sand">
              {def.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
              <li className="text-warn/90">Tiebreak: {def.tiebreak}</li>
            </ul>
            <button
              className="mt-4 text-xs text-dust underline underline-offset-4 hover:text-bad"
              onClick={() => confirm(`Reset everything entered for ${def.short}?`) && resetGame(i)}
            >
              Reset this game
            </button>
          </Section>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-5">
        <Button variant="ghost" disabled={i === 0} onClick={() => goToGame(i - 1)}>
          <ChevronLeft /> Previous
        </Button>
        {result && i < GAMES.length - 1 && (
          <Button variant="secondary" onClick={() => setView('standings')}>
            <Trophy /> Standings on TV
          </Button>
        )}
        {i < GAMES.length - 1 ? (
          <Button variant={result ? 'primary' : 'secondary'} size="lg" onClick={() => goToGame(i + 1)}>
            Next: {GAMES[i + 1].short} <ChevronRight />
          </Button>
        ) : (
          <Button variant="primary" size="lg" disabled={!result} onClick={() => setView('champion')}>
            <Crown /> Crown the champion
          </Button>
        )}
      </div>
      {TEAM_IDS.some((t) => teams[t].members.length === 0) && (
        <p className="text-[13px] text-warn">Teams are empty. Add the roster under Roster &amp; teams.</p>
      )}
    </div>
  )
}

// Handy for debugging from the browser console on game night.
;(window as unknown as Record<string, unknown>).__familyCup = useStore
