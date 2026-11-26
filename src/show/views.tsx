import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Crown, Clock, Swords, Users } from 'lucide-react'
import { GAMES } from '@/lib/games'
import { useStore, COLORS, TEAM_IDS, TEAM_GRID, type TeamId, teamName} from '@/lib/store'
import { standings } from '@/lib/scoring'
import { useTeam } from '@/lib/hooks'
import { NumberTicker } from '@/components/fx/number-ticker'
import { EmberField } from '@/components/fx/ember-field'
import { celebrate } from '@/components/fx/confetti'
import { ordinal } from '@/lib/utils'
import { ease } from './parts'
import { GameScene } from './scenes'
import { EVENT } from '@/lib/event'

const stagger = (i: number, base = 0) => ({
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.35, ease, delay: base + i * 0.05 },
})

/* ---------- welcome (the hero moment) ---------- */
export function WelcomeView() {
  const settings = useStore((s) => s.settings)
  const teams = useStore((s) => s.teams)
  const hasTeams = TEAM_IDS.every((t) => teams[t].members.length)
  const words = settings.title.split(' ')
  return (
    <div className="relative flex h-full flex-col items-center justify-center text-center">
      <EmberField className="opacity-70" />
      <motion.div {...stagger(0)} className="relative text-[1.8rem] text-sand">
        {settings.subtitle}
      </motion.div>
      <h1 className="relative mt-4 font-display text-[13rem] font-extrabold leading-[0.88] tracking-[-0.04em] [font-stretch:92%]">
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.4, ease, delay: 0.05 + i * 0.08 }}
            >
              {w}
              {i < words.length - 1 && ' '}
            </motion.span>
          </span>
        ))}
      </h1>
      <motion.div {...stagger(0, 0.3)} className="relative mt-8 text-[2rem] text-sand">
        {[settings.place, settings.date].filter(Boolean).join('  ·  ')}
      </motion.div>
      {hasTeams && (
        <motion.div {...stagger(0, 0.4)} className="relative mt-16 flex gap-6">
          {TEAM_IDS.map((t) => (
            <span
              key={t}
              className="rounded-full px-8 py-3 font-display text-[1.9rem] font-bold"
              style={{ background: COLORS[teams[t].color].hex, color: COLORS[teams[t].color].ink }}
            >
              {teamName(teams, t)}
            </span>
          ))}
        </motion.div>
      )}
      <motion.div {...stagger(0, 0.5)} className="relative mt-14 text-[1.4rem] text-dust">
        {GAMES.length} games · {TEAM_IDS.length} teams · {EVENT === 'trailer' ? 'bragging rights' : '1 cup'}
      </motion.div>
    </div>
  )
}

