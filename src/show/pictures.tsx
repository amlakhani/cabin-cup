/* Simple line pictures for Back-to-Back Drawing. Easy to describe with shapes. */
import type { ReactNode } from 'react'

const S = { fill: 'none', stroke: '#f6efe3', strokeWidth: 4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const PICS: { name: string; level: 1 | 2 | 3; draw: ReactNode }[] = [
  {
    name: 'House with a sun',
    level: 1,
    draw: (
      <>
        <rect x="50" y="70" width="70" height="55" {...S} />
        <path d="M42 72 L85 35 L128 72" {...S} />
        <rect x="76" y="95" width="18" height="30" {...S} />
        <circle cx="160" cy="35" r="15" {...S} />
      </>
    ),
  },
  {
    name: 'Snowman with a hat',
    level: 1,
    draw: (
      <>
        <circle cx="100" cy="108" r="28" {...S} />
        <circle cx="100" cy="62" r="20" {...S} />
        <path d="M80 42 L120 42 M88 42 L88 22 L112 22 L112 42" {...S} />
        <circle cx="93" cy="58" r="2" fill="#f6efe3" />
        <circle cx="107" cy="58" r="2" fill="#f6efe3" />
      </>
    ),
  },
  {
    name: 'Ice cream cone',
    level: 1,
    draw: (
      <>
        <path d="M75 70 L100 135 L125 70 Z" {...S} />
        <circle cx="100" cy="55" r="27" {...S} />
        <circle cx="100" cy="22" r="6" {...S} />
      </>
    ),
  },
  {
    name: 'Fish in a bowl',
    level: 1,
    draw: (
      <>
        <path d="M60 40 Q30 90 70 130 L130 130 Q170 90 140 40" {...S} />
        <path d="M60 40 L140 40" {...S} />
        <ellipse cx="98" cy="92" rx="22" ry="13" {...S} />
        <path d="M120 92 L136 80 L136 104 Z" {...S} />
      </>
    ),
  },
  {
    name: 'Kite with a tail',
    level: 2,
    draw: (
      <>
        <path d="M100 15 L135 60 L100 105 L65 60 Z" {...S} />
        <path d="M100 15 L100 105 M65 60 L135 60" {...S} />
        <path d="M100 105 Q90 120 105 130 Q120 140 100 148" {...S} />
      </>
    ),
  },
  {
    name: 'Rocket and moon',
    level: 2,
    draw: (
      <>
        <path d="M90 120 L90 60 Q100 30 110 60 L110 120 Z" {...S} />
        <path d="M90 100 L75 120 L90 120 M110 100 L125 120 L110 120" {...S} />
        <circle cx="100" cy="75" r="7" {...S} />
        <path d="M155 25 A20 20 0 1 0 170 55 A15 15 0 1 1 155 25 Z" {...S} />
      </>
    ),
  },
  {
    name: 'Cup of chai',
    level: 2,
    draw: (
      <>
        <path d="M60 70 L70 125 L120 125 L130 70 Z" {...S} />
        <path d="M130 82 Q155 85 145 105 Q140 112 124 112" {...S} />
        <path d="M80 55 Q72 45 80 35 M100 55 Q92 45 100 35 M120 55 Q112 45 120 35" {...S} />
        <path d="M45 135 L145 135" {...S} />
      </>
    ),
  },
  {
    name: 'Sailboat on waves',
    level: 2,
    draw: (
      <>
        <path d="M55 105 L145 105 L130 125 L70 125 Z" {...S} />
        <path d="M100 105 L100 25 L140 95 Z" {...S} />
        <path d="M100 35 L68 95 L100 95" {...S} />
        <path d="M20 138 Q35 128 50 138 Q65 148 80 138 Q95 128 110 138 Q125 148 140 138 Q155 128 170 138" {...S} />
      </>
    ),
  },
  {
    name: 'Diya with a flame',
    level: 2,
    draw: (
      <>
        <path d="M45 95 Q100 140 155 95 Z" {...S} />
        <path d="M150 92 L170 85" {...S} />
        <path d="M100 85 Q85 65 100 40 Q115 65 100 85 Z" {...S} />
        <path d="M70 120 L130 120" {...S} />
      </>
    ),
  },
  {
    name: 'Car',
    level: 3,
    draw: (
      <>
        <path d="M30 105 L30 85 L60 82 L80 58 L130 58 L150 82 L172 88 L172 105 Z" {...S} />
        <path d="M85 64 L85 82 M125 64 L125 82 M70 82 L145 82" {...S} />
        <circle cx="62" cy="108" r="14" {...S} />
        <circle cx="142" cy="108" r="14" {...S} />
      </>
    ),
  },
  {
    name: 'Cat face',
    level: 3,
    draw: (
      <>
        <circle cx="100" cy="80" r="45" {...S} />
        <path d="M65 50 L62 18 L90 38 M135 50 L138 18 L110 38" {...S} />
        <circle cx="83" cy="75" r="5" {...S} />
        <circle cx="117" cy="75" r="5" {...S} />
        <path d="M95 92 L105 92 L100 98 Z M100 98 Q92 108 84 102 M100 98 Q108 108 116 102" {...S} />
        <path d="M55 88 L30 82 M55 96 L30 100 M145 88 L170 82 M145 96 L170 100" {...S} />
      </>
    ),
  },
  {
    name: 'Turkey made of circles',
    level: 3,
    draw: (
      <>
        <path d="M100 95 m-50 0 a50 50 0 0 1 100 0" {...S} />
        <path d="M100 95 m-35 0 a35 35 0 0 1 70 0" {...S} />
        <circle cx="100" cy="100" r="25" {...S} />
        <circle cx="100" cy="68" r="13" {...S} />
        <path d="M113 68 L122 72 L113 75" {...S} />
        <path d="M90 125 L86 140 M110 125 L114 140" {...S} />
      </>
    ),
  },
]

export const PICTURE_NAMES = PICS.map((p) => p.name)

export function Picture({ id, className }: { id: number; className?: string }) {
  const p = PICS[id % PICS.length]
  return (
    <svg viewBox="0 0 200 150" className={className} role="img" aria-label={p.name}>
      {p.draw}
    </svg>
  )
}
