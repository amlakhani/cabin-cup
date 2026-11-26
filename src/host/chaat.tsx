import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { ChevronDown, Copy, Minus, Plus, Radio, Smartphone, Undo2 } from 'lucide-react'
import { GAMES } from '@/lib/games'
import { subscribe, type ChaatEvent } from '@/lib/relay'
import { useNow } from '@/lib/hooks'
import { uid } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { useStore, TEAM_IDS, COLORS, type ChaatData, type TeamId, teamName, shortTeamName} from '@/lib/store'
import { updateGame, setView } from '@/lib/actions'

const pulse = (p: Parameters<ReturnType<typeof useStore.getState>['emit']>[0]) => useStore.getState().emit(p)
import { cn } from '@/lib/utils'
import { Section, Segmented, TeamDot, TeamName } from './common'

export function chaatCardUrl(d: ChaatData, names: Record<TeamId, string>, colors: Record<TeamId, string>) {
  const u = new URL('/thanksgiving/card', location.origin)
  u.searchParams.set('a', names.A)
  u.searchParams.set('b', names.B)
  u.searchParams.set('ac', colors.A)
  u.searchParams.set('bc', colors.B)
  u.searchParams.set('t', String(d.turnSec))
  u.searchParams.set('s', String(d.skips))
  if (d.room) u.searchParams.set('r', d.room)
  return u.toString()
}

/* ---------- live relay: phone -> host (host is the only writer) ---------- */
const relayState = { connected: false, listeners: new Set<(c: boolean) => void>() }
function setConnected(c: boolean) {
  relayState.connected = c
  relayState.listeners.forEach((f) => f(c))
}
export function useRelayConnected() {
  const [c, setC] = useState(relayState.connected)
  useEffect(() => {
    relayState.listeners.add(setC)
    return () => void relayState.listeners.delete(setC)
  }, [])
  return c
}

/** Mounted once in the host app: listens for the phone and updates Desi Chaat live. */
export function useChaatRelay() {
  const i = GAMES.findIndex((g) => g.kind === 'chaat')
  const room = useStore((s) => (i >= 0 ? (s.games[i]?.data as ChaatData | undefined)?.room : undefined))
  useEffect(() => {
    if (i < 0 || !room) return
    const apply = (e: ChaatEvent, time: number) => {
      const d = useStore.getState().games[i].data as ChaatData
      if (e.k === 'bank') {
        if (d.applied?.includes(e.id)) return
        updateGame<ChaatData>(i, (x) => {
          x.scores[e.team] += e.score
          x.turns[e.team] += 1
          x.log.push({ team: e.team, pts: e.score })
          x.up = e.team === 'A' ? 'B' : 'A'
          x.applied = [...(x.applied ?? []), e.id].slice(-300)
          x.banked = [...(x.banked ?? []), e.turn].slice(-300)
          if (x.live?.turn === e.turn) x.live = null
        })
        pulse({ kind: 'correct', team: e.team, text: `${e.score >= 0 ? '+' : ''}${e.score} this turn` })
        return
      }
      // Live updates only matter while the turn is happening (ignore old replays).
      if (Date.now() - time > 6 * 60 * 1000) return
      if (d.banked?.includes(e.turn)) return
      updateGame<ChaatData>(i, (x) => {
        const cur = x.live && x.live.turn === e.turn ? x.live : null
        const base = cur ?? {
          turn: e.turn,
          team: e.team,
          got: 0,
          buzz: 0,
          skip: 0,
          secs: x.turnSec,
          endsAt: Date.now() + x.turnSec * 1000,
          paused: false,
          leftMs: x.turnSec * 1000,
          ended: false,
        }
        if (e.k === 'start') {
          x.live = { ...base, team: e.team, secs: e.secs, endsAt: time + e.secs * 1000, leftMs: e.secs * 1000, paused: false, ended: false }
          x.up = e.team
        } else if (e.k === 'tap') {
          x.live = { ...base, got: e.got, buzz: e.buzz, skip: e.skip, endsAt: Date.now() + e.leftMs, leftMs: e.leftMs }
        } else if (e.k === 'pause') {
          x.live = { ...base, paused: e.paused, leftMs: e.leftMs, endsAt: Date.now() + e.leftMs }
        } else if (e.k === 'end') {
          x.live = { ...base, got: e.got, buzz: e.buzz, skip: e.skip, ended: true, leftMs: 0, endsAt: Date.now() }
        }
      })
      const st = useStore.getState()
      if (e.k === 'start' && st.current === i && st.view !== 'play') setView('play')
    }
    return subscribe(room, apply, setConnected)
  }, [i, room])
}

