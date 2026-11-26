import { AnimatePresence, motion } from 'motion/react'
import { Music2, Pencil } from 'lucide-react'
import { GAMES } from '@/lib/games'
import { useStore, TEAM_IDS, b2bTeam, type B2BData, type PictionaryData, type TuneData, type TeamId } from '@/lib/store'
import { useNow, useTeam } from '@/lib/hooks'
import { NumberTicker } from '@/components/fx/number-ticker'
import { cn } from '@/lib/utils'
import { BigTimer, ScoreColumns, TeamPill, ease } from './parts'
import { Picture } from './pictures'

const ROUND_NAMES = ['Warm-up', 'Turn It Up', 'Generation Swap']
const groupLabel = (g: string) => (g === 'pop' ? 'English' : `${g} Bollywood`)

function Header({ index, right }: { index: number; right?: React.ReactNode }) {
  const def = GAMES[index]
  return (
    <div className="flex items-end justify-between gap-8">
      <div>
        <div className="text-[1.3rem] text-dust">Game {def.number}</div>
        <h2 className="font-display text-[3.6rem] font-bold leading-none tracking-[-0.03em]">{def.title}</h2>
      </div>
      {right}
    </div>
  )
}

/* ---------- Name That Tune ---------- */
export function TunePlay({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as TuneData)
  const list = d.setlist[d.round] ?? []
  const song = d.songs[list[d.pos]]
  const now = useNow(!!d.playId, 200)
  const playing = !!d.playId && now - d.playId < (d.clipSec + 1) * 1000 && !d.revealed
  const swap = d.round === 2
  return (
    <div className="flex h-full flex-col gap-8">
      <Header
        index={index}
        right={
          <div className="text-right">
            <div className="font-display text-[2rem] font-bold">
              Round {d.round + 1}
              <span className="ml-3 text-[1.5rem] font-normal text-sand">{ROUND_NAMES[d.round]}</span>
            </div>
            <div className="text-[1.3rem] text-dust">
              Song {d.pos + 1} of {list.length}
              {swap && ' · double points'}
            </div>
          </div>
        }
      />
      <div className="relative flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          {d.revealed && song ? (
            <motion.div
              key={`r-${d.round}-${d.pos}`}
              className="flex items-center gap-16"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease }}
            >
              <Vinyl spinning />
              <div className="max-w-[60rem]">
                <div className="text-[1.6rem] text-dust">{groupLabel(song.group)}</div>
                <div className="mt-2 font-display text-[7rem] font-bold leading-[0.95] tracking-[-0.04em]">{song.title}</div>
                <div className="mt-4 text-[2.6rem] text-sand">{song.group === 'pop' ? song.artist : `from ${song.artist}`}</div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`q-${d.round}-${d.pos}`}
              className="flex flex-col items-center gap-10 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Equalizer active={playing} />
              <div className="font-display text-[5rem] font-bold tracking-[-0.03em]">
                {playing ? 'Buzz in!' : `Song ${d.pos + 1}`}
              </div>
              {swap && song && (
                <div className="rounded-full border border-warn/40 bg-warn/10 px-8 py-3 text-[2rem] font-semibold text-warn">
                  {song.group === 'pop' ? 'Adults only' : 'Kids only'}
                </div>
              )}
              {!swap && (
                <div className="flex items-center gap-3 text-[1.8rem] text-sand">
                  <Music2 className="size-8" /> Title is 1 point · {d.round === 0 ? 'artist' : 'film'} is a bonus point
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ScoreColumns scores={d.scores} unit="points" compact />
    </div>
  )
}

