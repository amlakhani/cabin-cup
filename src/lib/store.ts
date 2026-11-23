import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { EVENT } from './event'
import { SONGS, type Song } from './songs'
import {
  PICTIONARY_WORDS,
  GAMES,
  DEFAULT_CHARADES_PROMPTS,
  DEFAULT_LINEUP_CATEGORIES,
} from './games'

export type TeamId = 'A' | 'B' | 'C'
export const TEAM_IDS: TeamId[] = ['A', 'B', 'C']

export type ShowView =
  | 'welcome'
  | 'teams'
  | 'rules'
  | 'play'
  | 'result'
  | 'standings'
  | 'champion'

export interface Player {
  id: string
  name: string
}

export interface Team {
  name: string
  color: ColorKey
  members: string[]
  captain: string | null
}

export const COLORS = {
  ember: { label: 'Ember', hex: '#F2683C', ink: '#2A0F05' },
  glacier: { label: 'Glacier', hex: '#5AB0F0', ink: '#04182A' },
  meadow: { label: 'Meadow', hex: '#A6D65A', ink: '#142205' },
  plum: { label: 'Plum', hex: '#C784F0', ink: '#200833' },
  marigold: { label: 'Marigold', hex: '#F5C143', ink: '#2B1E00' },
  rose: { label: 'Rose', hex: '#F27A9E', ink: '#2E0816' },
} as const
export type ColorKey = keyof typeof COLORS

export interface Timer {
  label: string
  duration: number // ms
  endsAt: number | null // epoch ms while running
  remaining: number // ms when paused
  running: boolean
  stamp: number
}

export type Placement = Record<TeamId, 1 | 2 | 3>

export interface GameResult {
  placement: Placement
  points: Record<TeamId, number>
  scores: Partial<Record<TeamId, number>>
  lockedAt: number
}

/* ---------- per-game data ---------- */
export interface TotalsData {
  scores: Partial<Record<TeamId, number>>
}
export interface Heat {
  a: TeamId
  b: TeamId
  aWins: number | null
  total: number | null // duels in this matchup, frozen when scored
}
export interface HeatsData {
  heats: Heat[]
  active: number
  cups: 1 | 2 | 4 | 8
  wave: number
  call: { word: string; id: number } | null
}
export interface MemoryData {
  board: 0 | 1 | 2
  study: 30 | 45 | 60
  stage: 'setup' | 'study' | 'write' | 'reveal'
  scores: Partial<Record<TeamId, number>>
}
export interface Series {
  a: TeamId
  b: TeamId
  boards: ('a' | 'b' | 'draw')[]
}
export interface TTTData {
  series: Series[]
  active: number
}
export interface LineupData {
  categories: string[]
  rounds: { category: string; winner: TeamId | null }[]
  current: number // index into rounds, -1 = none
}
export interface RelayData {
  cups: number
  finish: 'edge' | 'line'
  order: TeamId[]
  active: number
  scores: Partial<Record<TeamId, number>>
}
export interface MatchData {
  pairs: number
  order: TeamId[]
  turn: number
  scores: Record<TeamId, number>
  log: { team: TeamId; hit: boolean }[]
  lastResult: { kind: 'match' | 'miss'; team: TeamId; id: number } | null
}
export interface ChopsticksData {
  lineups: Record<TeamId, string[]> // player ids in turn order
  rounds: number
  round: number
  counts: Record<TeamId, (number | null)[]>
}
export interface CharadesTurn {
  team: TeamId
  correct: number
  passed: number
  done: boolean
  log: { text: string; result: 'correct' | 'pass' }[]
}
export interface CharadesData {
  prompts: string[]
  order: number[]
  cursor: number
  turns: CharadesTurn[]
  active: number | null // index in turns while live
  extra: boolean
}

