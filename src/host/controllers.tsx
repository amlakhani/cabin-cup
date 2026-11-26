import { useEffect, useState } from 'react'
import { Check, X, Megaphone, RotateCcw, Shuffle, SkipForward, Undo2, Eye, PencilLine, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { BOARDS, GAMES } from '@/lib/games'
import {
  useStore,
  TEAM_IDS,
  shuffle,
  type CharadesData,
  type HeatsData,
  type LineupData,
  type ChopsticksData,
  type MatchData,
  type TeamId,
  type MemoryData,
  type RelayData,
  type TTTData,
  type TotalsData,
} from '@/lib/store'
import { updateGame, setView, finalPlacement } from '@/lib/actions'
import { DUELS_PER_HEAT, heatDuels, heatWaves, seriesWins } from '@/lib/scoring'
import { useTimerRemaining } from '@/lib/hooks'
import { cn, fmtTime } from '@/lib/utils'
import { TuneController, PictionaryController, B2BController } from './trailer'
import { Section, Segmented, Stepper, TeamDot, TeamName, TeamScoreRow, TimerControl } from './common'
import { FeudController } from './feud'
import { ChaatController } from './chaat'

const pulse = (p: Parameters<ReturnType<typeof useStore.getState>['emit']>[0]) => useStore.getState().emit(p)

/* ============ 1, 8, 10: totals ============ */
export function TotalsController({ index }: { index: number }) {
  const def = GAMES[index]
  const d = useStore((s) => s.games[index].data as TotalsData)
  return (
    <>
      <Section title="Timer" hint="Starting the timer switches the TV to the live view.">
        <TimerControl presets={[{ label: fmtTime(def.timer! * 1000), seconds: def.timer!, name: def.timer! >= 120 ? `${def.timer! / 60}-minute round` : `${def.timer}-second round` }]} />
      </Section>
      <Section title="Team totals" hint={`Count only ${def.unit} fully inside the cups.`}>
        <div className="grid gap-2.5">
          {TEAM_IDS.map((t) => (
            <TeamScoreRow
              key={t}
              t={t}
              unit={def.unit}
              value={d.scores[t]}
              onChange={(v) =>
                updateGame<TotalsData>(index, (x) => {
                  if (v == null) delete x.scores[t]
                  else x.scores[t] = v
                })
              }
            />
          ))}
        </div>
      </Section>
    </>
  )
}

/* ============ 2: heats ============ */
const CALLS = ['Head', 'Shoulders', 'Knees', 'Toes', 'Nose', 'Ears']

export function HeatsController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as HeatsData)
  const teams = useStore((s) => s.teams)
  const players = useStore((s) => s.players)
  const heat = d.heats[d.active]
  const judge = TEAM_IDS.find((t) => t !== heat.a && t !== heat.b)!
  const duels = heat.total ?? heatDuels({ teams }, heat.a, heat.b)
  const waves = heatWaves({ teams, players }, heat.a, heat.b, d.cups)
  const wave = Math.min(d.wave, waves.length - 1)
  const call = (word: string) =>
    updateGame<HeatsData>(index, (x) => {
      x.call = { word, id: Date.now() }
    })
  return (
    <>
      <Section
        title="Matchups"
        hint="The team sitting out judges. Every team plays both opponents."
        action={
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-sand">Cups</span>
            <Segmented
              value={d.cups}
              onChange={(v) =>
                updateGame<HeatsData>(index, (x) => {
                  x.cups = v
                  x.wave = 0
                })
              }
              options={[1, 2, 4, 8].map((n) => ({ label: n, value: n as 1 | 2 | 4 | 8 }))}
            />
          </div>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {d.heats.map((h, i) => (
            <button
              key={i}
              onClick={() =>
                updateGame<HeatsData>(index, (x) => {
                  x.active = i
                  x.wave = 0
                })
              }
              className={cn(
                'press rounded-[12px] border px-3 py-3 text-left',
                d.active === i ? 'border-cream/60 bg-raised' : 'border-line bg-ink hover:border-line-strong',
              )}
            >
              <div className="text-xs text-dust">Matchup {i + 1}</div>
              <div className="mt-1 grid gap-0.5 text-sm font-medium">
                <span className="flex items-center gap-1.5 truncate">
                  <TeamDot t={h.a} /> {teams[h.a].name}
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <TeamDot t={h.b} /> {teams[h.b].name}
                </span>
              </div>
              <div className="mt-1.5 text-xs tabular-nums text-sand">
                {h.aWins == null ? 'Not scored' : `${h.aWins} – ${(h.total ?? DUELS_PER_HEAT) - h.aWins}`}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section
        title={`Wave ${wave + 1} of ${waves.length}`}
        hint={
          <>
            {duels} duels, {d.cups} at a time. <TeamName t={judge} className="text-sand" /> judges. Only you see the pairings.
          </>
        }
        action={
          <div className="flex gap-1">
            {waves.map((_, w) => (
              <Button
                key={w}
                size="sm"
                variant={w === wave ? 'primary' : 'ghost'}
                onClick={() => updateGame<HeatsData>(index, (x) => void (x.wave = w))}
              >
                Wave {w + 1}
              </Button>
            ))}
          </div>
        }
      >
        <ol className="grid gap-1.5">
          {waves[wave]?.map((p, i) => (
            <li
              key={i}
              className="grid grid-cols-[28px_1fr_auto_1fr] items-center gap-3 rounded-[10px] border border-line bg-ink px-3.5 py-2 text-sm"
            >
              <span className="font-mono text-[11px] text-dust">{wave * d.cups + i + 1}</span>
              <span className="flex items-center gap-2">
                <TeamDot t={heat.a} /> {p.a}
              </span>
              <span className="text-xs text-dust">vs</span>
              <span className="flex items-center justify-end gap-2">
                {p.b} <TeamDot t={heat.b} />
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Caller" hint="Tap to flash a call on the TV.">
        <div className="flex flex-wrap gap-2">
          {CALLS.map((w) => (
            <Button key={w} size="lg" onClick={() => call(w)}>
              {w}
            </Button>
          ))}
          <Button size="lg" variant="primary" onClick={() => call('CUP!')}>
            <Megaphone /> CUP!
          </Button>
          <Button size="lg" variant="ghost" onClick={() => call(CALLS[Math.floor(Math.random() * 4)])}>
            <Shuffle /> Random
          </Button>
        </div>
      </Section>

      <Section
        title={`Matchup ${d.active + 1} score`}
        hint={`Enter duels won by one team across all waves. The rest of the ${duels} go to the other team.`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-line bg-ink p-4">
          <div>
            <TeamName t={heat.a} className="font-display text-lg font-semibold" />
            <div className="text-xs text-dust">duels won</div>
          </div>
          <Stepper
            size="lg"
            max={duels}
            value={heat.aWins}
            onChange={(v) =>
              updateGame<HeatsData>(index, (x) => {
                const h = x.heats[x.active]
                h.aWins = v
                h.total = v == null ? null : duels
              })
            }
          />
          <div className="text-right">
            <TeamName t={heat.b} className="font-display text-lg font-semibold" />
            <div className="text-xs tabular-nums text-dust">gets {heat.aWins == null ? '–' : duels - heat.aWins}</div>
          </div>
        </div>
        {heat.aWins != null && d.active < 2 && (
          <Button
            className="mt-3"
            size="sm"
            variant="primary"
            onClick={() =>
              updateGame<HeatsData>(index, (x) => {
                x.active += 1
                x.wave = 0
              })
            }
          >
            <SkipForward /> Next matchup
          </Button>
        )}
      </Section>
    </>
  )
}

/* ============ 3: memorize ============ */
export function MemoryController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as MemoryData)
  const timer = useTimerRemaining()
  const { startTimer, clearTimer } = useStore.getState()
  const set = (fn: (x: MemoryData) => void) => updateGame<MemoryData>(index, fn)
  const studyOver = d.stage === 'study' && timer?.done
  return (
    <>
      <Section title="Board" hint="Pick a board and a study window before you start.">
        <div className="grid grid-cols-3 gap-3">
          {BOARDS.map((b, i) => (
            <button
              key={b.id}
              disabled={d.stage !== 'setup'}
              onClick={() => set((x) => void (x.board = i as 0 | 1 | 2))}
              className={cn(
                'press overflow-hidden rounded-[12px] border text-left disabled:opacity-50',
                d.board === i ? 'border-cream/70' : 'border-line hover:border-line-strong',
              )}
            >
              <img src={b.src} alt="" className="aspect-[16/9] w-full object-cover" />
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-medium">{b.label}</span>
                <span className="text-xs text-dust">{b.count} items</span>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-sand">Study time</span>
          <Segmented
            value={d.study}
            onChange={(v) => d.stage === 'setup' && set((x) => void (x.study = v))}
            options={[30, 45, 60].map((n) => ({ label: `${n}s`, value: n as 30 | 45 | 60 }))}
          />
        </div>
      </Section>

      <Section title="Run it" hint="The board vanishes from the TV at zero by itself.">
        <div className="flex flex-wrap items-center gap-2">
          {d.stage === 'setup' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                set((x) => void (x.stage = 'study'))
                startTimer('Study', d.study)
                setView('play')
              }}
            >
              <Eye /> Show board · {d.study}s
            </Button>
          )}
          {d.stage === 'study' && (
            <Button
              variant={studyOver ? 'primary' : 'secondary'}
              size="lg"
              onClick={() => {
                set((x) => void (x.stage = 'write'))
                startTimer('Write', 60)
              }}
            >
              <PencilLine /> {studyOver ? 'Start recall timer · 60s' : 'Hide board & start recall'}
            </Button>
          )}
          {d.stage === 'write' && (
            <Button
              variant={timer?.done ? 'primary' : 'secondary'}
              size="lg"
              onClick={() => {
                set((x) => void (x.stage = 'reveal'))
                clearTimer()
              }}
            >
              <Eye /> Reveal answers
            </Button>
          )}
          {d.stage !== 'setup' && (
            <Button
              variant="ghost"
              onClick={() => {
                set((x) => void (x.stage = 'setup'))
                clearTimer()
              }}
            >
              <RotateCcw /> Back to setup
            </Button>
          )}
          <span className="ml-auto text-sm capitalize text-dust">
            Stage: <span className="text-cream">{d.stage}</span>
            {timer && ` · ${fmtTime(timer.remainingMs)}`}
          </span>
        </div>
      </Section>

      {d.stage === 'reveal' && (
        <Section title={`Answers · ${BOARDS[d.board].items.length}`} hint="Also showing on the TV.">
          <ol className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] text-sand sm:grid-cols-3">
            {BOARDS[d.board].items.map((item, i) => (
              <li key={item + i} className="flex gap-2">
                <span className="w-5 shrink-0 text-right font-mono text-[11px] leading-5 text-dust">{i + 1}</span>
                {item}
              </li>
            ))}
          </ol>
        </Section>
      )}

      <Section title="Correct answers" hint="Count each correct item once per team. Obvious misspellings are fine.">
        <div className="grid gap-2.5">
          {TEAM_IDS.map((t) => (
            <TeamScoreRow
              key={t}
              t={t}
              unit="items"
              max={BOARDS[d.board].count}
              value={d.scores[t]}
              onChange={(v) =>
                set((x) => {
                  if (v == null) delete x.scores[t]
                  else x.scores[t] = v
                })
              }
            />
          ))}
        </div>
      </Section>
    </>
  )
}

/* ============ 4: tic-tac-toe ============ */
export function TTTController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as TTTData)
  const teams = useStore((s) => s.teams)
  const s = d.series[d.active]
  const w = seriesWins(s)
  const judge = TEAM_IDS.find((t) => t !== s.a && t !== s.b)!
  const record = (r: 'a' | 'b' | 'draw') => {
    updateGame<TTTData>(index, (x) => {
      x.series[x.active].boards.push(r)
    })
    if (r !== 'draw') pulse({ kind: 'score', team: r === 'a' ? s.a : s.b, text: 'takes the board' })
  }
  return (
    <>
      <Section title="Series" hint="Every pairing plays best of three. Draws are replayed.">
        <div className="grid grid-cols-3 gap-2">
          {d.series.map((x, i) => {
            const ww = seriesWins(x)
            return (
              <button
                key={i}
                onClick={() => updateGame<TTTData>(index, (y) => void (y.active = i))}
                className={cn(
                  'press rounded-[12px] border px-3 py-3 text-left',
                  d.active === i ? 'border-cream/60 bg-raised' : 'border-line bg-ink hover:border-line-strong',
                )}
              >
                <div className="text-xs text-dust">Match {i + 1}</div>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                  <TeamDot t={x.a} /> {teams[x.a].name} <span className="text-dust">vs</span> <TeamDot t={x.b} />{' '}
                  {teams[x.b].name}
                </div>
                <div className="mt-1.5 text-xs tabular-nums text-sand">
                  {ww.a} – {ww.b}
                  {ww.winner && ` · ${teams[ww.winner === 'a' ? x.a : x.b].name} win`}
                </div>
              </button>
            )
          })}
        </div>
      </Section>
      <Section
        title={`Match ${d.active + 1}`}
        hint={
          <>
            <TeamName t={judge} className="text-sand" /> judges. Tap who won each board.
          </>
        }
      >
        <div className="mb-4 flex gap-2">
          {[0, 1, 2].map((i) => {
            const b = s.boards.filter((x) => x !== 'draw')[i]
            return (
              <div
                key={i}
                className="flex h-10 flex-1 items-center justify-center rounded-[10px] border border-line bg-ink text-sm"
              >
                {b ? <TeamName t={b === 'a' ? s.a : s.b} /> : <span className="text-dust">Board {i + 1}</span>}
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" disabled={!!w.winner} onClick={() => record('a')}>
            <TeamDot t={s.a} /> {teams[s.a].name} won
          </Button>
          <Button size="lg" disabled={!!w.winner} onClick={() => record('b')}>
            <TeamDot t={s.b} /> {teams[s.b].name} won
          </Button>
          <Button size="lg" variant="ghost" disabled={!!w.winner} onClick={() => record('draw')}>
            Draw · replay
          </Button>
          <Button
            size="lg"
            variant="ghost"
            disabled={!s.boards.length}
            onClick={() => updateGame<TTTData>(index, (x) => void x.series[x.active].boards.pop())}
          >
            <Undo2 /> Undo board
          </Button>
        </div>
        {w.winner && d.active < 2 && (
          <Button className="mt-3" size="sm" variant="primary" onClick={() => updateGame<TTTData>(index, (x) => void (x.active += 1))}>
            <SkipForward /> Next match
          </Button>
        )}
      </Section>
    </>
  )
}

/* ============ 5: silent line-up ============ */
export function LineupController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as LineupData)
  const teams = useStore((s) => s.teams)
  const [draft, setDraft] = useState(d.categories.join('\n'))
  const round = d.current >= 0 ? d.rounds[d.current] : null
  const used = new Set(d.rounds.map((r) => r.category))
  const startRound = (category: string) => {
    updateGame<LineupData>(index, (x) => {
      x.rounds.push({ category, winner: null })
      x.current = x.rounds.length - 1
    })
    setView('play')
  }
  return (
    <>
      <Section
        title="Categories"
        hint="Tap one to put it on the TV. Run as many rounds as you like."
        action={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <PencilLine /> Edit list
              </Button>
            </DialogTrigger>
            <DialogContent title="Line-up categories" description="One per line.">
              <Textarea rows={10} value={draft} onChange={(e) => setDraft(e.target.value)} />
              <DialogClose asChild>
                <Button
                  className="mt-4 w-full"
                  variant="primary"
                  onClick={() =>
                    updateGame<LineupData>(index, (x) => {
                      x.categories = draft.split('\n').map((l) => l.trim()).filter(Boolean)
                    })
                  }
                >
                  Save categories
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        }
      >
        <div className="grid gap-1.5">
          {d.categories.map((c) => (
            <button
              key={c}
              disabled={round != null && !round.winner}
              onClick={() => startRound(c)}
              className={cn(
                'press flex items-center justify-between rounded-[10px] border border-line bg-ink px-3.5 py-2.5 text-left text-sm hover:border-line-strong disabled:opacity-40',
                used.has(c) && 'text-dust',
              )}
            >
              {c}
              {used.has(c) && <Check className="size-4 text-dust" />}
            </button>
          ))}
        </div>
      </Section>

      <Section title={round ? `Round ${d.current + 1}` : 'No round yet'} hint={round?.category ?? 'Pick a category to start.'}>
        {round && (
          <div className="flex flex-wrap gap-2">
            {TEAM_IDS.map((t) => (
              <Button
                key={t}
                size="lg"
                variant={round.winner === t ? 'primary' : 'secondary'}
                onClick={() => {
                  updateGame<LineupData>(index, (x) => void (x.rounds[x.current].winner = t))
                  pulse({ kind: 'round', team: t, text: 'win the round' })
                }}
              >
                <TeamDot t={t} /> {teams[t].name} first
              </Button>
            ))}
          </div>
        )}
        {d.rounds.length > 0 && (
          <ol className="mt-4 grid gap-1 text-[13px] text-sand">
            {d.rounds.map((r, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {i + 1}. {r.category}
                </span>
                <span>{r.winner ? teams[r.winner].name : '…'}</span>
              </li>
            ))}
          </ol>
        )}
        {d.rounds.length > 0 && (
          <Button
            className="mt-3"
            size="sm"
            variant="ghost"
            onClick={() =>
              updateGame<LineupData>(index, (x) => {
                x.rounds.pop()
                x.current = x.rounds.length - 1
              })
            }
          >
            <Undo2 /> Remove last round
          </Button>
        )}
      </Section>
    </>
  )
}

/* ============ 6: balloon relay ============ */
export function RelayController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as RelayData)
  const teams = useStore((s) => s.teams)
  const timer = useTimerRemaining()
  const { startTimer, clearTimer } = useStore.getState()
  const allDone = d.order.every((t) => d.scores[t] != null)
  const current = d.order[Math.min(d.active, d.order.length - 1)]
  const set = (fn: (x: RelayData) => void) => updateGame<RelayData>(index, fn)
  return (
    <>
      <Section
        title="Setup"
        hint="Use the same finish for every team. Reset the cups between teams."
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-sand">Cups</span>
            <Stepper value={d.cups} min={1} max={60} onChange={(v) => set((x) => void (x.cups = v ?? 1))} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-sand">Finish</span>
            <Segmented
              value={d.finish}
              onChange={(v) => set((x) => void (x.finish = v))}
              options={[
                { label: 'Table edge', value: 'edge' as const },
                { label: 'Taped line', value: 'line' as const },
              ]}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-sand">Order</span>
          {d.order.map((t, i) => (
            <button
              key={t}
              onClick={() => set((x) => void (x.active = i))}
              className={cn(
                'press flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px]',
                i === d.active && !allDone ? 'border-cream bg-raised' : 'border-line text-sand hover:border-line-strong',
              )}
            >
              <span className="font-mono text-[11px] text-dust">{i + 1}</span>
              <TeamDot t={t} /> {teams[t].name}
              {d.scores[t] != null && <span className="tabular-nums text-cream">· {d.scores[t]}</span>}
            </button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            disabled={Object.keys(d.scores).length > 0}
            onClick={() => set((x) => void (x.order = shuffle(x.order)))}
          >
            <Shuffle /> Shuffle order
          </Button>
        </div>
      </Section>

      <Section title={`Now playing: ${teams[current].name}`} hint="Start the clock, then count cups at the buzzer.">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                startTimer(`${teams[current].name} · 2 minutes`, GAMES[index].timer ?? 120)
                setView('play')
              }}
            >
              <Play /> Start 2 minutes
            </Button>
            {timer && (
              <span className={cn('font-display text-3xl font-semibold tabular-nums', timer.done && 'text-bad')}>
                {fmtTime(timer.remainingMs)}
              </span>
            )}
          </div>
          <div className="mt-5">
            <TeamScoreRow
              t={current}
              unit={`cups past the ${d.finish === 'edge' ? 'table edge' : 'line'}`}
              max={d.cups}
              value={d.scores[current]}
              onChange={(v) =>
                set((x) => {
                  if (v == null) delete x.scores[current]
                  else x.scores[current] = v
                })
              }
            />
          </div>
          <Button
            className="mt-4"
            variant="primary"
            disabled={d.scores[current] == null}
            onClick={() => {
              clearTimer()
              pulse({ kind: 'score', team: current, text: `move ${d.scores[current]} cups` })
              set((x) => {
                const next = x.order.findIndex((t, i) => i > x.active && x.scores[t] == null)
                const anyLeft = x.order.findIndex((t) => x.scores[t] == null)
                x.active = next >= 0 ? next : anyLeft >= 0 ? anyLeft : x.active
              })
            }}
          >
            <SkipForward /> {d.order.filter((t) => d.scores[t] == null && t !== current).length ? 'Save & next team' : 'Save score'}
          </Button>
        </Section>
      {allDone && (
        <Section title="All teams have played" hint="Tap a team in the order above to fix its count.">
          <div className="grid gap-2">
            {d.order.map((t) => (
              <div key={t} className="flex items-center justify-between rounded-[10px] border border-line bg-ink px-4 py-2.5 text-sm">
                <TeamName t={t} />
                <span className="font-display text-lg font-semibold tabular-nums">{d.scores[t]} cups</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

/* ============ 7: match the pictures (physical cards) ============ */
export function MatchController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as MatchData)
  const teams = useStore((s) => s.teams)
  const current = d.order[d.turn % d.order.length]
  const found = TEAM_IDS.reduce((n, t) => n + d.scores[t], 0)
  const left = Math.max(0, d.pairs - found)
  const set = (fn: (x: MatchData) => void) => updateGame<MatchData>(index, fn)

  const record = (hit: boolean) => {
    set((x) => {
      const t = x.order[x.turn % x.order.length]
      if (hit) x.scores[t] += 1
      x.log.push({ team: t, hit })
      x.lastResult = { kind: hit ? 'match' : 'miss', team: t, id: Date.now() }
      x.turn += 1
    })
    pulse({ kind: hit ? 'match' : 'miss', team: current, text: hit ? 'found a pair' : 'missed' })
  }

  const undo = () =>
    set((x) => {
      const last = x.log.pop()
      if (!last) return
      if (last.hit) x.scores[last.team] = Math.max(0, x.scores[last.team] - 1)
      x.turn = Math.max(0, x.turn - 1)
      x.lastResult = null
    })

  return (
    <>
      <Section
        title="Card layout"
        hint="Lay the printed photos face-down. Tell the app how many pairs are on the table."
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-sand">Pairs on the table</span>
            <Stepper value={d.pairs} min={1} max={60} onChange={(v) => set((x) => void (x.pairs = v ?? 1))} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-sand">First team</span>
            {TEAM_IDS.map((t) => (
              <Button
                key={t}
                size="sm"
                disabled={d.log.length > 0}
                variant={d.order[0] === t ? 'primary' : 'ghost'}
                onClick={() =>
                  set((x) => {
                    const i = TEAM_IDS.indexOf(t)
                    x.order = [TEAM_IDS[i], TEAM_IDS[(i + 1) % 3], TEAM_IDS[(i + 2) % 3]]
                    x.turn = 0
                  })
                }
              >
                <TeamDot t={t} /> {teams[t].name}
              </Button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Turns" hint={`${found} of ${d.pairs} pairs found · ${left} left`}>
        <div className="mb-4 flex items-center justify-between rounded-[12px] border border-line bg-ink px-4 py-3">
          <span className="text-sm text-sand">Flipping now</span>
          <TeamName t={current} className="font-display text-xl font-semibold" />
          <span className="text-xs text-dust">Turn {d.turn + 1}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button size="xl" className="bg-ok text-night hover:bg-ok/90" disabled={left === 0} onClick={() => record(true)}>
            <Check className="!size-5" /> Match
          </Button>
          <Button size="xl" disabled={left === 0} onClick={() => record(false)}>
            <X className="!size-5" /> Miss
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" disabled={!d.log.length} onClick={undo}>
            <Undo2 /> Undo last turn
          </Button>
          <Button size="sm" variant="ghost" onClick={() => set((x) => void (x.turn += 1))}>
            <SkipForward /> Skip turn
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {TEAM_IDS.map((t) => (
            <div key={t} className="rounded-[10px] border border-line bg-ink px-3 py-2.5">
              <TeamName t={t} className="text-[13px]" />
              <div className="mt-1 font-display text-2xl font-semibold tabular-nums">{d.scores[t]}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

/* ============ 8: chopsticks (one player per team per round) ============ */
export function ChopsticksController({ index }: { index: number }) {
  const def = GAMES[index]
  const d = useStore((s) => s.games[index].data as ChopsticksData)
  const teams = useStore((s) => s.teams)
  const players = useStore((s) => s.players)
  const timer = useTimerRemaining()
  const { startTimer, clearTimer } = useStore.getState()
  const set = (fn: (x: ChopsticksData) => void) => updateGame<ChopsticksData>(index, fn)
  const name = (id?: string) => players.find((p) => p.id === id)?.name ?? '—'
  const maxTeam = Math.max(...TEAM_IDS.map((t) => teams[t].members.length))
  const needsLineup = TEAM_IDS.some((t) => d.lineups[t].length !== teams[t].members.length || d.lineups[t].some((id) => !teams[t].members.includes(id)))
  const round = Math.min(d.round, Math.max(0, d.rounds - 1))
  const roundDone = TEAM_IDS.every((t) => d.counts[t][round] != null)
  const totals = { A: 0, B: 0, C: 0 } as Record<TeamId, number>
  TEAM_IDS.forEach((t) => d.counts[t].slice(0, d.rounds).forEach((v) => (totals[t] += v ?? 0)))

  const shuffleLineups = () =>
    set((x) => {
      TEAM_IDS.forEach((t) => (x.lineups[t] = shuffle(teams[t].members)))
      x.rounds = maxTeam || 8
      x.round = 0
      x.counts = { A: [], B: [], C: [] }
    })

  // Build a random order the first time the game is opened.
  useEffect(() => {
    if (needsLineup && TEAM_IDS.every((t) => d.counts[t].every((v) => v == null)) && maxTeam > 0) shuffleLineups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLineup])

  // A team with fewer players wraps back to its first player.
  const upNext = (t: TeamId, r: number) => {
    const l = d.lineups[t]
    return l.length ? l[r % l.length] : undefined
  }

  return (
    <>
      <Section
        title="Random order"
        hint="One player from each team goes at the same time, in this order."
        action={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (TEAM_IDS.some((t) => d.counts[t].some((v) => v != null)) && !confirm('Re-shuffle and clear the counts entered so far?')) return
              shuffleLineups()
            }}
          >
            <Shuffle /> Re-shuffle
          </Button>
        }
      >
        <div className="grid grid-cols-3 gap-3">
          {TEAM_IDS.map((t) => (
            <div key={t}>
              <TeamName t={t} className="mb-2 text-[13px] font-medium" />
              <ol className="grid gap-1 text-[13px]">
                {Array.from({ length: d.rounds }).map((_, r) => (
                  <li
                    key={r}
                    className={cn(
                      'flex items-center justify-between rounded-[8px] px-2.5 py-1.5',
                      r === round ? 'bg-raised text-cream' : 'text-sand',
                    )}
                  >
                    <span>
                      <span className="mr-2 font-mono text-[11px] text-dust">{r + 1}</span>
                      {name(upNext(t, r))}
                    </span>
                    {d.counts[t][r] != null && <span className="tabular-nums">{d.counts[t][r]}</span>}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-sand">Rounds</span>
          <Stepper value={d.rounds} min={1} max={24} onChange={(v) => set((x) => void (x.rounds = v ?? 1))} />
        </div>
      </Section>

      <Section title={`Round ${round + 1} of ${d.rounds}`} hint="Start the clock, then enter each player's count at the buzzer.">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              startTimer(`Round ${round + 1} · 60 seconds`, def.timer!)
              setView('play')
            }}
          >
            <Play /> Start 60 seconds
          </Button>
          {timer && (
            <span className={cn('font-display text-3xl font-semibold tabular-nums', timer.done && 'text-bad')}>
              {fmtTime(timer.remainingMs)}
            </span>
          )}
        </div>
        <div className="grid gap-2.5">
          {TEAM_IDS.map((t) => (
            <div key={t} className="flex items-center justify-between gap-4 rounded-[12px] border border-line bg-ink px-4 py-3">
              <div>
                <div className="font-display text-lg font-semibold">{name(upNext(t, round))}</div>
                <TeamName t={t} className="text-xs text-dust" />
              </div>
              <Stepper
                size="lg"
                value={d.counts[t][round]}
                onChange={(v) =>
                  set((x) => {
                    x.counts[t][round] = v
                  })
                }
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            disabled={round === 0}
            onClick={() => set((x) => void (x.round = Math.max(0, round - 1)))}
          >
            Previous round
          </Button>
          <Button
            variant="primary"
            disabled={!roundDone || round >= d.rounds - 1}
            onClick={() => {
              clearTimer()
              set((x) => void (x.round = round + 1))
            }}
          >
            <SkipForward /> Next round
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {TEAM_IDS.map((t) => (
            <div key={t} className="rounded-[10px] border border-line bg-ink px-3 py-2.5">
              <TeamName t={t} className="text-[13px]" />
              <div className="mt-1 font-display text-2xl font-semibold tabular-nums">{totals[t]}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

/* ============ 9: reverse charades ============ */
export function CharadesController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as CharadesData)
  const teams = useStore((s) => s.teams)
  const timer = useTimerRemaining()
  const { startTimer, clearTimer } = useStore.getState()
  const [draft, setDraft] = useState(d.prompts.join('\n'))
  const prompt = d.prompts[d.order[d.cursor % d.order.length]] ?? '—'
  const nextTurn = d.turns.findIndex((t) => !t.done)
  const live = d.active != null ? d.turns[d.active] : null
  const f = finalPlacement(index)
  const tied = f.sheet.complete ? f.ranking.ties[0] ?? null : null

  const answer = (result: 'correct' | 'pass') => {
    updateGame<CharadesData>(index, (x) => {
      const t = x.turns[x.active!]
      t.log.push({ text: prompt, result })
      if (result === 'correct') t.correct++
      else t.passed++
      x.cursor++
    })
    pulse({ kind: result === 'correct' ? 'correct' : 'pass', team: live!.team })
  }

  return (
    <>
      <Section
        title="Turns"
        hint="Two 60-second turns per team, a different guesser each time."
        action={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <PencilLine /> Edit prompts ({d.prompts.length})
              </Button>
            </DialogTrigger>
            <DialogContent title="Charades prompts" description="One per line. They are shuffled each time you save.">
              <Textarea rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} />
              <DialogClose asChild>
                <Button
                  className="mt-4 w-full"
                  variant="primary"
                  onClick={() =>
                    updateGame<CharadesData>(index, (x) => {
                      x.prompts = draft.split('\n').map((l) => l.trim()).filter(Boolean)
                      x.order = shuffle([...x.prompts.keys()])
                      x.cursor = 0
                    })
                  }
                >
                  Save &amp; shuffle
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {d.turns.map((t, i) => (
            <div
              key={i}
              className={cn(
                'rounded-[10px] border px-3 py-2.5 text-sm',
                d.active === i ? 'border-cream/60 bg-raised' : 'border-line bg-ink',
                t.done && 'opacity-70',
              )}
            >
              <div className="flex items-center justify-between">
                <TeamName t={t.team} className="font-medium" />
                <span className="text-xs text-dust">{i >= 6 ? 'Extra' : `Turn ${Math.floor(i / 3) + 1}`}</span>
              </div>
              <div className="mt-1 text-xs tabular-nums text-sand">
                {t.correct} correct · {t.passed} passed
              </div>
            </div>
          ))}
        </div>
        {tied && d.active == null && !d.extra && (
          <Button
            className="mt-3"
            size="sm"
            onClick={() =>
              updateGame<CharadesData>(index, (x) => {
                x.extra = true
                tied.forEach((t) => x.turns.push({ team: t, correct: 0, passed: 0, done: false, log: [] }))
              })
            }
          >
            Add one extra turn for {tied.map((t) => teams[t].name).join(' & ')}
          </Button>
        )}
      </Section>

      <Section
        title={live ? `${teams[live.team].name} are acting` : nextTurn >= 0 ? `Up next: ${teams[d.turns[nextTurn].team].name}` : 'All turns played'}
        hint={live ? 'Tap as the guesser calls it.' : 'Guesser stands with their back to the TV.'}
      >
        {live ? (
          <>
            <div className="mb-4 rounded-[12px] border border-line bg-ink px-4 py-4">
              <div className="text-xs text-dust">On screen</div>
              <div className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">{prompt}</div>
              <div className="mt-2 text-xs tabular-nums text-sand">
                {timer ? fmtTime(timer.remainingMs) : ''} · {live.correct} correct
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button size="xl" className="bg-ok text-night hover:bg-ok/90" onClick={() => answer('correct')}>
                <Check className="!size-5" /> Correct
              </Button>
              <Button size="xl" onClick={() => answer('pass')}>
                <SkipForward className="!size-5" /> Pass
              </Button>
            </div>
            <Button
              className="mt-3 w-full"
              variant={timer?.done ? 'primary' : 'ghost'}
              onClick={() => {
                updateGame<CharadesData>(index, (x) => {
                  x.turns[x.active!].done = true
                  x.active = null
                })
                clearTimer()
              }}
            >
              <Square /> End turn
            </Button>
          </>
        ) : (
          nextTurn >= 0 && (
            <Button
              variant="primary"
              size="xl"
              onClick={() => {
                updateGame<CharadesData>(index, (x) => void (x.active = nextTurn))
                startTimer('Charades', 60)
                setView('play')
              }}
            >
              <Play /> Start {teams[d.turns[nextTurn].team].name} · 60s
            </Button>
          )
        )}
      </Section>
    </>
  )
}

export function ControllerFor({ index }: { index: number }) {
  switch (GAMES[index].kind) {
    case 'totals':
      return <TotalsController index={index} />
    case 'heats':
      return <HeatsController index={index} />
    case 'memory-board':
      return <MemoryController index={index} />
    case 'tictactoe':
      return <TTTController index={index} />
    case 'lineup':
      return <LineupController index={index} />
    case 'relay':
      return <RelayController index={index} />
    case 'match':
      return <MatchController index={index} />
    case 'chopsticks':
      return <ChopsticksController index={index} />
    case 'tune':
      return <TuneController index={index} />
    case 'pictionary':
      return <PictionaryController index={index} />
    case 'b2b':
      return <B2BController index={index} />
    case 'feud':
      return <FeudController index={index} />
    case 'chaat':
      return <ChaatController index={index} />
    case 'charades':
      return <CharadesController index={index} />
  }
}