function Equalizer({ active }: { active: boolean }) {
  const bars = [0.5, 0.9, 0.6, 1, 0.7, 0.85, 0.55, 0.95, 0.65, 0.8, 0.5]
  return (
    <div className="flex h-[14rem] items-end gap-3" aria-hidden>
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-6 rounded-full bg-cream"
          style={{ height: '100%', originY: 1 }}
          animate={
            active
              ? { scaleY: [h * 0.3, h, h * 0.5, h * 0.9, h * 0.35], opacity: 1 }
              : { scaleY: 0.08, opacity: 0.35 }
          }
          transition={
            active
              ? { duration: 0.9 + (i % 3) * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  )
}

function Vinyl({ spinning }: { spinning: boolean }) {
  return (
    <motion.div
      className="relative size-[22rem] shrink-0 rounded-full"
      style={{
        background:
          'repeating-radial-gradient(circle, #1b1712 0 6px, #241f18 6px 8px)',
        boxShadow: '0 30px 80px -30px rgb(0 0 0 / 0.8)',
      }}
      animate={spinning ? { rotate: 360 } : { rotate: 0 }}
      transition={spinning ? { duration: 3, repeat: Infinity, ease: 'linear' } : undefined}
    >
      <div className="absolute inset-[34%] rounded-full bg-warn" />
      <div className="absolute inset-[47%] rounded-full bg-night" />
      <div className="absolute left-[30%] top-[14%] h-[10%] w-[4%] rotate-45 rounded-full bg-white/10" />
    </motion.div>
  )
}

/* ---------- Pictionary Relay ---------- */
export function PictionaryPlay({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as PictionaryData)
  const up = d.up ?? 'A'
  const team = useTeam(up)
  const turnId = d.turn ?? 0
  const rounds = d.rounds ?? 1
  const turns = d.turns ?? { A: 0, B: 0, C: 0 }
  const now = d.log.filter((l) => (l.turn ?? -1) === turnId && l.team === up && !l.steal).length
  const last = [...d.log].reverse().find((l) => l.team)
  const t = useStore((s) => s.timer)
  return (
    <div className="flex h-full flex-col gap-8">
      <Header
        index={index}
        right={
          <div className="flex items-center gap-5">
            <span
              className="rounded-full px-6 py-2 font-display text-[1.8rem] font-bold"
              style={{ background: `${team.hex}26`, color: team.hex, boxShadow: `inset 0 0 0 2px ${team.hex}66` }}
            >
              {team.name} drawing
            </span>
            <span className="font-display text-[2rem] font-bold">
              Turn {Math.min(turns[up] + 1, rounds)} <span className="text-dust">of {rounds}</span>
            </span>
          </div>
        }
      />
      <div className="grid flex-1 grid-cols-[1.2fr_1fr] items-center gap-12">
        <div className="flex flex-col items-center gap-6">
          {t ? (
            <BigTimer size="xl" />
          ) : (
            <div className="flex items-center gap-5 text-[2.4rem] text-sand">
              <Pencil className="size-10" /> First drawer, come up for your word.
            </div>
          )}
          <div className="font-display text-[2.6rem] font-bold">
            <NumberTicker value={now} className="tabular-nums" /> <span className="text-sand">guessed this turn</span>
          </div>
        </div>
        <div className="flex flex-col items-start gap-4">
          <div className="text-[1.5rem] text-dust">Last word guessed</div>
          <AnimatePresence mode="wait">
            {last ? (
              <motion.div
                key={d.log.length}
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease }}
              >
                <div className="font-display text-[6rem] font-bold leading-none tracking-[-0.04em]">{last.word}</div>
                <TeamPill t={last.team as TeamId} className="mt-5 text-[1.8rem]" />
                {last.steal && <div className="mt-3 text-[1.6rem] font-semibold text-sand">Stolen!</div>}
              </motion.div>
            ) : (
              <motion.div key="none" className="text-[2rem] text-sand">
                Nothing yet. Get drawing.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ScoreColumns scores={d.scores} unit="words" compact />
    </div>
  )
}

/* ---------- Back-to-Back Drawing ---------- */
export function B2BPlay({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as B2BData)
  const turn = d.turn ?? 0
  const team = b2bTeam(d.round, turn)
  const up = useTeam(team)
  const pic = d.pics[(d.round * 2 + turn) % d.pics.length]
  const t = useStore((s) => s.timer)
  return (
    <div className="flex h-full flex-col gap-6">
      <Header
        index={index}
        right={
          <div className="flex items-center gap-5">
            <span
              className="rounded-full px-6 py-2 font-display text-[1.8rem] font-bold"
              style={{ background: `${up.hex}26`, color: up.hex, boxShadow: `inset 0 0 0 2px ${up.hex}66` }}
            >
              {up.name} drawing
            </span>
            <span className="font-display text-[2rem] font-bold">
              Round {d.round + 1} <span className="text-dust">of {d.rounds}</span>
            </span>
          </div>
        }
      />
      <div className="grid min-h-0 flex-1 grid-cols-[1.3fr_1fr] items-center gap-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${d.round}-${turn}-${pic}`}
            className="flex h-full min-h-0 items-center justify-center rounded-[1.6rem] border border-line bg-panel/70 p-8"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            <Picture id={pic} className="h-full max-h-[34rem] w-full" />
          </motion.div>
        </AnimatePresence>
        <div className="flex flex-col gap-6">
          {d.revealed ? (
            TEAM_IDS.map((x) => <B2BScore key={x} t={x} round={d.round} scores={d.scores[x]} active={x === team} />)
          ) : (
            <>
              <div className="text-[2rem] leading-snug text-sand">
                Describer: shapes and directions only. Don&rsquo;t say what it is. Everyone else, stay quiet.
              </div>
              {t && <BigTimer size="lg" className="items-start" />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function B2BScore({ t, round, scores, active = true }: { t: TeamId; round: number; scores: (number | null)[]; active?: boolean }) {
  const team = useTeam(t)
  const v = scores[round]
  const total = scores.reduce<number>((a, x) => a + (x ?? 0), 0)
  return (
    <div className={cn('flex items-center justify-between rounded-[1.2rem] border border-line bg-panel/70 px-8 py-5 transition-opacity', !active && 'opacity-55')}>
      <span className="font-display text-[2rem] font-semibold" style={{ color: team.hex }}>
        {team.name}
      </span>
      <span className="flex items-baseline gap-6">
        <span className="flex gap-1.5" aria-label={v ? `${v} out of 5` : 'Not scored'}>
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.span
              key={n}
              className={cn('size-5 rounded-full')}
              animate={{ background: v != null && n <= v ? team.hex : 'rgba(246,239,227,0.12)' }}
              transition={{ duration: 0.25, delay: n * 0.05 }}
            />
          ))}
        </span>
        <span className="text-[1.4rem] text-sand">
          total <NumberTicker value={total} className="font-display text-[2.4rem] font-bold text-cream" />
        </span>
      </span>
    </div>
  )
}
