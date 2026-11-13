import { useEffect, useState } from 'react'
import { Crown, HelpCircle, LogOut, Play, Send, WifiOff } from 'lucide-react'
import type { Action, View } from '../game/types'
import { CATEGORIES } from '../game/words'
import { Avatar, CopyInvite, RulesModal } from './ui'

interface Props {
  view: View
  send: (a: Action) => void
  onLeave: () => void
}

export default function Lobby({ view, send, onLeave }: Props) {
  const me = view.players.find((p) => p.id === view.me)!
  const [rules, setRules] = useState(false)
  const [c1, setC1] = useState(view.myCustoms[0] ?? '')
  const [c2, setC2] = useState(view.myCustoms[1] ?? '')
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    setC1(view.myCustoms[0] ?? '')
    setC2(view.myCustoms[1] ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.myCustoms.join('|')])

  const active = view.players.filter((p) => p.connected)
  const allReady = active.length >= 2 && active.every((p) => p.ready)
  const totalCustom = view.players.reduce((n, p) => n + p.customCount, 0)

  const toggleCat = (id: string) => {
    const has = view.settings.categories.includes(id)
    const cats = has ? view.settings.categories.filter((c) => c !== id) : [...view.settings.categories, id]
    if (cats.length) send({ k: 'settings', patch: { categories: cats } })
  }

  const saveCustom = () => {
    send({ k: 'custom', texts: [c1, c2] })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black">🎭 Lobby</h1>
        <div className="flex gap-2">
          <button className="btn btn-ghost !px-3" onClick={() => setRules(true)}>
            <HelpCircle size={18} /> Jak grać?
          </button>
          <button className="btn btn-ghost !px-3" onClick={onLeave}>
            <LogOut size={18} /> Wyjdź
          </button>
        </div>
      </header>

      <section className="card flex flex-col items-center gap-3 p-4 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-violet-300">Kod pokoju</div>
          <div className="font-mono text-5xl font-black tracking-[0.25em] text-amber-200">{view.code}</div>
        </div>
        <CopyInvite code={view.code} className="w-full sm:w-auto" />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-2 p-4">
          <h2 className="font-black">Gracze ({view.players.length})</h2>
          <ul className="space-y-2">
            {view.players.map((p) => (
              <li key={p.id} className={`flex items-center gap-3 rounded-xl bg-black/25 p-2 ${p.connected ? '' : 'opacity-50'}`}>
                <Avatar a={p.avatar} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 truncate font-bold">
                    {p.name} {p.id === view.hostId && <Crown size={14} className="text-amber-300" />}
                    {p.id === view.me && <span className="text-xs text-violet-300">(Ty)</span>}
                    {!p.connected && <WifiOff size={14} />}
                  </div>
                  {p.customCount > 0 && <div className="text-xs text-violet-300">Własne hasła: {p.customCount}</div>}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${p.ready ? 'bg-green-500 text-white' : 'bg-white/10 text-violet-200'}`}
                >
                  {p.ready ? 'Gotowy' : 'Czeka'}
                </span>
              </li>
            ))}
          </ul>
          <button
            className={`btn w-full ${me.ready ? 'btn-ghost' : 'btn-good'}`}
            onClick={() => send({ k: 'ready', v: !me.ready })}
          >
            {me.ready ? 'Cofnij gotowość' : 'Gotowy'}
          </button>
          <button className="btn btn-primary w-full" disabled={!allReady} onClick={() => send({ k: 'start' })}>
            <Play size={18} /> Zacznij grę
          </button>
          {!allReady && (
            <p className="text-center text-xs text-violet-300">
              {active.length < 2 ? 'Potrzeba co najmniej 2 graczy.' : 'Wszyscy gracze muszą kliknąć „Gotowy”.'}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div className="card p-4">
            <h2 className="mb-2 font-black">Punkty do wygranej</h2>
            <div className="flex gap-2">
              {[3, 5, 6, 10].map((n) => (
                <button
                  key={n}
                  className="chip flex-1 !py-2 text-base"
                  data-on={view.settings.target === n}
                  onClick={() => send({ k: 'settings', patch: { target: n } })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h2 className="mb-2 font-black">Kategorie</h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.id} className="chip" data-on={view.settings.categories.includes(c.id)} onClick={() => toggleCat(c.id)}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-2 p-4">
            <h2 className="font-black">Własne hasła (opcjonalnie)</h2>
            <p className="text-xs text-violet-300">
              Dodaj 1–2 tajne hasła. Zostaną wymieszane i rozdane tak, że nikt nie dostanie własnego. Łącznie w puli: {totalCustom}.
            </p>
            <input className="input" maxLength={40} placeholder="Hasło nr 1" value={c1} onChange={(e) => setC1(e.target.value)} />
            <input className="input" maxLength={40} placeholder="Hasło nr 2" value={c2} onChange={(e) => setC2(e.target.value)} />
            <button className="btn btn-ghost w-full" onClick={saveCustom}>
              <Send size={16} /> {saved ? 'Zapisano!' : 'Zapisz moje hasła'}
            </button>
          </div>
        </section>
      </div>
      {rules && <RulesModal onClose={() => setRules(false)} />}
    </div>
  )
}
