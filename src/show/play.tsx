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
import { computeSheet, heatDuels, heatWaves, seriesWins } from '@/lib/scoring'
import { useTeam, useTeamColors, useTimerRemaining } from '@/lib/hooks'
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
  const teams = useStore((s) => s.teams)
  const players = useStore((s) => s.players)
  const sheet = computeSheet(index, useStore.getState().games[index])
  const h = d.heats[d.active]
  const judge = TEAM_IDS.find((t) => t !== h.a && t !== h.b)!
  const duels = h.total ?? heatDuels({ teams }, h.a, h.b)
  const waves = heatWaves({ teams, players }, h.a, h.b, d.cups).length
  const wave = Math.min(d.wave, waves - 1)
  return (
    <div className="flex h-full flex-col gap-8">
      <PlayHeader
        index={index}
        right={
          <div className="text-right text-[1.4rem] text-sand">
            Matchup {d.active + 1} of 3 · <TeamLabel t={judge} /> judging
          </div>
        }
      />
      <div className="flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${d.active}-${wave}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-full border border-line-strong bg-raised px-8 py-3 font-display text-[2.2rem] font-bold"
          >
            Wave {wave + 1} of {waves}
            <span className="ml-4 text-[1.5rem] font-normal text-sand">{d.cups} cups on the table</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="relative grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-10">
        <HeatSide t={h.a} won={h.aWins} duels={duels} />
        <div className="font-display text-[3rem] font-bold text-dust">vs</div>
        <HeatSide t={h.b} won={h.aWins == null ? null : duels - h.aWins} duels={duels} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {d.call && Date.now() - d.call.id < 8000 && (
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
      <div className="flex justify-center gap-12 text-[1.5rem] text-sand">
        {TEAM_IDS.map((t) => (
          <span key={t} className="flex items-center gap-3">
            <TeamLabel t={t} />
            <span className="font-display text-[2rem] font-bold text-cream">{sheet.scores[t] ?? 0}</span>
          </span>
        ))}
        <span className="text-dust">duels won</span>
      </div>
    </div>
  )
}

function HeatSide({ t, won, duels }: { t: TeamId; won: number | null; duels: number }) {
  const team = useTeam(t)
  return (
    <div className="text-center">
      <div className="font-display text-[4rem] font-bold leading-[1] tracking-[-0.03em]" style={{ color: team.hex }}>
        {team.name}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {Array.from({ length: duels }).map((_, i) => (
          <motion.span
            key={i}
            className="h-14 w-10 rounded-b-[0.6rem] rounded-t-[0.2rem] border-2"
            animate={{
              background: won != null && i < won ? team.hex : 'rgba(0,0,0,0)',
              borderColor: won != null && i < won ? team.hex : 'rgba(246,239,227,0.18)',
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
  if (studyVisible) {
    return (
      <div className="relative h-full overflow-hidden rounded-[1.4rem] bg-white">
        <motion.img
          src={board.src}
          alt="Memory board"
          className="absolute inset-0 size-full object-contain"
          initial={{ opacity: 0, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease }}
        />
        <div className="absolute right-6 top-6 rounded-full bg-night/90 px-8 py-3 font-display text-[3.4rem] font-bold tabular-nums text-cream">
          {Math.ceil(t.remainingMs / 1000)}
        </div>
      </div>
    )
  }
  if (d.stage === 'reveal') {
    const cols = board.items.length > 40 ? 3 : board.items.length > 16 ? 2 : 1
    return (
      <div className="grid h-full grid-cols-[1.45fr_1fr] gap-8">
        <div className="flex min-h-0 flex-col gap-6">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.4rem] bg-white">
            <motion.img
              src={board.src}
              alt="Memory board"
              className="absolute inset-0 size-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease }}
            />
          </div>
          <ScoreColumns scores={d.scores} unit="items" compact />
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[2.6rem] font-bold tracking-[-0.025em]">Answers</h2>
            <span className="text-[1.4rem] text-sand">{board.items.length} items</span>
          </div>
          <ol
            className="mt-4 grid content-start gap-x-6 gap-y-[0.35rem]"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {board.items.map((item, i) => (
              <motion.li
                key={item + i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease, delay: Math.min(i * 0.012, 0.4) }}
                className={cn('flex gap-3 leading-tight', cols === 3 ? 'text-[1.2rem]' : cols === 2 ? 'text-[1.45rem]' : 'text-[1.9rem]')}
              >
                <span className="w-[1.8em] shrink-0 text-right tabular-nums text-dust">{i + 1}</span>
                {item}
              </motion.li>
            ))}
          </ol>
        </div>
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
  const t = useTimerRemaining()
  const current = d.order[Math.min(d.active, d.order.length - 1)]
  const allDone = d.order.every((x) => d.scores[x] != null)
  return (
    <div className="flex h-full flex-col gap-8">
      <PlayHeader
        index={index}
        right={
          <div className="text-right text-[1.4rem] text-sand">
            {d.cups} cups · finish at the {d.finish === 'edge' ? 'table edge' : 'taped line'}
          </div>
        }
      />
      <div className="grid flex-1 grid-cols-[1fr_1.1fr] items-center gap-14">
        <div className="flex flex-col items-center gap-6 text-center">
          {allDone ? (
            <div className="font-display text-[5rem] font-bold tracking-[-0.03em]">All teams done</div>
          ) : (
            <>
              <div className="text-[1.6rem] text-dust">At the table</div>
              <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <TeamPill t={current} className="text-[2.6rem]" />
                </motion.div>
              </AnimatePresence>
              {t ? <BigTimer size="lg" /> : <div className="text-[2rem] text-sand">60 seconds on the clock</div>}
            </>
          )}
        </div>
        <div className="grid gap-5">
          {d.order.map((x, i) => (
            <RelayRow key={x} t={x} order={i + 1} cups={d.cups} score={d.scores[x]} active={!allDone && x === current} />
          ))}
        </div>
      </div>
    </div>
  )
}

function RelayRow({ t, order, cups, score, active }: { t: TeamId; order: number; cups: number; score?: number; active: boolean }) {
  const team = useTeam(t)
  return (
    <motion.div
      animate={{ opacity: active || score != null ? 1 : 0.55 }}
      className={cn('rounded-[1.2rem] border px-8 py-5', active ? 'border-cream/40 bg-raised' : 'border-line bg-panel/70')}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[2.2rem] font-bold tracking-[-0.02em]" style={{ color: team.hex }}>
          <span className="mr-3 text-[1.3rem] font-normal text-dust">{order}</span>
          {team.name}
        </span>
        <span className="font-display text-[3rem] font-bold tabular-nums">
          {score == null ? <span className="text-cream/25">–</span> : <NumberTicker value={score} />}
        </span>
      </div>
      <div className="mt-3 flex gap-[0.25rem]">
        {Array.from({ length: cups }).map((_, i) => (
          <motion.span
            key={i}
            className="h-3 flex-1 rounded-full"
            initial={false}
            animate={{ background: score != null && i < score ? team.hex : 'rgba(246,239,227,0.1)' }}
            transition={{ duration: 0.25, delay: i * 0.015 }}
          />
        ))}
      </div>
    </motion.div>
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
