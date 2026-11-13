export interface Avatar {
  color: string
  emoji: string
}

export interface Player {
  id: string
  name: string
  avatar: Avatar
  ready: boolean
  connected: boolean
  score: number
  customCount: number
  order: number
}

export interface Word {
  text: string
  cat: string // id kategorii lub 'own'
  by?: string // tylko po stronie hosta (autor własnego hasła)
}

export interface Settings {
  target: number
  categories: string[]
}

export interface Claim {
  id: number
  target: string
  by: string
  confirms: string[]
  rejects: string[]
  expiresAt: number
}

export interface Reroll {
  id: number
  target: string
  by: string
  yes: string[]
  no: string[]
  expiresAt: number
}

export interface TimelineEntry {
  pid: string
  text: string | null // null = ukryte przed samym graczem do końca gry
  cat: string
  result: 'guessed' | 'rerolled' | 'final'
}

export interface LogEntry {
  id: number
  kind: 'info' | 'score' | 'reroll' | 'turn'
  text: string
  pid?: string
  word?: string
}

/** Pełny stan (tylko host + zapis w pamięci). Nigdy nie wysyłany w całości. */
export interface Full {
  code: string
  rev: number
  epoch: number
  hostId: string
  phase: 'lobby' | 'playing' | 'finished'
  players: Player[]
  settings: Settings
  words: Record<string, Word | null>
  wordGen: Record<string, number>
  turn: string | null
  turnNo: number
  claim: Claim | null
  reroll: Reroll | null
  timeline: TimelineEntry[]
  log: LogEntry[]
  logSeq: number
  idSeq: number
  winnerId: string | null
}

/** Widok danego gracza: jego własne hasło jest zawsze null. */
export interface View extends Omit<Full, 'words'> {
  words: Record<string, Word | null>
  myCustoms: string[]
  me: string
  hostNow: number
}

export type Action =
  | { k: 'ready'; v: boolean }
  | { k: 'profile'; name: string; avatar: Avatar }
  | { k: 'settings'; patch: Partial<Settings> }
  | { k: 'custom'; texts: string[] }
  | { k: 'start' }
  | { k: 'claim'; target: string }
  | { k: 'vote'; id: number; ok: boolean }
  | { k: 'next' }
  | { k: 'rerollStart'; target: string }
  | { k: 'rerollVote'; id: number; ok: boolean }
  | { k: 'again' }

export type Msg =
  | { t: 'hello'; pid: string; name: string; avatar: Avatar; view: View | null }
  | { t: 'act'; a: Action }
  | { t: 'state'; view: View }
  | { t: 'reject'; reason: string }
  | { t: 'bye' }