/* ---------- teams ---------- */
export function TeamsView() {
  const teams = useStore((s) => s.teams)
  const players = useStore((s) => s.players)
  const byId = Object.fromEntries(players.map((p) => [p.id, p.name]))
  return (
    <div className="flex h-full flex-col">
      <motion.h2 {...stagger(0)} className="font-display text-[3.6rem] font-bold leading-none tracking-[-0.03em]">
        Your teams
      </motion.h2>
      <div className={`mt-8 grid min-h-0 flex-1 ${TEAM_GRID} gap-8`}>
        {TEAM_IDS.map((t, col) => {
          const c = COLORS[teams[t].color]
          return (
            <motion.div
              key={t}
              {...stagger(col, 0.05)}
              className="flex flex-col overflow-hidden rounded-[1.6rem] border"
              style={{ borderColor: `${c.hex}50`, background: `linear-gradient(180deg, ${c.hex}22, ${c.hex}05 60%)` }}
            >
              <div className="px-10 pb-4 pt-7">
                <div className="font-display text-[3.2rem] font-bold leading-none tracking-[-0.03em]" style={{ color: c.hex }}>
                  {teamName(teams, t)}
                </div>
                <div className="mt-2 flex items-center gap-2 text-[1.3rem] text-sand">
                  <Users className="size-5" /> {teams[t].members.length} players
                </div>
              </div>
              <ul className={`grid gap-1 px-10 pb-8 ${TEAM_IDS.length === 2 ? 'grid-cols-2 gap-x-10' : ''}`}>
                {teams[t].members.map((id, i) => (
                  <motion.li
                    key={id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease, delay: 0.2 + col * 0.05 + i * 0.04 }}
                    className="flex items-center justify-between border-t border-line py-[0.55rem] text-[1.75rem]"
                  >
                    {byId[id]}
                    {teams[t].captain === id && <Crown className="size-6 text-warn" />}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- rules ---------- */
export function RulesView({ index }: { index: number }) {
  const def = GAMES[index]
  return (
    <div className="grid h-full grid-cols-[0.9fr_1.1fr] gap-16">
      <div className="flex min-h-0 flex-col">
        <motion.div {...stagger(0)} className="text-[1.5rem] text-dust">
          Game <span className="font-display font-bold text-cream">{def.number}</span> of {GAMES.length}
        </motion.div>
        <motion.h2
          {...stagger(1)}
          className="mt-2 font-display text-[5rem] font-bold leading-[0.95] tracking-[-0.035em]"
        >
          {def.title}
        </motion.h2>
        <motion.div {...stagger(2)} className="mt-5 flex flex-wrap items-center gap-3">
          {def.skills.map((s) => (
            <span key={s} className="rounded-full border border-line-strong px-5 py-1.5 text-[1.3rem] text-sand">
              {s}
            </span>
          ))}
          <span className="ml-2 flex items-center gap-2 text-[1.35rem] text-sand">
            <Clock className="size-6 shrink-0 text-dust" /> {def.format}
          </span>
        </motion.div>
        <motion.p {...stagger(3)} className="mt-5 max-w-[38rem] text-[2rem] leading-[1.3] text-cream">
          {def.objective}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.25 }}
          className="relative my-5 min-h-[10rem] max-w-[42rem] flex-1"
        >
          <GameScene id={def.id} className="absolute inset-0 size-full" />
        </motion.div>
        <div className="grid gap-4">
          <motion.div
            {...stagger(5)}
            className="flex items-start gap-4 rounded-[1.1rem] border border-warn/25 bg-warn/[0.06] px-6 py-4 text-[1.6rem]"
          >
            <Swords className="mt-1 size-7 shrink-0 text-warn" />
            <span>
              <span className="font-semibold text-warn">Tiebreaker. </span>
              <span className="text-cream/90">{def.tiebreak}</span>
            </span>
          </motion.div>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-12">
        <div>
          <motion.h3 {...stagger(2)} className="text-[1.5rem] font-semibold text-dust">
            How to play
          </motion.h3>
          <ol className="mt-5 grid gap-6">
            {def.howTo.map((step, i) => (
              <motion.li key={i} {...stagger(3 + i)} className="grid grid-cols-[3.4rem_1fr] items-baseline gap-4">
                <span className="flex size-[3.4rem] items-center justify-center rounded-full bg-cream font-display text-[1.7rem] font-bold text-night">
                  {i + 1}
                </span>
                <span className="text-[2.15rem] leading-[1.3]">{step}</span>
              </motion.li>
            ))}
          </ol>
        </div>
        <div>
          <motion.h3 {...stagger(6)} className="text-[1.5rem] font-semibold text-dust">
            House rules
          </motion.h3>
          <ul className="mt-4 grid gap-3">
            {def.rules.map((r, i) => (
              <motion.li key={r} {...stagger(7 + i)} className="flex items-baseline gap-4 text-[1.85rem] text-sand">
                <span className="size-2.5 shrink-0 translate-y-[-0.2em] rounded-full bg-cream/40" />
                {r}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ---------- result reveal ---------- */
export function ResultView({ index }: { index: number }) {
  const result = useStore((s) => s.games[index].result)
  const teams = useStore((s) => s.teams)
  const def = GAMES[index]
  const fired = useRef<number | null>(null)
  useEffect(() => {
    if (!result || fired.current === result.lockedAt) return
    fired.current = result.lockedAt
    const winner = TEAM_IDS.find((t) => result.placement[t] === 1)!
    const id = setTimeout(() => celebrate([COLORS[teams[winner].color].hex, '#f6efe3']), 650)
    return () => clearTimeout(id)
  }, [result, teams])
  if (!result) return <div className="flex h-full items-center justify-center text-[2.4rem] text-sand">Results coming up…</div>
  // podium order: 2nd, 1st, 3rd
  const byPlace = [...TEAM_IDS].sort((a, b) => result.placement[a] - result.placement[b])
  const podium = [byPlace[1], byPlace[0], byPlace[2]].filter(Boolean)
  return (
    <div className="flex h-full flex-col">
      <motion.div {...stagger(0)} className="text-[1.5rem] text-dust">
        Game {def.number} result
      </motion.div>
      <motion.h2 {...stagger(1)} className="font-display text-[4.6rem] font-bold tracking-[-0.03em]">
        {def.title}
      </motion.h2>
      <div className={`mt-6 grid flex-1 ${TEAM_GRID} items-end gap-8`}>
        {podium.map((t) => (
          <PodiumColumn
            key={t}
            t={t}
            place={result.placement[t]}
            points={result.points[t]}
            score={result.scores[t]}
            unit={def.unit}
          />
        ))}
      </div>
    </div>
  )
}

function PodiumColumn({
  t,
  place,
  points,
  score,
  unit,
}: {
  t: TeamId
  place: number
  points: number
  score?: number
  unit?: string
}) {
  const team = useTeam(t)
  const height = place === 1 ? '100%' : place === 2 ? '76%' : '56%'
  const delay = place === 3 ? 0 : place === 2 ? 0.15 : 0.3
  return (
    <div className="flex h-full flex-col justify-end">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease, delay: delay + 0.1 }}
        className="mb-5 text-center"
      >
        <div className="font-display text-[3.4rem] font-bold leading-none tracking-[-0.03em]" style={{ color: team.hex }}>
          {team.name}
        </div>
        {score != null && unit && (
          <div className="mt-2 text-[1.5rem] text-sand">
            {Number.isInteger(score) ? score : score.toFixed(1)} {unit}
          </div>
        )}
      </motion.div>
      <motion.div
        className="relative flex flex-col items-center justify-start overflow-hidden rounded-t-[1.6rem] pt-8"
        style={{ background: `linear-gradient(180deg, ${team.hex}, ${team.hex}b0)`, color: team.inkHex }}
        initial={{ height: '0%' }}
        animate={{ height }}
        transition={{ duration: 0.4, ease, delay }}
      >
        {place === 1 && <Crown className="mb-2 size-14" strokeWidth={2.2} />}
        <div className="font-display text-[5.4rem] font-black leading-none tracking-[-0.04em]">{ordinal(place)}</div>
        <div className="mt-3 font-display text-[2.6rem] font-bold">
          +<NumberTicker value={points} />
        </div>
      </motion.div>
    </div>
  )
}

/* ---------- standings ---------- */
export function StandingsView() {
  const s = useStore()
  const st = standings(s)
  const max = Math.max(1, ...TEAM_IDS.map((t) => st.totals[t]))
  return (
    <div className="flex h-full flex-col">
      <motion.div {...stagger(0)} className="text-[1.5rem] text-dust">
        After {st.played} of {GAMES.length} games
      </motion.div>
      <motion.h2 {...stagger(1)} className="font-display text-[5rem] font-bold tracking-[-0.03em]">
        Standings
      </motion.h2>
      <div className="mt-12 grid flex-1 content-center gap-8">
        {st.order.map((t, i) => (
          <motion.div key={t} layout transition={{ duration: 0.4, ease }} className="grid grid-cols-[4.5rem_30rem_1fr_8rem] items-center gap-8">
            <span className="font-display text-[3rem] font-bold text-dust">{i + 1}</span>
            <StandingName t={t} wins={st.wins[t]} />
            <div className="h-16 overflow-hidden rounded-full bg-cream/[0.06]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: COLORS[s.teams[t].color].hex }}
                initial={{ width: 0 }}
                animate={{ width: `${(st.totals[t] / max) * 100}%` }}
                transition={{ duration: 0.4, ease, delay: 0.1 + i * 0.06 }}
              />
            </div>
            <NumberTicker value={st.totals[t]} className="text-right font-display text-[4rem] font-bold tracking-[-0.03em]" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function StandingName({ t, wins }: { t: TeamId; wins: number }) {
  const team = useTeam(t)
  return (
    <div>
      <div className="font-display text-[2.8rem] font-bold leading-none tracking-[-0.025em]" style={{ color: team.hex }}>
        {team.name}
      </div>
      <div className="mt-1 text-[1.3rem] text-sand">
        {wins} game{wins === 1 ? '' : 's'} won
      </div>
    </div>
  )
}

/* ---------- champion ---------- */
export function ChampionView() {
  const s = useStore()
  const st = standings(s)
  const champ = st.order[0]
  const team = { ...s.teams[champ], name: teamName(s.teams, champ) }
  const c = COLORS[team.color]
  const byId = Object.fromEntries(s.players.map((p) => [p.id, p.name]))
  useEffect(() => {
    const id = setTimeout(() => celebrate([c.hex, '#f6efe3', '#f5c143'], true), 400)
    return () => clearTimeout(id)
  }, [c.hex])
  return (
    <div className="relative flex h-full flex-col items-center justify-center text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(50% 45% at 50% 40%, ${c.hex}33, transparent 70%)` }}
      />
      <motion.div {...stagger(0)}>
        <Crown className="size-24" style={{ color: c.hex }} strokeWidth={1.8} />
      </motion.div>
      <motion.div {...stagger(1)} className="mt-6 text-[2rem] text-sand">
        {s.settings.title} champions
      </motion.div>
      <motion.h1
        {...stagger(2)}
        className="mt-2 font-display text-[14rem] font-extrabold leading-[0.9] tracking-[-0.045em]"
        style={{ color: c.hex }}
      >
        {team.name}
      </motion.h1>
      <motion.div {...stagger(3)} className="mt-6 font-display text-[3rem] font-bold">
        <NumberTicker value={st.totals[champ]} /> points
      </motion.div>
      <motion.div {...stagger(4)} className="mt-10 flex max-w-[80rem] flex-wrap justify-center gap-x-8 gap-y-2 text-[2rem] text-sand">
        {team.members.map((id) => (
          <span key={id}>{byId[id]}</span>
        ))}
      </motion.div>
      <motion.div {...stagger(5)} className="mt-14 flex gap-10 text-[1.5rem] text-dust">
        {st.order.slice(1).map((t, i) => (
          <span key={t}>
            {ordinal(i + 2)} · {teamName(s.teams, t)} · {st.totals[t]}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
