import { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'motion/react'
import { ArrowRight, Shuffle, Star, UserPlus, X, Tv, ArrowDownToLine, Copy } from 'lucide-react'
import { EVENT } from '@/lib/event'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { useStore, TEAM_IDS, COLORS, type ColorKey, type TeamId } from '@/lib/store'
import { addPlayers, removePlayer, shuffleTeams, movePlayer, swapPlayers, assignUnplaced, setView } from '@/lib/actions'
import { cn } from '@/lib/utils'
import { Section } from './common'

export function TeamsPage({ onNext }: { onNext: () => void }) {
  const players = useStore((s) => s.players)
  const teams = useStore((s) => s.teams)
  const set = useStore((s) => s.set)
  const [raw, setRaw] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const byId = Object.fromEntries(players.map((p) => [p.id, p]))
  const placed = new Set(TEAM_IDS.flatMap((t) => teams[t].members))
  const unplaced = players.filter((p) => !placed.has(p.id))
  const sizes = TEAM_IDS.map((t) => teams[t].members.length)
  const balanced = Math.max(...sizes) - Math.min(...sizes) <= 1

  const importCabin = () => {
    try {
      const raw = localStorage.getItem('cabin-cup-v3')
      const st = raw ? JSON.parse(raw).state : null
      if (!st?.players?.length) return alert('No Cabin Cup roster found in this browser.')
      if (players.length && !confirm('Replace this roster and these teams with the Cabin Cup ones?')) return
      set((s) => {
        s.players = st.players
        TEAM_IDS.forEach((t) => {
          s.teams[t] = { ...s.teams[t], ...st.teams[t] }
        })
      })
    } catch {
      alert('Could not read the Cabin Cup roster.')
    }
  }

  const onPlayerClick = (id: string) => {
    if (!selected) return setSelected(id)
    if (selected === id) return setSelected(null)
    swapPlayers(selected, id)
    setSelected(null)
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-[34px] font-bold tracking-[-0.03em]">Roster &amp; teams</h1>
        <p className="mt-1 text-sm text-sand">
          Add everyone, shuffle into three teams, then fine-tune. Tap two players on different teams to swap them.
        </p>
      </div>

      <Section
        title={`Roster · ${players.length}`}
        hint="Paste names separated by new lines or commas."
        action={
          EVENT === 'trailer' ? (
            <Button size="sm" variant="ghost" onClick={importCabin}>
              <Copy /> Copy roster &amp; teams from Cabin Cup
            </Button>
          ) : undefined
        }
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Textarea
            rows={3}
            value={raw}
            placeholder=""
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                addPlayers(raw)
                setRaw('')
              }
            }}
          />
          <Button
            className="h-auto"
            variant="primary"
            disabled={!raw.trim()}
            onClick={() => {
              addPlayers(raw)
              setRaw('')
            }}
          >
            <UserPlus /> Add
          </Button>
        </div>
        {unplaced.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] text-sand">Not on a team yet · {unplaced.length}</span>
              {placed.size > 0 && (
                <Button size="sm" variant="ghost" onClick={assignUnplaced}>
                  <ArrowDownToLine /> Add to smallest teams
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {unplaced.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-line bg-ink pl-3 pr-1 text-[13px]"
                >
                  {p.name}
                  <button
                    className="press rounded-full p-1 text-dust hover:text-bad"
                    aria-label={`Remove ${p.name}`}
                    onClick={() => removePlayer(p.id)}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Button variant="primary" size="lg" disabled={players.length < 3} onClick={shuffleTeams}>
            <Shuffle /> {placed.size ? 'Re-shuffle teams' : 'Shuffle into 3 teams'}
          </Button>
          <span className="text-[13px] text-dust">
            {players.length === 24
              ? '24 players → three teams of 8.'
              : players.length
                ? `${players.length} players → teams of ${sizes.join(' / ')}.`
                : 'Add players to begin.'}
          </span>
        </div>
      </Section>

      <LayoutGroup>
        <div className="grid gap-4 md:grid-cols-3">
          {TEAM_IDS.map((t) => (
            <TeamColumn
              key={t}
              t={t}
              selected={selected}
              onPlayerClick={onPlayerClick}
              onMoveHere={() => {
                if (selected) movePlayer(selected, t)
                setSelected(null)
              }}
              byId={byId}
              setName={(name) => set((s) => void (s.teams[t].name = name))}
              setColor={(c) => set((s) => void (s.teams[t].color = c))}
              setCaptain={(id) =>
                set((s) => void (s.teams[t].captain = s.teams[t].captain === id ? null : id))
              }
            />
          ))}
        </div>
      </LayoutGroup>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={cn('text-[13px]', balanced ? 'text-dust' : 'text-warn')}>
          {balanced ? 'Teams are balanced.' : `Teams are uneven (${sizes.join(' / ')}). Match player counts for timed games.`}
        </span>
        <div className="flex gap-2">
          <Button disabled={!placed.size} onClick={() => setView('teams')}>
            <Tv /> Reveal teams on TV
          </Button>
          <Button variant="primary" size="lg" onClick={onNext}>
            Start Game 1 <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

function TeamColumn({
  t,
  selected,
  onPlayerClick,
  onMoveHere,
  byId,
  setName,
  setColor,
  setCaptain,
}: {
  t: TeamId
  selected: string | null
  onPlayerClick: (id: string) => void
  onMoveHere: () => void
  byId: Record<string, { id: string; name: string }>
  setName: (n: string) => void
  setColor: (c: ColorKey) => void
  setCaptain: (id: string) => void
}) {
  const team = useStore((s) => s.teams[t])
  const teams = useStore((s) => s.teams)
  const hex = COLORS[team.color].hex
  const canMove = selected && !team.members.includes(selected)
  const taken = new Set(TEAM_IDS.filter((x) => x !== t).map((x) => teams[x].color))
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-panel p-4">
      <div className="flex items-center gap-2">
        <span className="size-3 shrink-0 rounded-full" style={{ background: hex }} />
        <Input
          value={team.name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 border-transparent bg-transparent px-1.5 font-display text-lg font-semibold tracking-[-0.015em] hover:border-line"
          aria-label="Team name"
        />
        <span className="font-mono text-xs text-dust">{team.members.length}</span>
      </div>
      <div className="mt-2 flex gap-1.5 pl-5">
        {(Object.keys(COLORS) as ColorKey[]).map((c) => (
          <button
            key={c}
            disabled={taken.has(c)}
            onClick={() => setColor(c)}
            aria-label={COLORS[c].label}
            className={cn(
              'press size-5 rounded-full disabled:opacity-20',
              team.color === c && 'ring-2 ring-cream ring-offset-2 ring-offset-panel',
            )}
            style={{ background: COLORS[c].hex }}
          />
        ))}
      </div>
      <ul className="mt-4 grid gap-1">
        <AnimatePresence initial={false}>
          {team.members.map((id) => {
            const p = byId[id]
            if (!p) return null
            const isSel = selected === id
            const isCap = team.captain === id
            return (
              <motion.li
                key={id}
                layout
                layoutId={id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  'group flex items-center justify-between rounded-[9px] border px-2.5 py-1.5 text-[14px]',
                  isSel ? 'border-cream bg-raised' : 'border-transparent hover:bg-raised',
                )}
              >
                <button className="flex-1 text-left" onClick={() => onPlayerClick(id)}>
                  {p.name}
                  {isCap && <span className="ml-2 text-[11px] text-warn">captain</span>}
                </button>
                <span className="flex items-center gap-0.5">
                  <button
                    className={cn(
                      'press rounded p-1',
                      isCap ? 'text-warn' : 'text-dust opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                    )}
                    aria-label={isCap ? 'Remove captain' : 'Make captain'}
                    onClick={() => setCaptain(id)}
                  >
                    <Star className="size-3.5" fill={isCap ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    className="press rounded p-1 text-dust opacity-0 hover:text-bad group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`Remove ${p.name}`}
                    onClick={() => removePlayer(id)}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
      {team.members.length === 0 && <p className="py-6 text-center text-[13px] text-dust">No players yet</p>}
      {canMove && (
        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onMoveHere}>
          Move {byId[selected!]?.name} here
        </Button>
      )}
    </div>
  )
}
