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
  /* ---- added: easy ---- */
  { name: 'Pine tree', level: 1, draw: (<>
    <path d="M60 110 L100 50 L140 110 Z" {...S} />
    <path d="M70 80 L100 30 L130 80" {...S} />
    <rect x="92" y="110" width="16" height="25" {...S} />
  </>) },
  { name: 'Balloon on a string', level: 1, draw: (<>
    <ellipse cx="100" cy="58" rx="30" ry="38" {...S} />
    <path d="M94 98 L100 92 L106 98 Z" {...S} />
    <path d="M100 98 Q88 115 100 128 Q112 140 100 148" {...S} />
  </>) },
  { name: 'Umbrella', level: 1, draw: (<>
    <path d="M45 80 Q100 15 155 80 Q141 70 127 80 Q114 70 100 80 Q86 70 73 80 Q59 70 45 80 Z" {...S} />
    <path d="M100 80 L100 125 Q100 138 88 135" {...S} />
    <path d="M100 37 L100 30" {...S} />
  </>) },
  { name: 'Apple with a leaf', level: 1, draw: (<>
    <path d="M100 52 C72 36 46 60 56 96 C63 124 86 136 100 126 C114 136 137 124 144 96 C154 60 128 36 100 52 Z" {...S} />
    <path d="M100 52 Q102 38 108 28" {...S} />
    <path d="M105 40 Q122 26 132 36 Q117 48 105 40 Z" {...S} />
  </>) },
  { name: 'Flower', level: 1, draw: (<>
    <circle cx="100" cy="55" r="11" {...S} />
    <circle cx="100" cy="30" r="14" {...S} />
    <circle cx="124" cy="48" r="14" {...S} />
    <circle cx="115" cy="76" r="14" {...S} />
    <circle cx="85" cy="76" r="14" {...S} />
    <circle cx="76" cy="48" r="14" {...S} />
    <path d="M100 90 L100 145" {...S} />
    <path d="M100 120 Q118 104 130 110 Q116 126 100 120 Z" {...S} />
  </>) },
  { name: 'Pizza slice', level: 1, draw: (<>
    <path d="M60 42 L140 42 L100 135 Z" {...S} />
    <path d="M58 42 Q100 22 142 42" {...S} />
    <circle cx="90" cy="60" r="7" {...S} />
    <circle cx="113" cy="62" r="6" {...S} />
    <circle cx="100" cy="88" r="7" {...S} />
  </>) },
  { name: 'Cupcake with a cherry', level: 1, draw: (<>
    <path d="M70 85 L80 135 L120 135 L130 85 Z" {...S} />
    <path d="M90 85 L93 135 M110 85 L107 135" {...S} />
    <path d="M65 85 Q58 62 82 60 Q88 42 108 45 Q136 48 135 85 Z" {...S} />
    <circle cx="102" cy="34" r="7" {...S} />
  </>) },
  { name: 'Envelope', level: 1, draw: (<>
    <rect x="45" y="40" width="110" height="75" {...S} />
    <path d="M45 40 L100 85 L155 40" {...S} />
    <path d="M45 115 L86 76 M155 115 L114 76" {...S} />
  </>) },

  /* ---- added: medium ---- */
  { name: 'Mountains and sun', level: 2, draw: (<>
    <path d="M20 130 L70 55 L105 105 L135 65 L180 130 Z" {...S} />
    <path d="M58 73 L70 55 L82 73" {...S} />
    <circle cx="152" cy="34" r="14" {...S} />
    <path d="M28 36 Q35 30 42 36 Q49 30 56 36" {...S} />
  </>) },
  { name: 'Hot air balloon', level: 2, draw: (<>
    <path d="M100 15 C55 15 50 70 86 96 L114 96 C150 70 145 15 100 15 Z" {...S} />
    <path d="M100 15 Q78 55 92 96 M100 15 Q122 55 108 96" {...S} />
    <path d="M88 96 L90 116 M112 96 L110 116" {...S} />
    <rect x="86" y="116" width="28" height="20" {...S} />
  </>) },
  { name: 'Alarm clock', level: 2, draw: (<>
    <circle cx="100" cy="78" r="45" {...S} />
    <path d="M100 78 L100 50 M100 78 L120 90" {...S} />
    <path d="M100 38 L100 45 M140 78 L133 78 M100 118 L100 111 M60 78 L67 78" {...S} />
    <path d="M62 44 Q58 26 76 28 M138 44 Q142 26 124 28" {...S} />
    <path d="M70 116 L60 132 M130 116 L140 132" {...S} />
  </>) },
  { name: 'Tent under the moon', level: 2, draw: (<>
    <path d="M40 130 L100 48 L160 130 Z" {...S} />
    <path d="M84 130 L100 92 L116 130" {...S} />
    <path d="M20 130 L180 130" {...S} />
    <path d="M160 18 A15 15 0 1 0 174 44 A11 11 0 1 1 160 18 Z" {...S} />
    <path d="M38 28 L38 40 M32 34 L44 34" {...S} />
  </>) },
  { name: 'Jack-o’-lantern', level: 2, draw: (<>
    <ellipse cx="100" cy="92" rx="56" ry="40" {...S} />
    <ellipse cx="100" cy="92" rx="24" ry="40" {...S} />
    <path d="M100 52 L100 36 Q104 30 112 32" {...S} />
    <path d="M74 84 L82 72 L90 84 Z M110 84 L118 72 L126 84 Z" {...S} />
    <path d="M78 104 Q100 118 122 104" {...S} />
  </>) },
  { name: 'Cactus in a pot', level: 2, draw: (<>
    <path d="M72 107 L80 140 L120 140 L128 107" {...S} />
    <rect x="66" y="97" width="68" height="10" {...S} />
    <path d="M90 97 L90 42 Q100 26 110 42 L110 97" {...S} />
    <path d="M90 74 L76 74 Q70 74 70 66 L70 52" {...S} />
    <path d="M110 62 L124 62 Q130 62 130 54 L130 42" {...S} />
  </>) },
  { name: 'Pair of glasses', level: 2, draw: (<>
    <circle cx="70" cy="80" r="24" {...S} />
    <circle cx="130" cy="80" r="24" {...S} />
    <path d="M94 78 Q100 70 106 78" {...S} />
    <path d="M46 74 L24 62 M154 74 L176 62" {...S} />
  </>) },
  { name: 'Present with a bow', level: 2, draw: (<>
    <rect x="55" y="72" width="90" height="63" {...S} />
    <rect x="48" y="56" width="104" height="16" {...S} />
    <path d="M100 56 L100 135" {...S} />
    <path d="M100 56 Q80 30 74 44 Q76 58 100 56 Q120 30 126 44 Q124 58 100 56" {...S} />
  </>) },

  /* ---- added: hard ---- */
  { name: 'Bicycle', level: 3, draw: (<>
    <circle cx="55" cy="105" r="28" {...S} />
    <circle cx="145" cy="105" r="28" {...S} />
    <path d="M55 105 L86 66 L130 66 L145 105 M86 66 L100 105 L130 66 M55 105 L100 105" {...S} />
    <path d="M86 66 L84 56 M76 56 L92 56" {...S} />
    <path d="M130 66 L125 48 L139 45" {...S} />
  </>) },
  { name: 'Robot', level: 3, draw: (<>
    <rect x="75" y="20" width="50" height="40" rx="4" {...S} />
    <circle cx="88" cy="38" r="5" {...S} />
    <circle cx="112" cy="38" r="5" {...S} />
    <path d="M90 50 L110 50 M100 20 L100 10" {...S} />
    <circle cx="100" cy="7" r="3" {...S} />
    <rect x="65" y="65" width="70" height="55" rx="4" {...S} />
    <rect x="85" y="78" width="30" height="20" {...S} />
    <path d="M65 76 L46 100 M135 76 L154 100 M85 120 L85 142 M115 120 L115 142" {...S} />
  </>) },
  { name: 'Owl on a branch', level: 3, draw: (<>
    <ellipse cx="100" cy="85" rx="40" ry="50" {...S} />
    <circle cx="84" cy="66" r="13" {...S} />
    <circle cx="116" cy="66" r="13" {...S} />
    <circle cx="84" cy="66" r="3" fill="#f6efe3" />
    <circle cx="116" cy="66" r="3" fill="#f6efe3" />
    <path d="M95 80 L100 90 L105 80 Z" {...S} />
    <path d="M66 46 L70 26 L84 38 M134 46 L130 26 L116 38" {...S} />
    <path d="M62 88 Q70 114 86 120 M138 88 Q130 114 114 120" {...S} />
    <path d="M40 140 L160 140" {...S} />
  </>) },
  { name: 'Castle with towers', level: 3, draw: (<>
    <rect x="50" y="60" width="100" height="75" {...S} />
    <path d="M50 60 L50 48 L62 48 L62 60 M76 60 L76 48 L88 48 L88 60 M112 60 L112 48 L124 48 L124 60 M138 60 L138 48 L150 48 L150 60" {...S} />
    <path d="M88 135 L88 106 Q100 90 112 106 L112 135" {...S} />
    <rect x="30" y="42" width="20" height="93" {...S} />
    <rect x="150" y="42" width="20" height="93" {...S} />
    <path d="M27 42 L40 20 L53 42 M147 42 L160 20 L173 42" {...S} />
    <path d="M160 20 L160 6 L174 11 L160 16" {...S} />
  </>) },
  { name: 'Teapot', level: 3, draw: (<>
    <ellipse cx="100" cy="92" rx="45" ry="34" {...S} />
    <path d="M74 64 Q100 46 126 64" {...S} />
    <circle cx="100" cy="50" r="5" {...S} />
    <path d="M58 86 Q38 82 30 60 M60 102 Q40 96 30 60" {...S} />
    <path d="M144 76 Q172 80 160 106 Q154 116 140 108" {...S} />
    <path d="M74 124 L126 124" {...S} />
  </>) },
  { name: 'Guitar', level: 3, draw: (<>
    <circle cx="100" cy="112" r="30" {...S} />
    <circle cx="100" cy="74" r="20" {...S} />
    <circle cx="100" cy="102" r="9" {...S} />
    <rect x="94" y="16" width="12" height="40" {...S} />
    <rect x="90" y="4" width="20" height="12" {...S} />
    <path d="M97 16 L97 128 M103 16 L103 128 M88 128 L112 128" {...S} />
  </>) },
  { name: 'Butterfly', level: 3, draw: (<>
    <ellipse cx="100" cy="76" rx="6" ry="30" {...S} />
    <path d="M95 66 Q60 18 44 50 Q40 76 95 76" {...S} />
    <path d="M105 66 Q140 18 156 50 Q160 76 105 76" {...S} />
    <path d="M95 82 Q56 86 60 114 Q74 130 97 96" {...S} />
    <path d="M105 82 Q144 86 140 114 Q126 130 103 96" {...S} />
    <path d="M97 47 Q90 30 82 25 M103 47 Q110 30 118 25" {...S} />
    <circle cx="70" cy="52" r="6" {...S} />
    <circle cx="130" cy="52" r="6" {...S} />
  </>) },
  { name: 'Train engine', level: 3, draw: (<>
    <rect x="110" y="45" width="45" height="60" {...S} />
    <rect x="120" y="55" width="25" height="20" {...S} />
    <rect x="45" y="70" width="65" height="35" {...S} />
    <path d="M60 70 L60 48 L50 36 L80 36 L70 48 L70 70" {...S} />
    <circle cx="65" cy="116" r="12" {...S} />
    <circle cx="100" cy="116" r="12" {...S} />
    <circle cx="140" cy="114" r="15" {...S} />
    <path d="M45 105 L34 116 L45 116" {...S} />
    <circle cx="72" cy="22" r="6" {...S} />
    <circle cx="88" cy="13" r="8" {...S} />
  </>) },
  { name: 'Spider web', level: 3, draw: (<>
    <path d="M100 75 L100 10 M100 75 L156 42 M100 75 L156 108 M100 75 L100 140 M100 75 L44 108 M100 75 L44 42" {...S} />
    <path d="M100 30 L139 52 L139 98 L100 120 L61 98 L61 52 Z" {...S} />
    <path d="M100 52 L120 63 L120 87 L100 98 L80 87 L80 63 Z" {...S} />
    <circle cx="128" cy="92" r="6" {...S} />
    <path d="M128 86 L128 70" {...S} />
  </>) },
]

export const PICTURE_NAMES = PICS.map((p) => p.name)
export const PICTURE_LEVELS = PICS.map((p) => p.level)
export const PICTURE_COUNT = PICS.length

export function Picture({ id, className }: { id: number; className?: string }) {
  const p = PICS[id % PICS.length]
  return (
    <svg viewBox="0 0 200 150" className={className} role="img" aria-label={p.name}>
      {p.draw}
    </svg>
  )
}
