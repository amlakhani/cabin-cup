// Adapted from React Bits' Particles background: slow rising embers on a canvas.
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export function EmberField({ className, density = 70, colors = ['#ffb36b', '#ff8a4c', '#ffd79a'] }: {
  className?: string
  density?: number
  colors?: string[]
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; c: string; t: number }
    let ps: P[] = []
    const spawn = (anywhere: boolean): P => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: Math.random() * 1.8 + 0.6,
      vy: -(Math.random() * 0.35 + 0.12),
      vx: (Math.random() - 0.5) * 0.15,
      a: Math.random() * 0.5 + 0.25,
      c: colors[Math.floor(Math.random() * colors.length)],
      t: Math.random() * 1000,
    })
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ps = Array.from({ length: density }, () => spawn(true))
    }
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of ps) {
        p.t += 0.01
        p.x += p.vx + Math.sin(p.t) * 0.12
        p.y += p.vy
        const fade = Math.min(1, p.y / (h * 0.6))
        ctx.globalAlpha = p.a * fade
        ctx.fillStyle = p.c
        ctx.shadowColor = p.c
        ctx.shadowBlur = 8
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
        if (p.y < -10) Object.assign(p, spawn(false))
      }
      raf = requestAnimationFrame(draw)
    }
    resize()
    if (reduce) { draw(); cancelAnimationFrame(raf) } else draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [density, colors])
  return <canvas ref={ref} aria-hidden className={cn('pointer-events-none absolute inset-0 size-full', className)} />
}
