/**
 * Tiny phone → host relay for Desi Chaat over ntfy.sh (free public pub/sub, CORS-enabled).
 * Each game gets a random private channel. The phone publishes events; the host laptop listens
 * and is the only one that writes scores. Messages are replayed on reconnect and de-duplicated by id.
 */
const BASE = 'https://ntfy.sh'

export type ChaatEvent =
  | { k: 'start'; turn: string; team: 'A' | 'B'; secs: number }
  | { k: 'tap'; turn: string; team: 'A' | 'B'; got: number; buzz: number; skip: number; leftMs: number }
  | { k: 'pause'; turn: string; team: 'A' | 'B'; paused: boolean; leftMs: number }
  | { k: 'end'; turn: string; team: 'A' | 'B'; got: number; buzz: number; skip: number }
  | { k: 'bank'; id: string; turn: string; team: 'A' | 'B'; score: number; got: number; buzz: number }

const topic = (room: string) => `cabincup-chaat-${room}`

export async function publish(room: string, evt: ChaatEvent): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${BASE}/${topic(room)}`, { method: 'POST', body: JSON.stringify(evt) })
      if (r.ok) return true
    } catch {
      /* retry */
    }
    await new Promise((res) => setTimeout(res, 400 * (attempt + 1)))
  }
  return false
}

/** Listens for phone events. `time` is when the relay received the event (ms). */
export function subscribe(
  room: string,
  onEvent: (evt: ChaatEvent, time: number) => void,
  onStatus: (connected: boolean) => void,
): () => void {
  let es: EventSource | null = null
  let closed = false
  let retry: ReturnType<typeof setTimeout> | undefined
  const open = () => {
    if (closed) return
    es = new EventSource(`${BASE}/${topic(room)}/sse?since=all`)
    es.addEventListener('open', () => onStatus(true))
    es.onopen = () => onStatus(true)
    es.onmessage = (e) => {
      try {
        const m = JSON.parse(e.data)
        if (m.event && m.event !== 'message') return
        if (!m.message) return
        onEvent(JSON.parse(m.message) as ChaatEvent, (m.time ?? Date.now() / 1000) * 1000)
      } catch {
        /* ignore anything that isn't ours */
      }
    }
    es.onerror = () => {
      onStatus(false)
      // EventSource retries on its own; if it gave up, reopen.
      if (es?.readyState === EventSource.CLOSED) {
        es.close()
        retry = setTimeout(open, 2000)
      }
    }
  }
  open()
  return () => {
    closed = true
    clearTimeout(retry)
    es?.close()
  }
}
