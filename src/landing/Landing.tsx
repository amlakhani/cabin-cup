import { useRef } from 'react'
import { motion } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowDown, MonitorPlay, SlidersHorizontal, Swords, Clock } from 'lucide-react'
import { GAMES } from '@/lib/games'
import { useStore } from '@/lib/store'
import { EmberField } from '@/components/fx/ember-field'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const ease = [0.23, 1, 0.32, 1] as const

export default function Landing() {
  const settings = useStore((s) => s.settings)
  const words = settings.title.split(' ')
  return (
    <div className="bg-night text-cream">
      {/* hero */}
      <section className="relative flex min-h-[92dvh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        <EmberField density={50} className="opacity-60" />
        <div className="relative text-sm text-sand sm:text-base">{settings.subtitle}</div>
        <h1 className="relative mt-3 font-display text-[clamp(4rem,14vw,11rem)] font-extrabold leading-[0.88] tracking-[-0.04em]">
          {words.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <motion.span
                className="inline-block"
                initial={{ y: '105%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.4, ease, delay: 0.05 + i * 0.08 }}
              >
                {w}
                {i < words.length - 1 && ' '}
              </motion.span>
            </span>
          ))}
        </h1>
        <p className="relative mt-6 max-w-[36rem] text-[17px] leading-relaxed text-sand">
          Ten games, three teams of eight, one cup. Here are the rules so nobody can say they didn&rsquo;t know.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <a href="#games" className={cn(buttonVariants({ variant: 'primary', size: 'lg' }))}>
            Read the rules <ArrowDown />
          </a>
          <a href="/host" className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }))}>
            <SlidersHorizontal /> Host controls
          </a>
          <a href="/show" className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }))}>
            <MonitorPlay /> TV screen
          </a>
        </div>
      </section>

      <ScoringStrip points={settings.points} />
      <GameRail />

      <footer className="border-t border-line px-6 py-10 text-center text-sm text-dust">
        {settings.title} · {[settings.place, settings.date].filter(Boolean).join(' · ')}
      </footer>
    </div>
  )
}

function ScoringStrip({ points }: { points: [number, number, number] }) {
  return (
    <section className="mx-auto grid max-w-[1100px] gap-10 px-6 py-20 md:grid-cols-[1fr_1.2fr] md:items-center">
      <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-bold leading-[0.98] tracking-[-0.03em]">
        Every game pays out to all three teams.
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {['1st', '2nd', '3rd'].map((p, i) => (
          <div key={p} className="rounded-[14px] border border-line bg-panel px-5 py-5">
            <div className="text-sm text-dust">{p} place</div>
            <div className="mt-1 font-display text-[44px] font-bold leading-none tracking-[-0.03em]">{points[i]}</div>
            <div className="text-sm text-sand">points</div>
          </div>
        ))}
        <p className="col-span-3 mt-2 text-[15px] leading-relaxed text-sand">
          Ties get settled on the spot with each game&rsquo;s tiebreaker. Most points after ten games takes the cup. If
          points are level at the end, the team with more game wins takes it.
        </p>
      </div>
    </section>
  )
}

/* The one scroll-linked scene: a pinned horizontal rail through all ten games. */
function GameRail() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const el = track.current!
        const distance = () => el.scrollWidth - window.innerWidth + 48
        gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`
            },
          },
        })
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="games" ref={root} className="relative overflow-hidden border-t border-line">
      <div className="flex min-h-dvh flex-col justify-center py-16">
        <div className="mx-auto mb-10 flex w-full max-w-[1100px] items-end justify-between gap-6 px-6">
          <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-bold tracking-[-0.03em]">The ten games</h2>
          <div className="hidden h-1 w-48 overflow-hidden rounded-full bg-cream/10 min-[900px]:block">
            <div ref={bar} className="h-full origin-left scale-x-0 rounded-full bg-cream" />
          </div>
        </div>
        <div
          ref={track}
          className="flex flex-col gap-5 px-6 min-[900px]:w-max min-[900px]:flex-row min-[900px]:pl-[max(24px,calc((100vw-1100px)/2+24px))] min-[900px]:pr-12"
        >
          {GAMES.map((g) => (
            <article
              key={g.id}
              className="flex flex-col rounded-[16px] border border-line bg-panel p-7 min-[900px]:h-[min(68vh,620px)] min-[900px]:w-[440px]"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[64px] font-black leading-[0.8] tracking-[-0.05em] text-cream/15">
                  {g.number}
                </span>
                <span className="text-[13px] text-dust">{g.skills.join(' + ')}</span>
              </div>
              <h3 className="mt-5 font-display text-[28px] font-bold leading-[1.02] tracking-[-0.025em]">{g.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-cream/90">{g.objective}</p>
              <ol className="mt-5 grid gap-2.5 text-[14px] leading-relaxed text-sand">
                {g.howTo.map((s, i) => (
                  <li key={i} className="grid grid-cols-[20px_1fr] gap-2">
                    <span className="font-mono text-[12px] leading-[1.6] text-dust">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <div className="mt-auto grid gap-2 pt-6 text-[13px]">
                <div className="flex items-center gap-2 text-sand">
                  <Clock className="size-4 text-dust" /> {g.format}
                </div>
                <div className="flex items-start gap-2 text-sand">
                  <Swords className="mt-0.5 size-4 shrink-0 text-warn" /> {g.tiebreak}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
