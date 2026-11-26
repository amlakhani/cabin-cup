import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Pause, Play, RotateCcw, SkipForward, Undo2, X } from 'lucide-react'
import { CHAAT_CARDS } from '@/lib/chaat'
import { PhoneLink } from '@/lib/relay'
import { cn } from '@/lib/utils'

/* The phone/iPad "card" for Desi Chaat. It works on its own (no connection to the host laptop):
   it runs the timer and deck, tallies the turn, and shows the score to hand to the host. */

type Team = 'A' | 'B'
type Outcome = 'got' | 'skip' | 'buzz'
interface Saved {
  order: number[]
  next: number
  totals: Record<Team, number>
  up: Team
}

const KEY = 'desi-chaat-card-v1'
const ease = [0.23, 1, 0.32, 1] as const

const q = new URLSearchParams(location.search)
const NAMES: Record<Team, string> = { A: q.get('a') || 'Team 1', B: q.get('b') || 'Team 2' }
const COLORS: Record<Team, string> = { A: q.get('ac') || '#F06A3B', B: q.get('bc') || '#F5C143' }
const TURN = Math.min(300, Math.max(10, Number(q.get('t')) || 60))
const SKIPS = q.has('s') ? Number(q.get('s')) : 3 // -1 = unlimited
const ROOM = q.get('r') // private channel to the host laptop; none = offline mode

/** Link to the host laptop: direct (instant) when it can, with a backup. */
const link = ROOM ? new PhoneLink(ROOM) : null
if (q.has('peerdebug')) (window as unknown as { __link: unknown }).__link = link
let lastOk: boolean | null = null
const okListeners = new Set<(ok: boolean | null) => void>()
type SendEvt = Parameters<PhoneLink['send']>[0]
function send(evt: SendEvt) {
  if (!link) return Promise.resolve(false)
  return link.send(evt).then((ok) => {
    lastOk = ok
    okListeners.forEach((f) => f(ok))
    return ok
  })
}
function useLinkOk() {
  const [ok, setOk] = useState<boolean | null>(lastOk)
  const [direct, setDirect] = useState(link?.direct ?? false)
  useEffect(() => {
    okListeners.add(setOk)
    const off = link?.onChange(setDirect)
    // In case it linked up between the first render and now.
    setDirect(link?.direct ?? false)
    return () => {
      okListeners.delete(setOk)
      off?.()
    }
  }, [])
  return { ok, direct }
}
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

function shuffled(n: number) {
  const a = [...Array(n).keys()]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function load(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') as Saved | null
    if (s && Array.isArray(s.order) && s.order.length === CHAAT_CARDS.length) return s
    // The deck changed (new cards): reshuffle, but keep the scores and whose turn it is.
    if (s?.totals) return { order: shuffled(CHAAT_CARDS.length), next: 0, totals: s.totals, up: s.up ?? 'A' }
  } catch {
    /* fall through */
  }
  return { order: shuffled(CHAAT_CARDS.length), next: 0, totals: { A: 0, B: 0 }, up: 'A' }
}

function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* private mode: fine, just no memory */
  }
}

/* ---------- little sound + haptics ---------- */
let ctx: AudioContext | null = null
function beep(freq: number, ms: number, vol = 0.15) {
  try {
    ctx ??= new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = freq
    g.gain.value = vol
    o.connect(g).connect(ctx.destination)
    o.start()
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000)
    o.stop(ctx.currentTime + ms / 1000)
  } catch {
    /* no audio */
  }
}
const buzz = (ms: number | number[]) => navigator.vibrate?.(ms)