export function ChaatController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as ChaatData)
  const teams = useStore((s) => s.teams)
  const set = (fn: (x: ChaatData) => void) => updateGame<ChaatData>(index, fn)
  const [pts, setPts] = useState(0)
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const short = (t: TeamId) => shortTeamName(teams, t)
  const names = { A: teamName(teams, 'A'), B: teamName(teams, 'B'), C: teamName(teams, 'C') }
  const colors = { A: COLORS[teams.A.color].hex, B: COLORS[teams.B.color].hex, C: COLORS[teams.C.color].hex }
  const url = chaatCardUrl(d, names, colors)
  const other = (t: TeamId): TeamId => (t === 'A' ? 'B' : 'A')
  const allDone = TEAM_IDS.every((t) => d.turns[t] >= d.rounds)
  const [manual, setManual] = useState(false)
  const connected = useRelayConnected()
  const live = d.live ?? null
  const now = useNow(!!live && !live.ended && !live.paused, 250)
  const leftSecs = live ? Math.max(0, Math.ceil((live.paused ? live.leftMs : live.endsAt - now) / 1000)) : 0

  // Older saves may not have a channel yet.
  useEffect(() => {
    if (!d.room) set((x) => void (x.room = uid() + uid()))
  }, [d.room]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#1c120b', light: '#f6efe3' } })
      .then(setQr)
      .catch(() => setQr(''))
  }, [url])

  const bank = () => {
    const t = d.up
    set((x) => {
      x.scores[t] += pts
      x.turns[t] += 1
      x.log.push({ team: t, pts })
      x.up = other(t)
    })
    pulse({ kind: 'correct', team: t, text: `${pts >= 0 ? '+' : ''}${pts} this turn` })
    setPts(0)
    if (useStore.getState().view !== 'play') setView('play')
  }

  return (
    <>
      <Section
        title="Open the card on a phone or iPad"
        hint="Scan with the camera. Every tap on the phone updates the score here and on the TV."
      >
        <div className="grid items-center gap-5 md:grid-cols-[180px_1fr]">
          <div className="overflow-hidden rounded-[14px] bg-cream p-2 [&_svg]:block [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="grid gap-3">
            <div className="flex items-start gap-2 rounded-[10px] border border-line bg-ink px-3 py-2 text-[12px] text-sand">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-dust" />
              <span className="min-w-0 break-all">{url}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(url)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
              >
                <Copy /> {copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
            <div className="grid gap-2 text-[13px] text-sand">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-24">Turn length</span>
                <Segmented
                  value={d.turnSec}
                  onChange={(v) => set((x) => void (x.turnSec = v))}
                  options={[45, 60, 90].map((n) => ({ label: `${n}s`, value: n }))}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-24">Skips per turn</span>
                <Segmented
                  value={d.skips}
                  onChange={(v) => set((x) => void (x.skips = v))}
                  options={[
                    { label: '1', value: 1 },
                    { label: '3', value: 3 },
                    { label: 'Unlimited', value: -1 },
                  ]}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-24">Turns per team</span>
                <Segmented
                  value={d.rounds}
                  onChange={(v) => set((x) => void (x.rounds = v))}
                  options={[3, 4, 5, 6].map((n) => ({ label: String(n), value: n }))}
                />
              </div>
              <p className="text-[12px] text-dust">
                Turns per team = how many times each team gets the phone (teams alternate, so 4 means 8 turns in all). Change
                these before scanning; the QR code updates with them.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title={
          live && !live.ended
            ? `${short(live.team)} are playing now`
            : allDone
              ? 'All turns played'
              : `${short(d.up)} are up · turn ${Math.min(d.turns[d.up] + 1, d.rounds)} of ${d.rounds}`
        }
        hint={connected ? 'Scores come straight from the phone. Nothing to type.' : 'Connecting to the phone… If it stays offline, add scores by hand below.'}
        action={
          <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium', connected ? 'bg-ok/15 text-ok' : 'bg-raised text-dust')}>
            <Radio className="size-3.5" /> {connected ? 'Live' : 'Offline'}
          </span>
        }
      >
        {live ? (
          <div className="rounded-[12px] border border-line bg-ink px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <TeamName t={live.team} className="font-display text-lg font-semibold" />
              <span className={cn('font-display text-3xl font-bold tabular-nums', !live.ended && leftSecs <= 5 && 'text-bad')}>
                {live.ended ? 'Time’s up' : live.paused ? 'Paused' : `${Math.floor(leftSecs / 60)}:${String(leftSecs % 60).padStart(2, '0')}`}
              </span>
            </div>
            <div className="mt-2 flex gap-4 text-sm text-sand">
              <span>Got {live.got}</span>
              <span className="text-bad">Buzz {live.buzz}</span>
              <span>Skipped {live.skip}</span>
              <span className="ml-auto font-semibold text-cream">
                This turn {live.got - live.buzz >= 0 ? '+' : ''}
                {live.got - live.buzz}
              </span>
            </div>
            {live.ended && <p className="mt-2 text-xs text-dust">Waiting for the phone to tap Done…</p>}
          </div>
        ) : (
          <div className="rounded-[12px] border border-dashed border-line px-4 py-4 text-sm text-sand">
            {allDone ? 'Every team has played all its turns.' : `Hand the phone to ${short(d.up)}’s clue-giver and tap Start on it.`}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {TEAM_IDS.map((t) => (
            <div key={t} className="rounded-[12px] border border-line px-4 py-3">
              <div className="flex items-center justify-between">
                <TeamName t={t} className="text-sm font-semibold" />
                <span className="text-xs text-dust">
                  {d.turns[t]}/{d.rounds} turns
                </span>
              </div>
              <div className="mt-1 font-display text-3xl font-bold tabular-nums">{d.scores[t]}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            disabled={!d.log.length}
            onClick={() =>
              set((x) => {
                const l = x.log.pop()
                if (!l) return
                x.scores[l.team] -= l.pts
                x.turns[l.team] = Math.max(0, x.turns[l.team] - 1)
                x.up = l.team
              })
            }
          >
            <Undo2 /> Undo last turn
          </Button>
          {d.log.length > 0 && (
            <span className="text-xs text-dust">
              Last: {short(d.log[d.log.length - 1].team)} {d.log[d.log.length - 1].pts >= 0 ? '+' : ''}
              {d.log[d.log.length - 1].pts}
            </span>
          )}
          <Button variant="ghost" className="ml-auto" onClick={() => setManual((v) => !v)}>
            <ChevronDown className={cn('transition-transform', manual && 'rotate-180')} /> Add a score by hand
          </Button>
        </div>

        {manual && (
          <div className="mt-3 border-t border-line pt-3">
            <div className="mb-2 flex flex-wrap items-center gap-1">
              {TEAM_IDS.map((t) => (
                <Button key={t} size="sm" variant={d.up === t ? 'primary' : 'ghost'} onClick={() => set((x) => void (x.up = t))}>
                  <TeamDot t={t} /> {short(t)}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-line bg-ink px-4 py-3">
              <TeamName t={d.up} className="font-display text-lg font-semibold" />
              <div className="ml-auto flex items-center gap-2">
                <Button size="icon" variant="secondary" aria-label="Minus one" onClick={() => setPts((p) => p - 1)}>
                  <Minus />
                </Button>
                <span className={cn('w-14 text-center font-display text-3xl font-bold tabular-nums', pts < 0 && 'text-bad')}>
                  {pts > 0 ? `+${pts}` : pts}
                </span>
                <Button size="icon" variant="secondary" aria-label="Plus one" onClick={() => setPts((p) => p + 1)}>
                  <Plus />
                </Button>
              </div>
              <Button variant="primary" size="lg" onClick={bank}>
                Add {pts >= 0 ? `+${pts}` : pts} to {short(d.up)}
              </Button>
            </div>
          </div>
        )}
      </Section>
    </>
  )
}
