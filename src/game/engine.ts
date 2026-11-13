import { ALL_CATEGORY_IDS, CATEGORIES } from './words'
import type { Action, Avatar, Full, Player, Settings, View, Word } from './types'

export const CLAIM_MS = 5000
export const REROLL_MS = 15000
export const MAX_PLAYERS = 12
const LOBBY_GRACE_MS = 20000

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const norm = (s: string) => s.trim().toLowerCase()

export class Engine {
  s: Full
  customs: { by: string; text: string }[] = []
  deck: Word[] = []
  private disc = new Map<string, number>()

  constructor(code: string, host: { pid: string; name: string; avatar: Avatar }) {
    this.s = {
      code,
      rev: 1,
      epoch: 0,
      hostId: host.pid,
      phase: 'lobby',
      players: [],
      settings: { target: 6, categories: [...ALL_CATEGORY_IDS] },
      words: {},
      wordGen: {},
      turn: null,
      turnNo: 0,
      claim: null,
      reroll: null,
      timeline: [],
      log: [],
      logSeq: 0,
      idSeq: 1,
      winnerId: null,
    }
    this.addPlayer(host.pid, host.name, host.avatar)
  }

  /** Odtwarza silnik z widoku gracza, który przejmuje rolę hosta (migracja). */
  static recover(view: View, epoch: number): Engine {
    const e = Object.create(Engine.prototype) as Engine
    const { myCustoms, me, hostNow: _h, ...rest } = view
    void _h
    e.s = {
      ...rest,
      words: { ...view.words },
      wordGen: { ...view.wordGen },
      players: view.players.map((p) => ({ ...p, connected: p.id === me })),
      hostId: me,
      epoch,
      claim: null,
      reroll: null,
      rev: view.rev + 1,
    }
    e.customs = myCustoms.map((text) => ({ by: me, text }))
    e.deck = []
    e.disc = new Map(view.players.filter((p) => p.id !== me).map((p) => [p.id, Date.now()]))
    e.log(`Gospodarz pokoju się zmienił – gra toczy się dalej.`, 'info')
    return e
  }

  private bump() {
    this.s.rev++
  }

  private log(text: string, kind: 'info' | 'score' | 'reroll' | 'turn' = 'info', pid?: string, word?: string) {
    this.s.logSeq++
    this.s.log.push({ id: this.s.logSeq, kind, text, pid, word })
    if (this.s.log.length > 30) this.s.log.splice(0, this.s.log.length - 30)
  }

  private name(pid: string) {
    return this.s.players.find((p) => p.id === pid)?.name ?? '???'
  }

  private connectedPlayers() {
    return this.s.players.filter((p) => p.connected)
  }

  // ---------- gracze ----------

  private addPlayer(pid: string, name: string, avatar: Avatar) {
    const order = this.s.players.reduce((m, p) => Math.max(m, p.order), -1) + 1
    this.s.players.push({
      id: pid,
      name: name.trim().slice(0, 16) || 'Gracz',
      avatar,
      ready: false,
      connected: true,
      score: 0,
      customCount: 0,
      order,
    })
    this.s.words[pid] = null
    this.s.wordGen[pid] = 0
  }

  join(pid: string, name: string, avatar: Avatar, view: View | null): { ok: true } | { ok: false; reason: string } {
    const ex = this.s.players.find((p) => p.id === pid)
    if (ex) {
      ex.connected = true
      ex.name = name.trim().slice(0, 16) || ex.name
      ex.avatar = avatar
      this.disc.delete(pid)
      if (view) this.mergeView(pid, view)
      this.log(`${ex.name} wraca do gry.`)
      this.bump()
      return { ok: true }
    }
    if (this.s.phase !== 'lobby') return { ok: false, reason: 'Gra już trwa – dołączyć można tylko w lobby.' }
    if (this.s.players.length >= MAX_PLAYERS) return { ok: false, reason: 'Pokój jest pełny.' }
    this.addPlayer(pid, name, avatar)
    this.log(`${this.name(pid)} dołącza do pokoju.`)
    this.bump()
    return { ok: true }
  }

