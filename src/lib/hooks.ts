import { useEffect, useState } from 'react'
import { useStore, COLORS, teamName, type TeamId } from './store'

export function useNow(active = true, interval = 100) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [active, interval])
  return now
}

export function useTimerRemaining() {
  const timer = useStore((s) => s.timer)
  const now = useNow(!!timer?.running, 100)
  if (!timer) return null
  const remaining = timer.running && timer.endsAt ? Math.max(0, timer.endsAt - now) : timer.remaining
  return { ...timer, remainingMs: remaining, done: remaining <= 0 }
}

export function useTeam(t: TeamId) {
  const team = useStore((s) => s.teams[t])
  return { ...team, name: teamName({ [t]: team } as unknown as Record<TeamId, { name: string }>, t), hex: COLORS[team.color].hex, inkHex: COLORS[team.color].ink }
}

export function useTeamColors() {
  const teams = useStore((s) => s.teams)
  return {
    A: COLORS[teams.A.color].hex,
    B: COLORS[teams.B.color].hex,
    C: COLORS[teams.C.color].hex,
  } as Record<TeamId, string>
}
