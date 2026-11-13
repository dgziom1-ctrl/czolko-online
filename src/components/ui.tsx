import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { X, Copy, Check } from 'lucide-react'
import type { Avatar as AvatarT } from '../game/types'
import { inviteLink } from '../game/profile'

export function Avatar({ a, size = 44 }: { a: AvatarT; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-white/30 shadow-md"
      style={{ width: size, height: size, background: a.color, fontSize: size * 0.55 }}
    >
      {a.emoji}
    </div>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center" onClick={onClose}>
      <div
        className="card anim-up max-h-[90vh] w-full max-w-lg overflow-y-auto bg-[#1e0b36]/95 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <button className="btn btn-ghost !p-2" onClick={onClose} aria-label="Zamknij">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Jak grać?" onClose={onClose}>
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-violet-100">
        <li>Każdy gracz dostaje tajne hasło (postać, rzecz, mem). <b>Wszyscy widzą Twoje hasło – oprócz Ciebie.</b> Na swojej karcie masz <b>???</b>.</li>
        <li>Rozmawiacie na żywo (Discord, w jednym pokoju). Po kolei zadajesz pytania typu <i>tak/nie</i>: „Czy jestem Polakiem?”, „Czy żyję?”.</li>
        <li>Pozostali odpowiadają tylko <b>tak</b> lub <b>nie</b>. Po pytaniu klikasz <b>Następna tura</b>.</li>
        <li>Gdy wiesz, kim jesteś – powiedz to na głos i kliknij <b>Zgadłem!</b>. Reszta potwierdza (albo po 5 sekundach potwierdza się samo, jeśli nikt się nie sprzeciwi).</li>
        <li>Za poprawną odpowiedź dostajesz <b>+1 pkt</b>, widzisz, kim byłeś, i od razu dostajesz <b>nowe hasło</b>.</li>
        <li>Hasło jest za trudne lub niesprawiedliwe? Kliknij <b>Zmień hasło</b> na karcie gracza – wszyscy głosują, decyduje większość.</li>
        <li>Wygrywa pierwsza osoba, która zbierze wymaganą liczbę punktów.</li>
        <li>W <b>Moich notatkach</b> zapisujesz wskazówki. Czyszczą się przy każdym nowym haśle.</li>
      </ol>
      <p className="mt-3 text-xs text-violet-300">
        Gra nie ma moderatora ani serwera – działa peer-to-peer. Jeśli założyciel pokoju wyjdzie, pokój przejmuje kolejny gracz.
      </p>
    </Modal>
  )
}

export function CopyInvite({ code, className = '' }: { code: string; className?: string }) {
  const [ok, setOk] = useState(false)
  const copy = async () => {
    const link = inviteLink(code)
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* ignore */
      }
      ta.remove()
    }
    setOk(true)
    setTimeout(() => setOk(false), 2000)
  }
  return (
    <button className={`btn btn-primary ${className}`} onClick={copy}>
      {ok ? <Check size={18} /> : <Copy size={18} />}
      {ok ? 'Skopiowano!' : 'Kopiuj link zaproszenia'}
    </button>
  )
}

export function Confetti({ count = 90 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        i,
        left: Math.random() * 100,
        dx: (Math.random() - 0.5) * 300,
        delay: Math.random() * 0.8,
        dur: 2.2 + Math.random() * 2,
        color: ['#f43f5e', '#facc15', '#22c55e', '#38bdf8', '#a855f7', '#fb923c'][i % 6],
      })),
    [count],
  )
  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti-piece"
          style={
            {
              left: `${p.left}vw`,
              background: p.color,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              '--dx': `${p.dx}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  )
}

export interface Toast {
  id: number
  text: string
}

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-[70] flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => (
        <div key={t.id} className="anim-up card bg-[#2a0f4a]/95 px-4 py-2 text-sm font-bold shadow-xl">
          {t.text}
        </div>
      ))}
    </div>
  )
}

/** Odliczanie do wartości expiresAt zegara hosta. */
export function useCountdown(expiresAt: number | undefined, offset: number) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!expiresAt) return
    const t = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(t)
  }, [expiresAt])
  if (!expiresAt) return 0
  return Math.max(0, Math.ceil((expiresAt - (now + offset)) / 1000))
}