  /** Scala widok gracza po migracji hosta: odtwarza hasła, których nowy host nie zna. */
  private mergeView(sender: string, v: View) {
    const s = this.s
    if (v.rev > s.rev) {
      s.phase = v.phase
      s.settings = v.settings
      s.turn = v.turn
      s.turnNo = v.turnNo
      s.timeline = v.timeline
      s.winnerId = v.winnerId
      for (const p of s.players) {
        const q = v.players.find((x) => x.id === p.id)
        if (q) {
          p.score = q.score
          p.ready = q.ready
          p.customCount = q.customCount
        }
      }
    }
    for (const p of v.players) {
      if (p.id === sender) continue // własne hasło nadawcy jest zamaskowane
      const gen = v.wordGen[p.id] ?? 0
      const cur = s.wordGen[p.id] ?? 0
      const w = v.words[p.id]
      if (gen > cur || (gen === cur && !s.words[p.id] && w)) {
        s.words[p.id] = w ? { ...w } : null
        s.wordGen[p.id] = gen
      }
    }
    if (v.myCustoms.length) {
      this.customs = this.customs.filter((c) => c.by !== sender)
      v.myCustoms.forEach((text) => this.customs.push({ by: sender, text }))
    }
    s.logSeq = Math.max(s.logSeq, v.logSeq)
    s.idSeq = Math.max(s.idSeq, v.idSeq)
  }

  setConnected(pid: string, connected: boolean) {
    const p = this.s.players.find((x) => x.id === pid)
    if (!p || p.connected === connected) return
    p.connected = connected
    if (connected) this.disc.delete(pid)
    else {
      this.disc.set(pid, Date.now())
      this.log(`${p.name} rozłączył(a) się.`)
      if (this.s.turn === pid && this.s.phase === 'playing') this.advanceTurn()
    }
    this.bump()
  }

  leave(pid: string) {
    const p = this.s.players.find((x) => x.id === pid)
    if (!p) return
    if (this.s.phase === 'lobby') this.removePlayer(pid)
    else this.setConnected(pid, false)
    this.bump()
  }

  private removePlayer(pid: string) {
    this.s.players = this.s.players.filter((p) => p.id !== pid)
    delete this.s.words[pid]
    delete this.s.wordGen[pid]
    this.customs = this.customs.filter((c) => c.by !== pid)
    this.disc.delete(pid)
    this.refreshCustomCounts()
  }

  private refreshCustomCounts() {
    for (const p of this.s.players) p.customCount = this.customs.filter((c) => c.by === p.id).length
  }

  // ---------- akcje ----------

  act(pid: string, a: Action): boolean {
    const s = this.s
    const me = s.players.find((p) => p.id === pid)
    if (!me) return false
    switch (a.k) {
      case 'ready':
        if (s.phase !== 'lobby') return false
        me.ready = !!a.v
        break
      case 'profile':
        me.name = a.name.trim().slice(0, 16) || me.name
        me.avatar = a.avatar
        break
      case 'settings': {
        if (s.phase !== 'lobby') return false
        const st: Settings = { ...s.settings }
        if (a.patch.target !== undefined && [3, 5, 6, 10].includes(a.patch.target)) st.target = a.patch.target
        if (a.patch.categories) {
          const cats = a.patch.categories.filter((c) => ALL_CATEGORY_IDS.includes(c))
          if (cats.length) st.categories = cats
        }
        s.settings = st
        s.players.forEach((p) => (p.ready = false))
        break
      }
      case 'custom': {
        if (s.phase !== 'lobby') return false
        const texts = a.texts.map((t) => t.trim().slice(0, 40)).filter(Boolean).slice(0, 2)
        this.customs = this.customs.filter((c) => c.by !== pid)
        texts.forEach((text) => this.customs.push({ by: pid, text }))
        this.refreshCustomCounts()
        break
      }
      case 'start':
        if (s.phase !== 'lobby') return false
        if (!this.startGame()) return false
        break
      case 'claim':
        if (!this.startClaim(pid, a.target)) return false
        break
      case 'vote':
        if (!this.voteClaim(pid, a.id, a.ok)) return false
        break
      case 'next':
        if (s.phase !== 'playing') return false
        this.advanceTurn()
        break
      case 'rerollStart':
        if (!this.startReroll(pid, a.target)) return false
        break
      case 'rerollVote':
        if (!this.voteReroll(pid, a.id, a.ok)) return false
        break
      case 'again':
        if (s.phase !== 'finished') return false
        this.resetToLobby()
        break
    }
    this.bump()
    return true
  }

  // ---------- talia ----------

  private usedTexts(): Set<string> {
    const used = new Set<string>()
    Object.values(this.s.words).forEach((w) => w && used.add(norm(w.text)))
    this.s.timeline.forEach((t) => t.text && used.add(norm(t.text)))
    return used
  }

