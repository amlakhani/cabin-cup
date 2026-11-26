import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ArrowDown,
  ArrowUp,
  Eye,
  Trash2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  SkipForward,
  Undo2,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GAMES } from '@/lib/games'
import { useStore, TEAM_IDS, shuffle, makeSetlist, b2bTeam, type B2BData, type PictionaryData, type TuneData, type TeamId, teamName, shortTeamName} from '@/lib/store'
import { updateGame, setView } from '@/lib/actions'
import { loadYouTube, parseYouTube, type YTPlayer } from '@/lib/youtube'
import type { Song } from '@/lib/songs'
import { cn } from '@/lib/utils'
import { Picture, PICTURE_NAMES, PICTURE_LEVELS, PICTURE_COUNT } from '@/show/pictures'
import { Section, Segmented, TeamDot, TeamName, TimerControl } from './common'

const pulse = (p: Parameters<ReturnType<typeof useStore.getState>['emit']>[0]) => useStore.getState().emit(p)

export const ROUND_NAMES = ['Warm-up', 'Turn It Up', 'Generation Swap']
export const groupLabel = (g: Song['group']) => (g === 'pop' ? 'English' : `${g} Bollywood`)
const songLabel = (s: Song) => `${groupLabel(s.group)}${s.group === 'pop' ? (s.hard ? ' · harder' : ' · easier') : ''}${s.custom ? ' · your song' : ''}`

/* ================= Name That Tune ================= */

function useClipPlayer() {
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const stopTimer = useRef<number | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const pending = useRef<((ok: boolean) => void) | null>(null)
  const onBad = useRef<(() => void) | null>(null)

  useEffect(() => {
    let cancelled = false
    loadYouTube()
      .then((YT) => {
        if (cancelled || !host.current) return
        // Give YouTube its own node so React never sees the iframe swap.
        const el = document.createElement('div')
        host.current.replaceChildren(el)
        player.current = new YT.Player(el, {
          width: '100%',
          height: '100%',
          playerVars: { controls: 1, rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: () => setReady(true),
            onStateChange: (e) => {
              setPlaying(e.data === 1)
              if (e.data === 5 && pending.current) {
                pending.current(true)
                pending.current = null
              }
            },
            onError: () => {
              if (pending.current) {
                pending.current(false)
                pending.current = null
                return
              }
              setError('That video can’t be played inside the site. Remove it and add a different link.')
              onBad.current?.()
            },
          },
        })
      })
      .catch((e) => setError(String(e.message ?? e)))
    return () => {
      cancelled = true
      if (stopTimer.current) clearTimeout(stopTimer.current)
      player.current?.destroy()
      player.current = null
    }
  }, [])

  const clear = () => {
    if (stopTimer.current) clearTimeout(stopTimer.current)
    stopTimer.current = null
  }

  /** Plays [start, start+seconds) and stops on its own. */
  const play = (videoId: string, start: number, seconds: number | null) => {
    const p = player.current
    if (!p) return
    setError(null)
    clear()
    p.loadVideoById(seconds ? { videoId, startSeconds: start, endSeconds: start + seconds } : { videoId, startSeconds: start })
    if (seconds) {
      // Backup in case the player ignores endSeconds (buffering can make it run long).
      stopTimer.current = window.setTimeout(() => p.pauseVideo(), (seconds + 1.5) * 1000)
    }
  }
  const more = (videoId: string, seconds: number) => {
    const p = player.current
    if (!p) return
    const at = Math.floor(p.getCurrentTime())
    play(videoId, at, seconds)
  }
  const stop = () => {
    clear()
    player.current?.pauseVideo()
  }
  /** Loads a video without playing it, to see whether YouTube allows it here. */
  const check = (videoId: string) =>
    new Promise<boolean>((resolve) => {
      const p = player.current
      if (!p) return resolve(true)
      clear()
      const t = window.setTimeout(() => {
        pending.current = null
        resolve(true) // no error within the window: assume it plays
      }, 6000)
      pending.current = (ok) => {
        clearTimeout(t)
        resolve(ok)
      }
      p.cueVideoById({ videoId })
    })
  return { host, ready, error, playing, play, more, stop, check, onBad, setError }
}

