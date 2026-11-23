import { GAMES } from './games'
import { computeSheet, placementFromOrder, rank } from './scoring'
import {
  useStore,
  shuffle,
  uid,
  freshGames,
  TEAM_IDS,
  type AppState,
  type GameData,
  type Placement,
  type ShowView,
  type TeamId,
} from './store'

const S = () => useStore.getState()

export function setView(view: ShowView) {
  S().set((s) => {
    s.view = view
    if (view === 'result') s.revealStep = 0
  })
}

export function goToGame(i: number) {
  S().set((s) => {
    s.current = Math.max(0, Math.min(GAMES.length - 1, i))
    s.view = 'rules'
    s.timer = null
  })
}

export function updateGame<T extends GameData>(i: number, fn: (d: T, s: AppState) => void) {
  S().set((s) => {
    fn(s.games[i].data as T, s)
  })
}

export function setTiebreak(i: number, on: boolean) {
  S().set((s) => {
    s.games[i].tiebreak = on
  })
}

export function resolveTie(i: number, ordered: TeamId[]) {
  S().set((s) => {
    const g = s.games[i]
    const rest = g.tieOrder.filter((t) => !ordered.includes(t))
    g.tieOrder = [...ordered, ...rest]
    g.tiebreak = false
  })
}

export function clearTies(i: number) {
  S().set((s) => {
    s.games[i].tieOrder = []
  })
}

export function setOverride(i: number, p: Placement | null) {
  S().set((s) => {
    s.games[i].override = p
  })
}

export function finalPlacement(i: number, s: AppState = S()) {
  const g = s.games[i]
  const sheet = computeSheet(i, g)
  const r = rank(sheet, g.tieOrder)
  if (g.override) return { placement: g.override, sheet, ranking: r, ready: true, reason: '' }
  if (!sheet.complete)
    return { placement: null, sheet, ranking: r, ready: false, reason: 'Enter every team’s result first.' }
  if (r.ties.length)
    return { placement: null, sheet, ranking: r, ready: false, reason: 'Settle the tie to lock results.' }
  return { placement: placementFromOrder(r.order), sheet, ranking: r, ready: true, reason: '' }
}

export function lockResults(i: number) {
  const st = S()
  const f = finalPlacement(i, st)
  if (!f.placement) return
  const pts = st.settings.points
  st.set((s) => {
    const points = {} as Record<TeamId, number>
    TEAM_IDS.forEach((t) => (points[t] = pts[f.placement![t] - 1]))
    const scores: Partial<Record<TeamId, number>> = {}
    TEAM_IDS.forEach((t) => {
      const v = f.sheet.scores[t]
      if (v != null) scores[t] = v
    })
    s.games[i].result = { placement: f.placement!, points, scores, lockedAt: Date.now() }
    s.games[i].tiebreak = false
    s.timer = null
    s.view = 'result'
    s.revealStep = 0
  })
}

export function unlockResults(i: number) {
  S().set((s) => {
    s.games[i].result = null
    if (s.view === 'result') s.view = 'play'
  })
}

export function resetGame(i: number) {
  S().set((s) => {
    s.games[i] = freshGames()[i]
    s.timer = null
  })
}

/* ---------- roster ---------- */
export function addPlayers(raw: string) {
  const names = raw
    .split(/[\n,]+/)
    .map((n) => n.trim())
    .filter(Boolean)
  if (!names.length) return 0
  S().set((s) => {
    const existing = new Set(s.players.map((p) => p.name.toLowerCase()))
    for (const name of names) {
      if (existing.has(name.toLowerCase())) continue
      existing.add(name.toLowerCase())
      s.players.push({ id: uid(), name })
    }
  })
  return names.length
}

export function removePlayer(id: string) {
  S().set((s) => {
    s.players = s.players.filter((p) => p.id !== id)
    TEAM_IDS.forEach((t) => {
      s.teams[t].members = s.teams[t].members.filter((m) => m !== id)
      if (s.teams[t].captain === id) s.teams[t].captain = null
    })
  })
}

export function shuffleTeams() {
  S().set((s) => {
    const ids = shuffle(s.players.map((p) => p.id))
    TEAM_IDS.forEach((t) => {
      s.teams[t].members = []
      s.teams[t].captain = null
    })
    // Rotate the starting team so leftover players don't always land on A.
    const n = TEAM_IDS.length
    const start = Math.floor(Math.random() * n)
    ids.forEach((id, i) => s.teams[TEAM_IDS[(i + start) % n]].members.push(id))
  })
}

export function assignUnplaced() {
  S().set((s) => {
    const placed = new Set(TEAM_IDS.flatMap((t) => s.teams[t].members))
    for (const p of s.players) {
      if (placed.has(p.id)) continue
      const t = [...TEAM_IDS].sort((a, b) => s.teams[a].members.length - s.teams[b].members.length)[0]
      s.teams[t].members.push(p.id)
    }
  })
}

export function movePlayer(id: string, to: TeamId) {
  S().set((s) => {
    TEAM_IDS.forEach((t) => {
      s.teams[t].members = s.teams[t].members.filter((m) => m !== id)
      if (s.teams[t].captain === id && t !== to) s.teams[t].captain = null
    })
    s.teams[to].members.push(id)
  })
}

export function swapPlayers(a: string, b: string) {
  S().set((s) => {
    const ta = TEAM_IDS.find((t) => s.teams[t].members.includes(a))
    const tb = TEAM_IDS.find((t) => s.teams[t].members.includes(b))
    if (!ta || !tb || ta === tb) return
    s.teams[ta].members = s.teams[ta].members.map((m) => (m === a ? b : m))
    s.teams[tb].members = s.teams[tb].members.map((m) => (m === b ? a : m))
    if (s.teams[ta].captain === a) s.teams[ta].captain = null
    if (s.teams[tb].captain === b) s.teams[tb].captain = null
  })
}
