/* Minimal YouTube IFrame API loader and link parsing. */

export interface YTPlayer {
  loadVideoById(opts: { videoId: string; startSeconds?: number; endSeconds?: number }): void
  cueVideoById(opts: { videoId: string; startSeconds?: number }): void
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  seekTo(s: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getPlayerState(): number
  setVolume(v: number): void
  destroy(): void
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          width?: string | number
          height?: string | number
          videoId?: string
          playerVars?: Record<string, number | string>
          events?: Record<string, (e: { data: number; target: YTPlayer }) => void>
        },
      ) => YTPlayer
      PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let loading: Promise<NonNullable<Window['YT']>> | null = null

export function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve(window.YT!)
    }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.async = true
    s.onerror = () => {
      loading = null
      reject(new Error('Could not load YouTube. Check the internet connection.'))
    }
    document.head.appendChild(s)
  })
  return loading
}

/** Accepts a YouTube URL (watch, youtu.be, shorts, music) or a bare 11-character id. */
export function parseYouTube(input: string): { videoId: string; start?: number } | null {
  const raw = input.trim()
  if (!raw) return null
  if (/^[\w-]{11}$/.test(raw)) return { videoId: raw }
  let url: URL
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
  } catch {
    return null
  }
  let id: string | null = null
  if (url.hostname.includes('youtu.be')) id = url.pathname.slice(1, 12)
  else if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/') || url.pathname.startsWith('/live/'))
    id = url.pathname.split('/')[2]?.slice(0, 11) ?? null
  else id = url.searchParams.get('v')
  if (!id || !/^[\w-]{11}$/.test(id)) return null
  const t = url.searchParams.get('t') ?? url.searchParams.get('start')
  return { videoId: id, start: t ? parseTime(t) : undefined }
}

function parseTime(t: string) {
  if (/^\d+$/.test(t)) return Number(t)
  const m = t.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/)
  if (!m) return undefined
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
}

export const youtubeSearchUrl = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
