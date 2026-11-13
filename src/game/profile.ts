import type { Avatar } from './types'

export const EMOJIS = ['😎', '🤠', '🦊', '🐸', '🐼', '🦄', '👽', '🤖', '🔥', '🍕', '🐙', '🦖', '🎃', '🧙', '🥷', '👑']
export const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899']

function ls(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
function ss(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** Identyfikator gracza – per karta przeglądarki, żeby dało się grać w kilka kart naraz. */
export function getPid(): string {
  const s = ss()
  let id = s?.getItem('czolko.pid')
  if (!id) {
    id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
    s?.setItem('czolko.pid', id)
  }
  return id
}

export function loadProfile(): { name: string; avatar: Avatar } {
  try {
    const raw = ls()?.getItem('czolko.profile')
    if (raw) {
      const p = JSON.parse(raw)
      if (p && typeof p.name === 'string' && p.avatar) return p
    }
  } catch {
    /* ignore */
  }
  return {
    name: '',
    avatar: {
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    },
  }
}

export function saveProfile(name: string, avatar: Avatar) {
  try {
    ls()?.setItem('czolko.profile', JSON.stringify({ name, avatar }))
  } catch {
    /* ignore */
  }
}

export function saveRoom(code: string | null) {
  try {
    if (code) ss()?.setItem('czolko.room', code)
    else ss()?.removeItem('czolko.room')
  } catch {
    /* ignore */
  }
}

export function loadRoom(): string | null {
  try {
    return ss()?.getItem('czolko.room') ?? null
  } catch {
    return null
  }
}

export function inviteLink(code: string) {
  const base = location.origin + location.pathname
  return `${base}?room=${code}`
}
