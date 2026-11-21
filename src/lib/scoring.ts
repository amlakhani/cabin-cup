import { GAMES } from './games'
import type {
  AppState,
  CharadesData,
  GameState,
  HeatsData,
  LineupData,
  MatchData,
  MemoryData,
  Placement,
  RelayData,
  TTTData,
  TeamId,
  TotalsData,
} from './store'
import { TEAM_IDS } from './store'

export const DUELS_PER_HEAT = 8

export interface ScoreSheet {
  scores: Record<TeamId, number | null>
  secondary?: Record<TeamId, number>
  complete: boolean
}

export function seriesWins(s: TTTData['series'][number]) {
  const a = s.boards.filter((b) => b === 'a').length
  const b = s.boards.filter((b) => b === 'b').length
  const winner: 'a' | 'b' | null = a >= 2 ? 'a' : b >= 2 ? 'b' : null
  return { a, b, winner }
}

export function computeSheet(index: number, gs: GameState): ScoreSheet {
  const kind = GAMES[index].kind
  const empty = { A: null, B: null, C: null } as Record<TeamId, number | null>
  switch (kind) {
    case 'totals':
    case 'memory-board': {
      const d = gs.data as TotalsData | MemoryData
      const scores = { ...empty }
      TEAM_IDS.forEach((t) => (scores[t] = d.scores[t] ?? null))
      return { scores, complete: TEAM_IDS.every((t) => d.scores[t] != null) }
    }
    case 'heats': {
      const d = gs.data as HeatsData
      const scores = { A: 0, B: 0, C: 0 } as Record<TeamId, number | null>
      d.heats.forEach((h) => {
        if (h.aWins == null) return
        scores[h.a] = (scores[h.a] ?? 0) + h.aWins
        scores[h.b] = (scores[h.b] ?? 0) + (DUELS_PER_HEAT - h.aWins)
      })
      return { scores, complete: d.heats.every((h) => h.aWins != null) }
    }
    case 'tictactoe': {
      const d = gs.data as TTTData
      const scores = { A: 0, B: 0, C: 0 } as Record<TeamId, number | null>
      const diff = { A: 0, B: 0, C: 0 } as Record<TeamId, number>
      d.series.forEach((s) => {
        const w = seriesWins(s)
        diff[s.a] += w.a - w.b
        diff[s.b] += w.b - w.a
        if (w.winner === 'a') scores[s.a] = (scores[s.a] ?? 0) + 1
        if (w.winner === 'b') scores[s.b] = (scores[s.b] ?? 0) + 1
      })
      return {
        scores,
        secondary: diff,
        complete: d.series.every((s) => seriesWins(s).winner),
      }
    }
    case 'lineup': {
      const d = gs.data as LineupData
      const scores = { A: 0, B: 0, C: 0 } as Record<TeamId, number | null>
      d.rounds.forEach((r) => {
        if (r.winner) scores[r.winner] = (scores[r.winner] ?? 0) + 1
      })
      return {
        scores,
        complete: d.rounds.length > 0 && d.rounds.every((r) => r.winner),
      }
    }
    case 'relay': {
      const d = gs.data as RelayData
      const scores = { ...empty }
      d.finishes.forEach((f, i) => (scores[f.team] = 3 - i))
      if (d.finishes.length === 2) {
        const last = TEAM_IDS.find((t) => !d.finishes.some((f) => f.team === t))!
        scores[last] = 1
      }
      return { scores, complete: d.finishes.length >= 2 }
    }
    case 'match': {
      const d = gs.data as MatchData
      const scores = { A: 0, B: 0, C: 0 } as Record<TeamId, number | null>
      Object.values(d.board.matched).forEach((t) => (scores[t] = (scores[t] ?? 0) + 0.5))
      return {
        scores,
        complete: Object.keys(d.board.matched).length >= d.board.deck.length,
      }
    }
    case 'charades': {
      const d = gs.data as CharadesData
      const scores = { A: 0, B: 0, C: 0 } as Record<TeamId, number | null>
      d.turns.forEach((t) => (scores[t.team] = (scores[t.team] ?? 0) + t.correct))
      return { scores, complete: d.active == null && d.turns.every((t) => t.done) }
    }
  }
}

export interface Ranking {
  order: TeamId[]
  ties: TeamId[][] // unresolved groups
  groups: TeamId[][] // all equal-score groups (size>1), resolved or not
}

export function rank(sheet: ScoreSheet, tieOrder: TeamId[]): Ranking {
  const val = (t: TeamId) => sheet.scores[t] ?? -Infinity
  const sec = (t: TeamId) => sheet.secondary?.[t] ?? 0
  const sorted = [...TEAM_IDS].sort((x, y) => val(y) - val(x) || sec(y) - sec(x))
  const groups: TeamId[][] = []
  for (const t of sorted) {
    const g = groups[groups.length - 1]
    if (g && val(g[0]) === val(t) && sec(g[0]) === sec(t)) g.push(t)
    else groups.push([t])
  }
  const ties: TeamId[][] = []
  const order: TeamId[] = []
  for (const g of groups) {
    if (g.length === 1) {
      order.push(g[0])
      continue
    }
    const resolved = g.every((t) => tieOrder.includes(t))
    if (resolved) order.push(...[...g].sort((a, b) => tieOrder.indexOf(a) - tieOrder.indexOf(b)))
    else {
      ties.push(g)
      order.push(...g)
    }
  }
  return { order, ties, groups: groups.filter((g) => g.length > 1) }
}

export function placementFromOrder(order: TeamId[]): Placement {
  const p = {} as Placement
  order.forEach((t, i) => (p[t] = (i + 1) as 1 | 2 | 3))
  return p
}

export function standings(s: AppState) {
  const totals = { A: 0, B: 0, C: 0 } as Record<TeamId, number>
  const wins = { A: 0, B: 0, C: 0 } as Record<TeamId, number>
  s.games.forEach((g) => {
    if (!g.result) return
    TEAM_IDS.forEach((t) => {
      totals[t] += g.result!.points[t]
      if (g.result!.placement[t] === 1) wins[t]++
    })
  })
  const order = [...TEAM_IDS].sort((a, b) => totals[b] - totals[a] || wins[b] - wins[a])
  const played = s.games.filter((g) => g.result).length
  return { totals, wins, order, played }
}
