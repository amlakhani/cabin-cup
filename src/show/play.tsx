import { AnimatePresence, motion } from 'motion/react'
import { MicOff, Hand } from 'lucide-react'
import { BOARDS, GAMES } from '@/lib/games'
import {
  useStore,
  TEAM_IDS,
  type CharadesData,
  type HeatsData,
  type LineupData,
  type MatchData,
  type MemoryData,
  type RelayData,
  type TTTData,
  type TeamId,
  type TotalsData,
} from '@/lib/store'
import { DUELS_PER_HEAT, computeSheet, seriesWins } from '@/lib/scoring'
import { useNow, useTeam, useTeamColors, useTimerRemaining } from '@/lib/hooks'
import { MATCH_ICONS } from '@/lib/icons'
import { NumberTicker } from '@/components/fx/number-ticker'
import { cn } from '@/lib/utils'
import { BigTimer, ScoreColumns, TeamLabel, TeamPill, ease } from './parts'

function PlayHeader({ index, right }: { index: number; right?: React.ReactNode }) {
  const def = GAMES[index]
  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="text-[1.3rem] text-dust">Game {def.number}</div>
        <h2 className="font-display text-[3.6rem] font-bold leading-none tracking-[-0.03em]">{def.title}</h2>
      </div>
      {right}
    </div>
  )
}

/* ---------- totals ---------- */
function TotalsPlay({ index }: { index: number }) {
  const def = GAMES[index]
  const d = useStore((s) => s.games[index].data as TotalsData)
  const t = useTimerRemaining()
  const running = t && !t.done
  return (
    <div className="flex h-full flex-col gap-10">
      <PlayHeader index={index} />
      <div className="flex flex-1 items-center justify-center">
        {t ? (
          <BigTimer size={running ? 'xl' : 'lg'} />
        ) : (
          <div className="text-center text-[2.2rem] text-sand">{def.objective}</div>
        )}
      </div>
      <ScoreColumns scores={d.scores} unit={def.unit} hidden={!!running} />
    </div>
  )
}