  private buildDeck() {
    const used = this.usedTexts()
    const base: Word[] = []
    for (const c of CATEGORIES) {
      if (!this.s.settings.categories.includes(c.id)) continue
      for (const text of c.words) if (!used.has(norm(text))) base.push({ text, cat: c.id })
    }
    const own: Word[] = this.customs
      .filter((c) => !used.has(norm(c.text)))
      .map((c) => ({ text: c.text, cat: 'own', by: c.by }))
    // Własne hasła trafiają na górę talii, żeby na pewno zostały rozdane.
    this.deck = [...shuffle(own), ...shuffle(base)]
  }

  private draw(pid: string): Word {
    const onBoard = new Set<string>()
    Object.values(this.s.words).forEach((w) => w && onBoard.add(norm(w.text)))
    for (let attempt = 0; attempt < 2; attempt++) {
      if (this.deck.length === 0) this.buildDeck()
      const idx = this.deck.findIndex((w) => w.by !== pid && !onBoard.has(norm(w.text)))
      if (idx >= 0) return this.deck.splice(idx, 1)[0]
      this.deck = []
    }
    // awaryjnie: cokolwiek z wybranych kategorii
    const pool = CATEGORIES.filter((c) => this.s.settings.categories.includes(c.id)).flatMap((c) =>
      c.words.map((text) => ({ text, cat: c.id })),
    )
    return pool[Math.floor(Math.random() * pool.length)]
  }

  private deal(pid: string) {
    this.s.words[pid] = this.draw(pid)
    this.s.wordGen[pid] = (this.s.wordGen[pid] ?? 0) + 1
  }

  // ---------- przebieg gry ----------

  private startGame(): boolean {
    const s = this.s
    const active = this.connectedPlayers()
    if (active.length < 2) return false
    if (!active.every((p) => p.ready)) return false
    // zostają tylko połączeni gracze
    s.players.filter((p) => !p.connected).forEach((p) => this.removePlayer(p.id))
    this.deck = []
    this.buildDeck()
    s.timeline = []
    s.winnerId = null
    s.claim = null
    s.reroll = null
    s.players.forEach((p) => (p.score = 0))
    // własne hasła rozdajemy tak, by nikt nie dostał swojego
    for (const p of shuffle(s.players)) this.deal(p.id)
    s.phase = 'playing'
    s.turnNo = 1
    s.turn = s.players[Math.floor(Math.random() * s.players.length)].id
    this.log(`Gra się zaczyna! Do ${s.settings.target} pkt.`, 'info')
    this.log(`Tura gracza: ${this.name(s.turn)}`, 'turn')
    return true
  }

  private advanceTurn() {
    const s = this.s
    const list = [...s.players].sort((a, b) => a.order - b.order).filter((p) => p.connected)
    if (!list.length) return
    const i = list.findIndex((p) => p.id === s.turn)
    const next = list[(i + 1) % list.length]
    s.turn = next.id
    s.turnNo++
    this.log(`Tura gracza: ${next.name}`, 'turn')
  }

  private startClaim(by: string, target: string): boolean {
    const s = this.s
    if (s.phase !== 'playing' || s.claim || s.reroll) return false
    if (!s.players.some((p) => p.id === target)) return false
    s.claim = { id: s.idSeq++, target, by, confirms: [], rejects: [], expiresAt: Date.now() + CLAIM_MS }
    return true
  }

  private claimVoters(): string[] {
    const c = this.s.claim
    if (!c) return []
    return this.connectedPlayers()
      .map((p) => p.id)
      .filter((id) => id !== c.target && id !== c.by)
  }

  private voteClaim(pid: string, id: number, ok: boolean): boolean {
    const c = this.s.claim
    if (!c || c.id !== id || pid === c.target || pid === c.by) return false
    if (c.confirms.includes(pid) || c.rejects.includes(pid)) return false
    if (ok) c.confirms.push(pid)
    else c.rejects.push(pid)
    this.checkClaim(false)
    return true
  }

  private checkClaim(expired: boolean) {
    const c = this.s.claim
    if (!c) return
    const voters = this.claimVoters()
    // dla zgłoszenia od innego gracza jego kliknięcie to już „głos za”
    const peerClaim = c.by !== c.target
    if (c.confirms.length >= 1 || (peerClaim && voters.length === 0 && c.rejects.length === 0)) return this.resolveClaim(true)
    if (voters.length > 0 && c.rejects.length * 2 > voters.length) return this.resolveClaim(false)
    if (c.rejects.length > 0 && voters.length === 0) return this.resolveClaim(false)
    if (expired) this.resolveClaim(c.rejects.length === 0)
  }

