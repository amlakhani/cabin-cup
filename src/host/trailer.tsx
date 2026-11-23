import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ExternalLink,
  Eye,
  Link2,
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
import { useStore, TEAM_IDS, shuffle, makeSetlist, spareSong, type B2BData, type PictionaryData, type TuneData, type TeamId } from '@/lib/store'
import { updateGame, setView } from '@/lib/actions'
import { loadYouTube, parseYouTube, youtubeSearchUrl, type YTPlayer } from '@/lib/youtube'
import type { Song } from '@/lib/songs'
import { cn } from '@/lib/utils'
import { Picture, PICTURE_NAMES } from '@/show/pictures'
import { Section, Segmented, TeamDot, TeamName, TimerControl } from './common'

const pulse = (p: Parameters<ReturnType<typeof useStore.getState>['emit']>[0]) => useStore.getState().emit(p)

export const ROUND_NAMES = ['Pop Hits', 'Bollywood Through the Decades', 'Generation Swap']
export const groupLabel = (g: Song['group']) => (g === 'pop' ? 'English pop' : `${g} Bollywood`)

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
              setError('That video can’t be played inside the site. Swap in another song.')
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
  const linked = d.setlist.flat().filter((i) => d.songs[i]?.videoId).length
  const total = d.setlist.flat().length

  clip.onBad.current = () =>
    set((x) => {
      const si = x.setlist[x.round][x.pos]
      if (x.songs[si]) x.songs[si].bad = true
    })

  const swap = () => {
    clip.stop()
    clip.setError(null)
    set((x) => {
      const si = x.setlist[x.round][x.pos]
      const next = spareSong(x.songs, x.setlist, x.songs[si].group)
      if (next != null) x.setlist[x.round][x.pos] = next
      x.revealed = false
    })
  }

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
      else if (x.round < 2) {
        x.round += 1
        x.pos = 0
      }
    })
  }

  return (
    <>
      <Section
        title={`Round ${d.round + 1}: ${ROUND_NAMES[d.round]}`}
        hint={
          d.round === 2
            ? 'Double points. Only kids answer Bollywood songs, only adults answer pop songs.'
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
                  Song {d.pos + 1} · {groupLabel(song.group)}
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
                <Button variant="ghost" onClick={swap}>
                  <Shuffle /> Swap song
                </Button>
              </div>
              {!song.videoId && (
                <p className="mt-3 text-[13px] text-warn">
                  No YouTube link for this song yet. Add one under Song links below.
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
          <p className="text-sm text-dust">This round has no songs.</p>
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
              Last: {teams[d.log[d.log.length - 1].team].name} +{d.log[d.log.length - 1].pts}
            </span>
          )}
        </div>
      </Section>

      <SongLinks
        index={index}
        linked={linked}
        total={total}
        onTest={(s) => s.videoId && clip.play(s.videoId, s.start ?? 0, d.clipSec)}
        check={clip.ready ? clip.check : null}
      />
    </>
  )
}

function SongLinks({
  index,
  linked,
  total,
  onTest,
  check,
}: {
  index: number
  linked: number
  total: number
  onTest: (s: Song) => void
  check: ((videoId: string) => Promise<boolean>) | null
}) {
  const d = useStore((s) => s.games[index].data as TuneData)
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; bad: number } | null>(null)
  const set = (fn: (x: TuneData) => void) => updateGame<TuneData>(index, fn)
  const badCount = d.setlist.flat().filter((i) => d.songs[i]?.bad).length

  const checkAll = async () => {
    if (!check) return
    const idx = d.songs.map((_, i) => i).filter((i) => d.songs[i].videoId)
    let bad = 0
    setProgress({ done: 0, total: idx.length, bad })
    for (let k = 0; k < idx.length; k++) {
      const i = idx[k]
      const ok = await check(d.songs[i].videoId!)
      if (!ok) bad++
      set((x) => void (x.songs[i].bad = !ok))
      setProgress({ done: k + 1, total: idx.length, bad })
    }
    // Swap any broken songs in the setlist for working spares.
    set((x) => {
      x.setlist.forEach((round, r) =>
        round.forEach((si, p) => {
          if (!x.songs[si]?.bad) return
          const next = spareSong(x.songs, x.setlist, x.songs[si].group)
          if (next != null) x.setlist[r][p] = next
        }),
      )
    })
  }
  return (
    <Section
      title={`Setlist · ${linked} of ${total} songs linked${badCount ? ` · ${badCount} blocked` : ''}`}
      hint="Links are already filled in. Run Check all songs once on this laptop before the party. Adjust a start time to skip a long intro."
      action={
        <div className="flex gap-2">
          <Button size="sm" variant="primary" disabled={!check || (progress != null && progress.done < progress.total)} onClick={checkAll}>
            <Check /> Check all songs
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (d.log.length && !confirm('Shuffle a new setlist? Your saved links stay.')) return
              set((x) => {
                x.setlist = makeSetlist(x.songs)
                x.pos = 0
                x.round = 0
                x.revealed = false
              })
            }}
          >
            <Shuffle /> New setlist
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
            <Link2 /> {open ? 'Hide list' : 'Show list'}
          </Button>
        </div>
      }
    >
      {progress && (
        <div className="mb-4 rounded-[10px] border border-line bg-ink px-4 py-3 text-[13px]">
          <div className="flex justify-between">
            <span>
              {progress.done < progress.total ? 'Checking songs…' : 'Check finished.'} {progress.done} of {progress.total}
            </span>
            <span className={progress.bad ? 'text-warn' : 'text-ok'}>
              {progress.bad ? `${progress.bad} can’t play here, swapped out` : 'All good so far'}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream/10">
            <div className="h-full rounded-full bg-cream transition-[width] duration-200" style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} />
          </div>
        </div>
      )}
      {open &&
        d.setlist.map((round, r) => (
          <div key={r} className="mb-4 last:mb-0">
            <div className="mb-2 text-xs font-medium text-dust">
              Round {r + 1} · {ROUND_NAMES[r]}
            </div>
            <ol className="grid gap-1.5">
              {round.map((si, p) => (
                <SongLinkRow
                  key={`${r}-${si}`}
                  n={p + 1}
                  song={d.songs[si]}
                  current={d.round === r && d.pos === p}
                  onSave={(videoId, start) =>
                    set((x) => {
                      if (x.songs[si].videoId !== videoId) x.songs[si].bad = false
                      x.songs[si].videoId = videoId
                      x.songs[si].start = start
                    })
                  }
                  onTest={() => onTest(d.songs[si])}
                />
              ))}
            </ol>
          </div>
        ))}
    </Section>
  )
}

