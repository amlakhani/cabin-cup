import { Crown, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, TEAM_IDS } from '@/lib/store'
import { GAMES } from '@/lib/games'
import { standings } from '@/lib/scoring'
import { setView } from '@/lib/actions'
import { ordinal } from '@/lib/utils'
import { Section, TeamName } from './common'

export function StandingsPage() {
  const s = useStore()
  const st = standings(s)
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[34px] font-bold tracking-[-0.03em]">Standings</h1>
          <p className="mt-1 text-sm text-sand">{st.played} of 10 games scored. Ties on points go to the team with more game wins.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setView('standings')}>
            <Trophy /> Standings on TV
          </Button>
          <Button variant="primary" disabled={st.played === 0} onClick={() => setView('champion')}>
            <Crown /> Crown the champion
          </Button>
        </div>
      </div>
      <Section title="By game">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-dust">
                <th className="py-2 pr-4 font-medium">Game</th>
                {TEAM_IDS.map((t) => (
                  <th key={t} className="py-2 pr-4 font-medium">
                    <TeamName t={t} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GAMES.map((g, i) => {
                const r = s.games[i].result
                return (
                  <tr key={g.id} className="border-t border-line">
                    <td className="py-2.5 pr-4 text-sand">
                      <span className="mr-2 font-mono text-xs text-dust">{g.number}</span>
                      {g.short}
                    </td>
                    {TEAM_IDS.map((t) => (
                      <td key={t} className="py-2.5 pr-4 tabular-nums">
                        {r ? (
                          <>
                            <span className="font-semibold">{r.points[t]}</span>
                            <span className="ml-1.5 text-xs text-dust">{ordinal(r.placement[t])}</span>
                          </>
                        ) : (
                          <span className="text-dust">–</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
              <tr className="border-t border-line-strong">
                <td className="py-3 pr-4 font-medium">Total</td>
                {TEAM_IDS.map((t) => (
                  <td key={t} className="py-3 pr-4 font-display text-lg font-bold tabular-nums">
                    {st.totals[t]}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
