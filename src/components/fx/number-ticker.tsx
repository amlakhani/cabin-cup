// Adapted from Magic UI's NumberTicker: spring-driven count with reduced-motion fallback.
import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export function NumberTicker({
  value,
  className,
  decimals = 0,
}: {
  value: number
  className?: string
  decimals?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 90, damping: 22, restDelta: 0.01 })

  useEffect(() => {
    if (reduce) {
      mv.jump(value)
      spring.jump(value)
    } else mv.set(value)
  }, [value, reduce, mv, spring])

  useEffect(
    () =>
      spring.on('change', (v) => {
        if (ref.current) ref.current.textContent = v.toFixed(decimals)
      }),
    [spring, decimals],
  )

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {value.toFixed(decimals)}
    </span>
  )
}
