import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import './index.css'
import { EVENT } from './lib/event'

const Host = lazy(() => import('./host/HostApp'))
const Show = lazy(() => import('./show/ShowApp'))
const Landing = lazy(() => import('./landing/Landing'))
const Card = lazy(() => import('./card/CardApp'))

const path = location.pathname.replace(/\/+$/, '').replace(/^\/thanksgiving/, '')
const Page = path === '/host' ? Host : path === '/show' ? Show : path === '/card' ? Card : Landing
const name = EVENT === 'trailer' ? 'Thanksgiving Trailer' : 'Cabin Cup'

document.title =
  path === '/card'
    ? 'Desi Chaat card'
    : path === '/host' ? `Host · ${name}` : path === '/show' ? `TV · ${name}` : EVENT === 'trailer' ? 'Thanksgiving Trailer' : "Crazy Family’s Cabin Cup"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user" transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
      <Suspense fallback={<div className="min-h-dvh bg-night" />}>
        <Page />
      </Suspense>
    </MotionConfig>
  </StrictMode>,
)
