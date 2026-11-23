import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GAMES } from '@/lib/games'
import { useStore, type FeudData } from '@/lib/store'
import { useTeam } from '@/lib/hooks'
import { NumberTicker } from '@/components/fx/number-ticker'
import { cn } from '@/lib/utils'
import { boardOrder, feudBank, feudPhase, otherTeam } from '@/host/feud'
import { ScoreColumns, ease } from './parts'

const FLASH_MS = 1400

export function FeudPlay({ index }: { index: number }) {
  const def = GAMES[index]
  const d = useStore((s) => s.games[index].data as FeudData)
  const q = d.questions[d.cursor]
  const phase = feudPhase(d)
  const bank = feudBank(d)
  const award = q ? d.awards[q.id] : undefined
  const flashing = useFlash(d.flash)

  const totals = { A: 0, B: 0, C: 0 }
  Object.values(d.awards).forEach((a) => a.team && (totals[a.team] += a.points))

  const ordered = q ? boardOrder(q) : []
  const rows = Math.max(4, Math.ceil(ordered.length / 2))
  const slots = Array.from({ length: rows * 2 }, (_, i) => ordered[i] ?? null)

  return (
    <div className="relative flex h-full flex-col gap-6">
      <div className="flex items-end justify-between gap-8">
        <div>
          <div className="text-[1.3rem] text-dust">Game {def.number}</div>
          <h2 className="font-display text-[3.6rem] font-bold leading-none tracking-[-0.03em]">{def.title}</h2>
        </div>
        {q && (
          <div className="flex items-center gap-4">
            {q.mult > 1 && (
              <span className="rounded-full bg-[#F5C143] px-5 py-2 font-display text-[1.6rem] font-bold text-night">
                {q.mult === 2 ? 'Double points' : 'Triple points'}
              </span>
            )}
            <span className="font-display text-[2rem] font-bold">
              Question {d.cursor + 1} <span className="text-dust">of {d.questions.length}</span>
            </span>
          </div>
        )}
      </div>

      <div className="min-h-[6.5rem]">
        <AnimatePresence mode="wait">
          {q && d.shown ? (
            <motion.p
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="max-w-[70rem] font-display text-[3rem] font-semibold leading-[1.12] tracking-[-0.02em]"
            >
              {q.text}
            </motion.p>
          ) : (
            <motion.p key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[2.2rem] text-sand">
              Face-off players, hands by the buzzer…
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_17rem] gap-8">
        <div
          className="grid grid-flow-col gap-3 rounded-[1.6rem] border border-line bg-panel/70 p-4"
          style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
        >
          {slots.map((a, i) => (
            <Tile key={a?.id ?? `empty-${i}`} n={i + 1} text={a?.text} points={a?.points} on={!!a && d.revealed.includes(a.id)} empty={!a} />
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-[1.4rem] border border-line bg-panel/70 px-6 py-5 text-center">
            <div className="text-[1.3rem] text-dust">{award ? 'Won' : 'On the board'}</div>
            <NumberTicker value={award ? award.points : bank} className="font-display text-[4.6rem] font-bold leading-none" />
          </div>
          <div className="flex justify-center gap-3" aria-label={`${d.strikes} strikes`}>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cn(
                  'flex size-[4.4rem] items-center justify-center rounded-[1rem] border-2 font-display text-[3rem] font-bold leading-none',
                  n <= d.strikes ? 'border-bad bg-bad/15 text-bad' : 'border-line text-cream/10',
                )}
              >
                ✕
              </span>
            ))}
          </div>
          <Status phase={phase} control={d.control} awardTeam={award?.team ?? null} awardPts={award?.points ?? 0} />
        </div>
      </div>

      <ScoreColumns scores={totals} unit="points" compact />

      <AnimatePresence>
        {flashing && (
          <motion.div
            key={flashing.id}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-[3rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {Array.from({ length: flashing.n }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, ease, delay: i * 0.06 }}
                className="flex size-[16rem] items-center justify-center rounded-[2.4rem] border-[0.6rem] border-bad bg-night/90 font-display text-[13rem] font-black leading-none text-bad shadow-[0_0_6rem_rgba(0,0,0,0.6)]"
              >
                ✕
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Shows a strike flash for a moment; stale flashes (e.g. after a reload) are ignored. */
function useFlash(flash: FeudData['flash']) {
  const [shown, setShown] = useState<FeudData['flash']>(null)
  useEffect(() => {
    if (!flash) return setShown(null)
    const left = FLASH_MS - (Date.now() - flash.id)
    if (left <= 0) return
    setShown(flash)
    const id = setTimeout(() => setShown(null), left)
    return () => clearTimeout(id)
  }, [flash?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return shown
}

function Tile({ n, text, points, on, empty }: { n: number; text?: string; points?: number; on: boolean; empty: boolean }) {
  if (empty) return <div className="rounded-[1rem] bg-ink/60" />
  return (
    <div className="relative min-h-0 [perspective:60rem]">
      <AnimatePresence initial={false} mode="wait">
        {on ? (
          <motion.div
            key="on"
            initial={{ rotateX: -90 }}
            animate={{ rotateX: 0 }}
            exit={{ rotateX: 90 }}
            transition={{ duration: 0.22, ease }}
            className="absolute inset-0 flex items-center gap-4 rounded-[1rem] bg-cream px-6 text-night"
          >
            <span className="min-w-0 flex-1 truncate font-display text-[2.3rem] font-bold uppercase tracking-[-0.01em]">{text}</span>
            <span className="flex h-[70%] min-w-[4.6rem] items-center justify-center rounded-[0.7rem] bg-night px-3 font-display text-[2.3rem] font-bold text-cream">
              {points}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="off"
            initial={{ rotateX: 90 }}
            animate={{ rotateX: 0 }}
            exit={{ rotateX: -90 }}
            transition={{ duration: 0.22, ease }}
            className="absolute inset-0 flex items-center justify-center rounded-[1rem] border border-line-strong bg-raised"
          >
            <span className="flex size-[3.4rem] items-center justify-center rounded-full bg-[#F5C143] font-display text-[1.9rem] font-bold text-night">
              {n}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Status({
  phase,
  control,
  awardTeam,
  awardPts,
}: {
  phase: ReturnType<typeof feudPhase>
  control: FeudData['control']
  awardTeam: FeudData['control']
  awardPts: number
}) {
  const playing = useTeam(control ?? 'A')
  const stealer = useTeam(control ? otherTeam(control) : 'B')
  const winner = useTeam(awardTeam ?? 'A')
  let tone = '#f6efe3'
  let top = ''
  let main = ''
  if (phase === 'faceoff') {
    top = 'Face-off'
    main = 'Higher answer wins the board'
  } else if (phase === 'play') {
    tone = playing.hex
    top = 'Playing'
    main = playing.name
  } else if (phase === 'steal') {
    tone = stealer.hex
    top = 'Steal!'
    main = `${stealer.name}, one guess`
  } else if (awardTeam) {
    tone = winner.hex
    top = `+${awardPts} points`
    main = winner.name
  } else {
    top = 'No points'
    main = 'On to the next one'
  }
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${phase}-${control}-${awardTeam}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease }}
        className="rounded-[1.4rem] border px-6 py-5"
        style={{ borderColor: `${tone}55`, background: `linear-gradient(180deg, ${tone}22, ${tone}06)` }}
      >
        <div className="text-[1.4rem] font-semibold" style={{ color: tone }}>
          {top}
        </div>
        <div className="mt-1 font-display text-[2.1rem] font-bold leading-[1.1] tracking-[-0.02em]">{main}</div>
      </motion.div>
    </AnimatePresence>
  )
}