function SongLinkRow({
  n,
  song,
  current,
  onSave,
  onTest,
}: {
  n: number
  song: Song
  current: boolean
  onSave: (videoId: string | undefined, start: number | undefined) => void
  onTest: () => void
}) {
  const [draft, setDraft] = useState('')
  const [bad, setBad] = useState(false)
  const q = song.group === 'pop' ? `${song.title} ${song.artist} official video` : `${song.title} ${song.artist} song`
  const save = (v: string) => {
    const p = parseYouTube(v)
    if (!p) return setBad(!!v.trim())
    setBad(false)
    setDraft('')
    onSave(p.videoId, p.start ?? song.start)
  }
  return (
    <li
      className={cn(
        'grid items-center gap-2 rounded-[10px] border px-3 py-2 text-[13px] md:grid-cols-[22px_minmax(0,1fr)_minmax(0,1.2fr)_auto]',
        current ? 'border-cream/40 bg-raised' : 'border-line bg-ink',
      )}
    >
      <span className="font-mono text-[11px] text-dust">{n}</span>
      <span className="min-w-0 truncate">
        <span className="text-cream">{song.title}</span> <span className="text-dust">· {song.artist}</span>
      </span>
      {song.videoId ? (
        <span className={cn('flex items-center gap-2', song.bad ? 'text-warn' : 'text-ok')}>
          <Check className="size-3.5 shrink-0" /> {song.bad ? 'Blocked' : 'Linked'}
          <label className="ml-2 flex items-center gap-1 text-dust">
            start
            <input
              className="h-7 w-14 rounded-md border border-line bg-night px-1.5 text-center text-cream tabular-nums outline-none focus:border-line-strong"
              inputMode="numeric"
              value={song.start ?? 0}
              onChange={(e) => onSave(song.videoId, Number(e.target.value.replace(/\D/g, '') || 0))}
              aria-label="Start time in seconds"
            />
            s
          </label>
        </span>
      ) : (
        <Input
          value={draft}
          placeholder="Paste YouTube link"
          className={cn('h-8 text-[13px]', bad && 'border-bad/60')}
          onChange={(e) => {
            setDraft(e.target.value)
            setBad(false)
          }}
          onPaste={(e) => {
            const v = e.clipboardData.getData('text')
            setTimeout(() => save(v), 0)
          }}
          onBlur={() => draft && save(draft)}
          onKeyDown={(e) => e.key === 'Enter' && save(draft)}
        />
      )}
      <span className="flex gap-1">
        <a
          href={youtubeSearchUrl(q)}
          target="_blank"
          rel="noreferrer"
          className="press inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-sand hover:bg-raised hover:text-cream"
        >
          <ExternalLink className="size-3.5" /> Find
        </a>
        {song.videoId && (
          <>
            <Button size="sm" variant="ghost" onClick={onTest}>
              <Play /> Test
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onSave(undefined, undefined)} aria-label="Remove link">
              ✕
            </Button>
          </>
        )}
      </span>
      {bad && <span className="text-[12px] text-bad md:col-start-3">That doesn’t look like a YouTube link.</span>}
    </li>
  )
}

