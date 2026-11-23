export type EventId = 'cabin' | 'trailer'

/** Which game night this page is for, from the URL: /thanksgiving/... is the trailer. */
export const EVENT: EventId =
  typeof location !== 'undefined' && location.pathname.startsWith('/thanksgiving') ? 'trailer' : 'cabin'

/** URL prefix for the current event's pages. */
export const BASE = EVENT === 'trailer' ? '/thanksgiving' : ''

export const EVENTS: { id: EventId; label: string; base: string }[] = [
  { id: 'cabin', label: 'Cabin Cup', base: '' },
  { id: 'trailer', label: 'Thanksgiving Trailer', base: '/thanksgiving' },
]
