import { useEffect, useRef, useState } from 'react'
import { Check, Flag, Megaphone, RotateCcw, Shuffle, SkipForward, Undo2, Eye, PencilLine, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { BOARDS, GAMES } from '@/lib/games'
import {
  useStore,
  TEAM_IDS,
  makeDeck,
  shuffle,
  type CharadesData,
  type HeatsData,
  type LineupData,
  type MatchBoard,
  type MatchData,
  type MemoryData,
  type RelayData,
  type TTTData,
  type TeamId,
  type TotalsData,
} from '@/lib/store'
import { updateGame, setView, resolveTie, finalPlacement } from '@/lib/actions'
import { DUELS_PER_HEAT, seriesWins } from '@/lib/scoring'
import { useNow, useTeam, useTeamColors, useTimerRemaining } from '@/lib/hooks'
import { MATCH_ICONS } from '@/lib/icons'
import { cn, fmtTime } from '@/lib/utils'
import { Section, Segmented, Stepper, TeamDot, TeamName, TeamScoreRow, TimerControl } from './common'

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
  const heat = d.heats[d.active]
  const judge = TEAM_IDS.find((t) => t !== heat.a && t !== heat.b)!
  const call = (word: string) =>
    updateGame<HeatsData>(index, (x) => {
      x.call = { word, id: Date.now() }
    })
  return (
    <>
      <Section title="Heats" hint="The team sitting out judges. Eight duels per heat, in one go or two waves.">
        <div className="grid grid-cols-3 gap-2">
          {d.heats.map((h, i) => (
            <button
              key={i}
              onClick={() => updateGame<HeatsData>(index, (x) => void (x.active = i))}
              className={cn(
                'press rounded-[12px] border px-3 py-3 text-left',
                d.active === i ? 'border-cream/60 bg-raised' : 'border-line bg-ink hover:border-line-strong',
              )}
            >
              <div className="text-xs text-dust">Heat {i + 1}</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                <TeamDot t={h.a} /> {teams[h.a].name}
                <span className="text-dust">vs</span>
                <TeamDot t={h.b} /> {teams[h.b].name}
              </div>
              <div className="mt-1.5 text-xs tabular-nums text-sand">
                {h.aWins == null ? 'Not scored' : `${h.aWins} – ${DUELS_PER_HEAT - h.aWins}`}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Caller"
        hint={
          <>
            Tap to flash a call on the TV. <TeamName t={judge} className="text-sand" /> judges this heat.
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {CALLS.map((w) => (
            <Button key={w} size="lg" onClick={() => call(w)}>
              {w}
            </Button>
          ))}
          <Button size="lg" variant="primary" onClick={() => call('CUP!')}>
            <Megaphone /> CUP!
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => call(CALLS[Math.floor(Math.random() * 4)])}
          >
            <Shuffle /> Random
          </Button>
        </div>
      </Section>

      <Section title={`Heat ${d.active + 1} score`} hint="Enter cups won by one team. The rest go to the other.">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-line bg-ink p-4">
          <div>
            <TeamName t={heat.a} className="font-display text-lg font-semibold" />
            <div className="text-xs text-dust">cups won</div>
          </div>
          <Stepper
            size="lg"
            max={DUELS_PER_HEAT}
            value={heat.aWins}
            onChange={(v) =>
              updateGame<HeatsData>(index, (x) => {
                x.heats[x.active].aWins = v
              })
            }
          />
          <div className="text-right">
            <TeamName t={heat.b} className="font-display text-lg font-semibold" />
            <div className="text-xs tabular-nums text-dust">
              gets {heat.aWins == null ? '–' : DUELS_PER_HEAT - heat.aWins}
            </div>
          </div>
        </div>
        {heat.aWins != null && d.active < 2 && (
          <Button
            className="mt-3"
            size="sm"
            variant="ghost"
            onClick={() => updateGame<HeatsData>(index, (x) => void (x.active = x.active + 1))}
          >
            <SkipForward /> Next heat
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
              <PencilLine /> {studyOver ? 'Start writing · 60s' : 'Skip to writing'}
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
              <Eye /> Pens down · reveal board
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

      <Section title="Unique correct answers" hint="Duplicates count once. Obvious misspellings are fine.">
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
  const now = useNow(!!d.startedAt && d.finishes.length < 3, 50)
  const elapsed = d.startedAt ? (d.finishes.length >= 3 ? d.finishes[2].at - d.startedAt : now - d.startedAt) : 0
  return (
    <>
      <Section title="Race" hint="Everyone starts together. Tap each team the moment its last cup drops.">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <span className="text-sm text-sand">Cups per team</span>
          <Stepper
            value={d.cups}
            min={1}
            max={24}
            onChange={(v) => updateGame<RelayData>(index, (x) => void (x.cups = v ?? 1))}
          />
          <span className="ml-auto font-display text-3xl font-semibold tabular-nums">
            {(elapsed / 1000).toFixed(1)}s
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {!d.startedAt ? (
            <Button
              variant="primary"
              size="xl"
              onClick={() => {
                updateGame<RelayData>(index, (x) => {
                  x.startedAt = Date.now() + 3000
                  x.finishes = []
                })
                setView('play')
              }}
            >
              <Play /> Start race (3-2-1)
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() =>
                updateGame<RelayData>(index, (x) => {
                  x.startedAt = null
                  x.finishes = []
                })
              }
            >
              <RotateCcw /> Reset race
            </Button>
          )}
        </div>
      </Section>
      <Section title="Finish line">
        <div className="grid gap-2.5">
          {TEAM_IDS.map((t) => {
            const fi = d.finishes.findIndex((f) => f.team === t)
            return <FinishRow key={t} t={t} index={index} place={fi} disabled={!d.startedAt || now < d.startedAt} />
          })}
        </div>
        {d.finishes.length > 0 && (
          <Button
            className="mt-3"
            size="sm"
            variant="ghost"
            onClick={() => updateGame<RelayData>(index, (x) => void x.finishes.pop())}
          >
            <Undo2 /> Undo last finish
          </Button>
        )}
      </Section>
    </>
  )
}

function FinishRow({ t, index, place, disabled }: { t: TeamId; index: number; place: number; disabled: boolean }) {
  const team = useTeam(t)
  const d = useStore((s) => s.games[index].data as RelayData)
  const f = d.finishes[place]
  return (
    <div className="flex items-center justify-between rounded-[12px] border border-line bg-ink px-4 py-3">
      <TeamName t={t} className="font-display text-lg font-semibold" />
      {place >= 0 ? (
        <span className="text-sm text-sand">
          <span className="font-display text-lg font-semibold text-cream">{['1st', '2nd', '3rd'][place]}</span> ·{' '}
          {((f.at - (d.startedAt ?? f.at)) / 1000).toFixed(1)}s
        </span>
      ) : (
        <Button
          size="lg"
          disabled={disabled}
          style={{ background: team.hex, color: team.inkHex }}
          className="border-0 hover:opacity-90"
          onClick={() => {
            updateGame<RelayData>(index, (x) => void x.finishes.push({ team: t, at: Date.now() }))
            pulse({ kind: 'finish', team: t, text: ['finish first', 'finish second', 'finish third'][d.finishes.length] })
          }}
        >
          <Flag /> Finished
        </Button>
      )}
    </div>
  )
}

/* ============ 7: match the pictures ============ */
export function MatchController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as MatchData)
  const teams = useStore((s) => s.teams)
  const tiebreak = useStore((s) => s.games[index].tiebreak)
  const colors = useTeamColors()
  const busy = useRef(false)
  const b = d.tb ?? d.board
  const isTb = !!d.tb
  const current = b.order[b.turn % b.order.length]
  const cols = b.deck.length <= 12 ? 4 : b.deck.length <= 16 ? 4 : b.deck.length <= 20 ? 5 : 6

  useEffect(() => () => void (busy.current = false), [])

  const flip = (pos: number) => {
    if (busy.current || b.matched[pos] || b.flipped.includes(pos) || b.flipped.length >= 2) return
    const key: 'tb' | 'board' = isTb ? 'tb' : 'board'
    const second = b.flipped.length === 1
    updateGame<MatchData>(index, (x) => {
      x[key]!.flipped.push(pos)
    })
    if (!second) return
    const first = b.flipped[0]
    const hit = b.deck[first] === b.deck[pos]
    if (hit) {
      updateGame<MatchData>(index, (x) => {
        const bb = x[key] as MatchBoard
        bb.matched[first] = current
        bb.matched[pos] = current
        bb.flipped = []
        bb.turn += 1
        x.lastResult = { kind: 'match', team: current, id: Date.now() }
        if (isTb && !x.tbWinner) x.tbWinner = current
      })
      pulse({ kind: 'match', team: current, text: 'found a pair' })
      if (isTb) {
        const others = b.order.filter((t) => t !== current)
        resolveTie(index, [current, ...others])
      }
    } else {
      busy.current = true
      updateGame<MatchData>(index, (x) => void (x.lastResult = { kind: 'miss', team: current, id: Date.now() }))
      setTimeout(() => {
        updateGame<MatchData>(index, (x) => {
          const bb = x[key] as MatchBoard
          bb.flipped = []
          bb.turn += 1
        })
        busy.current = false
      }, 2200)
    }
  }

  const newBoard = (pairs: number) =>
    updateGame<MatchData>(index, (x) => {
      x.pairs = pairs
      x.board = { deck: makeDeck(pairs), matched: {}, flipped: [], order: x.board.order, turn: 0 }
      x.lastResult = null
    })

  const f = finalPlacement(index)
  const tied = f.sheet.complete ? f.ranking.ties[0] ?? null : null

  return (
    <>
      <Section
        title={isTb ? 'Tiebreak board' : 'Board'}
        hint={isTb ? 'First pair found wins the tie.' : 'Tap the numbers the active team calls out. Faces are dimmed for you only.'}
        action={
          !isTb && (
            <Segmented
              value={d.pairs}
              onChange={(v) => newBoard(v)}
              options={[8, 10, 12].map((n) => ({ label: `${n} pairs`, value: n }))}
            />
          )
        }
      >
        <div className="mb-4 flex items-center justify-between rounded-[12px] border border-line bg-ink px-4 py-3">
          <span className="text-sm text-sand">Turn</span>
          <TeamName t={current} className="font-display text-xl font-semibold" />
          <span className="text-xs text-dust">
            {b.flipped.length === 0 ? 'Pick card 1' : b.flipped.length === 1 ? 'Pick card 2' : 'Checking…'}
          </span>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {b.deck.map((icon, pos) => {
            const m = b.matched[pos]
            const up = b.flipped.includes(pos)
            const { Icon, hex } = MATCH_ICONS[icon]
            return (
              <button
                key={pos}
                onClick={() => flip(pos)}
                disabled={!!m}
                className={cn(
                  'press relative flex aspect-[4/3] items-center justify-center rounded-[10px] border text-lg font-semibold',
                  up ? 'border-cream bg-raised' : 'border-line bg-ink hover:border-line-strong',
                )}
                style={m ? { borderColor: colors[m], background: 'transparent' } : undefined}
              >
                <span className="absolute left-2 top-1.5 font-mono text-[11px] text-dust">{pos + 1}</span>
                <Icon className={cn('size-6', !up && !m && 'opacity-25')} style={{ color: hex }} />
                {m && <TeamDot t={m} className="absolute bottom-2 right-2" />}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!isTb && (
            <>
              <span className="text-sm text-sand">First team</span>
              {TEAM_IDS.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={d.board.order[0] === t ? 'primary' : 'ghost'}
                  onClick={() =>
                    updateGame<MatchData>(index, (x) => {
                      const i = TEAM_IDS.indexOf(t)
                      x.board.order = [TEAM_IDS[i], TEAM_IDS[(i + 1) % 3], TEAM_IDS[(i + 2) % 3]]
                      x.board.turn = 0
                    })
                  }
                >
                  <TeamDot t={t} /> {teams[t].name}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => updateGame<MatchData>(index, (x) => void (x.board.turn += 1))}>
                <SkipForward /> Skip turn
              </Button>
              <Button size="sm" variant="ghost" onClick={() => newBoard(d.pairs)}>
                <Shuffle /> New board
              </Button>
            </>
          )}
          {isTb && (
            <Button size="sm" variant="ghost" onClick={() => updateGame<MatchData>(index, (x) => void (x.tb = null))}>
              <Square /> Close tiebreak board
            </Button>
          )}
        </div>
        {!isTb && tied && (
          <Button
            className="mt-4"
            variant={tiebreak ? 'primary' : 'secondary'}
            onClick={() =>
              updateGame<MatchData>(index, (x) => {
                x.tb = { deck: makeDeck(6), matched: {}, flipped: [], order: shuffle(tied), turn: 0 }
                x.tbWinner = null
              })
            }
          >
            Start fresh tiebreak board for {tied.map((t) => teams[t].name).join(' & ')}
          </Button>
        )}
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
    case 'charades':
      return <CharadesController index={index} />
  }
}