export interface TuneData {
  songs: Song[]
  setlist: number[][] // song indices for each of the 3 rounds
  round: number
  pos: number
  clipSec: number
  revealed: boolean
  playId: number | null // set when a clip starts, so the TV can animate
  scores: Record<TeamId, number>
  log: { team: TeamId; pts: number; round: number; pos: number }[]
}
export interface PictionaryData {
  words: string[]
  order: number[]
  cursor: number
  round: number
  scores: Record<TeamId, number>
  log: { team: TeamId | null; word: string }[]
}
export interface B2BData {
  rounds: number
  round: number
  pics: number[]
  revealed: boolean
  scores: Record<TeamId, (number | null)[]>
}

export type GameData =
  | TotalsData
  | HeatsData
  | MemoryData
  | TTTData
  | LineupData
  | RelayData
  | MatchData
  | ChopsticksData
  | TuneData
  | PictionaryData
  | B2BData
  | CharadesData

export interface GameState {
  data: GameData
  tieOrder: TeamId[]
  tiebreak: boolean
  override: Placement | null
  result: GameResult | null
}

export interface Pulse {
  id: number
  kind:
    | 'score'
    | 'match'
    | 'miss'
    | 'correct'
    | 'pass'
    | 'finish'
    | 'round'
    | 'call'
    | 'flip'
  team?: TeamId
  text?: string
}

export interface Settings {
  title: string
  subtitle: string
  place: string
  date: string
  points: [number, number, number]
  sound: boolean
}

export interface AppState {
  settings: Settings
  players: Player[]
  teams: Record<TeamId, Team>
  current: number
  view: ShowView
  games: GameState[]
  timer: Timer | null
  pulse: Pulse | null
  revealStep: number
  version: number
}

/* ---------- helpers ---------- */
export const uid = () => Math.random().toString(36).slice(2, 9)

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const B2B_PICTURE_COUNT = 12

export function makeSetlist(songs: Song[]): number[][] {
  // Only songs with a working link make the setlist.
  const ok = (s: Song) => !!s.videoId && !s.bad
  const by = (g: Song['group']) => shuffle(songs.map((s, i) => (s.group === g && ok(s) ? i : -1)).filter((i) => i >= 0))
  const pop = by('pop')
  const decades = (['80s', '90s', '00s', '10s', '20s'] as const).map(by)
  const r1 = pop.slice(0, 12)
  const r2 = decades.flatMap((d) => d.slice(0, 3))
  const r3 = shuffle([...pop.slice(12, 16), ...decades.map((d) => d[3]).filter((i) => i != null)])
  return [r1, r2, r3]
}

/** Picks an unused, working song of the same group to replace one that won't play. */
export function spareSong(songs: Song[], setlist: number[][], group: Song['group']) {
  const used = new Set(setlist.flat())
  const options = songs.map((_, i) => i).filter((i) => !used.has(i) && songs[i].group === group && songs[i].videoId && !songs[i].bad)
  return options.length ? options[Math.floor(Math.random() * options.length)] : null
}

