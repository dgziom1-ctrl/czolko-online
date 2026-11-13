import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Loader2, WifiOff, X } from 'lucide-react'
import { session } from './game/net'
import { getPid, loadProfile, loadRoom, saveProfile, saveRoom } from './game/profile'
import { fanfare, ping, unlockAudio } from './game/sound'
import type { Avatar as AvatarT } from './game/types'
import Landing from './components/Landing'
import Lobby from './components/Lobby'
import Board from './components/Board'
import Podium from './components/Podium'
import { Confetti, Toasts, type Toast } from './components/ui'

const params = new URLSearchParams(location.search)
const inviteParam = (params.get('room') ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5)

export default function App() {
  const snap = useSyncExternalStore(session.subscribe, session.getSnapshot)
  const initial = useRef(loadProfile())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [celebrate, setCelebrate] = useState<{ word: string } | null>(null)
  const seenLog = useRef<number | null>(null)
  const autoTried = useRef(false)

  const view = snap.view
  const inRoom = !!view && snap.status !== 'error' && view.players.some((p) => p.id === view.me)

  const profile = (name: string, avatar: AvatarT) => {
    saveProfile(name, avatar)
    unlockAudio()
    return { pid: getPid(), name, avatar }
  }

  // Odświeżenie strony: wróć do ostatniego pokoju
  useEffect(() => {
    if (autoTried.current) return
    autoTried.current = true
    const room = loadRoom()
    const p = initial.current
    if (room && p.name.trim().length >= 2 && (!inviteParam || inviteParam === room)) {
      void session.join(room, { pid: getPid(), name: p.name, avatar: p.avatar })
    }
  }, [])

  useEffect(() => {
    saveRoom(inRoom ? snap.code : null)
  }, [inRoom, snap.code])

  // Powiadomienia z dziennika zdarzeń hosta
  useEffect(() => {
    if (!view) {
      seenLog.current = null
      return
    }
    const maxId = view.log.reduce((m, l) => Math.max(m, l.id), 0)
    if (seenLog.current === null) {
      seenLog.current = maxId
      return
    }
    const fresh = view.log.filter((l) => l.id > (seenLog.current ?? 0))
    seenLog.current = maxId
    for (const l of fresh) {
      if (l.kind === 'turn') continue
      const id = Date.now() + l.id
      setToasts((t) => [...t.slice(-3), { id, text: l.text }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
      if (l.kind === 'score') {
        fanfare()
        if (l.pid === view.me && l.word) {
          setCelebrate({ word: l.word })
          setTimeout(() => setCelebrate(null), 4500)
        }
      } else {
        ping()
      }
    }
  }, [view])

  const leave = () => {
    session.leave()
    saveRoom(null)
    history.replaceState(null, '', location.pathname)
  }

  let screen
  if (!inRoom) {
    const busy = snap.status === 'connecting' || snap.status === 'reconnecting'
    screen = (
      <Landing
        initialName={initial.current.name}
        initialAvatar={initial.current.avatar}
        inviteCode={inviteParam}
        busy={busy}
        error={snap.error}
        onCreate={(n, a) => void session.create(profile(n, a))}
        onJoin={(c, n, a) => void session.join(c, profile(n, a))}
      />
    )
  } else if (view.phase === 'lobby') {
    screen = <Lobby view={view} send={(a) => session.send(a)} onLeave={leave} />
  } else if (view.phase === 'playing') {
    screen = <Board view={view} send={(a) => session.send(a)} onLeave={leave} />
  } else {
    screen = <Podium view={view} send={(a) => session.send(a)} onLeave={leave} />
  }

  return (
    <>
      {screen}
      <Toasts toasts={toasts} />
      {snap.status === 'reconnecting' && (
        <div className="fixed inset-x-0 bottom-16 z-[80] mx-auto flex w-fit items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-black text-black shadow-xl">
          <WifiOff size={16} /> Gospodarz się rozłączył – przekazuję pokój… <Loader2 size={16} className="animate-spin" />
        </div>
      )}
      {celebrate && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 p-4" onClick={() => setCelebrate(null)}>
          <Confetti />
          <div className="anim-pop card max-w-sm space-y-2 bg-[#2a0f4a]/95 p-6 text-center">
            <div className="text-6xl">🎉</div>
            <div className="text-sm font-bold uppercase tracking-wider text-violet-300">Zgadłeś! Byłeś/aś:</div>
            <div className="text-4xl font-black text-amber-200">{celebrate.word}</div>
            <div className="text-lg font-bold">+1 punkt! Dostajesz nowe hasło.</div>
            <button className="btn btn-ghost mx-auto">
              <X size={16} /> Zamknij
            </button>
          </div>
        </div>
      )}
    </>
  )
}
