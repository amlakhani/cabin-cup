import type { ReactNode } from 'react'
import { useTeamColors } from '@/lib/hooks'
import './scenes.css'

const SKIN = ['#c98e63', '#e8b98f', '#d9a477', '#b97d55']
const HAIR = ['#1c120b', '#3a2414', '#2b1a10', '#24160d']
const INK = '#1c120b'
const TABLE = '#7a5c40'
const TABLE_DARK = '#5b4632'
const CREAM = '#f6efe3'

/** A cartoon player: x,y is the bottom-centre of the body. */
function Person({
  x,
  y,
  shirt,
  skin = 0,
  hair = 0,
  long = false,
  s = 1,
  face,
  className,
  children,
}: {
  x: number
  y: number
  shirt: string
  skin?: number
  hair?: number
  long?: boolean
  s?: number
  face?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <g className={className}>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-28 0 Q-28 -44 0 -46 Q28 -44 28 0Z" fill={shirt} />
      <circle cx="0" cy="-62" r="20" fill={SKIN[skin]} />
      {long ? (
        <path d="M-21 -56 Q-24 -86 0 -84 Q24 -86 21 -56 Q19 -74 0 -75 Q-19 -74 -21 -56Z" fill={HAIR[hair]} />
      ) : (
        <path d="M-20 -66 Q-18 -84 0 -83 Q20 -84 21 -66 Q12 -75 0 -74 Q-12 -75 -20 -66Z" fill={HAIR[hair]} />
      )}
      {face ?? (
        <>
          <circle cx="-7" cy="-62" r="2.5" fill={INK} />
          <circle cx="7" cy="-62" r="2.5" fill={INK} />
          <path d="M-6 -52 Q0 -48 6 -52" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {children}
    </g>
    </g>
  )
}

function Cup({ x, y, color, w = 24, h = 30, face }: { x: number; y: number; color: string; w?: number; h?: number; face?: 'happy' | 'worried' }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M${-w / 2} ${-h} L${w / 2} ${-h} L${w / 2 - 4} 0 L${-w / 2 + 4} 0Z`} fill={color} />
      <rect x={-w / 2 - 2} y={-h - 4} width={w + 4} height="5" rx="2.5" fill={color} opacity="0.75" />
      {face && (
        <>
          <circle cx="-4" cy={-h * 0.55} r="1.8" fill={INK} />
          <circle cx="4" cy={-h * 0.55} r="1.8" fill={INK} />
          {face === 'happy' ? (
            <path d={`M-4 ${-h * 0.3} Q0 ${-h * 0.18} 4 ${-h * 0.3}`} stroke={INK} strokeWidth="1.5" fill="none" />
          ) : (
            <ellipse cx="0" cy={-h * 0.25} rx="2.5" ry="3" fill={INK} />
          )}
        </>
      )}
    </g>
  )
}

function Table({ x = 0, w = 240, y = 112 }: { x?: number; w?: number; y?: number }) {
  return (
    <>
      <rect x={x} y={y} width={w} height="6" rx="3" fill={TABLE} />
      <rect x={x} y={y + 5} width={w} height="5" rx="2" fill={TABLE_DARK} />
    </>
  )
}

/* ---------------- scenes ---------------- */

function Cotton({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  return (
    <>
      <Table />
      <Person
        x={46}
        y={112}
        shirt={c.A}
        className="sc-bob"
        face={
          <>
            <circle cx="0" cy="-62" r="2.5" fill={INK} />
            <circle cx="11" cy="-62" r="2.5" fill={INK} />
            <g className="sc-suck">
              <circle cx="15" cy="-52" r="3.5" fill={INK} />
            </g>
          </>
        }
      />
      <g className="sc-sip">
        <rect x="60" y="58" width="44" height="4" rx="2" fill="#F5C143" transform="rotate(35 60 58)" />
      </g>
      <g className="sc-ballgo">
        <circle cx="94" cy="88" r="6" fill={CREAM} />
      </g>
      <g fill={CREAM}>
        <circle cx="86" cy="106" r="6" />
        <circle cx="100" cy="108" r="5" />
        <circle cx="74" cy="108" r="5" />
        <circle cx="112" cy="107" r="5.5" />
      </g>
      <Cup x={172} y={112} color={c.A} w={42} h={34} />
      <g fill={CREAM}>
        <circle cx="166" cy="80" r="5" />
        <circle cx="178" cy="78" r="6" />
      </g>
    </>
  )
}

function HeadShoulders({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  return (
    <>
      <Table x={40} w={160} />
      <Cup x={120} y={112} color={CREAM} w={22} h={26} />
      <Person
        x={40}
        y={130}
        shirt={c.A}
        face={
          <>
            <circle cx="5" cy="-62" r="2.5" fill={INK} />
            <circle cx="14" cy="-62" r="2.5" fill={INK} />
            <path d="M6 -51 Q11 -48 16 -52" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        }
      >
        <g className="sc-sweat">
          <path d="M-14 -72 Q-17 -66 -14 -63 Q-11 -66 -14 -72Z" fill="#9fd3ff" />
        </g>
      </Person>
      <g className="sc-grabL">
        <path d="M62 94 Q78 84 86 72" stroke={SKIN[0]} strokeWidth="9" fill="none" strokeLinecap="round" />
        <circle cx="87" cy="70" r="7" fill={SKIN[0]} />
      </g>
      <Person
        x={200}
        y={130}
        shirt={c.B}
        skin={1}
        hair={1}
        long
        face={
          <>
            <circle cx="-14" cy="-62" r="2.5" fill={INK} />
            <circle cx="-5" cy="-62" r="2.5" fill={INK} />
            <ellipse cx="-9" cy="-51" rx="3" ry="2.5" fill={INK} />
          </>
        }
      />
      <g className="sc-grabR">
        <path d="M178 94 Q162 84 156 74" stroke={SKIN[1]} strokeWidth="9" fill="none" strokeLinecap="round" />
        <circle cx="155" cy="72" r="7" fill={SKIN[1]} />
      </g>
      <g className="sc-w1">
        <rect x="92" y="8" width="56" height="24" rx="7" fill="#26211a" />
        <text x="120" y="25" textAnchor="middle" fontSize="13" fontWeight="600" fill={CREAM}>
          Head
        </text>
      </g>
      <g className="sc-w2">
        <rect x="92" y="8" width="56" height="24" rx="7" fill="#26211a" />
        <text x="120" y="25" textAnchor="middle" fontSize="13" fontWeight="600" fill={CREAM}>
          Knees
        </text>
      </g>
      <g className="sc-cupcall">
        <rect x="86" y="4" width="68" height="32" rx="9" fill="#F5C143" />
        <text x="120" y="27" textAnchor="middle" fontSize="18" fontWeight="800" fill="#2B1E00">
          CUP!
        </text>
      </g>
    </>
  )
}

function Memorize({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  return (
    <>
      <g className="sc-board">
        <rect x="104" y="10" width="124" height="78" rx="6" fill={CREAM} />
        <circle cx="124" cy="32" r="8" fill="#F2683C" />
        <rect x="142" y="24" width="18" height="16" rx="3" fill="#5AB0F0" />
        <path d="M184 22 L194 40 L174 40Z" fill="#A6D65A" />
        <circle cx="210" cy="32" r="7" fill="#F5C143" />
        <rect x="116" y="54" width="22" height="10" rx="5" fill="#C784F0" />
        <circle cx="158" cy="62" r="8" fill="#8a5a3a" />
        <rect x="178" y="52" width="10" height="20" rx="3" fill="#5AB0F0" />
        <path d="M200 70 Q210 50 220 70Z" fill="#F27A9E" />
      </g>
      <rect x="160" y="88" width="12" height="24" fill="#4a3826" />
      <Person
        x={52}
        y={124}
        shirt={c.C}
        skin={2}
        hair={2}
        face={
          <>
            <g className="sc-blink">
              <path d="M2 -63 L12 -61" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M-12 -61 L-2 -63" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <path d="M-4 -51 L6 -51" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          </>
        }
      />
      <g className="sc-think">
        <circle cx="76" cy="40" r="3" fill="#3a332b" />
        <circle cx="84" cy="30" r="4.5" fill="#3a332b" />
        <rect x="88" y="4" width="60" height="22" rx="11" fill="#3a332b" />
        <text x="118" y="20" textAnchor="middle" fontSize="11" fontWeight="600" fill={CREAM}>
          a dog…?
        </text>
      </g>
    </>
  )
}

function TicTacToe({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  const gx = 140
  return (
    <>
      <rect x="0" y="118" width="240" height="4" rx="2" fill="#26211a" />
      <g stroke={CREAM} strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round">
        <line x1={gx + 30} y1="64" x2={gx + 30} y2="118" />
        <line x1={gx + 60} y1="64" x2={gx + 60} y2="118" />
        <line x1={gx} y1="82" x2={gx + 90} y2="82" />
        <line x1={gx} y1="100" x2={gx + 90} y2="100" />
      </g>
      <Cup x={gx + 15} y={80} color={c.A} w={14} h={14} />
      <circle cx={gx + 75} cy="73" r="7" fill={c.B} />
      <circle cx={gx + 45} cy="109" r="7" fill={c.B} />
      <g className="sc-place">
        <Cup x={gx + 45} y={98} color={c.A} w={14} h={14} />
      </g>
      <g className="sc-run">
        <g transform="translate(40 0)">
          <g className="sc-legs">
            <rect x="-10" y="104" width="7" height="16" rx="3" fill={INK} />
          </g>
          <rect x="3" y="104" width="7" height="16" rx="3" fill={INK} />
          <Person x={0} y={108} shirt={c.A} s={0.85} hair={3} skin={3} />
          <Cup x={24} y={66} color={c.A} w={14} h={14} />
        </g>
      </g>
    </>
  )
}

function Lineup({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  return (
    <>
      <rect x="0" y="118" width="240" height="4" rx="2" fill="#26211a" />
      <g className="sc-swapA">
        <Person x={60} y={118} shirt={c.B} s={1.08} hair={0} skin={0} />
      </g>
      <Person x={164} y={118} shirt={c.B} s={0.98} hair={1} skin={1} long>
        <g className="sc-shh">
          <rect x="-2" y="-58" width="4" height="12" rx="2" fill={SKIN[1]} />
        </g>
      </Person>
      <g className="sc-swapB">
        <Person x={112} y={118} shirt={c.B} s={0.82} hair={2} skin={2} />
      </g>
      <g className="sc-tick">
        <circle cx="214" cy="22" r="13" fill="#8fd18a" />
        <path d="M207 22 L212 27 L221 17" stroke="#142205" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g opacity="0.8">
        <circle cx="26" cy="22" r="13" fill="#3a332b" />
        <path d="M20 22 L32 22" stroke="#f07a6a" strokeWidth="3" strokeLinecap="round" />
      </g>
    </>
  )
}

function Balloon({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  return (
    <>
      <Table w={196} />
      <line x1="196" y1="104" x2="196" y2="130" stroke="#f5c143" strokeWidth="1.5" strokeDasharray="3 3" />
      <Person
        x={38}
        y={112}
        shirt={c.C}
        skin={1}
        hair={1}
        long
        className="sc-bob"
        face={
          <>
            <circle cx="-4" cy="-64" r="2.5" fill={INK} />
            <circle cx="8" cy="-64" r="2.5" fill={INK} />
            <g className="sc-cheeks">
              <circle cx="-6" cy="-54" r="5" fill="#f0a07a" />
              <circle cx="12" cy="-54" r="5" fill="#f0a07a" />
            </g>
          </>
        }
      />
      <g className="sc-inflate">
        <path d="M58 58 L66 60" stroke="#ffd56b" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="86" cy="44" rx="20" ry="23" fill="#F5C143" />
        <ellipse cx="79" cy="35" rx="4.5" ry="7" fill="#ffe08f" />
      </g>
      <g className="sc-puff" fill={CREAM}>
        <circle cx="112" cy="96" r="3.5" />
        <circle cx="120" cy="92" r="2.5" />
        <circle cx="119" cy="102" r="2.5" />
      </g>
      <g className="sc-slide">
        <Cup x={142} y={112} color={c.C} w={24} h={30} face="worried" />
      </g>
      <g transform="translate(222 128) rotate(20)">
        <Cup x={0} y={0} color={c.C} w={18} h={22} face="happy" />
      </g>
    </>
  )
}

function Match() {
  const Photo = ({ x }: { x: number }) => (
    <g transform={`translate(${x} 0)`}>
      <rect x="-28" y="18" width="56" height="74" rx="6" fill={CREAM} />
      <rect x="-22" y="24" width="44" height="50" rx="3" fill="#d9e6f2" />
      <circle cx="-8" cy="44" r="8" fill={SKIN[0]} />
      <circle cx="9" cy="46" r="7" fill={SKIN[1]} />
      <path d="M-20 74 Q-8 54 4 74Z" fill="#F2683C" />
      <path d="M0 74 Q9 58 20 74Z" fill="#5AB0F0" />
      <rect x="-14" y="80" width="28" height="4" rx="2" fill="#c9bca8" />
    </g>
  )
  const Back = ({ x }: { x: number }) => (
    <g transform={`translate(${x} 0)`}>
      <rect x="-28" y="18" width="56" height="74" rx="6" fill="#3a332b" />
      <rect x="-22" y="24" width="44" height="62" rx="4" fill="none" stroke="#6b6155" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="0" y="62" textAnchor="middle" fontSize="18" fontWeight="700" fill="#9c8f7c">
        ?
      </text>
    </g>
  )
  return (
    <>
      <rect x="10" y="104" width="220" height="6" rx="3" fill={TABLE} />
      <g opacity="0.5">
        <Back x={30} />
      </g>
      <g className="sc-flip1">
        <g className="sc-back1">
          <Back x={88} />
        </g>
        <g className="sc-face1">
          <Photo x={88} />
        </g>
      </g>
      <g className="sc-flip2">
        <g className="sc-back2">
          <Back x={152} />
        </g>
        <g className="sc-face2">
          <Photo x={152} />
        </g>
      </g>
      <g opacity="0.5">
        <Back x={210} />
      </g>
      <g className="sc-heart">
        <path d="M120 16 C114 6 100 10 104 20 C106 26 120 34 120 34 C120 34 134 26 136 20 C140 10 126 6 120 16Z" fill="#F27A9E" />
      </g>
    </>
  )
}

function Chopsticks({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  return (
    <>
      <Table />
      <Person
        x={44}
        y={112}
        shirt={c.B}
        skin={2}
        hair={2}
        className="sc-bob"
        face={
          <>
            <circle cx="5" cy="-62" r="2.5" fill={INK} />
            <circle cx="15" cy="-62" r="2.5" fill={INK} />
            <path d="M4 -51 Q10 -48 16 -53" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M17 -54 L21 -56" stroke="#d6512a" strokeWidth="3" strokeLinecap="round" />
          </>
        }
      />
      <g className="sc-wob">
        <rect x="66" y="76" width="74" height="3" rx="1.5" fill="#c79a5b" transform="rotate(-14 66 76)" />
        <rect x="66" y="82" width="74" height="3" rx="1.5" fill="#b5884a" transform="rotate(-8 66 82)" />
        <path d="M132 58 L139 69 L125 69Z" fill="#c9ccd1" />
        <rect x="131" y="51" width="2" height="8" fill={CREAM} />
      </g>
      <g className="sc-drop">
        <path d="M104 86 L109 94 L99 94Z" fill="#c9ccd1" />
      </g>
      <Cup x={190} y={112} color={c.B} w={40} h={30} />
      <g fill="#c9ccd1">
        <path d="M184 80 L188 86 L180 86Z" />
        <path d="M195 78 L199 84 L191 84Z" />
      </g>
    </>
  )
}

function Charades({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  return (
    <>
      <rect x="0" y="118" width="240" height="4" rx="2" fill="#26211a" />
      {/* guesser, back turned */}
      <g transform="translate(40 118)">
        <path d="M-26 0 Q-26 -42 0 -44 Q26 -42 26 0Z" fill={c.A} />
        <circle cx="0" cy="-60" r="19" fill={HAIR[0]} />
        <circle cx="-18" cy="-60" r="4" fill={SKIN[0]} />
      </g>
      <g className="sc-q">
        <text x="66" y="40" fontSize="26" fontWeight="800" fill="#F5C143">
          ?
        </text>
      </g>
      {/* actors */}
      <Person x={128} y={118} shirt={c.A} skin={1} hair={1} long s={0.9}>
        <g className="sc-actA">
          <rect x="18" y="-44" width="8" height="28" rx="4" fill={SKIN[1]} transform="rotate(-30 22 -16)" />
        </g>
      </Person>
      <Person
        x={192}
        y={118}
        shirt={c.A}
        skin={3}
        hair={3}
        s={0.95}
        face={
          <>
            <circle cx="-7" cy="-62" r="2.5" fill={INK} />
            <circle cx="7" cy="-62" r="2.5" fill={INK} />
            <ellipse cx="0" cy="-51" rx="5" ry="4" fill={INK} />
          </>
        }
      >
        <g className="sc-actB">
          <rect x="-28" y="-46" width="8" height="28" rx="4" fill={SKIN[3]} transform="rotate(30 -24 -18)" />
        </g>
        <g className="sc-actA">
          <rect x="20" y="-46" width="8" height="28" rx="4" fill={SKIN[3]} transform="rotate(-30 24 -18)" />
        </g>
      </Person>
      <g opacity="0.7">
        <rect x="150" y="4" width="68" height="20" rx="10" fill="#3a332b" />
        <text x="184" y="18" textAnchor="middle" fontSize="10" fontWeight="600" fill="#c9bca8">
          no sounds!
        </text>
      </g>
    </>
  )
}

function Balance({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  return (
    <>
      <rect x="0" y="122" width="240" height="4" rx="2" fill="#26211a" />
      <g className="sc-arms">
        <rect x="20" y="66" width="200" height="9" rx="4.5" fill={SKIN[0]} />
        <g className="sc-s1">
          <Cup x={40} y={66} color={c.C} w={16} h={18} />
        </g>
        <g className="sc-s2">
          <Cup x={200} y={66} color={c.C} w={16} h={18} />
        </g>
        <g className="sc-s3">
          <Cup x={40} y={44} color="#C784F0" w={16} h={18} />
        </g>
      </g>
      <Person
        x={120}
        y={122}
        shirt={c.C}
        face={
          <>
            <circle cx="-7" cy="-62" r="2.5" fill={INK} />
            <circle cx="7" cy="-62" r="2.5" fill={INK} />
            <path d="M-6 -51 L6 -51" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          </>
        }
      >
        <path d="M17 -74 Q14 -68 17 -65 Q20 -68 17 -74Z" fill="#9fd3ff" />
      </Person>
    </>
  )
}


function Tune({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  return (
    <>
      <Table x={60} w={180} />
      {/* speaker */}
      <rect x="6" y="40" width="44" height="72" rx="8" fill="#2f2920" />
      <circle cx="28" cy="62" r="9" fill="#1a1612" stroke="#4a4036" strokeWidth="2" />
      <circle cx="28" cy="92" r="13" fill="#1a1612" stroke="#4a4036" strokeWidth="2" />
      <g fill="#F5C143">
        <g className="sc-note1"><circle cx="54" cy="44" r="4" /><rect x="57" y="28" width="2.5" height="16" /></g>
        <g className="sc-note2"><circle cx="52" cy="58" r="4" /><rect x="55" y="42" width="2.5" height="16" /></g>
        <g className="sc-note3"><circle cx="56" cy="34" r="4" /><rect x="59" y="18" width="2.5" height="16" /></g>
      </g>
      {/* bell */}
      <path d="M140 112 Q140 96 152 96 Q164 96 164 112Z" fill="#c9bca8" />
      <rect x="136" y="110" width="32" height="4" rx="2" fill="#9c8f7c" />
      <circle cx="152" cy="94" r="3" fill="#c9bca8" />
      <g className="sc-ding">
        <path d="M134 84 L128 78 M152 80 L152 72 M170 84 L176 78" stroke="#F5C143" strokeWidth="3" strokeLinecap="round" />
      </g>
      <Person x={110} y={130} shirt={c.A} skin={1} hair={1} long className="sc-groove" />
      <g className="sc-slap">
        <path d="M128 92 Q140 86 148 88" stroke={SKIN[1]} strokeWidth="8" fill="none" strokeLinecap="round" />
        <ellipse cx="151" cy="88" rx="7" ry="5" fill={SKIN[1]} />
      </g>
      <Person x={208} y={130} shirt={c.B} skin={3} hair={3} s={0.95} />
    </>
  )
}

function Pictionary({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  return (
    <>
      <rect x="0" y="122" width="240" height="4" rx="2" fill="#26211a" />
      {/* easel */}
      <path d="M58 122 L74 30 M118 122 L102 30 M88 122 L88 96" stroke="#7a5c40" strokeWidth="4" strokeLinecap="round" />
      <rect x="54" y="20" width="68" height="76" rx="3" fill={CREAM} />
      <path className="sc-draw" d="M70 70 L88 40 L106 70 Z M82 70 L82 84 M94 70 L94 84" stroke="#1c120b" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <g className="sc-pen"><rect x="96" y="56" width="4" height="22" rx="2" fill="#F2683C" transform="rotate(30 98 67)" /></g>
      <Person x={32} y={122} shirt={c.C} s={0.85} skin={2} hair={2} />
      <Person
        x={182}
        y={122}
        shirt={c.C}
        skin={0}
        hair={0}
        face={
          <>
            <circle cx="-7" cy="-62" r="2.5" fill={INK} />
            <circle cx="7" cy="-62" r="2.5" fill={INK} />
            <ellipse cx="0" cy="-51" rx="5" ry="4" fill={INK} />
          </>
        }
      />
      <g className="sc-aha">
        <rect x="150" y="4" width="70" height="24" rx="12" fill="#F5C143" />
        <text x="185" y="21" textAnchor="middle" fontSize="12" fontWeight="800" fill="#2B1E00">
          TENT!
        </text>
      </g>
    </>
  )
}

function BackToBack({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  return (
    <>
      <rect x="0" y="122" width="240" height="4" rx="2" fill="#26211a" />
      {/* picture on the TV */}
      <rect x="6" y="12" width="64" height="44" rx="5" fill="#2f2920" />
      <circle cx="38" cy="34" r="12" fill="none" stroke={CREAM} strokeWidth="2.5" />
      <path d="M26 46 L50 46" stroke={CREAM} strokeWidth="2.5" strokeLinecap="round" />
      {/* describer faces the TV (left) */}
      <Person
        x={96}
        y={122}
        shirt={c.A}
        skin={1}
        hair={1}
        face={
          <>
            <circle cx="-12" cy="-62" r="2.5" fill={INK} />
            <g className="sc-talk">
              <ellipse cx="-12" cy="-51" rx="4" ry="3" fill={INK} />
            </g>
          </>
        }
      />
      <g stroke="#F5C143" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path className="sc-wave1" d="M74 46 Q70 52 74 58" />
        <path className="sc-wave2" d="M68 42 Q62 52 68 62" />
      </g>
      {/* drawer faces away (right) */}
      <Person
        x={144}
        y={122}
        shirt={c.A}
        skin={3}
        hair={3}
        long
        face={
          <>
            <circle cx="12" cy="-62" r="2.5" fill={INK} />
            <path d="M8 -51 L16 -51" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          </>
        }
      />
      <rect x="168" y="70" width="54" height="40" rx="3" fill={CREAM} transform="rotate(-6 195 90)" />
      <path className="sc-sketch" d="M184 92 A11 11 0 1 1 206 88 M184 100 L206 98" stroke="#1c120b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  )
}

function Feud({ c }: { c: Record<'A' | 'B' | 'C', string> }) {
  const tile = (x: number, y: number, n: number) => (
    <g key={n}>
      <rect x={x} y={y} width="44" height="16" rx="3" fill="#3a3329" />
      <circle cx={x + 22} cy={y + 8} r="5" fill="#F5C143" />
    </g>
  )
  return (
    <>
      {/* board */}
      <rect x="66" y="4" width="108" height="50" rx="7" fill="#26211a" />
      {tile(72, 10, 1)}
      {tile(124, 10, 3)}
      {tile(72, 32, 2)}
      {tile(124, 32, 4)}
      <g className="sc-flip1">
        <rect x="72" y="10" width="44" height="16" rx="3" fill={CREAM} />
        <rect x="76" y="16" width="24" height="4" rx="2" fill="#1c120b" />
        <rect x="104" y="13" width="9" height="10" rx="2" fill="#1c120b" />
      </g>
      <g className="sc-flip2">
        <rect x="72" y="32" width="44" height="16" rx="3" fill={CREAM} />
        <rect x="76" y="38" width="18" height="4" rx="2" fill="#1c120b" />
        <rect x="104" y="35" width="9" height="10" rx="2" fill="#1c120b" />
      </g>
      <g className="sc-strike">
        <rect x="102" y="12" width="36" height="36" rx="6" fill="#1a1612" stroke="#E5484D" strokeWidth="3" />
        <path d="M110 20 L130 40 M130 20 L110 40" stroke="#E5484D" strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* podium + buzzer */}
      <rect x="96" y="92" width="48" height="34" rx="4" fill="#4a3d2e" />
      <rect x="112" y="84" width="16" height="8" rx="2" fill="#2f2920" />
      <ellipse className="sc-buzz" cx="120" cy="83" rx="9" ry="4" fill="#E5484D" />
      <g className="sc-buzzhand">
        <path d="M84 96 Q100 84 112 80" stroke={SKIN[1]} strokeWidth="8" fill="none" strokeLinecap="round" />
        <ellipse cx="114" cy="79" rx="7" ry="5" fill={SKIN[1]} />
      </g>
      <Person x={70} y={128} shirt={c.A} skin={1} hair={1} long />
      <Person x={172} y={128} shirt={c.B} skin={3} hair={3} s={0.95} />
    </>
  )
}

const SCENES: Record<string, (p: { c: Record<'A' | 'B' | 'C', string> }) => ReactNode> = {
  cotton: Cotton,
  hskc: HeadShoulders,
  memorize: Memorize,
  tictactoe: TicTacToe,
  lineup: Lineup,
  balloon: Balloon,
  match: () => <Match />,
  chopstick: Chopsticks,
  charades: Charades,
  balance: Balance,
  tune: Tune,
  pictionary: Pictionary,
  b2b: BackToBack,
  feud: Feud,
}

export function GameScene({ id, className }: { id: string; className?: string }) {
  const c = useTeamColors()
  const Scene = SCENES[id]
  if (!Scene) return null
  return (
    <svg viewBox="0 0 240 130" preserveAspectRatio="xMinYMid meet" className={`scene ${className ?? ''}`} aria-hidden="true" overflow="visible">
      <Scene c={c} />
    </svg>
  )
}