function initialData(kind: string): GameData {
  switch (kind) {
    case 'tune':
      return {
        songs: SONGS.map((x) => ({ ...x })),
        setlist: makeSetlist(SONGS),
        round: 0,
        pos: 0,
        clipSec: 10,
        revealed: false,
        playId: null,
        scores: { A: 0, B: 0, C: 0 },
        log: [],
      }
    case 'pictionary':
      return {
        words: [...PICTIONARY_WORDS],
        order: shuffle([...PICTIONARY_WORDS.keys()]),
        cursor: 0,
        round: 0,
        scores: { A: 0, B: 0, C: 0 },
        log: [],
      }
    case 'b2b':
      return {
        rounds: 4,
        round: 0,
        pics: shuffle([...Array(B2B_PICTURE_COUNT).keys()]),
        revealed: false,
        scores: { A: [], B: [], C: [] },
      }
    case 'heats':
      return {
        heats: [
          { a: 'A', b: 'B', aWins: null, total: null },
          { a: 'B', b: 'C', aWins: null, total: null },
          { a: 'C', b: 'A', aWins: null, total: null },
        ],
        active: 0,
        cups: 4,
        wave: 0,
        call: null,
      }
    case 'memory-board':
      return { board: 0, study: 45, stage: 'setup', scores: {} }
    case 'tictactoe':
      return {
        series: [
          { a: 'A', b: 'B', boards: [] },
          { a: 'B', b: 'C', boards: [] },
          { a: 'C', b: 'A', boards: [] },
        ],
        active: 0,
      }
    case 'lineup':
      return {
        categories: [...DEFAULT_LINEUP_CATEGORIES],
        rounds: [],
        current: -1,
      }
    case 'relay':
      return { cups: 25, finish: 'edge', order: ['A', 'B', 'C'], active: 0, scores: {} }
    case 'match':
      return { pairs: 12, order: ['A', 'B', 'C'], turn: 0, scores: { A: 0, B: 0, C: 0 }, log: [], lastResult: null }
    case 'chopsticks':
      return { lineups: { A: [], B: [], C: [] }, rounds: 8, round: 0, counts: { A: [], B: [], C: [] } }
    case 'charades':
      return {
        prompts: [...DEFAULT_CHARADES_PROMPTS],
        order: shuffle([...DEFAULT_CHARADES_PROMPTS.keys()]),
        cursor: 0,
        turns: ['A', 'B', 'C', 'A', 'B', 'C'].map((t) => ({
          team: t as TeamId,
          correct: 0,
          passed: 0,
          done: false,
          log: [],
        })),
        active: null,
        extra: false,
      }
    default:
      return { scores: {} }
  }
}

export function freshGames(): GameState[] {
  return GAMES.map((g) => ({
    data: initialData(g.kind),
    tieOrder: [],
    tiebreak: false,
    override: null,
    result: null,
  }))
}

const initialState: AppState = {
  settings: {
    title: EVENT === 'trailer' ? 'Thanksgiving Trailer' : "Crazy Family’s Cabin Cup",
    subtitle: EVENT === 'trailer' ? 'A Cabin Cup warm-up' : 'Game Night',
    place: EVENT === 'trailer' ? 'Home' : 'Living room',
    date: EVENT === 'trailer' ? 'Thanksgiving 2026' : '2026',
    points: [10, 6, 3],
    sound: true,
  },
  players: [],
  teams: {
    A: { name: 'Team Dabeli Dominators', color: 'ember', members: [], captain: null },
    B: { name: 'Team Dhokla Destroyers', color: 'marigold', members: [], captain: null },
    C: { name: 'Team Thepla Travellers', color: 'meadow', members: [], captain: null },
  },
  current: 0,
  view: 'welcome',
  games: freshGames(),
  timer: null,
  pulse: null,
  revealStep: 0,
  version: 1,
}

