import { useState } from 'react'
import { HelpCircle, PartyPopper, LogIn, Loader2, AlertTriangle } from 'lucide-react'
import { COLORS, EMOJIS } from '../game/profile'
import type { Avatar as AvatarT } from '../game/types'
import { Avatar, RulesModal } from './ui'
import { normalizeCode } from '../game/net'

interface Props {
  initialName: string
  initialAvatar: AvatarT
  inviteCode: string
  busy: boolean
  error: string | null
  onCreate: (name: string, avatar: AvatarT) => void
  onJoin: (code: string, name: string, avatar: AvatarT) => void
}

export default function Landing({ initialName, initialAvatar, inviteCode, busy, error, onCreate, onJoin }: Props) {
  const [name, setName] = useState(initialName)
  const [avatar, setAvatar] = useState(initialAvatar)
  const [code, setCode] = useState(inviteCode)
  const [rules, setRules] = useState(false)
  const nameOk = name.trim().length >= 2

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
      <header className="text-center">
        <div className="mb-2 text-6xl">🎭</div>
        <h1 className="bg-gradient-to-r from-fuchsia-300 via-pink-300 to-amber-200 bg-clip-text text-5xl font-black tracking-tight text-transparent">
          Czółko Online
        </h1>
        <p className="mt-1 text-sm text-violet-200">Kim jesteś? Wszyscy wiedzą – oprócz Ciebie.</p>
      </header>

      {inviteCode && (
        <div className="card anim-pop flex items-center gap-2 border-amber-300/40 bg-amber-300/10 p-3 text-sm font-bold">
          <PartyPopper size={18} /> Zaproszenie do pokoju <span className="font-mono text-amber-200">{inviteCode}</span>
        </div>
      )}

      <section className="card space-y-4 p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-violet-300">Twój nick</span>
          <input
            className="input text-lg font-bold"
            value={name}
            maxLength={16}
            placeholder="np. Bungee"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-violet-300">Awatar</span>
          <div className="mb-3 flex items-center gap-3">
            <Avatar a={avatar} size={64} />
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Kolor ${c}`}
                  onClick={() => setAvatar({ ...avatar, color: c })}
                  className={`h-7 w-7 rounded-full border-2 ${avatar.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setAvatar({ ...avatar, emoji: e })}
                className={`rounded-lg py-1 text-2xl ${avatar.emoji === e ? 'bg-white/25' : 'hover:bg-white/10'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="card flex items-start gap-2 border-red-400/50 bg-red-500/15 p-3 text-sm font-semibold text-red-100">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <section className="space-y-3">
        <button className="btn btn-primary w-full text-lg" disabled={!nameOk || busy} onClick={() => onCreate(name, avatar)}>
          {busy ? <Loader2 className="animate-spin" size={20} /> : <PartyPopper size={20} />} Stwórz Pokój
        </button>
        <div className="card flex gap-2 p-2">
          <input
            className="input !bg-transparent text-center font-mono text-xl font-black uppercase tracking-[0.3em]"
            placeholder="KOD"
            value={code}
            maxLength={5}
            onChange={(e) => setCode(normalizeCode(e.target.value))}
          />
          <button
            className="btn btn-ghost shrink-0"
            disabled={!nameOk || busy || code.length !== 5}
            onClick={() => onJoin(code, name, avatar)}
          >
            <LogIn size={18} /> Dołącz do Pokoju
          </button>
        </div>
        {!nameOk && <p className="text-center text-xs text-violet-300">Wpisz nick (min. 2 znaki), aby zacząć.</p>}
      </section>

      <button className="btn btn-ghost mx-auto" onClick={() => setRules(true)}>
        <HelpCircle size={18} /> Jak grać?
      </button>
      {rules && <RulesModal onClose={() => setRules(false)} />}
    </div>
  )
}
