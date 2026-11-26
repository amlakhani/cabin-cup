import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { EVENT } from './event'
import { SONGS, type Song } from './songs'
import { PICTURE_COUNT, PICTURE_LEVELS } from '../show/pictures'
import {
  PICTIONARY_WORDS,
  GAMES,
  DEFAULT_CHARADES_PROMPTS,
  DEFAULT_LINEUP_CATEGORIES,
} from './games'

export type TeamId = 'A' | 'B' | 'C'
// The Thanksgiving Trailer plays with two teams; the Cabin Cup with three.
export const TEAM_IDS: TeamId[] = EVENT === 'trailer' ? ['A', 'B'] : ['A', 'B', 'C']
export const CABIN_TEAM_NAMES: Record<TeamId, string> = {
  A: 'Team Dabeli Dominators',
  B: 'Team Dhokla Destroyers',
  C: 'Team Thepla Travellers',
}
/** A team's display name: what the host typed, or "Team 1/2/3" if it's still blank. */
export function teamName(teams: Record<TeamId, { name: string }>, t: TeamId) {
  return teams[t]?.name?.trim() || `Team ${{ A: 1, B: 2, C: 3 }[t]}`
}
/** Short form for tight spots: drops a leading "Team " from typed names (keeps "Team 1"). */
export function shortTeamName(teams: Record<TeamId, { name: string }>, t: TeamId) {
  const n = teamName(teams, t)
  return /^Team \d$/.test(n) ? n : n.replace(/^Team /, '')
}
/** Desi Chaat turns a team needs: a set number, or one per team member. */
export function chaatNeed(d: { rounds: number }, teams: Record<TeamId, { members: string[] }>, t: TeamId) {
  return d.rounds > 0 ? d.rounds : Math.max(1, teams[t]?.members?.length ?? 1)
}
/** Who gives clues on a team's next Desi Chaat turn (team members in order). */
export function chaatNextGiver(d: { turns: Record<TeamId, number> }, teams: Record<TeamId, { members: string[] }>, players: { id: string; name: string }[], t: TeamId) {
  const m = teams[t]?.members ?? []
  if (!m.length) return null
  return players.find((p) => p.id === m[d.turns[t] % m.length])?.name ?? null
}
/** Pictionary relay order: the drawer now and the next ones, from the team roster in order. */
export function pictDrawers(
  d: { drawer?: Record<TeamId, number> },
  teams: Record<TeamId, { members: string[] }>,
  players: { id: string; name: string }[],
  t: TeamId,
  n = 3,
): string[] {
  const m = teams[t]?.members ?? []
  if (!m.length) return []
  const at = d.drawer?.[t] ?? 0
  return Array.from({ length: Math.min(n, m.length) }, (_, k) => players.find((p) => p.id === m[(at + k) % m.length])?.name ?? '')
}
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
  /** team: who scored (null = skipped); turn: which turn it happened in */
  log: { team: TeamId | null; word: string; turn?: number; steal?: boolean }[]
  /** one-team-at-a-time: */
  up?: TeamId
  turn?: number // turns started so far (0-based id of the current turn)
  turns?: Record<TeamId, number> // finished turns per team
  rounds?: number // turns per team
  /** how many drawers each team has used so far (who's next in the relay) */
  drawer?: Record<TeamId, number>
}
export interface B2BData {
  rounds: number
  round: number
  /** which team's turn inside the round (0 = first team up, 1 = second) */
  turn?: number
  /** picture for each turn: pics[round * 2 + turn] */
  pics: number[]
  revealed: boolean
  scores: Record<TeamId, (number | null)[]>
}

