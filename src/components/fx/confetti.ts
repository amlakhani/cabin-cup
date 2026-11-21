import confetti from 'canvas-confetti'

export function celebrate(colors: string[], big = false) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const base = { colors, disableForReducedMotion: true, ticks: 220, scalar: 1.1 }
  if (!big) {
    confetti({ ...base, particleCount: 60, spread: 70, startVelocity: 38, origin: { y: 0.7 } })
    return
  }
  const end = Date.now() + 1400
  const frame = () => {
    confetti({ ...base, particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } })
    confetti({ ...base, particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
