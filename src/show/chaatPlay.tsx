import { AnimatePresence, motion } from 'motion/react'
import { GAMES } from '@/lib/games'
import { useStore, TEAM_IDS, type ChaatData } from '@/lib/store'
import { useTeam } from '@/lib/hooks'
import { ScoreColumns, ease } from './parts'

export function ChaatPlay({ index }: { index: number }) {
  const def = GAMES[index]
  const d = useStore((s) => s.games[index].data as ChaatData)
  const up = useTeam(d.up)
  const allDone = TEAM_IDS.every((t) => d.turns[t] >= d.rounds)
  return (
    <div className="flex h-full flex-col gap-8">
      <div className="flex items-end justify-between gap-8">
        <div>
          <div className="text-[1.3rem] text-dust">Game {def.number}</div>
          <h2 className="font-display text-[3.6rem] font-bold leading-none tracking-[-0.03em]">{def.title}</h2>
        </div>
        <span className="font-display text-[2rem] font-bold">
          {d.turnSec}-second turns <span className="text-dust">· {d.rounds} each</span>
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.1fr_1fr] items-center gap-12">
        <AnimatePresence mode="wait">
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
              <div className="font-display text-[4.4rem] font-bold leading-none tracking-[-0.03em]">All turns played!</div>
            ) : (
              <>
                <div className="text-[1.8rem] font-semibold" style={{ color: up.hex }}>
                  Turn {Math.min(d.turns[d.up] + 1, d.rounds)} of {d.rounds} · up now
                </div>
                <div className="mt-2 font-display text-[4.8rem] font-bold leading-[1.02] tracking-[-0.03em]">{up.name}</div>
                <div className="mt-6 text-[2rem] text-sand">Clue-giver, grab the phone. Other team: one of you watch for chaat words.</div>
              </>
            )}
          </motion.div>
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