  private resolveClaim(ok: boolean) {
    const s = this.s
    const c = s.claim
    if (!c) return
    s.claim = null
    if (!ok) {
      this.log(`Odgadnięcie hasła przez ${this.name(c.target)} zostało odrzucone.`, 'info')
      return
    }
    const w = s.words[c.target]
    const p = s.players.find((x) => x.id === c.target)
    if (!w || !p) return
    s.timeline.push({ pid: p.id, text: w.text, cat: w.cat, result: 'guessed' })
    p.score++
    this.log(`${p.name} odgaduje hasło i zdobywa punkt!`, 'score', p.id, w.text)
    if (p.score >= s.settings.target) {
      this.finish(p.id)
    } else {
      this.deal(p.id)
    }
  }

  private finish(winner: string) {
    const s = this.s
    s.phase = 'finished'
    s.winnerId = winner
    s.claim = null
    s.reroll = null
    for (const p of s.players) {
      const w = s.words[p.id]
      if (w) s.timeline.push({ pid: p.id, text: w.text, cat: w.cat, result: 'final' })
    }
    this.log(`${this.name(winner)} wygrywa grę!`, 'info')
  }

  private startReroll(by: string, target: string): boolean {
    const s = this.s
    if (s.phase !== 'playing' || s.claim || s.reroll) return false
    if (!s.players.some((p) => p.id === target)) return false
    s.reroll = { id: s.idSeq++, target, by, yes: [by], no: [], expiresAt: Date.now() + REROLL_MS }
    this.checkReroll(false)
    return true
  }

  private voteReroll(pid: string, id: number, ok: boolean): boolean {
    const r = this.s.reroll
    if (!r || r.id !== id) return false
    if (r.yes.includes(pid) || r.no.includes(pid)) return false
    ;(ok ? r.yes : r.no).push(pid)
    this.checkReroll(false)
    return true
  }

  private checkReroll(expired: boolean) {
    const r = this.s.reroll
    if (!r) return
    const total = this.connectedPlayers().length
    if (r.yes.length * 2 > total) return this.resolveReroll(true)
    if (r.no.length * 2 >= total) return this.resolveReroll(false)
    if (expired) this.resolveReroll(false)
  }

  private resolveReroll(ok: boolean) {
    const s = this.s
    const r = s.reroll
    if (!r) return
    s.reroll = null
    const w = s.words[r.target]
    if (!ok || !w) {
      this.log(`Głosowanie: hasło gracza ${this.name(r.target)} zostaje bez zmian.`, 'info')
      return
    }
    s.timeline.push({ pid: r.target, text: w.text, cat: w.cat, result: 'rerolled' })
    this.deal(r.target)
    this.log(`Gracze zmienili hasło gracza ${this.name(r.target)}.`, 'reroll', r.target)
  }

  private resetToLobby() {
    const s = this.s
    s.phase = 'lobby'
    s.winnerId = null
    s.turn = null
    s.turnNo = 0
    s.claim = null
    s.reroll = null
    s.timeline = []
    s.players.filter((p) => !p.connected).forEach((p) => this.removePlayer(p.id))
    for (const p of s.players) {
      p.score = 0
      p.ready = false
      s.words[p.id] = null
    }
    this.customs = []
    this.refreshCustomCounts()
    this.deck = []
    this.log('Nowa runda – wróciliśmy do lobby.')
  }

  /** Wywoływane cyklicznie przez hosta. Zwraca true, gdy stan się zmienił. */
  tick(now = Date.now()): boolean {
    const s = this.s
    let changed = false
    if (s.claim && now >= s.claim.expiresAt) {
      this.checkClaim(true)
      changed = true
    }
    if (s.reroll && now >= s.reroll.expiresAt) {
      this.checkReroll(true)
      changed = true
    }
    if (s.phase === 'lobby') {
      for (const [pid, t] of [...this.disc]) {
        if (now - t > LOBBY_GRACE_MS) {
          this.removePlayer(pid)
          changed = true
        }
      }
    }
    if (changed) this.bump()
    return changed
  }

  // ---------- widok ----------

  viewFor(pid: string): View {
    const s = this.s
    const finished = s.phase === 'finished'
    const words: Record<string, Word | null> = {}
    for (const p of s.players) {
      const w = s.words[p.id]
      words[p.id] = p.id === pid && !finished ? null : w ? { text: w.text, cat: w.cat } : null
    }
    return {
      ...s,
      words,
      players: s.players.map((p) => ({ ...p })),
      timeline: s.timeline.map((t) =>
        t.pid === pid && t.result === 'rerolled' && !finished ? { ...t, text: null } : t,
      ),
      myCustoms: this.customs.filter((c) => c.by === pid).map((c) => c.text),
      me: pid,
      hostNow: Date.now(),
    }
  }
}

export type { Player }