/* ---------- heats ---------- */
function HeatsPlay({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as HeatsData)
  const sheet = computeSheet(index, useStore.getState().games[index])
  const h = d.heats[d.active]
  const judge = TEAM_IDS.find((t) => t !== h.a && t !== h.b)!
  return (
    <div className="flex h-full flex-col gap-8">
      <PlayHeader
        index={index}
        right={
          <div className="text-right text-[1.4rem] text-sand">
            Heat {d.active + 1} of 3 · <TeamLabel t={judge} /> judging
          </div>
        }
      />
      <div className="relative grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-10">
        <HeatSide t={h.a} cups={h.aWins} />
        <div className="font-display text-[3rem] font-bold text-dust">vs</div>
        <HeatSide t={h.b} cups={h.aWins == null ? null : DUELS_PER_HEAT - h.aWins} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {d.call && (
              <motion.div
                key={d.call.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.22, ease }}
                className={cn(
                  'rounded-[2rem] px-16 py-8 font-display font-black tracking-[-0.04em] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]',
                  d.call.word === 'CUP!' ? 'bg-warn text-[13rem] text-night' : 'bg-raised text-[9rem] text-cream',
                )}
              >
                {d.call.word}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {d.heats.map((x, i) => (
          <div
            key={i}
            className={cn(
              'rounded-[1rem] border px-6 py-4 text-[1.35rem]',
              i === d.active ? 'border-cream/40 bg-raised' : 'border-line bg-panel/60',
            )}
          >
            <div className="text-dust">Heat {i + 1}</div>
            <div className="mt-1 flex items-center gap-3">
              <TeamLabel t={x.a} /> <span className="text-dust">vs</span> <TeamLabel t={x.b} />
              <span className="ml-auto font-display font-semibold tabular-nums">
                {x.aWins == null ? '' : `${x.aWins}–${DUELS_PER_HEAT - x.aWins}`}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-10 text-[1.4rem] text-sand">
        {TEAM_IDS.map((t) => (
          <span key={t} className="flex items-center gap-3">
            <TeamLabel t={t} /> <span className="font-display font-bold text-cream">{sheet.scores[t] ?? 0}</span> cups
          </span>
        ))}
      </div>
    </div>
  )
}

function HeatSide({ t, cups }: { t: TeamId; cups: number | null }) {
  const team = useTeam(t)
  return (
    <div className="text-center">
      <div className="font-display text-[4.5rem] font-bold tracking-[-0.03em]" style={{ color: team.hex }}>
        {team.name}
      </div>
      <div className="mt-6 flex justify-center gap-3">
        {Array.from({ length: DUELS_PER_HEAT }).map((_, i) => (
          <motion.span
            key={i}
            className="h-14 w-10 rounded-b-[0.6rem] rounded-t-[0.2rem] border-2"
            animate={{
              background: cups != null && i < cups ? team.hex : 'rgba(0,0,0,0)',
              borderColor: cups != null && i < cups ? team.hex : 'rgba(246,239,227,0.18)',
            }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          />
        ))}
      </div>
    </div>
  )
}

/* ---------- memorize ---------- */
function MemoryPlay({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as MemoryData)
  const t = useTimerRemaining()
  const board = BOARDS[d.board]
  const studyVisible = d.stage === 'study' && t && !t.done
  if (studyVisible || d.stage === 'reveal') {
    return (
      <div className="flex h-full flex-col gap-6">
        <div className="relative flex-1 overflow-hidden rounded-[1.4rem] bg-white">
          <motion.img
            key={d.stage}
            src={board.src}
            alt="Memory board"
            className="absolute inset-0 size-full object-contain"
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease }}
          />
          {studyVisible && (
            <div className="absolute right-6 top-6 rounded-full bg-night/90 px-8 py-3 font-display text-[3.4rem] font-bold tabular-nums text-cream">
              {Math.ceil(t.remainingMs / 1000)}
            </div>
          )}
        </div>
        {d.stage === 'reveal' && <ScoreColumns scores={d.scores} unit="items" />}
      </div>
    )
  }
  return (
    <div className="flex h-full flex-col gap-10">
      <PlayHeader index={index} right={<div className="text-[1.4rem] text-sand">{board.label} board · {board.count} items</div>} />
      <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        {d.stage === 'setup' && (
          <p className="max-w-[44rem] text-[2.4rem] leading-snug text-sand">
            Eyes on the screen. You get <span className="text-cream">{d.study} seconds</span> to study the board. No writing.
          </p>
        )}
        {d.stage === 'study' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-[8rem] font-bold tracking-[-0.04em]">
            Board&rsquo;s gone.
          </motion.div>
        )}
        {d.stage === 'write' && (
          <>
            <div className="text-[2.4rem] text-sand">Write down everything you remember</div>
            <BigTimer size="xl" />
          </>
        )}
      </div>
    </div>
  )
}

/* ---------- tic-tac-toe ---------- */
function TTTPlay({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as TTTData)
  const active = d.series[d.active]
  const judge = TEAM_IDS.find((t) => t !== active.a && t !== active.b)!
  return (
    <div className="flex h-full flex-col gap-10">
      <PlayHeader index={index} right={<div className="text-[1.4rem] text-sand"><TeamLabel t={judge} /> judging</div>} />
      <div className="grid flex-1 grid-cols-3 items-stretch gap-6">
        {d.series.map((s, i) => {
          const w = seriesWins(s)
          const boards = s.boards.filter((b) => b !== 'draw')
          return (
            <motion.div
              key={i}
              animate={{ opacity: i === d.active || w.winner ? 1 : 0.55, scale: i === d.active ? 1 : 0.98 }}
              className={cn(
                'flex flex-col justify-between rounded-[1.4rem] border p-8',
                i === d.active ? 'border-cream/40 bg-raised' : 'border-line bg-panel/70',
              )}
            >
              <div className="text-[1.3rem] text-dust">Match {i + 1}</div>
              <div className="my-6 grid gap-4">
                <SeriesRow t={s.a} wins={w.a} winner={w.winner === 'a'} />
                <SeriesRow t={s.b} wins={w.b} winner={w.winner === 'b'} />
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map((k) => (
                  <BoardPip key={k} t={boards[k] ? (boards[k] === 'a' ? s.a : s.b) : null} />
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function SeriesRow({ t, wins, winner }: { t: TeamId; wins: number; winner: boolean }) {
  const team = useTeam(t)
  return (
    <div className="flex items-center justify-between">
      <span className="font-display text-[2.6rem] font-bold tracking-[-0.02em]" style={{ color: winner ? team.hex : undefined }}>
        {team.name}
      </span>
      <span className="font-display text-[3.4rem] font-bold tabular-nums">{wins}</span>
    </div>
  )
}

function BoardPip({ t }: { t: TeamId | null }) {
  const colors = useTeamColors()
  return (
    <motion.span
      className="h-3 flex-1 rounded-full"
      animate={{ background: t ? colors[t] : 'rgba(246,239,227,0.12)' }}
      transition={{ duration: 0.3 }}
    />
  )
}

/* ---------- silent line-up ---------- */
function LineupPlay({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as LineupData)
  const round = d.current >= 0 ? d.rounds[d.current] : null
  const wins = { A: 0, B: 0, C: 0 } as Record<TeamId, number>
  d.rounds.forEach((r) => r.winner && wins[r.winner]++)
  return (
    <div className="flex h-full flex-col gap-10">
      <PlayHeader
        index={index}
        right={
          <div className="flex items-center gap-3 rounded-full border border-line bg-panel px-6 py-3 text-[1.4rem] text-sand">
            <MicOff className="size-6 text-bad" /> No talking · gestures only
          </div>
        }
      />
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {round ? (
            <motion.div
              key={d.current}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
              transition={{ duration: 0.35, ease }}
            >
              <div className="text-[1.8rem] text-dust">Round {d.current + 1}</div>
              <div className="mt-4 max-w-[70rem] font-display text-[6.5rem] font-bold leading-[1.02] tracking-[-0.035em]">
                {round.category.replace(/\s*\(.*\)$/, '')}
              </div>
              {/\((.*)\)$/.test(round.category) && (
                <div className="mt-6 text-[2.4rem] text-sand">{round.category.match(/\((.*)\)$/)![1]}</div>
              )}
              {round.winner && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
                  <TeamPill t={round.winner} className="text-[2.6rem]" />
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="wait" className="text-[2.4rem] text-sand">
              Get ready. The first category is coming up.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex justify-center gap-12 text-[1.6rem]">
        {TEAM_IDS.map((t) => (
          <span key={t} className="flex items-center gap-3">
            <TeamLabel t={t} className="text-sand" />
            <NumberTicker value={wins[t]} className="font-display text-[2.2rem] font-bold" />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- balloon relay ---------- */
function RelayPlay({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as RelayData)
  const now = useNow(!!d.startedAt && d.finishes.length < 3, 50)
  const pre = d.startedAt ? d.startedAt - now : null
  const counting = pre != null && pre > 0
  const elapsed = d.startedAt && !counting ? (d.finishes.length >= 3 ? d.finishes[2].at : now) - d.startedAt : 0
  return (
    <div className="flex h-full flex-col gap-8">
      <PlayHeader
        index={index}
        right={<div className="text-[1.4rem] text-sand">{d.cups} cups each · first to clear the table</div>}
      />
      <div className="flex items-center justify-center py-2">
        <AnimatePresence mode="wait">
          {counting ? (
            <motion.div
              key={Math.ceil(pre! / 1000)}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.25 }}
              className="font-display text-[10rem] font-black leading-none tracking-[-0.04em]"
            >
              {Math.ceil(pre! / 1000)}
            </motion.div>
          ) : d.startedAt ? (
            <motion.div key="clock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-[8rem] font-bold leading-none tabular-nums tracking-[-0.04em]">
              {elapsed < 900 && d.finishes.length === 0 ? 'Go!' : `${(elapsed / 1000).toFixed(1)}s`}
            </motion.div>
          ) : (
            <motion.div key="idle" className="text-[2.4rem] text-sand">
              Line up behind your cups.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="grid flex-1 grid-rows-3 gap-5">
        {TEAM_IDS.map((t) => {
          const fi = d.finishes.findIndex((f) => f.team === t)
          return <Lane key={t} t={t} place={fi} time={fi >= 0 && d.startedAt ? d.finishes[fi].at - d.startedAt : null} />
        })}
      </div>
    </div>
  )
}

function Lane({ t, place, time }: { t: TeamId; place: number; time: number | null }) {
  const team = useTeam(t)
  const done = place >= 0
  return (
    <div className="relative overflow-hidden rounded-[1.2rem] border border-line bg-panel/70">
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{ background: `linear-gradient(90deg, ${team.hex}40, ${team.hex}14)` }}
        initial={false}
        animate={{ width: done ? '100%' : '0%' }}
        transition={{ duration: 0.4, ease }}
      />
      <div className="relative flex h-full items-center justify-between px-10">
        <span className="font-display text-[3.2rem] font-bold tracking-[-0.025em]" style={{ color: team.hex }}>
          {team.name}
        </span>
        {done && (
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-baseline gap-6"
          >
            <span className="text-[1.8rem] tabular-nums text-sand">{((time ?? 0) / 1000).toFixed(1)}s</span>
            <span className="font-display text-[4rem] font-black tracking-[-0.03em]">{['1st', '2nd', '3rd'][place]}</span>
          </motion.span>
        )}
      </div>
    </div>
  )
}

/* ---------- match ---------- */
function MatchPlay({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as MatchData)
  const colors = useTeamColors()
  const b = d.tb ?? d.board
  const current = b.order[b.turn % b.order.length]
  const cols = b.deck.length <= 16 ? 4 : b.deck.length <= 20 ? 5 : 6
  const counts = { A: 0, B: 0, C: 0 } as Record<TeamId, number>
  Object.values(d.board.matched).forEach((t) => (counts[t] += 0.5))
  return (
    <div className="grid h-full grid-cols-[1fr_22rem] gap-10">
      <div className="flex flex-col gap-6">
        <PlayHeader index={index} right={d.tb ? <div className="text-[1.6rem] font-semibold text-warn">Tiebreak board · first pair wins</div> : null} />
        <div
          className="grid flex-1 content-center gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, perspective: '1200px' }}
        >
          {b.deck.map((icon, pos) => {
            const m = b.matched[pos]
            const up = !!m || b.flipped.includes(pos)
            const { Icon, hex, name } = MATCH_ICONS[icon]
            return (
              <div key={pos} className="relative aspect-[4/3]" style={{ transformStyle: 'preserve-3d' }}>
                <motion.div
                  className="absolute inset-0"
                  style={{ transformStyle: 'preserve-3d' }}
                  initial={false}
                  animate={{ rotateY: up ? 180 : 0 }}
                  transition={{ duration: 0.4, ease: [0.77, 0, 0.175, 1] }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-[1rem] border border-line-strong bg-raised font-display text-[3.2rem] font-bold text-sand [backface-visibility:hidden]"
                  >
                    {pos + 1}
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[1rem] border-2 bg-panel [backface-visibility:hidden] [transform:rotateY(180deg)]"
                    style={{ borderColor: m ? colors[m] : 'rgba(246,239,227,0.5)' }}
                  >
                    <Icon style={{ color: hex }} className="size-[42%]" strokeWidth={1.75} />
                    <span className="text-[1.1rem] text-sand">{name}</span>
                  </div>
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex flex-col justify-center gap-5">
        <div className="text-[1.3rem] text-dust">Your turn</div>
        <AnimatePresence mode="wait">
          <motion.div key={`${current}-${b.turn}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <TeamPill t={current} className="text-[2.4rem]" />
          </motion.div>
        </AnimatePresence>
        <div className="mt-6 grid gap-3">
          {TEAM_IDS.map((t) => (
            <div key={t} className="flex items-center justify-between rounded-[1rem] border border-line bg-panel/70 px-6 py-4">
              <TeamLabel t={t} className="text-[1.6rem]" />
              <NumberTicker value={counts[t]} className="font-display text-[2.6rem] font-bold" />
            </div>
          ))}
        </div>
        <div className="text-[1.2rem] text-dust">pairs found</div>
      </div>
    </div>
  )
}

/* ---------- charades ---------- */
function CharadesPlay({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as CharadesData)
  const live = d.active != null ? d.turns[d.active] : null
  const prompt = d.prompts[d.order[d.cursor % d.order.length]]
  const next = d.turns.find((t) => !t.done)
  const totals = { A: 0, B: 0, C: 0 } as Record<TeamId, number>
  d.turns.forEach((t) => (totals[t.team] += t.correct))
  if (live) {
    return (
      <div className="grid h-full grid-rows-[auto_1fr_auto] gap-6">
        <div className="flex items-center justify-between">
          <TeamPill t={live.team} className="text-[2rem]" />
          <BigTimer size="md" className="items-end" />
        </div>
        <div className="flex items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={d.cursor}
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
              transition={{ duration: 0.28, ease }}
              className="max-w-[80rem] font-display text-[8.5rem] font-bold leading-[1] tracking-[-0.04em]"
            >
              {prompt}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-center gap-10 text-[1.8rem] text-sand">
          <span>
            <NumberTicker value={live.correct} className="font-display text-[3rem] font-bold text-ok" /> correct
          </span>
          <span>
            <span className="font-display text-[3rem] font-bold text-cream">{live.passed}</span> passed
          </span>
        </div>
      </div>
    )
  }
  return (
    <div className="flex h-full flex-col gap-10">
      <PlayHeader index={index} />
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        {next ? (
          <>
            <div className="text-[1.8rem] text-dust">Up next</div>
            <TeamPill t={next.team} className="text-[3.4rem]" />
            <div className="flex items-center gap-4 text-[2.4rem] text-sand">
              <Hand className="size-9" /> Guesser, turn your back to the TV.
            </div>
          </>
        ) : (
          <div className="font-display text-[5rem] font-bold">That&rsquo;s a wrap.</div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {TEAM_IDS.map((t) => (
          <div key={t} className="rounded-[1rem] border border-line bg-panel/70 px-6 py-4">
            <TeamLabel t={t} className="text-[1.6rem]" />
            <div className="mt-1 font-display text-[3.4rem] font-bold">
              <NumberTicker value={totals[t]} />
              <span className="ml-3 text-[1.3rem] font-normal text-sand">
                {d.turns.filter((x) => x.team === t && x.done).length} of {d.turns.filter((x) => x.team === t).length} turns
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PlayView({ index }: { index: number }) {
  switch (GAMES[index].kind) {
    case 'totals':
      return <TotalsPlay index={index} />
    case 'heats':
      return <HeatsPlay index={index} />
    case 'memory-board':
      return <MemoryPlay index={index} />
    case 'tictactoe':
      return <TTTPlay index={index} />
    case 'lineup':
      return <LineupPlay index={index} />
    case 'relay':
      return <RelayPlay index={index} />
    case 'match':
      return <MatchPlay index={index} />
    case 'charades':
      return <CharadesPlay index={index} />
  }
}