/* ---------- store ---------- */
interface Actions {
  set: (fn: (s: AppState) => void) => void
  replace: (s: AppState) => void
  undo: () => void
  canUndo: () => boolean
  emit: (p: Omit<Pulse, 'id'>) => void
  startTimer: (label: string, seconds: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  clearTimer: () => void
  addTime: (seconds: number) => void
  resetAll: () => void
}

export type Store = AppState & Actions

export const STORAGE_KEY = EVENT === 'trailer' ? 'trailer-v2' : 'cabin-cup-v3'

const history: AppState[] = []
const MAX_HISTORY = 60

export function snapshot(s: AppState): AppState {
  const {
    settings, players, teams, current, view, games, timer, pulse, revealStep, version,
  } = s
  return JSON.parse(
    JSON.stringify({ settings, players, teams, current, view, games, timer, pulse, revealStep, version }),
  )
}

export const useStore = create<Store>()(
  persist(
    immer((set, get) => ({
      ...initialState,
      set: (fn) => {
        history.push(snapshot(get()))
        if (history.length > MAX_HISTORY) history.shift()
        set((s) => {
          fn(s)
        })
      },
      replace: (next) => set(() => ({ ...next })),
      undo: () => {
        const prev = history.pop()
        if (prev) set(() => ({ ...prev, pulse: null }))
      },
      canUndo: () => history.length > 0,
      emit: (p) =>
        set((s) => {
          s.pulse = { ...p, id: Date.now() + Math.random() }
        }),
      startTimer: (label, seconds) =>
        set((s) => {
          const d = seconds * 1000
          s.timer = {
            label,
            duration: d,
            endsAt: Date.now() + d,
            remaining: d,
            running: true,
            stamp: Date.now(),
          }
        }),
      pauseTimer: () =>
        set((s) => {
          if (!s.timer || !s.timer.running || !s.timer.endsAt) return
          s.timer.remaining = Math.max(0, s.timer.endsAt - Date.now())
          s.timer.running = false
          s.timer.endsAt = null
        }),
      resumeTimer: () =>
        set((s) => {
          if (!s.timer || s.timer.running || s.timer.remaining <= 0) return
          s.timer.endsAt = Date.now() + s.timer.remaining
          s.timer.running = true
        }),
      clearTimer: () =>
        set((s) => {
          s.timer = null
        }),
      addTime: (sec) =>
        set((s) => {
          if (!s.timer) return
          if (s.timer.running && s.timer.endsAt) s.timer.endsAt += sec * 1000
          else s.timer.remaining = Math.max(0, s.timer.remaining + sec * 1000)
          s.timer.duration += sec * 1000
        }),
      resetAll: () => {
        history.length = 0
        set(() => ({ ...snapshot({ ...initialState, games: freshGames() } as AppState) }))
      },
    })),
    {
      name: STORAGE_KEY,
      version: 3,
      // Swap an older built-in charades list for the current one, unless the host edited it.
      migrate: (persisted, from) => {
        const st = persisted as AppState
        if (from < 3 && st?.games) {
          const i = GAMES.findIndex((g) => g.kind === 'charades')
          const d = st.games[i]?.data as CharadesData | undefined
          if (d && ((d.prompts.length === 40 || d.prompts.length === 139) && d.prompts[0] === 'Brushing your teeth' || d.prompts.length === 137 && d.prompts[0] === 'Brushing teeth')) {
            d.prompts = [...DEFAULT_CHARADES_PROMPTS]
            d.order = shuffle([...d.prompts.keys()])
            d.cursor = 0
          }
        }
        return st
      },
      // Only the host window writes; the TV window is read-only.
      storage: createJSONStorage(() => ({
        getItem: (k) => localStorage.getItem(k),
        setItem: (k, v) => {
          if (!location.pathname.replace(/\/+$/, '').endsWith('/show')) localStorage.setItem(k, v)
        },
        removeItem: (k) => localStorage.removeItem(k),
      })),
      partialize: (s) => snapshot(s),
    },
  ),
)

/* ---------- cross-window sync ---------- */
const CHANNEL = EVENT === 'trailer' ? 'trailer-sync' : 'cabin-cup-sync'

export function startHostSync() {
  if (typeof BroadcastChannel === 'undefined') return () => {}
  const ch = new BroadcastChannel(CHANNEL)
  const send = () => ch.postMessage({ type: 'state', state: snapshot(useStore.getState()) })
  const unsub = useStore.subscribe(send)
  ch.onmessage = (e) => {
    if (e.data?.type === 'hello') send()
  }
  send()
  return () => {
    unsub()
    ch.close()
  }
}

export function startShowSync() {
  // Fallback: the storage event fires in other windows when localStorage changes.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) useStore.persist.rehydrate()
  }
  window.addEventListener('storage', onStorage)
  if (typeof BroadcastChannel === 'undefined')
    return () => window.removeEventListener('storage', onStorage)
  const ch = new BroadcastChannel(CHANNEL)
  ch.onmessage = (e) => {
    if (e.data?.type === 'state') useStore.getState().replace(e.data.state)
  }
  ch.postMessage({ type: 'hello' })
  return () => {
    ch.close()
    window.removeEventListener('storage', onStorage)
  }
}