export function TuneController({ index }: { index: number }) {
  const d = useStore((s) => s.games[index].data as TuneData)
  const teams = useStore((s) => s.teams)
  const set = (fn: (x: TuneData) => void) => updateGame<TuneData>(index, fn)
  const clip = useClipPlayer()
  const list = d.setlist[d.round] ?? []
  const songIdx = list[d.pos]
  const song = d.songs[songIdx]
  const mult = d.round === 2 ? 2 : 1
  const lastRound = d.round === 2
  const lastSong = d.pos >= list.length - 1

  clip.onBad.current = () =>
    set((x) => {
      const si = x.setlist[x.round][x.pos]
      if (x.songs[si]) x.songs[si].bad = true
    })

  const playIntro = (seconds: number | null = d.clipSec) => {
    if (!song?.videoId) return
    clip.play(song.videoId, song.start ?? 0, seconds)
    set((x) => void (x.playId = Date.now()))
    if (useStore.getState().view !== 'play') setView('play')
  }

  const award = (t: TeamId, pts: number, label: string) => {
    set((x) => {
      x.scores[t] += pts * mult
      x.log.push({ team: t, pts: pts * mult, round: x.round, pos: x.pos })
    })
    pulse({ kind: 'correct', team: t, text: `+${pts * mult} ${label}` })
  }

  const next = () => {
    clip.stop()
    set((x) => {
      x.revealed = false
      x.playId = null
      if (x.pos < x.setlist[x.round].length - 1) x.pos += 1
      else {
        // Jump to the next round that has songs.
        let r = x.round + 1
        while (r <= 2 && !x.setlist[r]?.length) r++
        if (r <= 2) {
          x.round = r
          x.pos = 0
        }
      }
    })
  }

  return (
    <>
      <Section
        title={`Round ${d.round + 1}: ${ROUND_NAMES[d.round]}`}
        hint={
          d.round === 2
            ? 'Double points. Only kids answer Bollywood songs, only adults answer English songs.'
            : `Song ${d.pos + 1} of ${list.length}. First team to buzz answers; wrong answers can be stolen.`
        }
        action={
          <Segmented
            value={d.round}
            onChange={(r) =>
              set((x) => {
                x.round = r
                x.pos = 0
                x.revealed = false
              })
            }
            options={[0, 1, 2].map((r) => ({ label: `Round ${r + 1}`, value: r }))}
          />
        }
      >
        {song ? (
          <div className="grid gap-4 md:grid-cols-[1fr_300px]">
            <div className="rounded-[12px] border border-line bg-ink p-4">
              <div className="flex items-center justify-between text-xs text-dust">
                <span>
                  Song {d.pos + 1} · {songLabel(song)}
                  {d.round === 2 && (song.group === 'pop' ? ' · adults only' : ' · kids only')}
                </span>
                <span>only you can see this</span>
              </div>
              <div className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">{song.title}</div>
              <div className="text-sm text-sand">{song.artist}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="primary" disabled={!song.videoId || !clip.ready} onClick={() => playIntro()}>
                  <Play /> Play intro · {d.clipSec}s
                </Button>
                <Button disabled={!song.videoId || !clip.ready} onClick={() => song.videoId && clip.more(song.videoId, 5)}>
                  <Plus /> 5 more seconds
                </Button>
                <Button variant="ghost" disabled={!clip.playing} onClick={clip.stop}>
                  <Pause /> Stop
                </Button>
                <Button variant="ghost" disabled={!song.videoId || !clip.ready} onClick={() => playIntro()}>
                  <RotateCcw /> Replay
                </Button>
              </div>
              {!song.videoId && (
                <p className="mt-3 text-[13px] text-warn">
                  No YouTube link for this song. Remove it in Your songs and add it again with a link.
                </p>
              )}
              {clip.error && <p className="mt-3 text-[13px] text-bad">{clip.error}</p>}
            </div>
            <div className="overflow-hidden rounded-[12px] border border-line bg-black">
              <div ref={clip.host} className="aspect-video [&_iframe]:block [&_iframe]:size-full" />
              <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-dust">
                <Volume2 className="size-3.5" /> Plays from this laptop. Set the laptop’s sound to the TV.
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-[12px] border border-dashed border-line px-4 py-6 text-center text-sm text-sand">
            {d.songs.length ? 'No songs in this round. Add some in Your songs below, or pick another round.' : 'No songs yet. Add your songs in Your songs below.'}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-sand">Clip length</span>
          <Segmented
            value={d.clipSec}
            onChange={(v) => set((x) => void (x.clipSec = v))}
            options={[5, 8, 10, 15].map((n) => ({ label: `${n}s`, value: n }))}
          />
        </div>
      </Section>

      <Section title="Who got it?" hint={mult > 1 ? 'Points are doubled this round.' : 'Song title is 1 point; artist or film is 1 bonus point.'}>
        <div className="grid gap-2">
          {TEAM_IDS.map((t) => (
            <div key={t} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-line bg-ink px-4 py-3">
              <div className="flex items-center gap-3">
                <TeamName t={t} className="font-display text-lg font-semibold" />
                <span className="font-display text-xl font-semibold tabular-nums text-sand">{d.scores[t]}</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => award(t, 1, 'song')}>
                  <Check /> Song +{mult}
                </Button>
                <Button variant="ghost" onClick={() => award(t, 1, song?.group === 'pop' ? 'artist' : 'film')}>
                  <Plus /> {song?.group === 'pop' ? 'Artist' : 'Film'} +{mult}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button
            variant={d.revealed ? 'secondary' : 'primary'}
            onClick={() => {
              clip.stop()
              set((x) => void (x.revealed = !x.revealed))
              if (useStore.getState().view !== 'play') setView('play')
            }}
          >
            <Eye /> {d.revealed ? 'Hide answer' : 'Reveal answer on TV'}
          </Button>
          <Button variant="primary" disabled={lastRound && lastSong} onClick={next}>
            <SkipForward /> {lastSong && !lastRound ? `Start round ${d.round + 2}` : 'Next song'}
          </Button>
          <Button
            variant="ghost"
            disabled={!d.log.length}
            onClick={() =>
              set((x) => {
                const l = x.log.pop()
                if (l) x.scores[l.team] -= l.pts
              })
            }
          >
            <Undo2 /> Undo last points
          </Button>
          {d.log.length > 0 && (
            <span className="ml-auto text-xs text-dust">
              Last: {teamName(teams, d.log[d.log.length - 1].team)} +{d.log[d.log.length - 1].pts}
            </span>
          )}
        </div>
      </Section>

      <SongManager
        index={index}
        onTest={(id, start) => clip.ready && clip.play(id, start, d.clipSec)}
        canTest={clip.ready}
        check={clip.ready ? clip.check : null}
      />
    </>
  )
}

/* ---------- the host's songs ---------- */
const GROUPS: { label: string; value: Song['group'] }[] = [
  { label: 'English', value: 'pop' },
  { label: 'Bollywood 80s', value: '80s' },
  { label: 'Bollywood 90s', value: '90s' },
  { label: 'Bollywood 00s', value: '00s' },
  { label: 'Bollywood 10s', value: '10s' },
  { label: 'Bollywood 20s', value: '20s' },
]

/** Rebuilds the rounds after the song list changes, keeping the current song in place if it's still there. */
function regroup(x: TuneData) {
  const current = x.setlist[x.round]?.[x.pos]
  x.setlist = makeSetlist(x.songs)
  const at = current != null ? x.setlist[x.round].indexOf(current) : -1
  x.pos = at >= 0 ? at : Math.min(x.pos, Math.max(0, x.setlist[x.round].length - 1))
}

function SongManager({
  index,
  onTest,
  canTest,
  check,
}: {
  index: number
  onTest: (videoId: string, start: number) => void
  canTest: boolean
  check: ((videoId: string) => Promise<boolean>) | null
}) {
  const d = useStore((s) => s.games[index].data as TuneData)
  const set = (fn: (x: TuneData) => void) => updateGame<TuneData>(index, fn)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [group, setGroup] = useState<Song['group']>('80s')
  const [link, setLink] = useState('')
  const [start, setStart] = useState('')
  const [round, setRound] = useState(d.round)
  const [added, setAdded] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number; bad: number } | null>(null)
  const parsed = parseYouTube(link)
  const startSec = start.trim() ? toSeconds(start) : parsed?.start ?? 0
  const valid = title.trim() && parsed

  const add = () => {
    if (!valid) return
    set((x) => {
      x.songs.push({
        title: title.trim(),
        artist: artist.trim(),
        group,
        videoId: parsed!.videoId,
        start: startSec,
        custom: true,
        round,
      })
      regroup(x)
    })
    setAdded(`Added “${title.trim()}” to round ${round + 1}.`)
    setTitle('')
    setArtist('')
    setLink('')
    setStart('')
  }

  const checkAll = async () => {
    if (!check) return
    const ids = d.songs.map((s, i) => ({ s, i })).filter(({ s }) => s.videoId)
    setProgress({ done: 0, total: ids.length, bad: 0 })
    let bad = 0
    for (let k = 0; k < ids.length; k++) {
      const ok = await check(ids[k].s.videoId!)
      if (!ok) bad++
      set((x) => {
        if (x.songs[ids[k].i]) x.songs[ids[k].i].bad = !ok
      })
      setProgress({ done: k + 1, total: ids.length, bad })
    }
  }

  return (
    <Section
      title="Your songs"
      hint="Add the songs you want to play. They’re saved on this laptop and stay through every reset, even Start completely fresh."
    >
      <div className="grid gap-3 rounded-[12px] border border-line bg-ink p-4 md:grid-cols-2">
        <label className="grid gap-1 text-[13px] text-sand">
          Song title
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kal Ho Naa Ho" onKeyDown={(e) => e.key === 'Enter' && add()} />
        </label>
        <label className="grid gap-1 text-[13px] text-sand">
          {group === 'pop' ? 'Artist' : 'Film'} <span className="text-dust">(optional)</span>
          <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder={group === 'pop' ? 'e.g. Coldplay' : 'e.g. Kal Ho Naa Ho'} onKeyDown={(e) => e.key === 'Enter' && add()} />
        </label>
        <label className="grid gap-1 text-[13px] text-sand md:col-span-2">
          YouTube link
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Paste a youtube.com or youtu.be link"
            className={cn(link.trim() && !parsed && 'border-bad/60')}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          {link.trim() && !parsed && <span className="text-[12px] text-bad">That doesn’t look like a YouTube link.</span>}
        </label>
        <div className="grid gap-1 text-[13px] text-sand md:col-span-2">
          Type
          <div className="flex flex-wrap gap-1">
            {GROUPS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGroup(g.value)}
                className={cn(
                  'press h-8 rounded-[8px] border px-3 text-[13px]',
                  group === g.value ? 'border-cream bg-cream text-night' : 'border-line text-sand hover:border-line-strong',
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <label className="grid gap-1 text-[13px] text-sand">
          Start at (seconds or m:ss)
          <Input value={start} onChange={(e) => setStart(e.target.value)} placeholder={parsed?.start ? String(parsed.start) : '0'} inputMode="numeric" />
        </label>
        <div className="grid gap-1 text-[13px] text-sand">
          Round
          <Segmented value={round} onChange={setRound} options={[0, 1, 2].map((r) => ({ label: `Round ${r + 1}`, value: r }))} />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <Button variant="primary" disabled={!valid} onClick={add}>
            <Plus /> Add song
          </Button>
          <Button variant="ghost" disabled={!parsed || !canTest} onClick={() => parsed && onTest(parsed.videoId, startSec)}>
            <Play /> Test intro
          </Button>
          {added && <span className="text-[13px] text-ok">{added}</span>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-sand">
          {d.songs.length} song{d.songs.length === 1 ? '' : 's'} · {d.setlist.map((r, i) => `R${i + 1}: ${r.length}`).join(' · ')}
        </span>
        <Button
          size="sm"
          className="ml-auto"
          disabled={!check || !d.songs.length || (progress != null && progress.done < progress.total)}
          onClick={checkAll}
        >
          <Check /> Check all songs play
        </Button>
      </div>
      {progress && (
        <p className={cn('mt-2 text-[13px]', progress.bad ? 'text-warn' : 'text-dust')}>
          {progress.done < progress.total
            ? `Checking ${progress.done + 1} of ${progress.total}…`
            : progress.bad
              ? `${progress.bad} song${progress.bad === 1 ? '' : 's'} can’t play inside the site (marked below). Swap in a different link.`
              : 'All songs play.'}
        </p>
      )}

      {[0, 1, 2].map((r) => {
        const rows = d.setlist[r] ?? []
        return (
          <div key={r} className="mt-4">
            <div className="mb-1.5 text-xs font-medium text-dust">
              Round {r + 1} · {ROUND_NAMES[r]}
              {r === 2 && ' · double points'}
            </div>
            {rows.length ? (
              <ul className="grid gap-1.5">
                {rows.map((i, k) => (
                  <SongRow
                    key={`${i}-${d.songs[i].videoId}`}
                    index={index}
                    i={i}
                    first={k === 0}
                    last={k === rows.length - 1}
                    onTest={onTest}
                    canTest={canTest}
                  />
                ))}
              </ul>
            ) : (
              <p className="rounded-[10px] border border-dashed border-line px-3 py-2.5 text-[13px] text-dust">No songs in this round yet.</p>
            )}
          </div>
        )
      })}
    </Section>
  )
}

function SongRow({
  index,
  i,
  first,
  last,
  onTest,
  canTest,
}: {
  index: number
  i: number
  first: boolean
  last: boolean
  onTest: (videoId: string, start: number) => void
  canTest: boolean
}) {
  const s = useStore((st) => (st.games[index].data as TuneData).songs[i])
  const set = (fn: (x: TuneData) => void) => updateGame<TuneData>(index, fn)
  if (!s) return null
  // Swap places with the neighbouring song in the same round.
  const move = (dir: -1 | 1) =>
    set((x) => {
      const r = x.setlist.findIndex((list) => list.includes(i))
      const list = x.setlist[r]
      const j = list[list.indexOf(i) + dir]
      if (j == null) return
      ;[x.songs[i], x.songs[j]] = [x.songs[j], x.songs[i]]
      regroup(x)
    })
  return (
    <li className={cn('flex flex-wrap items-center gap-2 rounded-[10px] border bg-ink px-3 py-2 text-[13px]', s.bad ? 'border-warn/50' : 'border-line')}>
      <span className="min-w-0 flex-1 truncate">
        <span className="text-cream">{s.title}</span>
        <span className="text-dust">
          {s.artist ? ` · ${s.artist}` : ''} · {groupLabel(s.group)}
        </span>
        {s.bad && <span className="ml-2 text-warn">can’t play here</span>}
      </span>
      <label className="flex items-center gap-1 text-[12px] text-dust">
        start
        <Input
          key={`st-${s.videoId}-${s.start}`}
          defaultValue={String(s.start ?? 0)}
          className="h-7 w-16 px-2 text-[12px] tabular-nums"
          onBlur={(e) => {
            const v = toSeconds(e.target.value)
            if (v !== (s.start ?? 0)) set((x) => void (x.songs[i].start = v))
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      </label>
      <select
        value={s.round ?? 0}
        onChange={(e) =>
          set((x) => {
            x.songs[i].round = Number(e.target.value)
            regroup(x)
          })
        }
        className="h-7 rounded-[8px] border border-line bg-panel px-1.5 text-[12px] text-sand"
        aria-label="Round"
      >
        <option value={0}>Round 1</option>
        <option value={1}>Round 2</option>
        <option value={2}>Round 3</option>
      </select>
      <Button size="icon" variant="ghost" className="size-7" aria-label="Move up" disabled={first} onClick={() => move(-1)}>
        <ArrowUp />
      </Button>
      <Button size="icon" variant="ghost" className="size-7" aria-label="Move down" disabled={last} onClick={() => move(1)}>
        <ArrowDown />
      </Button>
      <Button size="sm" variant="ghost" disabled={!canTest || !s.videoId} onClick={() => s.videoId && onTest(s.videoId, s.start ?? 0)}>
        <Play /> Test
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label={`Remove ${s.title}`}
        onClick={() => {
          if (!confirm(`Remove “${s.title}”?`)) return
          set((x) => {
            x.songs.splice(i, 1)
            regroup(x)
          })
        }}
      >
        <Trash2 />
      </Button>
    </li>
  )
}

function toSeconds(v: string) {
  const t = v.trim()
  const m = t.match(/^(\d+):(\d{1,2})$/)
  if (m) return Number(m[1]) * 60 + Number(m[2])
  return Math.max(0, Math.round(Number(t.replace(/[^\d.]/g, '')) || 0))
}

/* ================= Pictionary Relay ================= */

export const PICT_SKIPS = 3

export function PictionaryController({ index }: { index: number }) {
  const def = GAMES[index]
  const d = useStore((s) => s.games[index].data as PictionaryData)
  const teams = useStore((s) => s.teams)
  const set = (fn: (x: PictionaryData) => void) => updateGame<PictionaryData>(index, fn)
  const word = d.words[d.order[d.cursor % d.order.length]]
  const up = d.up ?? 'A'
  const other: TeamId = up === 'A' ? 'B' : 'A'
  const turnId = d.turn ?? 0
  const rounds = d.rounds ?? 1
  const turns = d.turns ?? { A: 0, B: 0, C: 0 }
  const short = (t: TeamId) => shortTeamName(teams, t)
  const thisTurn = d.log.filter((l) => (l.turn ?? -1) === turnId)
  const gotNow = thisTurn.filter((l) => l.team === up && !l.steal).length
  const skipsNow = thisTurn.filter((l) => l.team == null).length
  const stolen = thisTurn.some((l) => l.steal)
  const allDone = TEAM_IDS.every((t) => turns[t] >= rounds)

  const got = (t: TeamId, steal = false) => {
    set((x) => {
      x.scores[t] += 1
      x.log.push({ team: t, word, turn: x.turn ?? 0, steal })
      x.cursor += 1
    })
    pulse({ kind: 'correct', team: t, text: steal ? `stole “${word}”` : `got “${word}”` })
  }

  const endTurn = () => {
    useStore.getState().clearTimer()
    set((x) => {
      const u = x.up ?? 'A'
      x.turns = { ...(x.turns ?? { A: 0, B: 0, C: 0 }), [u]: (x.turns?.[u] ?? 0) + 1 }
      x.up = u === 'A' ? 'B' : 'A'
      x.turn = (x.turn ?? 0) + 1
      // Fresh word for the next team so nobody starts on a word they've watched.
      x.cursor += 1
    })
  }

  return (
    <>
      <Section
        title={allDone ? 'All turns played' : `${short(up)} are drawing · turn ${Math.min(turns[up] + 1, rounds)} of ${rounds}`}
        hint={`Drawers from ${short(up)} come up one at a time. ${short(other)} watch and get one steal guess at the end.`}
        action={
          <div className="flex gap-1">
            {TEAM_IDS.map((t) => (
              <Button key={t} size="sm" variant={up === t ? 'primary' : 'ghost'} onClick={() => set((x) => void (x.up = t))}>
                <TeamDot t={t} /> {short(t)}
              </Button>
            ))}
          </div>
        }
      >
        <TimerControl
          presets={[
            { label: '5:00', seconds: def.timer!, name: `${short(up)} · 5 minutes` },
            { label: '3:00', seconds: 180, name: `${short(up)} · 3 minutes` },
          ]}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-sand">
          <span>Turns per team</span>
          <Segmented value={rounds} onChange={(v) => set((x) => void (x.rounds = v))} options={[1, 2, 3].map((n) => ({ label: String(n), value: n }))} />
          <span className="text-[12px] text-dust">How many times each team gets the clock. Teams alternate.</span>
        </div>
      </Section>

      <Section title="Secret word" hint="Only on your screen. Show it to the drawer who runs up.">
        <div className="rounded-[14px] border border-line bg-ink px-6 py-8 text-center">
          <div className="text-xs text-dust">
            {short(up)} · {gotNow} this turn
          </div>
          <div className="mt-2 font-display text-5xl font-bold tracking-[-0.03em]">{word}</div>
        </div>
        <div className="mt-4 grid grid-cols-[1.4fr_1fr] gap-2">
          <Button size="lg" variant="primary" onClick={() => got(up)} className="h-14 text-base">
            <Check /> {short(up)} got it · next word
          </Button>
          <Button
            size="lg"
            className="h-14"
            disabled={skipsNow >= PICT_SKIPS}
            onClick={() =>
              set((x) => {
                x.log.push({ team: null, word, turn: x.turn ?? 0 })
                x.cursor += 1
              })
            }
          >
            <SkipForward /> Skip ({PICT_SKIPS - skipsNow} left)
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <Button variant="secondary" disabled={stolen} onClick={() => got(other, true)}>
            <TeamDot t={other} /> {short(other)} stole it +1
          </Button>
          <Button variant="primary" className="ml-auto" disabled={allDone} onClick={endTurn}>
            <SkipForward /> End turn · {short(other)} next
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            disabled={!d.log.length}
            onClick={() =>
              set((x) => {
                const l = x.log.pop()
                if (!l) return
                if (l.team) x.scores[l.team] -= 1
                x.cursor = Math.max(0, x.cursor - 1)
              })
            }
          >
            <Undo2 /> Undo
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              set((x) => {
                x.order = shuffle([...x.words.keys()])
                x.cursor = 0
              })
            }
          >
            <Shuffle /> Reshuffle words
          </Button>
          <span className="ml-auto self-center text-xs text-dust">
            Totals: {TEAM_IDS.map((t) => `${short(t)} ${d.scores[t]} (${turns[t]}/${rounds} turns)`).join(' · ')}
          </span>
        </div>
      </Section>
    </>
  )
}

/* ================= Back-to-Back Drawing ================= */

export function B2BController({ index }: { index: number }) {
  const def = GAMES[index]
  const d = useStore((s) => s.games[index].data as B2BData)
  const teams = useStore((s) => s.teams)
  const set = (fn: (x: B2BData) => void) => updateGame<B2BData>(index, fn)
  const turn = d.turn ?? 0
  const team = b2bTeam(d.round, turn)
  const slot = d.round * 2 + turn
  const pic = d.pics[slot % d.pics.length]
  const [picking, setPicking] = useState(false)
  const [pickLevel, setPickLevel] = useState<0 | 1 | 2 | 3>(0)
  const short = (t: TeamId) => shortTeamName(teams, t)
  const scored = d.scores[team][d.round] != null
  const lastTurn = d.round >= d.rounds - 1 && turn === 1
  const turnsUsed = d.pics.slice(0, d.rounds * 2)

  const goTo = (round: number, t: number) =>
    set((x) => {
      x.round = round
      x.turn = t
      x.revealed = false
    })

  const nextTurn = () => {
    useStore.getState().clearTimer()
    if (turn === 0) goTo(d.round, 1)
    else if (d.round < d.rounds - 1) goTo(d.round + 1, 0)
  }

  return (
    <>
      <Section
        title={`Round ${d.round + 1} of ${d.rounds} · ${short(team)} are up`}
        hint={`One pair from ${short(team)}: describer faces the TV, drawer faces away. ${short(b2bTeam(d.round, 1 - turn))} watch quietly.`}
        action={
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: d.rounds }).flatMap((_, r) =>
              [0, 1].map((t) => {
                const tt = b2bTeam(r, t)
                const done = d.scores[tt][r] != null
                const on = r === d.round && t === turn
                return (
                  <button
                    key={`${r}-${t}`}
                    onClick={() => goTo(r, t)}
                    title={`Round ${r + 1} · ${teamName(teams, tt)}`}
                    className={cn(
                      'press flex h-8 items-center gap-1.5 rounded-[8px] border px-2 text-[12px] font-semibold tabular-nums',
                      on ? 'border-cream bg-cream text-night' : 'border-line text-sand hover:border-line-strong',
                      t === 1 && 'mr-1.5',
                    )}
                  >
                    <TeamDot t={tt} />
                    {r + 1}
                    {done && <Check className="size-3" />}
                  </button>
                )
              }),
            )}
          </div>
        }
      >
        <div className="grid items-center gap-4 md:grid-cols-[220px_1fr]">
          <div className="rounded-[12px] border border-line bg-ink p-3">
            <Picture id={pic} className="w-full" />
            <div className="mt-1 text-center text-xs text-dust">
              {PICTURE_NAMES[pic % PICTURE_COUNT]} · {['Easy', 'Medium', 'Hard'][PICTURE_LEVELS[pic % PICTURE_COUNT] - 1]}
            </div>
          </div>
          <div className="grid gap-3">
            <TimerControl presets={[{ label: '1:30', seconds: def.timer!, name: `${short(team)} · Round ${d.round + 1} · 90 seconds` }]} />
            <div className="flex flex-wrap gap-2">
              <Button
                variant={d.revealed ? 'secondary' : 'primary'}
                onClick={() => {
                  set((x) => void (x.revealed = !x.revealed))
                  if (useStore.getState().view !== 'play') setView('play')
                }}
              >
                <Eye /> {d.revealed ? 'Back to drawing view' : 'Pens down · show scoring'}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  set((x) => {
                    const used = new Set(x.pics.slice(0, x.rounds * 2))
                    const level = pickLevel || PICTURE_LEVELS[x.pics[slot] % PICTURE_COUNT]
                    const all = [...Array(PICTURE_COUNT).keys()].filter((i) => !used.has(i))
                    const pool = all.filter((i) => PICTURE_LEVELS[i] === level)
                    const from = pool.length ? pool : all
                    if (from.length) x.pics[slot] = from[Math.floor(Math.random() * from.length)]
                  })
                }
              >
                <Shuffle /> Random picture
              </Button>
              <Button variant={picking ? 'secondary' : 'ghost'} onClick={() => setPicking((v) => !v)}>
                <Eye /> {picking ? 'Hide pictures' : `Choose from all ${PICTURE_COUNT}`}
              </Button>
            </div>
          </div>
        </div>
        {picking && (
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Segmented
                value={pickLevel}
                onChange={setPickLevel}
                options={[
                  { label: 'All', value: 0 },
                  { label: 'Easy', value: 1 },
                  { label: 'Medium', value: 2 },
                  { label: 'Hard', value: 3 },
                ]}
              />
              <span className="text-xs text-dust">
                Tap a picture for {short(team)}, round {d.round + 1}. Dimmed ones are used in other turns.
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {[...Array(PICTURE_COUNT).keys()]
                .filter((i) => pickLevel === 0 || PICTURE_LEVELS[i] === pickLevel)
                .map((i) => {
                  const current = pic === i
                  const usedElsewhere = !current && turnsUsed.includes(i)
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        set((x) => {
                          // If it's used in another turn, swap the two so nothing repeats.
                          const other = x.pics.slice(0, x.rounds * 2).indexOf(i)
                          if (other >= 0 && other !== slot) x.pics[other] = x.pics[slot]
                          x.pics[slot] = i
                        })
                      }
                      title={PICTURE_NAMES[i]}
                      className={cn(
                        'press rounded-[10px] border bg-ink p-1.5 text-left',
                        current ? 'border-cream' : 'border-line hover:border-line-strong',
                        usedElsewhere && 'opacity-40',
                      )}
                    >
                      <Picture id={i} className="w-full" />
                      <div className="truncate px-0.5 text-[10.5px] text-dust">{PICTURE_NAMES[i]}</div>
                    </button>
                  )
                })}
            </div>
          </div>
        )}
      </Section>

      <Section title={`Score ${short(team)}’s drawing`} hint="Score it 1 to 5. Ask the other team, or make the call yourself.">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-line bg-ink px-4 py-3">
          <TeamName t={team} className="font-display text-lg font-semibold" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={`Score ${n}`}
                onClick={() => {
                  set((x) => void (x.scores[team][x.round] = n))
                  pulse({ kind: 'score', team, text: `score ${n}` })
                }}
                className={cn(
                  'press h-11 w-12 rounded-[9px] border font-display text-lg font-semibold',
                  d.scores[team][d.round] === n ? 'border-cream bg-cream text-night' : 'border-line text-sand hover:border-line-strong',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <span className="text-xs text-dust">
            Totals:{' '}
            {TEAM_IDS.map((t) => `${short(t)} ${d.scores[t].reduce<number>((a, v) => a + (v ?? 0), 0)}`).join(' · ')}
          </span>
          <Button variant="primary" disabled={!scored || lastTurn} onClick={nextTurn}>
            <SkipForward />{' '}
            {lastTurn ? 'All turns done' : turn === 0 ? `Next: ${short(b2bTeam(d.round, 1))}` : `Next round · ${short(b2bTeam(d.round + 1, 0))} first`}
          </Button>
        </div>
      </Section>
    </>
  )
}