export default function CardApp() {
  const [saved, setSaved] = useState<Saved>(load)
  const [phase, setPhase] = useState<'ready' | 'turn' | 'done'>('ready')
  const [team, setTeam] = useState<Team>(saved.up)
  const [results, setResults] = useState<{ card: number; out: Outcome }[]>([])
  const [left, setLeft] = useState(TURN * 1000)
  const [paused, setPaused] = useState(false)
  const [flash, setFlash] = useState<Outcome | null>(null)
  const endsAt = useRef(0)
  const turnKey = useRef('')
  const [banking, setBanking] = useState(false)
  const [sent, setSent] = useState<boolean | null>(null)
  const lastTick = useRef(99)
  const wake = useRef<WakeLockSentinel | null>(null)

  const update = useCallback((fn: (s: Saved) => Saved) => {
    setSaved((s) => {
      const n = fn(s)
      save(n)
      return n
    })
  }, [])

  const cardIdx = saved.order[saved.next % saved.order.length]
  const card = CHAAT_CARDS[cardIdx]
  const got = results.filter((r) => r.out === 'got').length
  const buzzed = results.filter((r) => r.out === 'buzz').length
  const skipped = results.filter((r) => r.out === 'skip').length
  const turnScore = got - buzzed
  const skipsLeft = SKIPS < 0 ? Infinity : SKIPS - skipped

  // Latest values for the timer callback.
  const resultsRef = useRef(results)
  resultsRef.current = results
  const teamRef = useRef(team)
  teamRef.current = team

  /* timer */
  useEffect(() => {
    if (phase !== 'turn' || paused) return
    const id = setInterval(() => {
      const ms = Math.max(0, endsAt.current - Date.now())
      setLeft(ms)
      const s = Math.ceil(ms / 1000)
      if (s <= 5 && s > 0 && s !== lastTick.current) {
        lastTick.current = s
        beep(880, 90, 0.12)
      }
      if (ms <= 0) {
        clearInterval(id)
        const r = resultsRef.current
        send({
          k: 'end',
          turn: turnKey.current,
          team: teamRef.current,
          got: r.filter((x) => x.out === 'got').length,
          buzz: r.filter((x) => x.out === 'buzz').length,
          skip: r.filter((x) => x.out === 'skip').length,
        })
        beep(220, 700, 0.25)
        buzz([200, 100, 400])
        setPhase('done')
        wake.current?.release().catch(() => {})
        wake.current = null
      }
    }, 100)
    return () => clearInterval(id)
  }, [phase, paused])

  const start = async () => {
    beep(660, 60, 0.001) // unlocks audio on iOS from this tap
    setResults([])
    lastTick.current = 99
    endsAt.current = Date.now() + TURN * 1000
    setLeft(TURN * 1000)
    setPaused(false)
    setPhase('turn')
    setSent(null)
    turnKey.current = newId()
    send({ k: 'start', turn: turnKey.current, team, secs: TURN })
    try {
      wake.current = (await navigator.wakeLock?.request('screen')) ?? null
    } catch {
      /* not supported */
    }
  }

  const mark = (out: Outcome) => {
    if (out === 'skip' && skipsLeft <= 0) return
    const next = [...results, { card: cardIdx, out }]
    setResults(next)
    sendTap(next)
    update((s) => {
      const next = s.next + 1
      // Ran through the whole deck: reshuffle.
      return next >= s.order.length ? { ...s, order: shuffled(CHAAT_CARDS.length), next: 0 } : { ...s, next }
    })
    setFlash(out)
    if (out === 'got') beep(1200, 120, 0.12)
    if (out === 'buzz') {
      beep(160, 350, 0.25)
      buzz(250)
    }
    setTimeout(() => setFlash(null), 350)
  }

  const sendTap = (r: { out: Outcome }[]) =>
    send({
      k: 'tap',
      turn: turnKey.current,
      team,
      got: r.filter((x) => x.out === 'got').length,
      buzz: r.filter((x) => x.out === 'buzz').length,
      skip: r.filter((x) => x.out === 'skip').length,
      leftMs: Math.max(0, endsAt.current - Date.now()),
    })

  const undo = () => {
    if (!results.length) return
    const next = results.slice(0, -1)
    setResults(next)
    sendTap(next)
    update((s) => ({ ...s, next: Math.max(0, s.next - 1) }))
  }

  const togglePause = () => {
    if (paused) {
      endsAt.current = Date.now() + left
      setPaused(false)
      send({ k: 'pause', turn: turnKey.current, team, paused: false, leftMs: left })
    } else {
      setPaused(true)
      send({ k: 'pause', turn: turnKey.current, team, paused: true, leftMs: Math.max(0, endsAt.current - Date.now()) })
    }
  }

  const bank = async () => {
    const other: Team = team === 'A' ? 'B' : 'A'
    if (ROOM) {
      setBanking(true)
      const ok = await send({ k: 'bank', id: newId(), turn: turnKey.current, team, score: turnScore, got, buzz: buzzed })
      setBanking(false)
      if (!ok) {
        setSent(false)
        if (!confirm(`Couldn’t reach the host laptop. Tell the host: ${NAMES[team]} ${turnScore >= 0 ? '+' : ''}${turnScore}. Pass the phone anyway?`)) return
      }
    }
    update((s) => ({ ...s, totals: { ...s.totals, [team]: s.totals[team] + turnScore }, up: other }))
    setTeam(other)
    setResults([])
    setPhase('ready')
  }

  const secs = Math.ceil(left / 1000)
  const tone = COLORS[team]

  return (
    <div className="flex min-h-dvh flex-col bg-night text-cream [touch-action:manipulation] select-none">
      {phase === 'ready' && (
        <Ready
          team={team}
          setTeam={setTeam}
          totals={saved.totals}
          onStart={start}
          onReset={() => {
            if (!confirm('Reset the scores on this phone and reshuffle the cards?')) return
            update(() => ({ order: shuffled(CHAAT_CARDS.length), next: 0, totals: { A: 0, B: 0 }, up: 'A' }))
            setTeam('A')
          }}
        />
      )}

      {phase === 'turn' && (
        <div className="flex flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-semibold" style={{ color: tone }}>
              {NAMES[team]}
            </span>
            <span className="text-sm tabular-nums text-sand">
              Got {got}
              {buzzed > 0 && <span className="text-bad"> · Buzz {buzzed}</span>}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className={cn('font-display text-5xl font-bold tabular-nums leading-none', secs <= 5 && 'text-bad')}>
              {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
              <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${(left / (TURN * 1000)) * 100}%`, background: tone }} />
            </div>
            <button onClick={togglePause} aria-label={paused ? 'Resume' : 'Pause'} className="press flex size-11 items-center justify-center rounded-full bg-raised">
              {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
            </button>
          </div>

          <div className="relative mt-4 flex flex-1 items-center justify-center">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={saved.next}
                initial={{ opacity: 0, x: 40, rotate: 2 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: flash === 'skip' ? 0 : -60, y: flash === 'skip' ? 40 : 0, rotate: -3 }}
                transition={{ duration: 0.22, ease }}
                className="w-full max-w-md overflow-hidden rounded-[28px] bg-cream text-night shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              >
                <div className="px-6 pb-6 pt-7 text-center" style={{ background: tone }}>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-night/60">Say this</div>
                  <div className="mt-1 font-display text-[clamp(2rem,9vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em]">{card.word}</div>
                </div>
                <div className="px-6 pb-7 pt-5">
                  <div className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-night/50">Don’t say</div>
                  <ul className="grid gap-2">
                    {card.taboo.map((w) => (
                      <li key={w} className="rounded-[14px] bg-night/[0.06] py-2.5 text-center font-display text-[clamp(1.25rem,5.5vw,1.75rem)] font-semibold">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
            {paused && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[28px] bg-night/85 backdrop-blur-sm">
                <button onClick={togglePause} className="press flex items-center gap-2 rounded-full bg-cream px-6 py-3 font-semibold text-night">
                  <Play className="size-5" /> Resume
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-[1fr_0.8fr_1.2fr] gap-2">
            <button
              onClick={() => mark('buzz')}
              disabled={paused}
              className="press flex h-20 flex-col items-center justify-center rounded-[20px] bg-bad font-display text-lg font-bold text-white disabled:opacity-40"
            >
              <X className="size-6" /> Buzz −1
            </button>
            <button
              onClick={() => mark('skip')}
              disabled={paused || skipsLeft <= 0}
              className="press flex h-20 flex-col items-center justify-center rounded-[20px] bg-raised font-display text-base font-semibold disabled:opacity-40"
            >
              <SkipForward className="size-5" /> Skip
              <span className="text-[11px] font-normal text-dust">{SKIPS < 0 ? 'unlimited' : `${skipsLeft} left`}</span>
            </button>
            <button
              onClick={() => mark('got')}
              disabled={paused}
              className="press flex h-20 flex-col items-center justify-center rounded-[20px] bg-ok font-display text-lg font-bold text-night disabled:opacity-40"
            >
              <Check className="size-6" /> Got it +1
            </button>
          </div>
          <button onClick={undo} disabled={!results.length} className="press mx-auto mt-2 flex items-center gap-1.5 px-3 py-2 text-sm text-dust disabled:opacity-30">
            <Undo2 className="size-4" /> Undo last tap
          </button>
        </div>
      )}

      {phase === 'done' && (
        <Done team={team} results={results} setResults={setResults} score={turnScore} onBank={bank} banking={banking} failed={sent === false} />
      )}
    </div>
  )
}

function Ready({
  team,
  setTeam,
  totals,
  onStart,
  onReset,
}: {
  team: Team
  setTeam: (t: Team) => void
  totals: Record<Team, number>
  onStart: () => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="text-sm text-dust">Thanksgiving Trailer</div>
      <h1 className="font-display text-4xl font-bold tracking-[-0.03em]">Desi Chaat</h1>
      <p className="mt-2 text-[15px] leading-snug text-sand">
        Describe the big word without saying it or the four words under it. Someone from the other team watches the screen.
      </p>

      <LinkStatus />

      <div className="mt-6 text-sm font-medium text-sand">Who’s giving clues?</div>
      <div className="mt-2 grid gap-2">
        {(['A', 'B'] as Team[]).map((t) => (
          <button
            key={t}
            onClick={() => setTeam(t)}
            className={cn('press flex items-center justify-between rounded-[18px] border-2 px-5 py-4 text-left', team === t ? 'bg-raised' : 'border-line')}
            style={team === t ? { borderColor: COLORS[t] } : undefined}
          >
            <span className="flex items-center gap-3">
              <span className="size-3.5 rounded-full" style={{ background: COLORS[t] }} />
              <span className="font-display text-xl font-semibold">{NAMES[t]}</span>
            </span>
            <span className="font-display text-2xl font-bold tabular-nums text-sand">{totals[t]}</span>
          </button>
        ))}
      </div>

      <div className="flex-1" />
      <button
        onClick={onStart}
        className="press mt-6 flex h-16 items-center justify-center gap-2 rounded-[20px] font-display text-xl font-bold text-night"
        style={{ background: COLORS[team] }}
      >
        <Play className="size-6" /> Start {TURN}-second turn
      </button>
      <div className="mt-3 flex items-center justify-between text-xs text-dust">
        <span>
          {SKIPS < 0 ? 'Unlimited skips' : `${SKIPS} skips per turn`} · +1 got it · −1 buzz
        </span>
        <button onClick={onReset} className="press flex items-center gap-1 px-1 py-1">
          <RotateCcw className="size-3.5" /> Reset
        </button>
      </div>
    </div>
  )
}

function Done({
  team,
  results,
  setResults,
  score,
  onBank,
  banking,
  failed,
}: {
  team: Team
  results: { card: number; out: Outcome }[]
  setResults: (fn: (r: { card: number; out: Outcome }[]) => { card: number; out: Outcome }[]) => void
  score: number
  onBank: () => void
  banking: boolean
  failed: boolean
}) {
  const cycle: Record<Outcome, Outcome> = { got: 'buzz', buzz: 'skip', skip: 'got' }
  const label: Record<Outcome, string> = { got: '+1', buzz: '−1', skip: 'skip' }
  return (
    <div className="flex flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="text-sm font-semibold" style={{ color: COLORS[team] }}>
        Time’s up · {NAMES[team]}
      </div>
      <div className="mt-1 flex items-end gap-3">
        <div className="font-display text-7xl font-bold leading-none tabular-nums">
          {score > 0 ? `+${score}` : score}
        </div>
        <div className="pb-2 text-sand">points this turn</div>
      </div>
      <p className="mt-3 rounded-[14px] bg-raised px-4 py-3 text-[15px] text-sand">
        {ROOM && !failed ? (
          <>Fix any mistakes below, then tap Done. The score goes straight to the TV.</>
        ) : (
          <>
            Tell the host: <span className="font-semibold text-cream">{NAMES[team]} {score > 0 ? `+${score}` : score}</span>
          </>
        )}
      </p>

      <div className="mt-5 text-xs font-medium text-dust">Cards this turn · tap to fix a mistake</div>
      <ul className="mt-2 grid max-h-[40dvh] gap-1.5 overflow-y-auto">
        {results.map((r, i) => (
          <li key={i}>
            <button
              onClick={() => setResults((rs) => rs.map((x, j) => (j === i ? { ...x, out: cycle[x.out] } : x)))}
              className="press flex w-full items-center justify-between rounded-[12px] border border-line px-4 py-2.5 text-left"
            >
              <span className="font-medium">{CHAAT_CARDS[r.card].word}</span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-bold',
                  r.out === 'got' ? 'bg-ok/20 text-ok' : r.out === 'buzz' ? 'bg-bad/20 text-bad' : 'bg-raised text-dust',
                )}
              >
                {label[r.out]}
              </span>
            </button>
          </li>
        ))}
        {!results.length && <li className="text-sm text-dust">No cards played.</li>}
      </ul>

      <div className="flex-1" />
      <button onClick={onBank} disabled={banking} className="press mt-6 h-16 rounded-[20px] bg-cream font-display text-xl font-bold text-night disabled:opacity-60">
        {banking ? 'Sending…' : `Done · pass to ${NAMES[team === 'A' ? 'B' : 'A']}`}
      </button>
    </div>
  )
}

function LinkStatus() {
  const { ok, direct } = useLinkOk()
  if (!ROOM)
    return <p className="mt-3 text-[13px] text-dust">Not linked to the host laptop. Tell the host your score after each turn.</p>
  const bad = ok === false && !direct
  return (
    <p className={cn('mt-3 flex items-center gap-2 text-[13px]', bad ? 'text-bad' : direct ? 'text-ok' : 'text-warn')}>
      <span className={cn('size-2 rounded-full', bad ? 'bg-bad' : direct ? 'bg-ok' : 'animate-pulse bg-warn')} />
      {bad
        ? 'Can’t reach the host laptop. Check Wi-Fi; tell the host scores for now.'
        : direct
          ? 'Linked to the host laptop. Every tap shows on the TV instantly.'
          : 'Linking to the host laptop… (make sure its Desi Chaat page is open)'}
    </p>
  )
}
