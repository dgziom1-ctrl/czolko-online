import { Crown, LogOut, RotateCcw, Trophy } from 'lucide-react'
import type { Action, View } from '../game/types'
import { categoryName } from '../game/words'
import { Avatar, Confetti } from './ui'

interface Props {
  view: View
  send: (a: Action) => void
  onLeave: () => void
}

const RESULT: Record<string, string> = { guessed: '✅ odgadnięte', rerolled: '🔄 zmienione', final: '❓ nieodgadnięte' }

export default function Podium({ view, send, onLeave }: Props) {
  const ranked = [...view.players].sort((a, b) => b.score - a.score || a.order - b.order)
  const winner = ranked.find((p) => p.id === view.winnerId) ?? ranked[0]
  const top = ranked.slice(0, 3)
  // układ podium: 2. – 1. – 3.
  const order = [top[1], top[0], top[2]].filter(Boolean)
  const heights: Record<number, string> = { 0: 'h-40', 1: 'h-28', 2: 'h-20' }
  const medal = ['🥇', '🥈', '🥉']

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-3 py-6">
      <Confetti count={120} />
      <header className="text-center">
        <Trophy className="mx-auto text-amber-300" size={48} />
        <h1 className="mt-1 text-4xl font-black">Koniec gry!</h1>
        <p className="text-lg text-violet-200">
          Wygrywa <b className="text-amber-200">{winner.name}</b> z wynikiem {winner.score} pkt 🎉
        </p>
      </header>

      <section className="flex items-end justify-center gap-2">
        {order.map((p) => {
          const rank = ranked.indexOf(p)
          return (
            <div key={p.id} className="anim-pop flex w-28 flex-col items-center sm:w-36">
              {rank === 0 && <Crown className="mb-1 text-amber-300" />}
              <Avatar a={p.avatar} size={56} />
              <div className="mt-1 max-w-full truncate font-black">{p.name}</div>
              <div
                className={`mt-1 flex w-full items-start justify-center rounded-t-xl bg-gradient-to-b from-fuchsia-500 to-violet-700 pt-2 text-3xl ${heights[rank]}`}
              >
                <div className="text-center">
                  {medal[rank]}
                  <div className="text-lg font-black">{p.score} pkt</div>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {ranked.length > 3 && (
        <section className="card divide-y divide-white/10 p-2">
          {ranked.slice(3).map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 p-2">
              <span className="w-6 text-center font-black text-violet-300">{i + 4}.</span>
              <Avatar a={p.avatar} size={32} />
              <span className="flex-1 font-bold">{p.name}</span>
              <span className="font-black text-amber-200">{p.score} pkt</span>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-black">Oś czasu tożsamości</h2>
        {ranked.map((p) => {
          const items = view.timeline.filter((t) => t.pid === p.id)
          return (
            <div key={p.id} className="card p-3">
              <div className="mb-2 flex items-center gap-2 font-black">
                <Avatar a={p.avatar} size={30} /> {p.name}
              </div>
              <ol className="space-y-1 border-l-2 border-fuchsia-400/50 pl-3">
                {items.map((t, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-bold">{t.text ?? '???'}</span>{' '}
                    <span className="text-xs text-violet-300">
                      · {categoryName(t.cat)} · {RESULT[t.result]}
                    </span>
                  </li>
                ))}
                {!items.length && <li className="text-sm text-violet-300">Brak haseł.</li>}
              </ol>
            </div>
          )
        })}
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button className="btn btn-primary flex-1 text-lg" onClick={() => send({ k: 'again' })}>
          <RotateCcw size={20} /> Zagraj ponownie
        </button>
        <button className="btn btn-ghost" onClick={onLeave}>
          <LogOut size={18} /> Wyjdź
        </button>
      </div>
    </div>
  )
}
