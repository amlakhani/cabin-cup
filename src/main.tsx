import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import './index.css'

const Host = lazy(() => import('./host/HostApp'))
const Show = lazy(() => import('./show/ShowApp'))
const Landing = lazy(() => import('./landing/Landing'))

const path = location.pathname.replace(/\/+$/, '')
const Page = path === '/host' ? Host : path === '/show' ? Show : Landing

document.title =
  path === '/host' ? 'Host · Family Cup' : path === '/show' ? 'TV · Family Cup' : 'Family Cup · Game Night'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user" transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
      <Suspense fallback={<div className="min-h-dvh bg-night" />}>
        <Page />
      </Suspense>
    </MotionConfig>
  </StrictMode>,
)