/* ================= Pictionary Relay ================= */

export function PictionaryController({ index }: { index: number }) {
  const def = GAMES[index]
  const d = useStore((s) => s.games[index].data as PictionaryData)
  const teams = useStore((s) => s.teams)
  const set = (fn: (x: PictionaryData) => void) => updateGame<PictionaryData>(index, fn)
  const word = d.words[d.order[d.cursor % d.order.length]]
  const used = d.log.filter((l) => l.team).length

  const got = (t: TeamId) => {
    set((x) => {
      x.scores[t] += 1
      x.log.push({ team: t, word })
      x.cursor += 1
    })
    pulse({ kind: 'correct', team: t, text: `got “${word}”` })
  }

  return (
    <>
      <Section
        title={`Round ${d.round + 1} of 2`}
        hint="Start the clock once the first drawers have seen the word."
        action={
          <Segmented
            value={d.round}
            onChange={(r) => set((x) => void (x.round = r))}
            options={[0, 1].map((r) => ({ label: `Round ${r + 1}`, value: r }))}
          />
        }
      >
        <TimerControl presets={[{ label: '3:00', seconds: def.timer!, name: `Round ${d.round + 1} · 3 minutes` }]} />
      </Section>

      <Section title="Secret word" hint="Only on your screen. Drawers come up to read it.">
        <div className="rounded-[14px] border border-line bg-ink px-6 py-8 text-center">
          <div className="text-xs text-dust">Word {d.cursor + 1}</div>
          <div className="mt-2 font-display text-5xl font-bold tracking-[-0.03em]">{word}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {TEAM_IDS.map((t) => (
            <Button key={t} size="lg" onClick={() => got(t)} className="h-14">
              <TeamDot t={t} /> {teams[t].name.replace(/^Team /, '')} got it
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() =>
              set((x) => {
                x.log.push({ team: null, word })
                x.cursor += 1
              })
            }
          >
            <SkipForward /> Skip word
          </Button>
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
          <span className="ml-auto self-center text-xs text-dust">{used} guessed so far</span>
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
  const pic = d.pics[d.round % d.pics.length]
  const roundScored = TEAM_IDS.every((t) => d.scores[t][d.round] != null)

  return (
    <>
      <Section
        title={`Round ${d.round + 1} of ${d.rounds}`}
        hint="One pair from every team. Describers face the TV; drawers face away."
        action={
          <div className="flex gap-1">
            {Array.from({ length: d.rounds }).map((_, r) => (
              <Button
                key={r}
                size="sm"
                variant={r === d.round ? 'primary' : 'ghost'}
                onClick={() => set((x) => void (x.round = r))}
              >
                {r + 1}
              </Button>
            ))}
          </div>
        }
      >
        <div className="grid items-center gap-4 md:grid-cols-[220px_1fr]">
          <div className="rounded-[12px] border border-line bg-ink p-3">
            <Picture id={pic} className="w-full" />
            <div className="mt-1 text-center text-xs text-dust">{PICTURE_NAMES[pic % PICTURE_NAMES.length]}</div>
          </div>
          <div className="grid gap-3">
            <TimerControl presets={[{ label: '1:30', seconds: def.timer!, name: `Round ${d.round + 1} · 90 seconds` }]} />
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
                    const used = new Set(x.pics.slice(0, x.rounds))
                    const spare = [...Array(12).keys()].find((i) => !used.has(i))
                    if (spare != null) x.pics[x.round] = spare
                  })
                }
              >
                <Shuffle /> Different picture
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Scores this round" hint="Score each drawing 1 to 5. Ask the other teams, or make the call yourself.">
        <div className="grid gap-2">
          {TEAM_IDS.map((t) => (
            <div key={t} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-line bg-ink px-4 py-3">
              <TeamName t={t} className="font-display text-lg font-semibold" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      set((x) => void (x.scores[t][x.round] = n))
                      pulse({ kind: 'score', team: t, text: `score ${n}` })
                    }}
                    className={cn(
                      'press h-10 w-11 rounded-[9px] border font-display text-lg font-semibold',
                      d.scores[t][d.round] === n
                        ? 'border-cream bg-cream text-night'
                        : 'border-line text-sand hover:border-line-strong',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-dust">
            Totals:{' '}
            {TEAM_IDS.map((t) => `${teams[t].name.replace(/^Team /, '')} ${d.scores[t].reduce<number>((a, v) => a + (v ?? 0), 0)}`).join(' · ')}
          </span>
          <Button
            variant="primary"
            disabled={!roundScored || d.round >= d.rounds - 1}
            onClick={() =>
              set((x) => {
                x.round += 1
                x.revealed = false
              })
            }
          >
            <SkipForward /> Next round
          </Button>
        </div>
      </Section>
    </>
  )
}