export interface ChaatData {
  scores: Record<TeamId, number>
  turns: Record<TeamId, number> // turns banked per team
  up: TeamId // team giving clues next
  rounds: number // turns per team; 0 = everyone on the team gets one turn
  turnSec: number
  skips: number // skips allowed per turn; -1 = unlimited
  log: { team: TeamId; pts: number }[]
  /** private relay channel the phone posts to */
  room?: string
  /** changes on every reset, so phones opened from an older QR code start from zero */
  epoch?: string
  /** phone turns already added (ids), so replays never double-count */
  applied?: string[]
  /** turn keys already finished */
  banked?: string[]
  /** the turn happening on the phone right now */
  live?: ChaatLive | null
}
export interface ChaatLive {
  turn: string
  team: TeamId
  got: number
  buzz: number
  skip: number
  secs: number
  endsAt: number
  paused: boolean
  leftMs: number
  ended: boolean
  seq?: number // last phone event applied, so late duplicates are ignored
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
  | ChaatData
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

/** Team up for a turn: the first team alternates each round so nobody always goes first. */
export const b2bTeam = (round: number, turn: number): TeamId => TEAM_IDS[(round + turn) % TEAM_IDS.length]

/** Two pictures per round (one per team) at the same difficulty, getting harder each round. */
export function b2bPics(rounds = 4, keep: number[] = []): number[] {
  const used = new Set<number>()
  const out: number[] = []
  const levelFor = (r: number) => (r === 0 ? 1 : r === rounds - 1 ? 3 : 2)
  for (let r = 0; r < rounds; r++) {
    for (let t = 0; t < 2; t++) {
      const k = keep[r * 2 + t]
      if (k != null && !used.has(k)) {
        out.push(k)
        used.add(k)
        continue
      }
      // Match the other turn's level if it was kept; otherwise use the round's level.
      const level = out[r * 2] != null && t === 1 ? PICTURE_LEVELS[out[r * 2]] : levelFor(r)
      const pool = shuffle([...Array(PICTURE_COUNT).keys()].filter((i) => !used.has(i) && PICTURE_LEVELS[i] === level))
      const any = shuffle([...Array(PICTURE_COUNT).keys()].filter((i) => !used.has(i)))
      const p = pool[0] ?? any[0]
      out.push(p)
      used.add(p)
    }
  }
  // Spares after the turns, so nothing indexes past the end.
  shuffle([...Array(PICTURE_COUNT).keys()].filter((i) => !used.has(i))).forEach((i) => out.push(i))
  return out
}

/** Play order: each round's songs in a random order (the song list itself stays as added). */
export function makeSetlist(songs: Song[]): number[][] {
  const rounds: number[][] = [[], [], []]
  songs.forEach((s, i) => {
    if (!s.videoId) return
    rounds[Math.min(2, Math.max(0, s.round ?? 0))].push(i)
  })
  return rounds.map((r) => shuffle(r))
}

/* The host's song list also lives in its own saved copy, so no reset can ever drop it. */
// Spelled out (not built from STORAGE_KEY) because the first state is made before that's defined.
const songsKey = () => (EVENT === 'trailer' ? 'trailer-v3-songs' : 'cabin-cup-v3-songs')
export function loadSongLibrary(): Song[] {
  try {
    const v = JSON.parse(localStorage.getItem(songsKey()) || '[]')
    return Array.isArray(v) ? v.filter((x) => x && x.title && x.videoId) : []
  } catch {
    return []
  }
}
export function saveSongLibrary(songs: Song[]) {
  try {
    localStorage.setItem(songsKey(), JSON.stringify(songs.filter((x) => x.videoId)))
  } catch {
    /* storage blocked */
  }
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
    case 'chaat':
      return {
        scores: { A: 0, B: 0, C: 0 },
        turns: { A: 0, B: 0, C: 0 },
        up: 'A',
        rounds: 0,
        turnSec: 60,
        skips: 3,
        log: [],
        room: uid() + uid(),
        epoch: uid(),
        applied: [],
        banked: [],
        live: null,
      }
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
    case 'tune': {
      const songs = EVENT === 'trailer' ? loadSongLibrary() : SONGS.map((x) => ({ ...x }))
      return {
        songs,
        setlist: makeSetlist(songs),
        round: 0,
        pos: 0,
        clipSec: 10,
        revealed: false,
        playId: null,
        scores: { A: 0, B: 0, C: 0 },
        log: [],
      }
    }
    case 'pictionary':
      return {
        words: [...PICTIONARY_WORDS],
        order: shuffle([...PICTIONARY_WORDS.keys()]),
        cursor: 0,
        round: 0,
        scores: { A: 0, B: 0, C: 0 },
        log: [],
        up: 'A',
        turn: 0,
        turns: { A: 0, B: 0, C: 0 },
        rounds: 1,
      }
    case 'b2b':
      return {
        rounds: 4,
        round: 0,
        turn: 0,
        pics: b2bPics(),
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

/**
 * Fresh scores for a game, keeping what the host set up: Feud questions and answers, songs and their
 * links, Pictionary words, Desi Chaat settings (and its phone link, so old turns never replay).
 */
export function freshKeepingSetup(kind: string, old: GameData | undefined): GameData {
  const fresh = initialData(kind)
  if (!old) return fresh
  switch (kind) {
    case 'tune': {
      const o = old as TuneData
      if (!o.songs) return fresh
      return { ...(fresh as TuneData), songs: o.songs, clipSec: o.clipSec, setlist: makeSetlist(o.songs) }
    }
    case 'feud': {
      const o = old as FeudData
      return o.questions ? { ...(fresh as FeudData), questions: o.questions } : fresh
    }
    case 'pictionary': {
      const o = old as PictionaryData
      if (!o.words) return fresh
      return { ...(fresh as PictionaryData), words: o.words, order: shuffle([...o.words.keys()]), rounds: o.rounds ?? 1 }
    }
    case 'chaat': {
      const o = old as ChaatData
      if (o.turnSec == null) return fresh
      return {
        ...(fresh as ChaatData),
        turnSec: o.turnSec,
        skips: o.skips,
        rounds: o.rounds,
        room: o.room ?? (fresh as ChaatData).room,
        applied: o.applied ?? [],
        banked: o.banked ?? [],
      }
    }
    case 'b2b': {
      const o = old as B2BData
      return o.rounds ? { ...(fresh as B2BData), rounds: o.rounds } : fresh
    }
    case 'charades': {
      const o = old as CharadesData
      return o.prompts ? { ...(fresh as CharadesData), prompts: o.prompts, order: shuffle([...o.prompts.keys()]) } : fresh
    }
    default:
      return fresh
  }
}

const backupKey = () => `${STORAGE_KEY}-backups`
export interface Backup {
  at: number
  raw: string
  why: string
}
/** Copies what's saved in this browser right now (keeps the last 5), so a reset can be undone. */
export function backupNow(why = 'Before reset') {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const list = readBackups().filter((b) => b.raw !== raw)
    list.unshift({ at: Date.now(), raw, why })
    localStorage.setItem(backupKey(), JSON.stringify(list.slice(0, 5)))
  } catch {
    /* storage full or blocked */
  }
}
export function readBackups(): Backup[] {
  try {
    const v = JSON.parse(localStorage.getItem(backupKey()) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
/** Puts a saved copy back and reloads (older copies are upgraded on load). */
export function restoreRaw(raw: string) {
  backupNow('Before restoring')
  localStorage.setItem(STORAGE_KEY, raw)
  location.reload()
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
    // The Cabin Cup keeps its team names; the Thanksgiving Trailer starts blank for the host to name.
    A: { name: EVENT === 'trailer' ? '' : CABIN_TEAM_NAMES.A, color: 'ember', members: [], captain: null },
    B: { name: EVENT === 'trailer' ? '' : CABIN_TEAM_NAMES.B, color: 'marigold', members: [], captain: null },
    C: { name: EVENT === 'trailer' ? '' : CABIN_TEAM_NAMES.C, color: 'meadow', members: [], captain: null },
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
  resetAll: (keepSetup?: boolean) => void
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
      resetAll: (keepSetup = false) => {
        backupNow()
        history.length = 0
        if (keepSetup) {
          // New night, same setup: scores and progress clear; roster, teams, questions and songs stay.
          set((s) => {
            s.games = GAMES.map((g, i) => ({ ...freshGames()[i], data: freshKeepingSetup(g.kind, s.games[i]?.data) }))
            s.current = 0
            s.view = 'welcome'
            s.timer = null
            s.pulse = null
            s.revealStep = 0
          })
          return
        }
        // Even a completely fresh start keeps the host's Name That Tune songs.
        const ti = GAMES.findIndex((g) => g.kind === 'tune')
        const oldTune = useStore.getState().games[ti]?.data
        const games = freshGames()
        if (ti >= 0) games[ti] = { ...games[ti], data: freshKeepingSetup('tune', oldTune) }
        set(() => ({ ...snapshot({ ...initialState, games } as AppState) }))
      },
    })),
    {
      name: STORAGE_KEY,
      version: EVENT === 'trailer' ? 11 : 3,
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
        if (EVENT === 'trailer' && from < 6 && st?.games) {
          // Back-to-Back is now one team at a time: each round's picture becomes the first
          // team's, and the second team gets a new one of the same difficulty. Scores are kept.
          const i = GAMES.findIndex((g) => g.kind === 'b2b')
          const d = st.games[i]?.data as B2BData | undefined
          if (d?.pics) {
            const keep: number[] = []
            for (let r = 0; r < d.rounds; r++) keep[r * 2] = d.pics[r]
            d.pics = b2bPics(d.rounds, keep)
            d.turn = 0
            d.revealed = false
          }
        }
        if (EVENT === 'trailer' && from < 7 && st?.games) {
          // Desi Chaat replaces Pictionary Relay as game 2. Other games' data is kept.
          const i = GAMES.findIndex((g) => g.kind === 'chaat')
          const cur = st.games[i]?.data as unknown as Record<string, unknown> | undefined
          if (i >= 0 && (!cur || !('turnSec' in cur))) st.games[i] = freshGames()[i]
        }
        if (EVENT === 'trailer' && from < 8 && st?.games) {
          // Lineup is now Tune, Pictionary, Desi Chaat, Back-to-Back, Feud. Put each saved game
          // back in its new spot by what it is, so nothing entered so far is lost.
          const kindOf = (g: GameState) => {
            const d = g?.data as unknown as Record<string, unknown>
            if (!d) return null
            if ('setlist' in d) return 'tune'
            if ('words' in d) return 'pictionary'
            if ('turnSec' in d) return 'chaat'
            if ('pics' in d) return 'b2b'
            if ('questions' in d) return 'feud'
            return null
          }
          const oldKind = kindOf(st.games[st.current])
          const fresh = freshGames()
          st.games = GAMES.map((def, i) => st.games.find((g) => kindOf(g) === def.kind) ?? fresh[i])
          const ci = GAMES.findIndex((g) => g.kind === oldKind)
          st.current = ci >= 0 ? ci : 0
        }
        if (EVENT === 'trailer' && from < 9 && st?.teams) {
          // Thanksgiving team names start blank: clear the Cabin Cup defaults if they're still there.
          TEAM_IDS.forEach((t) => {
            if (Object.values(CABIN_TEAM_NAMES).includes(st.teams[t]?.name)) st.teams[t].name = ''
          })
          // Pictionary is now one 5-minute turn per team by default.
          const i = GAMES.findIndex((g) => g.kind === 'pictionary')
          const d = st.games?.[i]?.data as PictionaryData | undefined
          if (d && !d.log?.length) d.rounds = 1
          // Desi Chaat gets a private channel for live scores from the phone.
          const ci = GAMES.findIndex((g) => g.kind === 'chaat')
          const c = st.games?.[ci]?.data as ChaatData | undefined
          if (c && !c.room) {
            c.room = uid() + uid()
            c.applied = []
            c.banked = []
            c.live = null
          }
        }
        if (EVENT === 'trailer' && from < 10 && st?.games) {
          // Desi Chaat: by default everyone on each team gets one turn as clue-giver.
          const ci = GAMES.findIndex((g) => g.kind === 'chaat')
          const c = st.games[ci]?.data as ChaatData | undefined
          if (c && !c.log?.length) c.rounds = 0
        }
        if (EVENT === 'trailer' && from < 11 && st?.games) {
          // Name That Tune: no built-in songs any more; keep only the host's own songs.
          const ti = GAMES.findIndex((g) => g.kind === 'tune')
          const t = st.games[ti]?.data as TuneData | undefined
          if (t?.songs) {
            const mine = t.songs.filter((x) => x.custom && x.videoId)
            const saved = loadSongLibrary()
            t.songs = mine.length ? mine : saved
            t.setlist = makeSetlist(t.songs)
            t.round = 0
            t.pos = 0
            t.revealed = false
            t.playId = null
            saveSongLibrary(t.songs)
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
  // Keep the host's song list in its own saved copy whenever it changes.
  const ti = GAMES.findIndex((g) => g.kind === 'tune')
  let lastSongs: unknown = null
  const mirror = (st: AppState) => {
    if (EVENT !== 'trailer' || ti < 0) return
    const songs = (st.games[ti]?.data as TuneData | undefined)?.songs
    if (songs && songs !== lastSongs) {
      lastSongs = songs
      saveSongLibrary(songs)
    }
  }
  mirror(useStore.getState())
  const unsub = useStore.subscribe((st) => {
    send()
    mirror(st)
  })
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
