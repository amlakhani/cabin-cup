/**
 * Phone → host link for Desi Chaat.
 *
 * Fast path: a direct WebRTC data channel (PeerJS; its free cloud server only introduces the two
 * devices). Every tap arrives instantly with no request limits.
 * Backup: ntfy.sh (free public pub/sub). Used for every tap only when the direct link isn't up, and
 * always for the few events that must not be lost (start, end, turn result).
 *
 * Events carry a sequence number so the host ignores stale ones, and turn results carry an id so
 * nothing is ever counted twice, whichever path (or both) delivered it.
 */
import Peer, { type DataConnection } from 'peerjs'

const NTFY = 'https://ntfy.sh'
const q = new URLSearchParams(location.search)
// For local testing only: ?peer=localhost:9000 points at a local PeerServer.
const PEER_OPTS = q.get('peer')
  ? { host: q.get('peer')!.split(':')[0], port: Number(q.get('peer')!.split(':')[1] || 9000), path: '/', secure: false }
  : {}

type Team = 'A' | 'B'
export type ChaatEvent =
  | { k: 'start'; seq: number; turn: string; team: Team; secs: number }
  | { k: 'tap'; seq: number; turn: string; team: Team; got: number; buzz: number; skip: number; leftMs: number }
  | { k: 'pause'; seq: number; turn: string; team: Team; paused: boolean; leftMs: number }
  | { k: 'end'; seq: number; turn: string; team: Team; got: number; buzz: number; skip: number }
  | { k: 'bank'; seq: number; id: string; turn: string; team: Team; score: number; got: number; buzz: number }

const topic = (room: string) => `cabincup-chaat-${room}`
const peerId = (room: string) => `cabincup-chaat-${room}`

