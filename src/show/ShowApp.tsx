import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Maximize } from 'lucide-react'
import { useStore, startShowSync, COLORS } from '@/lib/store'
import { PlayView } from './play'
import { WelcomeView, TeamsView, RulesView, ResultView, StandingsView, ChampionView } from './views'
import { PulseToast, TiebreakBanner, TopBar, useTimerSound, ease } from './parts'

export default function ShowApp() {
  const view = useStore((s) => s.view)
  const current = useStore((s) => s.current)
  const sound = useStore((s) => s.settings.sound)
  const pulse = useStore((s) => s.pulse)
  const teams = useStore((s) => s.teams)
  const [hint, setHint] = useState(true)
  useTimerSound(sound)

  useEffect(() => startShowSync(), [])

  // Scale the whole TV layout with the window: 1rem ≈ 16px at 1780px wide.
  useEffect(() => {
    const el = document.documentElement
    const prev = el.style.fontSize
    el.style.fontSize = 'min(0.9vw, 1.6vh)'
    document.body.style.overflow = 'hidden'
    return () => {
      el.style.fontSize = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
    }
    const hide = () => setHint(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', hide)
    const id = setTimeout(hide, 6000)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', hide)
      clearTimeout(id)
    }
  }, [])

  const fresh = pulse && Date.now() - pulse.id < 2000
  const glow = fresh && pulse?.team ? COLORS[teams[pulse.team].color].hex : null
  const chrome = view !== 'welcome' && view !== 'champion'
  const key = view === 'rules' || view === 'play' || view === 'result' ? `${view}-${current}` : view

  return (
    <div className="grain-glow relative h-dvh w-screen overflow-hidden text-cream" onDoubleClick={toggleFullscreen}>
      {/* team-colored spotlight that breathes in on each score */}
      <AnimatePresence>
        {glow && (
          <motion.div
            key={pulse!.id}
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(55% 40% at 50% 100%, ${glow}30, transparent 70%)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, times: [0, 0.2, 1] }}
          />
        )}
      </AnimatePresence>

      {chrome && <TopBar />}
      <TiebreakBanner index={current} />

      <AnimatePresence mode="wait">
        <motion.main
          key={key}
          className="absolute inset-0 px-16 pb-14"
          style={{ paddingTop: chrome ? '7.5rem' : '3.5rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.25, ease }}
        >
          {view === 'welcome' && <WelcomeView />}
          {view === 'teams' && <TeamsView />}
          {view === 'rules' && <RulesView index={current} />}
          {view === 'play' && <PlayView index={current} />}
          {view === 'result' && <ResultView index={current} />}
          {view === 'standings' && <StandingsView />}
          {view === 'champion' && <ChampionView />}
        </motion.main>
      </AnimatePresence>

      <PulseToast />

      <AnimatePresence>
        {hint && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleFullscreen}
            className="press absolute bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-line bg-panel/90 px-5 py-3 text-[1.1rem] text-sand backdrop-blur"
          >
            <Maximize className="size-5" /> Click to enable sound · F for fullscreen
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen()
  else document.documentElement.requestFullscreen?.().catch(() => {})
}
