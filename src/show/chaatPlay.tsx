import { AnimatePresence, motion } from 'motion/react'
import { GAMES } from '@/lib/games'
import { useStore, TEAM_IDS, chaatNeed, chaatNextGiver, type ChaatData } from '@/lib/store'
import { useNow, useTeam } from '@/lib/hooks'
import { NumberTicker } from '@/components/fx/number-ticker'
import { cn } from '@/lib/utils'
import { ScoreColumns, ease } from './parts'

export function ChaatPlay({ index }: { index: number }) {
  const def = GAMES[index]
  const d = useStore((s) => s.games[index].data as ChaatData)
  const live = d.live ?? null
  const up = useTeam(live?.team ?? d.up)
  const teams = useStore((s) => s.teams)
  const players = useStore((s) => s.players)
  const need = (t: 'A' | 'B' | 'C') => chaatNeed(d, teams, t)
  const giver = chaatNextGiver(d, teams, players, d.up)
  const allDone = TEAM_IDS.every((t) => d.turns[t] >= need(t))
  const now = useNow(!!live && !live.ended && !live.paused, 200)
  const left = live ? Math.max(0, Math.ceil((live.paused ? live.leftMs : live.endsAt - now) / 1000)) : 0
  return (
    <div className="flex h-full flex-col gap-8">
      <div className="flex items-end justify-between gap-8">
        <div>
          <div className="text-[1.3rem] text-dust">Game {def.number}</div>
          <h2 className="font-display text-[3.6rem] font-bold leading-none tracking-[-0.03em]">{def.title}</h2>
        </div>
        <span className="font-display text-[2rem] font-bold">
          {d.turnSec}-second turns <span className="text-dust">· {d.rounds > 0 ? `${d.rounds} each` : 'everyone goes'}</span>
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.1fr_1fr] items-center gap-12">
        <AnimatePresence mode="wait">
          {live ? (
            <motion.div
              key={`live-${live.turn}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className="rounded-[1.8rem] border px-12 py-10"
              style={{ borderColor: `${up.hex}55`, background: `linear-gradient(180deg, ${up.hex}24, ${up.hex}06)` }}
            >
              <div className="flex items-center justify-between gap-6">
                <div className="font-display text-[3rem] font-bold leading-[1.05] tracking-[-0.02em]">{up.name}</div>
                <div className={cn('font-display text-[5.5rem] font-bold leading-none tabular-nums', !live.ended && left <= 5 && 'text-bad')}>
                  {live.ended ? '0:00' : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}
                </div>
              </div>
              <div className="mt-2 text-[1.8rem] font-semibold" style={{ color: up.hex }}>
                {live.ended ? 'Time’s up!' : live.paused ? 'Paused' : 'Playing now'}
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="rounded-[1.2rem] bg-night/40 px-6 py-5">
                  <div className="text-[1.4rem] text-sand">Got it</div>
                  <NumberTicker value={live.got} className="font-display text-[4.4rem] font-bold leading-none" />
                </div>
                <div className="rounded-[1.2rem] bg-night/40 px-6 py-5">
                  <div className="text-[1.4rem] text-bad">Buzzed</div>
                  <NumberTicker value={live.buzz} className="font-display text-[4.4rem] font-bold leading-none text-bad" />
                </div>
                <div className="rounded-[1.2rem] bg-night/40 px-6 py-5">
                  <div className="text-[1.4rem] text-sand">This turn</div>
                  <div className="font-display text-[4.4rem] font-bold leading-none tabular-nums">
                    {live.got - live.buzz > 0 ? '+' : ''}
                    {live.got - live.buzz}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={allDone ? 'done' : `${d.up}-${d.turns[d.up]}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              className="rounded-[1.8rem] border px-12 py-12"
              style={{ borderColor: `${up.hex}55`, background: `linear-gradient(180deg, ${up.hex}24, ${up.hex}06)` }}
            >
              {allDone ? (
                <div className="font-display text-[4.4rem] font-bold leading-none tracking-[-0.03em]">Everyone’s had a turn!</div>
              ) : (
                <>
                  <div className="text-[1.8rem] font-semibold" style={{ color: up.hex }}>
                    {up.name} · turn {Math.min(d.turns[d.up] + 1, need(d.up))} of {need(d.up)}
                  </div>
                  <div className="mt-2 font-display text-[4.8rem] font-bold leading-[1.02] tracking-[-0.03em]">{giver ?? up.name}</div>
                  <div className="mt-6 text-[2rem] text-sand">
                    {giver ? 'You’re up! Grab the phone.' : 'Clue-giver, grab the phone.'} Other team: one of you watch for chaat words.
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <ul className="grid gap-5 text-[2rem] leading-snug text-sand">
          <li>
            <span className="font-semibold text-cream">Got it</span> +1 for every word your team says.
          </li>
          <li>
            <span className="font-semibold text-bad">Buzz</span> −1 if you say a chaat word, rhyme, spell or act.
          </li>
          <li>
            <span className="font-semibold text-cream">Skip</span> scores nothing. {d.skips < 0 ? 'Unlimited skips.' : `${d.skips} per turn.`}
          </li>
        </ul>
      </div>

      <ScoreColumns scores={d.scores} unit="points" compact />
    </div>
  )
}
