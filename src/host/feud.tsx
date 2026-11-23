import { useEffect, useRef, useState } from 'react'
import { Reorder, useDragControls } from 'motion/react'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Eye,
  EyeOff,
  GripVertical,
  ArrowDownWideNarrow,
  Pencil,
  Plus,
  SkipForward,
  Trash2,
  Trophy,
  Undo2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { useStore, TEAM_IDS, uid, feudQuestion, type FeudData, type FeudQuestion, type TeamId } from '@/lib/store'
import { updateGame, setView } from '@/lib/actions'
import { cn } from '@/lib/utils'
import { Section, TeamDot } from './common'

export const MAX_ANSWERS = 8

/** Answers in board order: the host's dragged order, or most points first (entry order breaks ties). */
export function boardOrder(q: FeudQuestion) {
  if (q.ordered) return [...q.answers]
  return q.answers
    .map((a, i) => ({ a, i }))
    .sort((x, y) => y.a.points - x.a.points || x.i - y.i)
    .map((x) => x.a)
}

export function feudBank(d: FeudData) {
  const q = d.questions[d.cursor]
  if (!q) return 0
  const sum = q.answers.filter((a) => d.revealed.includes(a.id)).reduce((n, a) => n + a.points, 0)
  return sum * q.mult
}

export function feudPhase(d: FeudData): 'faceoff' | 'play' | 'steal' | 'done' {
  const q = d.questions[d.cursor]
  if (q && d.awards[q.id]) return 'done'
  if (!d.control) return 'faceoff'
  if (d.strikes >= 3) return 'steal'
  return 'play'
}

export const otherTeam = (t: TeamId): TeamId => (TEAM_IDS.find((x) => x !== t) ?? t)

/** Splits pasted lines like "Khakhra 12", "Khakhra - 12" or "Khakhra, 12" into answers. */
function parseAnswers(raw: string) {
  return raw
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(.*?)[\s,:\-–—=]*?(\d+)\s*(?:pts?|points?)?$/i)
      return m && m[1].trim()
        ? { text: m[1].replace(/[\s,:\-–—=]+$/, '').trim(), points: Number(m[2]) }
        : { text: l, points: 0 }
    })
}

