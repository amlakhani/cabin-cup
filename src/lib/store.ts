import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { EVENT } from './event'
import { SONGS, type Song } from './songs'
import { PICTURE_COUNT } from '../show/pictures'
import {
  PICTIONARY_WORDS,
  GAMES,
  DEFAULT_CHARADES_PROMPTS,
  DEFAULT_LINEUP_CATEGORIES,
} from './games'

export type TeamId = 'A' | 'B' | 'C'
// The Thanksgiving Trailer plays with two teams; the Cabin Cup with three.
export const TEAM_IDS: TeamId[] = EVENT === 'trailer' ? ['A', 'B'] : ['A', 'B', 'C']
/** Grid classes sized to the team count (kept literal so Tailwind sees them). */
export const TEAM_GRID = EVENT === 'trailer' ? 'grid-cols-2' : 'grid-cols-3'
export const TEAM_GRID_MD = EVENT === 'trailer' ? 'md:grid-cols-2' : 'md:grid-cols-3'
export const TEAM_WORD = EVENT === 'trailer' ? 'two' : 'three'

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

export interface FeudAnswer {
  id: string
  text: string
  points: number
}
export interface FeudQuestion {
  id: string
  text: string
  answers: FeudAnswer[]
  mult: 1 | 2 | 3
  /** true once the host drags answers into a custom order; otherwise the board sorts by points */
  ordered?: boolean
}
export interface FeudAward {
  team: TeamId | null
  points: number
}
export interface FeudData {
  questions: FeudQuestion[]
  cursor: number
  shown: boolean // question text visible on the TV
  revealed: string[] // answer ids flipped on the current question
  strikes: number
  control: TeamId | null // team playing the board; null during the face-off
  awards: Record<string, FeudAward> // by question id, once the bank is awarded
  flash: { n: number; id: number } | null // big red X on the TV
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
  | FeudData
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

export const B2B_PICTURE_COUNT = PICTURE_COUNT

export function makeSetlist(songs: Song[]): number[][] {
  // Only songs with a working link make the setlist. The host's own songs are always in.
  const ok = (s: Song) => !!s.videoId && !s.bad && !s.custom
  const pick = (f: (s: Song) => boolean) => shuffle(songs.map((s, i) => (ok(s) && f(s) ? i : -1)).filter((i) => i >= 0))
  const easy = pick((s) => s.group === 'pop' && !s.hard)
  const hard = pick((s) => s.group === 'pop' && !!s.hard)
  // Deal Bollywood across the decades in turn so every round spans 80s to 20s.
  const decades = shuffle(['80s', '90s', '00s', '10s', '20s'] as const).map((g) => pick((s) => s.group === g))
  const bolly: number[] = []
  for (let k = 0; decades.some((d) => d.length); k++) {
    const d = decades[k % decades.length]
    if (d.length) bolly.push(d.shift()!)
  }
  // Every round mixes Bollywood and English; English gets harder as the night goes on.
  const plan = [
    { easy: 2, hard: 2, bolly: 8 },
    { easy: 1, hard: 3, bolly: 8 },
    { easy: 1, hard: 3, bolly: 6 },
  ]
  const rounds = plan.map((p) => shuffle([...easy.splice(0, p.easy), ...hard.splice(0, p.hard), ...bolly.splice(0, p.bolly)]))
  songs.forEach((s, i) => {
    if (!s.custom || !s.videoId) return
    const r = Math.min(2, Math.max(0, s.round ?? 0))
    rounds[r].push(i)
  })
  return rounds
}

/** Picks an unused, working song of the same group to replace one that won't play. */
export function spareSong(songs: Song[], setlist: number[][], group: Song['group'], hard?: boolean) {
  const used = new Set(setlist.flat())
  const options = songs.map((_, i) => i).filter((i) => !used.has(i) && songs[i].group === group && songs[i].videoId && !songs[i].bad && !songs[i].custom)
  // Prefer a spare of the same difficulty.
  const same = hard == null ? options : options.filter((i) => !!songs[i].hard === hard)
  const from = same.length ? same : options
  return from.length ? from[Math.floor(Math.random() * from.length)] : null
}

export const FEUD_QUESTIONS = [
  'Name a snack our family always has during a trip.',
  'Name a dish most likely to be at a family dinner or gathering.',
  'Name something you will always find in an Indian family’s fridge.',
  'Name something your mom always says when you’re leaving the house.',
  'Name something Gujjus love to do on vacation.',
  'Name a phrase every desi parent uses to end an argument.',
  'Name something kids today will never understand.',
  'Name something parents have to ask their kids to do at least three times.',
  'Name something you will always find Dev doing.',
  'Name a place (city, location or park) our family has visited the most.',
  'Name a place you will always find our family’s kids hanging out.',
]

export function feudQuestion(text = '', mult: 1 | 2 | 3 = 1): FeudQuestion {
  return { id: uid(), text, answers: [], mult }
}

function initialData(kind: string): GameData {
  switch (kind) {
    case 'feud': {
      const n = FEUD_QUESTIONS.length
      return {
        // Classic multipliers: the last few questions are worth double, the final one triple.
        questions: FEUD_QUESTIONS.map((q, i) => feudQuestion(q, i === n - 1 ? 3 : i >= n - 4 ? 2 : 1)),
        cursor: 0,
        shown: false,
        revealed: [],
        strikes: 0,
        control: null,
        awards: {},
        flash: null,
      }
    }
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

export const STORAGE_KEY = EVENT === 'trailer' ? 'trailer-v3' : 'cabin-cup-v3'

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
      version: EVENT === 'trailer' ? 5 : 3,
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
        if (EVENT === 'trailer' && from < 4 && st?.games) {
          // New games (Family Feud) get fresh state; everything already set up is kept.
          const fresh = freshGames()
          for (let i = st.games.length; i < fresh.length; i++) st.games.push(fresh[i])
          // Two teams now: fold anyone on the old third team into the smaller of A and B.
          const c = st.teams?.C
          if (c?.members?.length) {
            for (const id of c.members) {
              const t = st.teams.A.members.length <= st.teams.B.members.length ? 'A' : 'B'
              st.teams[t].members.push(id)
            }
            c.members = []
            c.captain = null
          }
        }
        if (EVENT === 'trailer' && from < 5 && st?.games) {
          // New harder English songs join the list; every round becomes a Bollywood + English mix.
          // Links, start times and blocked flags the host already has are kept.
          const i = GAMES.findIndex((g) => g.kind === 'tune')
          const d = st.games[i]?.data as TuneData | undefined
          if (d?.songs) {
            const have = new Set(d.songs.map((x) => x.title))
            SONGS.forEach((x) => !have.has(x.title) && d.songs.push({ ...x }))
            d.songs.forEach((x) => {
              const base = SONGS.find((y) => y.title === x.title)
              if (base?.hard) x.hard = true
            })
            d.setlist = makeSetlist(d.songs)
            d.round = 0
            d.pos = 0
            d.revealed = false
            d.playId = null
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
