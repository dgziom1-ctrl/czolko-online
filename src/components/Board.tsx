import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, LogOut, SkipForward, Shuffle, Hand, NotebookPen, Check, X, Target } from 'lucide-react'
import type { Action, Player, View } from '../game/types'
import { CATEGORIES, categoryName } from '../game/words'
import { Avatar, CopyInvite, RulesModal, useCountdown } from './ui'
import { whoosh } from '../game/sound'

interface Props {
  view: View
  send: (a: Action) => void
  onLeave: () => void
}

function catEmoji(cat: string) {
  return cat === 'own' ? '✍️' : (CATEGORIES.find((c) => c.id === cat)?.emoji ?? '❓')
}

export default function Board({ view, send, onLeave }: Props) {
  const [rules, setRules] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const offset = useMemo(() => view.hostNow - Date.now(), [view.rev, view.epoch, view.hostNow])
  const myGen = view.wordGen[view.me] ?? 0
  const players = [...view.players].sort((a, b) => a.order - b.order)
  const turnPlayer = players.find((p) => p.id === view.turn)
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '???'

  // notatki czyszczą się przy każdym nowym haśle
  useEffect(() => setNotes(''), [myGen])

  const claim = view.claim
  const reroll = view.reroll
  const claimLeft = useCountdown(claim?.expiresAt, offset)
  const rerollLeft = useCountdown(reroll?.expiresAt, offset)
  const busy = !!claim || !!reroll
  const iAmMyTurn = view.turn === view.me

  const singleCat = view.settings.categories.length === 1 ? view.settings.categories[0] : null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 px-3 pb-28 pt-3">
      <header className="flex flex-wrap items-center gap-2">
        <div className="mr-auto flex items-center gap-2">
          <span className="font-mono text-lg font-black tracking-widest text-amber-200">{view.code}</span>
          <span className="card flex items-center gap-1 px-2 py-1 text-xs font-bold">
            <Target size={14} /> do {view.settings.target} pkt
          </span>
        </div>
        <button className="btn btn-ghost !px-3 !py-2" onClick={() => setRules(true)} aria-label="Jak grać?">
          <HelpCircle size={18} />
        </button>
        <CopyInvite code={view.code} className="!px-3 !py-2 text-sm" />
        <button className="btn btn-ghost !px-3 !py-2" onClick={onLeave} aria-label="Wyjdź">
          <LogOut size={18} />
        </button>
      </header>

      <section className="card flex flex-wrap items-center justify-between gap-3 border-amber-300/40 p-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-violet-300">Tura #{view.turnNo}</div>
          <div className="text-xl font-black">
            Tura gracza: <span className="text-amber-200">{turnPlayer?.name ?? '—'}</span>
            {iAmMyTurn && ' (to Ty!)'}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            whoosh()
            send({ k: 'next' })
          }}
        >
          <SkipForward size={18} /> Następna tura
        </button>
      </section>

      {claim && (
        <section className="card anim-pop space-y-2 border-green-400/60 bg-green-500/15 p-3">
          {claim.target === view.me ? (
            <p className="font-bold">
              ⏳ Czekamy na potwierdzenie od innych graczy… ({claimLeft}s)
            </p>
          ) : (
            <>
              <p className="font-bold">
                Czy <span className="text-amber-200">{nameOf(claim.target)}</span> poprawnie odgadł(a) hasło:{' '}
                <span className="rounded bg-black/40 px-2 py-0.5 text-amber-200">{view.words[claim.target]?.text ?? '???'}</span>? — Potwierdź
              </p>
              {claim.by !== claim.target && <p className="text-xs text-violet-200">Zgłasza: {nameOf(claim.by)}</p>}
              {claim.by === view.me || claim.confirms.includes(view.me) || claim.rejects.includes(view.me) ? (
                <p className="text-sm text-violet-200">Twój głos został zapisany. Auto-potwierdzenie za {claimLeft}s.</p>
              ) : (
                <div className="flex gap-2">
                  <button className="btn btn-good flex-1" onClick={() => send({ k: 'vote', id: claim.id, ok: true })}>
                    <Check size={18} /> Potwierdź ({claimLeft}s)
                  </button>
                  <button className="btn btn-bad flex-1" onClick={() => send({ k: 'vote', id: claim.id, ok: false })}>
                    <X size={18} /> To nie to
                  </button>
                </div>
              )}
            </>
          )}
          <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
            <div key={claim.id} className="h-full bg-green-400" style={{ animation: `bar ${Math.max(claimLeft, 1)}s linear forwards` }} />
          </div>
        </section>
      )}

      {reroll && (
        <section className="card anim-pop space-y-2 border-sky-400/60 bg-sky-500/15 p-3">
          {reroll.target === view.me ? (
            <p className="font-bold">🔄 Gracze głosują nad zmianą Twojego hasła… ({rerollLeft}s)</p>
          ) : (
            <p className="font-bold">
              🔄 Głosowanie: zmienić hasło gracza <span className="text-amber-200">{nameOf(reroll.target)}</span> (
              {view.words[reroll.target]?.text ?? '???'})?
            </p>
          )}
          <p className="text-sm text-violet-200">
            Za: {reroll.yes.length} · Przeciw: {reroll.no.length} · {rerollLeft}s
          </p>
          {!reroll.yes.includes(view.me) && !reroll.no.includes(view.me) && (
            <div className="flex gap-2">
              <button className="btn btn-good flex-1" onClick={() => send({ k: 'rerollVote', id: reroll.id, ok: true })}>
                <Check size={18} /> Zmień
              </button>
              <button className="btn btn-bad flex-1" onClick={() => send({ k: 'rerollVote', id: reroll.id, ok: false })}>
                <X size={18} /> Zostaw
              </button>
            </div>
          )}
        </section>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((p) => (
          <PlayerCard
            key={p.id}
            p={p}
            view={view}
            isTurn={p.id === view.turn}
            isMe={p.id === view.me}
            busy={busy}
            singleCat={singleCat}
            send={send}
          />
        ))}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-3xl px-3 pb-2">
        <div className="card bg-[#1e0b36]/95 p-2 shadow-2xl">
          <button className="flex w-full items-center justify-between px-2 py-1 font-black" onClick={() => setNotesOpen(!notesOpen)}>
            <span className="flex items-center gap-2">
              <NotebookPen size={18} /> Moje notatki
            </span>
            {notesOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          {notesOpen && (
            <textarea
              className="input mt-2 h-28 resize-none"
              placeholder="Polak, raper, przed 30…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          )}
        </div>
      </div>
      {rules && <RulesModal onClose={() => setRules(false)} />}
    </div>
  )
}

function PlayerCard({
  p,
  view,
  isTurn,
  isMe,
  busy,
  singleCat,
  send,
}: {
  p: Player
  view: View
  isTurn: boolean
  isMe: boolean
  busy: boolean
  singleCat: string | null
  send: (a: Action) => void
}) {
  const w = view.words[p.id]
  return (
    <div
      className={`card relative space-y-3 p-3 ${isTurn ? 'turn-ring border-2' : ''} ${p.connected ? '' : 'opacity-50'}`}
      style={{ borderTopColor: p.avatar.color }}
    >
      <div className="flex items-center gap-3">
        <Avatar a={p.avatar} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-black">
            {p.name} {isMe && <span className="text-xs text-violet-300">(Ty)</span>}
          </div>
          <div className="text-xs text-violet-300">
            {isTurn ? '🎯 Jego/jej tura' : p.connected ? 'W grze' : 'Rozłączony(a)'}
          </div>
        </div>
        <div className="rounded-xl bg-black/40 px-3 py-1 text-2xl font-black text-amber-200">{p.score}</div>
      </div>

      <div className="flex min-h-[84px] flex-col items-center justify-center rounded-xl bg-black/35 p-3 text-center">
        {isMe || !w ? (
          <>
            <div className="text-4xl font-black tracking-widest text-violet-200">???</div>
            <div className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Ukryte hasło{singleCat ? ` · ${categoryName(singleCat)}` : ''}
            </div>
          </>
        ) : (
          <>
            <div key={w.text} className="anim-pop break-words text-2xl font-black leading-tight">
              {w.text}
            </div>
            <div className="mt-1 text-xs text-violet-300">
              {catEmoji(w.cat)} {w.cat === 'own' ? 'Własne hasło' : categoryName(w.cat)}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        {isMe ? (
          <button className="btn btn-good flex-1" disabled={busy} onClick={() => send({ k: 'claim', target: p.id })}>
            <Hand size={18} /> Zgadłem! (+1 pkt)
          </button>
        ) : (
          <button className="btn btn-ghost flex-1 !px-2 text-sm" disabled={busy} onClick={() => send({ k: 'claim', target: p.id })}>
            <Hand size={16} /> Zgadł! (+1 pkt)
          </button>
        )}
        <button
          className="btn btn-ghost !px-3 text-sm"
          disabled={busy}
          title="Głosuj za zmianą hasła"
          onClick={() => send({ k: 'rerollStart', target: p.id })}
        >
          <Shuffle size={16} /> <span className="hidden sm:inline">Zmień hasło</span>
        </button>
      </div>
    </div>
  )
}