export function FeudController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as FeudData)
  const teams = useStore((s) => s.teams)
  const set = (fn: (x: FeudData) => void) => updateGame<FeudData>(index, fn)
  const q = d.questions[d.cursor]
  const phase = feudPhase(d)
  const bank = feudBank(d)
  const award = q ? d.awards[q.id] : undefined
  const short = (t: TeamId) => teams[t].name.replace(/^Team /, '')
  const totals = TEAM_IDS.map((t) => ({
    t,
    pts: Object.values(d.awards).reduce((n, a) => n + (a.team === t ? a.points : 0), 0),
  }))

  const goTo = (i: number) =>
    set((x) => {
      x.cursor = Math.max(0, Math.min(x.questions.length - 1, i))
      x.revealed = []
      x.strikes = 0
      x.control = null
      x.shown = false
      x.flash = null
    })

  const strike = () =>
    set((x) => {
      // Face-off misses show a single X but don't count as strikes.
      if (!x.control) {
        x.flash = { n: 1, id: Date.now() }
        return
      }
      x.strikes = Math.min(3, x.strikes + 1)
      x.flash = { n: x.strikes, id: Date.now() }
    })

  const giveBank = (team: TeamId | null) =>
    set((x) => {
      const cur = x.questions[x.cursor]
      if (!cur) return
      x.awards[cur.id] = { team, points: team ? feudBank(x) : 0 }
    })

  if (!q)
    return (
      <Section title="No questions yet" hint="Add a question below to get started.">
        <QuestionEditor index={index} />
      </Section>
    )

  const ordered = boardOrder(q)

  return (
    <>
      <Section
        title={`Question ${d.cursor + 1} of ${d.questions.length}`}
        hint={q.mult > 1 ? `${q.mult === 2 ? 'Double' : 'Triple'} points on this question.` : 'Read it out, then run the face-off.'}
        action={
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" aria-label="Previous question" disabled={d.cursor === 0} onClick={() => goTo(d.cursor - 1)}>
              <ChevronLeft />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Next question"
              disabled={d.cursor >= d.questions.length - 1}
              onClick={() => goTo(d.cursor + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-1">
          {d.questions.map((x, i) => {
            const a = d.awards[x.id]
            return (
              <button
                key={x.id}
                onClick={() => goTo(i)}
                className={cn(
                  'press h-8 min-w-8 rounded-[8px] border px-2 text-[13px] font-semibold tabular-nums',
                  i === d.cursor ? 'border-cream bg-cream text-night' : a ? 'border-line text-dust' : 'border-line text-sand hover:border-line-strong',
                )}
                title={x.text}
              >
                {a ? (a.team ? <TeamDot t={a.team} className="mx-auto" /> : '–') : i + 1}
              </button>
            )
          })}
        </div>

        <div className="rounded-[14px] border border-line bg-ink px-5 py-4">
          <div className="font-display text-2xl font-semibold leading-snug tracking-[-0.01em]">{q.text || 'Untitled question'}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant={d.shown ? 'secondary' : 'primary'}
              onClick={() => {
                set((x) => void (x.shown = !x.shown))
                if (useStore.getState().view !== 'play') setView('play')
              }}
            >
              {d.shown ? <EyeOff /> : <Eye />} {d.shown ? 'Hide question on TV' : 'Show question on TV'}
            </Button>
            <span className="text-xs text-dust">
              {q.answers.length} answer{q.answers.length === 1 ? '' : 's'} on the board
            </span>
          </div>
        </div>

        {ordered.length === 0 ? (
          <div className="mt-4 rounded-[12px] border border-dashed border-line px-4 py-6 text-center text-sm text-sand">
            No answers yet. Add them in <span className="text-cream">Questions &amp; answers</span> below.
          </div>
        ) : (
          <div className="mt-4 grid grid-flow-col gap-2" style={{ gridTemplateRows: `repeat(${Math.ceil(ordered.length / 2)}, auto)` }}>
            {ordered.map((a, i) => {
              const on = d.revealed.includes(a.id)
              return (
                <button
                  key={a.id}
                  onClick={() =>
                    set((x) => {
                      x.revealed = on ? x.revealed.filter((r) => r !== a.id) : [...x.revealed, a.id]
                    })
                  }
                  className={cn(
                    'press flex h-14 items-center gap-3 rounded-[10px] border px-3 text-left',
                    on ? 'border-cream/60 bg-cream text-night' : 'border-line bg-ink hover:border-line-strong',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
                      on ? 'bg-night text-cream' : 'bg-raised text-sand',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{a.text || '—'}</span>
                  <span className="font-display text-lg font-bold tabular-nums">{a.points}</span>
                </button>
              )
            })}
          </div>
        )}
        <p className="mt-2 text-xs text-dust">Tap an answer to flip it on the TV. Tap again to hide it.</p>
      </Section>

      <Section
        title={
          phase === 'faceoff'
            ? 'Face-off'
            : phase === 'play'
              ? `${short(d.control!)} are playing`
              : phase === 'steal'
                ? `${short(otherTeam(d.control!))} can steal`
                : 'Board awarded'
        }
        hint={
          phase === 'faceoff'
            ? 'Flip the face-off answers. Whoever has the higher answer chooses play or pass; tap the team that will play.'
            : phase === 'play'
              ? 'Flip right answers. Wrong answer? Strike. Three strikes opens the steal.'
              : phase === 'steal'
                ? `One guess. If it’s on the board, flip it and give the bank to ${short(otherTeam(d.control!))}. If not, ${short(d.control!)} keep it.`
                : award?.team
                  ? `${short(award.team)} took ${award.points} points.`
                  : 'No points given on this question.'
        }
        action={
          <div className="text-right">
            <div className="text-xs text-dust">{award ? 'Won' : 'On the board'}</div>
            <div className="font-display text-3xl font-bold leading-none tabular-nums">{award ? award.points : bank}</div>
          </div>
        }
      >
        {phase !== 'done' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {TEAM_IDS.map((t) => (
                <Button
                  key={t}
                  size="lg"
                  variant={d.control === t ? 'primary' : 'secondary'}
                  onClick={() =>
                    set((x) => {
                      x.control = x.control === t ? null : t
                      x.strikes = 0
                    })
                  }
                >
                  <TeamDot t={t} /> {short(t)} play
                </Button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="lg" variant="danger" className="h-14 px-6 text-lg" onClick={strike} disabled={d.strikes >= 3}>
                <X className="!size-6" /> {d.control ? 'Strike' : 'Face-off miss'}
              </Button>
              <div className="flex gap-1.5 px-2" aria-label={`${d.strikes} strikes`}>
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-[8px] border font-display text-xl font-bold',
                      n <= d.strikes ? 'border-bad/50 bg-bad/15 text-bad' : 'border-line text-dust/40',
                    )}
                  >
                    ✕
                  </span>
                ))}
              </div>
              <Button variant="ghost" disabled={!d.strikes} onClick={() => set((x) => void (x.strikes = Math.max(0, x.strikes - 1)))}>
                <Undo2 /> Remove a strike
              </Button>
            </div>
          </>
        )}

        <div className="mt-4 border-t border-line pt-4">
          {phase === 'done' ? (
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={q.answers.every((a) => d.revealed.includes(a.id))}
                onClick={() => set((x) => void (x.revealed = q.answers.map((a) => a.id)))}
              >
                <Eye /> Reveal the rest
              </Button>
              <Button variant="ghost" onClick={() => set((x) => void delete x.awards[q.id])}>
                <Undo2 /> Undo award
              </Button>
              <Button variant="primary" className="ml-auto" disabled={d.cursor >= d.questions.length - 1} onClick={() => goTo(d.cursor + 1)}>
                <SkipForward /> Next question
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {TEAM_IDS.map((t) => {
                const boardCleared = q.answers.length > 0 && q.answers.every((a) => d.revealed.includes(a.id))
                const suggested = phase === 'steal' || (phase === 'play' && d.control === t && boardCleared)
                return (
                  <Button key={t} variant={suggested ? 'primary' : 'secondary'} disabled={!d.revealed.length} onClick={() => giveBank(t)}>
                    <Trophy /> Give {bank} to {short(t)}
                  </Button>
                )
              })}
              <Button variant="ghost" className="ml-auto" onClick={() => giveBank(null)}>
                Skip question
              </Button>
            </div>
          )}
          <div className="mt-3 text-xs text-dust">
            Totals: {totals.map(({ t, pts }) => `${short(t)} ${pts}`).join(' · ')}
          </div>
        </div>
      </Section>

      <Section title="Questions & answers" hint="Edit anything, any time. Drag answers by the handle to set their spot on the board.">
        <QuestionEditor index={index} />
      </Section>
    </>
  )
}

/* ---------- editor ---------- */
function QuestionEditor({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as FeudData)
  const set = (fn: (x: FeudData) => void) => updateGame<FeudData>(index, fn)
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="grid gap-2">
      {d.questions.map((q, i) => (
        <div key={q.id} className={cn('rounded-[12px] border bg-ink', open === q.id ? 'border-line-strong' : 'border-line')}>
          <button className="press flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(open === q.id ? null : q.id)}>
            <span className="w-6 text-[13px] font-semibold tabular-nums text-dust">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-[14px]">{q.text || <span className="text-dust">Untitled question</span>}</span>
            {q.mult > 1 && <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-semibold text-sand">{q.mult}×</span>}
            <span className={cn('text-[12px] tabular-nums', q.answers.length ? 'text-sand' : 'text-warn')}>
              {q.answers.length ? `${q.answers.length} answers` : 'No answers'}
            </span>
            <Pencil className="size-3.5 text-dust" />
          </button>
          {open === q.id && <QuestionForm index={index} qi={i} onDelete={() => setOpen(null)} />}
        </div>
      ))}
      <Button
        variant="outline"
        className="justify-self-start"
        onClick={() => {
          const q = feudQuestion('')
          set((x) => void x.questions.push(q))
          setOpen(q.id)
        }}
      >
        <Plus /> Add question
      </Button>
    </div>
  )
}

function QuestionForm({ index, qi, onDelete }: { index: number; qi: number; onDelete: () => void }) {
  const d = useStore((s) => s.games[index].data as FeudData)
  const q = d.questions[qi]
  const set = (fn: (x: FeudData) => void) => updateGame<FeudData>(index, fn)
  const edit = (fn: (x: FeudQuestion) => void) => set((x) => fn(x.questions[qi]))
  const [paste, setPaste] = useState<string | null>(null)
  const isCurrent = d.cursor === qi

  const move = (dir: -1 | 1) =>
    set((x) => {
      const j = qi + dir
      if (j < 0 || j >= x.questions.length) return
      ;[x.questions[qi], x.questions[j]] = [x.questions[j], x.questions[qi]]
      if (x.cursor === qi) x.cursor = j
      else if (x.cursor === j) x.cursor = qi
    })

  return (
    <div className="grid gap-4 border-t border-line px-4 pb-4 pt-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          key={`t-${q.id}`}
          defaultValue={q.text}
          placeholder="Name something…"
          onBlur={(e) => e.target.value !== q.text && edit((x) => void (x.text = e.target.value))}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <div className="flex rounded-[10px] border border-line p-0.5">
          {([1, 2, 3] as const).map((m) => (
            <button
              key={m}
              onClick={() => edit((x) => void (x.mult = m))}
              className={cn('press h-8 rounded-[8px] px-3 text-[13px] font-semibold', q.mult === m ? 'bg-cream text-night' : 'text-sand')}
            >
              {m === 1 ? 'Single' : m === 2 ? 'Double' : 'Triple'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-1.5">
        <div className="grid grid-cols-[2rem_1.5rem_1fr_5.5rem_2.25rem] gap-2 px-1 text-[11px] font-medium text-dust">
          <span />
          <span>#</span>
          <span>Answer</span>
          <span>Points</span>
          <span />
        </div>
        <AnswerList index={index} qi={qi} />
        <div className="mt-1 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={q.answers.length >= MAX_ANSWERS}
            onClick={() => edit((x) => void x.answers.push({ id: uid(), text: '', points: 0 }))}
          >
            <Plus /> Add answer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPaste(paste == null ? '' : null)}>
            <ClipboardPaste /> Paste a list
          </Button>
          {q.ordered && (
            <Button size="sm" variant="ghost" onClick={() => edit((x) => void (x.ordered = false))}>
              <ArrowDownWideNarrow /> Sort by points
            </Button>
          )}
          <span className="self-center text-[12px] text-dust">
            {q.answers.length}/{MAX_ANSWERS} · {q.ordered ? 'custom order' : 'sorted by points'}
          </span>
        </div>
        {paste != null && (
          <div className="mt-2 grid gap-2 rounded-[10px] border border-line p-3">
            <Textarea
              rows={5}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={'One answer per line, with its points at the end:\nKhakhra 12\nThepla 8\nChevdo 5'}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                disabled={!paste.trim()}
                onClick={() => {
                  const parsed = parseAnswers(paste).slice(0, MAX_ANSWERS)
                  edit((x) => {
                    x.answers = parsed.map((p) => ({ id: uid(), ...p }))
                    x.ordered = false
                  })
                  set((x) => void (isCurrent && (x.revealed = [])))
                  setPaste(null)
                }}
              >
                Replace answers
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPaste(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <Button size="sm" variant="ghost" disabled={qi === 0} onClick={() => move(-1)}>
          <ArrowUp /> Move up
        </Button>
        <Button size="sm" variant="ghost" disabled={qi === d.questions.length - 1} onClick={() => move(1)}>
          <ArrowDown /> Move down
        </Button>
        <Button
          size="sm"
          variant="danger"
          className="ml-auto"
          onClick={() => {
            if (!confirm('Delete this question and its answers?')) return
            set((x) => {
              const id = x.questions[qi].id
              x.questions.splice(qi, 1)
              delete x.awards[id]
              if (x.cursor === qi) {
                x.revealed = []
                x.strikes = 0
                x.control = null
                x.shown = false
              }
              if (x.cursor > qi) x.cursor -= 1
              x.cursor = Math.min(x.cursor, Math.max(0, x.questions.length - 1))
            })
            onDelete()
          }}
        >
          <Trash2 /> Delete question
        </Button>
      </div>
    </div>
  )
}

/* ---------- draggable answers ---------- */
function AnswerList({ index, qi }: { index: number; qi: number }) {
  const q = useStore((s) => (s.games[index].data as FeudData).questions[qi])
  const set = (fn: (x: FeudData) => void) => updateGame<FeudData>(index, fn)
  const ordered = boardOrder(q)
  const sig = ordered.map((a) => a.id).join(',')
  const [items, setItems] = useState(() => ordered.map((a) => a.id))
  const dragging = useRef(false)

  // Follow the store unless a drag is in progress.
  useEffect(() => {
    if (!dragging.current) setItems(sig ? sig.split(',') : [])
  }, [sig])

  const byId = Object.fromEntries(q.answers.map((a) => [a.id, a]))
  const commit = (ids: string[]) => {
    dragging.current = false
    if (ids.join(',') === sig) return
    set((x) => {
      const cur = x.questions[qi]
      const map = Object.fromEntries(cur.answers.map((a) => [a.id, a]))
      const next = ids.map((id) => map[id]).filter(Boolean)
      // Keep anything not in the dragged list (shouldn't happen) at the end, so nothing is lost.
      cur.answers.forEach((a) => !ids.includes(a.id) && next.push(a))
      cur.answers = next
      cur.ordered = true
    })
  }
  const move = (id: string, to: number) => {
    const ids = items.filter((x) => x !== id)
    ids.splice(Math.max(0, Math.min(ids.length, to)), 0, id)
    setItems(ids)
    commit(ids)
  }

  return (
    <Reorder.Group axis="y" values={items} onReorder={setItems} as="div" className="grid gap-1.5">
      {items.map((id, i) =>
        byId[id] ? (
          <AnswerRow
            key={id}
            index={index}
            qi={qi}
            id={id}
            pos={i}
            count={items.length}
            onDragStart={() => (dragging.current = true)}
            onDragEnd={() => commit(items)}
            onMove={(to) => move(id, to)}
          />
        ) : null,
      )}
    </Reorder.Group>
  )
}

function AnswerRow({
  index,
  qi,
  id,
  pos,
  count,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  index: number
  qi: number
  id: string
  pos: number
  count: number
  onDragStart: () => void
  onDragEnd: () => void
  onMove: (to: number) => void
}) {
  const a = useStore((s) => (s.games[index].data as FeudData).questions[qi].answers.find((x) => x.id === id))
  const controls = useDragControls()
  const editA = (fn: (x: FeudData['questions'][number]['answers'][number]) => void) =>
    updateGame<FeudData>(index, (x) => {
      const t = x.questions[qi].answers.find((y) => y.id === id)
      if (t) fn(t)
    })
  if (!a) return null
  return (
    <Reorder.Item
      value={id}
      as="div"
      dragListener={false}
      dragControls={controls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="relative grid grid-cols-[2rem_1.5rem_1fr_5.5rem_2.25rem] items-center gap-2 rounded-[10px] bg-ink"
      whileDrag={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.45)', zIndex: 10 }}
    >
      <button
        type="button"
        aria-label={`Drag ${a.text || 'answer'} to reorder. Arrow keys move it.`}
        title="Drag to reorder"
        className="press flex h-10 cursor-grab touch-none items-center justify-center rounded-[8px] text-dust hover:bg-raised hover:text-cream active:cursor-grabbing"
        onPointerDown={(e) => controls.start(e)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') (e.preventDefault(), onMove(pos - 1))
          if (e.key === 'ArrowDown') (e.preventDefault(), onMove(pos + 1))
          if (e.key === 'Home') (e.preventDefault(), onMove(0))
          if (e.key === 'End') (e.preventDefault(), onMove(count - 1))
        }}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="text-center text-[13px] tabular-nums text-dust">{pos + 1}</span>
      <Input
        defaultValue={a.text}
        placeholder="Answer"
        onBlur={(e) => e.target.value !== a.text && editA((x) => void (x.text = e.target.value))}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        defaultValue={a.points || ''}
        placeholder="0"
        className="tabular-nums"
        onBlur={(e) => {
          const v = Math.max(0, Math.round(Number(e.target.value) || 0))
          if (v !== a.points) editA((x) => void (x.points = v))
        }}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
      <Button
        size="icon"
        variant="ghost"
        aria-label="Remove answer"
        onClick={() =>
          updateGame<FeudData>(index, (x) => {
            x.questions[qi].answers = x.questions[qi].answers.filter((y) => y.id !== id)
            x.revealed = x.revealed.filter((r) => r !== id)
          })
        }
      >
        <Trash2 />
      </Button>
    </Reorder.Item>
  )
}