/* ---------------- backup: ntfy ---------------- */
export async function publish(room: string, evt: ChaatEvent): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${NTFY}/${topic(room)}`, { method: 'POST', body: JSON.stringify(evt) })
      if (r.ok) return true
    } catch {
      /* retry */
    }
    await new Promise((res) => setTimeout(res, 400 * (attempt + 1)))
  }
  return false
}

function subscribeNtfy(room: string, onEvent: (evt: ChaatEvent, time: number) => void, onStatus: (c: boolean) => void) {
  let es: EventSource | null = null
  let closed = false
  let retry: ReturnType<typeof setTimeout> | undefined
  const open = () => {
    if (closed) return
    es = new EventSource(`${NTFY}/${topic(room)}/sse?since=all`)
    es.addEventListener('open', () => onStatus(true))
    es.onopen = () => onStatus(true)
    es.onmessage = (e) => {
      try {
        const m = JSON.parse(e.data)
        if (m.event && m.event !== 'message') return
        if (!m.message) return
        onEvent(JSON.parse(m.message) as ChaatEvent, (m.time ?? Date.now() / 1000) * 1000)
      } catch {
        /* not ours */
      }
    }
    es.onerror = () => {
      onStatus(false)
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

/* ---------------- host: listen on both paths ---------------- */
export interface HostLinkStatus {
  direct: number // phones connected directly
  backup: boolean
}

export function listenForPhone(
  room: string,
  onEvent: (evt: ChaatEvent, time: number) => void,
  onStatus: (s: HostLinkStatus) => void,
): () => void {
  let closed = false
  let peer: Peer | null = null
  let retry: ReturnType<typeof setTimeout> | undefined
  const conns = new Set<DataConnection>()
  let backup = false
  const report = () => onStatus({ direct: conns.size, backup })

  const startPeer = () => {
    if (closed) return
    peer = new Peer(peerId(room), { ...PEER_OPTS, debug: q.has('peerdebug') ? 3 : 0 })
    peer.on('connection', (c) => {
      c.on('open', () => {
        conns.add(c)
        report()
      })
      c.on('data', (data) => onEvent(data as ChaatEvent, Date.now()))
      const drop = () => {
        conns.delete(c)
        report()
      }
      c.on('close', drop)
      c.on('error', drop)
    })
    peer.on('disconnected', () => {
      // Lost the introducer; existing phone links keep working. Reconnect so new phones can join.
      if (!closed && peer && !peer.destroyed) peer.reconnect()
    })
    peer.on('error', (err) => {
      // 'unavailable-id' = this channel is still held (e.g. the host page just reloaded): try again shortly.
      const type = (err as { type?: string }).type
      if (type === 'unavailable-id' || type === 'network' || type === 'server-error' || type === 'socket-error' || type === 'socket-closed') {
        peer?.destroy()
        retry = setTimeout(startPeer, 3000)
      }
    })
  }
  startPeer()

  const stopNtfy = subscribeNtfy(room, onEvent, (c) => {
    backup = c
    report()
  })

  return () => {
    closed = true
    clearTimeout(retry)
    stopNtfy()
    conns.forEach((c) => c.close())
    peer?.destroy()
  }
}

/* ---------------- phone: send on the fastest path ---------------- */
export class PhoneLink {
  private room: string
  private peer: Peer | null = null
  private conn: DataConnection | null = null
  private retry: ReturnType<typeof setTimeout> | undefined
  private seq = 0
  private listeners = new Set<(direct: boolean) => void>()
  private closed = false

  constructor(room: string) {
    this.room = room
    this.connect()
  }

  get direct() {
    return !!this.live && (this.isOpen || this.live.open)
  }
  private isOpen = false
  /** the connection that actually opened (there can briefly be a retry in flight) */
  private live: DataConnection | null = null

  onChange(f: (direct: boolean) => void) {
    this.listeners.add(f)
    return () => void this.listeners.delete(f)
  }

  private notify(direct = this.direct) {
    this.listeners.forEach((f) => f(direct))
  }

  private connect() {
    if (this.closed) return
    if (!this.peer || this.peer.destroyed) {
      this.peer = new Peer({ ...PEER_OPTS, debug: q.has('peerdebug') ? 3 : 0 })
      this.peer.on('error', () => this.scheduleRetry())
      this.peer.on('disconnected', () => {
        if (this.peer && !this.peer.destroyed) this.peer.reconnect()
      })
    }
    const go = () => {
      if (!this.peer || this.peer.destroyed) return
      const c = this.peer.connect(peerId(this.room), { reliable: true })
      this.conn = c
      c.on('open', () => {
        this.live = c
        this.isOpen = true
        this.notify(true) // PeerJS fires 'open' a moment before its own .open flag flips
      })
      c.on('close', () => {
        if (this.live === c) {
          this.live = null
          this.isOpen = false
        }
        this.notify()
        this.scheduleRetry()
      })
      c.on('error', () => {
        if (this.live === c) {
          this.live = null
          this.isOpen = false
        }
        this.notify()
        this.scheduleRetry()
      })
    }
    if (this.peer.open) go()
    else this.peer.once('open', go)
  }

  private scheduleRetry() {
    if (this.closed) return
    clearTimeout(this.retry)
    this.retry = setTimeout(() => {
      if (this.direct) return
      if (this.conn && this.conn !== this.live) this.conn.close()
      this.conn = null
      if (this.peer?.destroyed || this.peer?.disconnected) {
        this.peer?.destroy()
        this.peer = null
      }
      this.connect()
    }, 2500)
  }

  /**
   * Sends an event. Taps go direct when possible (backup only if the direct link is down);
   * start/end/turn results go both ways so they can't be lost. Resolves true if any path delivered it.
   */
  async send(evt: DistributiveOmit<ChaatEvent, 'seq'>): Promise<boolean> {
    const full = { ...evt, seq: ++this.seq } as ChaatEvent
    let ok = false
    if (this.direct) {
      try {
        this.live!.send(full)
        ok = true
      } catch {
        /* fall through to backup */
      }
    }
    const important = full.k === 'start' || full.k === 'end' || full.k === 'bank' || full.k === 'pause'
    if (!ok || important) {
      const sent = publish(this.room, full)
      if (!ok) ok = await sent
    }
    return ok
  }
}

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never
