import Peer, { type DataConnection } from 'peerjs'
import { Engine } from './engine'
import type { Action, Avatar, Msg, View } from './types'

const PREFIX = 'czolko-online-'
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const MAX_EPOCH = 8

export type Status = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface Snapshot {
  status: Status
  view: View | null
  error: string | null
  role: 'host' | 'client' | null
  code: string | null
}

export interface Profile {
  pid: string
  name: string
  avatar: Avatar
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function randomCode() {
  let c = ''
  for (let i = 0; i < 5; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return c
}

export function normalizeCode(s: string) {
  return s.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5)
}

function registerPeer(id?: string): Promise<Peer> {
  return new Promise((resolve, reject) => {
    const peer = id ? new Peer(id) : new Peer()
    const timer = setTimeout(() => {
      peer.destroy()
      reject({ type: 'timeout' })
    }, 12000)
    peer.on('open', () => {
      clearTimeout(timer)
      peer.removeAllListeners('error')
      resolve(peer)
    })
    peer.on('error', (e) => {
      clearTimeout(timer)
      peer.destroy()
      reject(e)
    })
  })
}

export class Session {
  private listeners = new Set<() => void>()
  snapshot: Snapshot = { status: 'idle', view: null, error: null, role: null, code: null }

  private profile!: Profile
  private code = ''
  private peer: Peer | null = null
  private hostConn: DataConnection | null = null
  private engine: Engine | null = null
  private conns = new Map<string, DataConnection>()
  private connPid = new Map<DataConnection, string>()
  private tickTimer: ReturnType<typeof setInterval> | null = null
  private lastView: View | null = null
  private leaving = false
  private generation = 0

  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  getSnapshot = () => this.snapshot

  private set(p: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...p }
    this.listeners.forEach((l) => l())
  }

  private setView(view: View) {
    if (this.lastView && view.epoch === this.lastView.epoch && view.rev < this.lastView.rev) return
    this.lastView = view
    this.set({ view })
  }

  // ---------- start ----------

  async create(profile: Profile) {
    this.reset(profile)
    this.set({ status: 'connecting' })
    for (let i = 0; i < 6; i++) {
      const code = randomCode()
      try {
        const peer = await registerPeer(PREFIX + code)
        this.code = code
        this.startHost(peer, new Engine(code, profile))
        return
      } catch (e) {
        const type = (e as { type?: string }).type
        if (type !== 'unavailable-id') {
          this.fail('Nie udało się połączyć z serwerem sygnalizacyjnym. Sprawdź internet i spróbuj ponownie.')
          return
        }
      }
    }
    this.fail('Nie udało się utworzyć pokoju. Spróbuj ponownie.')
  }

  async join(code: string, profile: Profile) {
    this.reset(profile)
    this.code = normalizeCode(code)
    this.set({ status: 'connecting', code: this.code })
    if (this.code.length !== 5) return this.fail('Kod pokoju ma 5 liter.')
    try {
      this.peer = await registerPeer()
    } catch {
      return this.fail('Nie udało się połączyć z serwerem sygnalizacyjnym. Sprawdź internet i spróbuj ponownie.')
    }
    const gen = this.generation
    const ids = [PREFIX + this.code, ...Array.from({ length: MAX_EPOCH }, (_, i) => `${PREFIX}${this.code}-h${i + 1}`)]
    for (const id of ids) {
      if (gen !== this.generation) return
      const conn = await this.tryConnect(id)
      if (conn) {
        this.attachClient(conn)
        return
      }
    }
    this.fail('Nie znaleziono pokoju o tym kodzie. Sprawdź kod albo poproś o nowy link.')
  }

  private reset(profile: Profile) {
    this.teardown()
    this.generation++
    this.profile = profile
    this.leaving = false
    this.lastView = null
    this.set({ status: 'idle', view: null, error: null, role: null, code: null })
  }

  private teardown() {
    if (this.tickTimer) clearInterval(this.tickTimer)
    this.tickTimer = null
    this.conns.forEach((c) => c.close())
    this.conns.clear()
    this.connPid.clear()
    this.hostConn?.close()
    this.hostConn = null
    this.peer?.destroy()
    this.peer = null
    this.engine = null
  }

  private fail(msg: string) {
    this.teardown()
    this.set({ status: 'error', error: msg, view: null, role: null })
  }

  // ---------- klient ----------

  private tryConnect(id: string, timeoutMs = 7000): Promise<DataConnection | null> {
    return new Promise((resolve) => {
      const peer = this.peer
      if (!peer || peer.destroyed) return resolve(null)
      if (peer.disconnected) peer.reconnect()
      let done = false
      const conn = peer.connect(id, { reliable: true })
      const finish = (r: DataConnection | null) => {
        if (done) return
        done = true
        clearTimeout(t)
        peer.off('error', onErr)
        if (!r) conn.close()
        resolve(r)
      }
      const onErr = (e: { type?: string; message?: string }) => {
        if (e.type === 'peer-unavailable' && e.message?.includes(id)) finish(null)
      }
      const t = setTimeout(() => finish(null), timeoutMs)
      peer.on('error', onErr)
      conn.on('open', () => finish(conn))
    })
  }

  private attachClient(conn: DataConnection) {
    this.hostConn = conn
    this.set({ role: 'client', status: 'connected', error: null })
    conn.on('data', (m) => this.onHostMsg(m as Msg))
    conn.on('close', () => {
      if (this.hostConn === conn) this.onHostLost()
    })
    this.sendTo(conn, {
      t: 'hello',
      pid: this.profile.pid,
      name: this.profile.name,
      avatar: this.profile.avatar,
      view: this.lastView,
    })
  }

  private onHostMsg(m: Msg) {
    if (m.t === 'state') {
      this.setView(m.view)
      if (this.snapshot.status !== 'connected') this.set({ status: 'connected' })
    } else if (m.t === 'reject') {
      this.leaving = true
      this.fail(m.reason)
    }
  }

  // ---------- migracja hosta ----------

  private async onHostLost() {
    if (this.leaving) return
    this.hostConn = null
    const view = this.lastView
    if (!view) return this.fail('Utracono połączenie z pokojem.')
    this.set({ status: 'reconnecting' })
    await this.migrate(view, view.epoch + 1, new Set([view.hostId]))
  }

  private async migrate(view: View, epoch: number, dead: Set<string>) {
    const gen = this.generation
    if (epoch > MAX_EPOCH) return this.fail('Utracono połączenie z pokojem.')
    const me = this.profile.pid
    const survivors = view.players.filter((p) => !dead.has(p.id) && (p.id === me || p.connected))
    let rank = survivors.findIndex((p) => p.id === me)
    if (rank < 0) rank = survivors.length
    const hostPeerId = `${PREFIX}${this.code}-h${epoch}`

    // Faza 1: gracze o niższym priorytecie czekają i sprawdzają, czy ktoś już przejął pokój.
    const start = Date.now()
    while (Date.now() - start < rank * 2000) {
      if (gen !== this.generation || this.leaving) return
      const conn = await this.tryConnect(hostPeerId, 2500)
      if (conn) return this.attachClient(conn)
      await sleep(700)
    }
    if (gen !== this.generation || this.leaving) return

    // Faza 2: próba zajęcia identyfikatora nowego hosta.
    try {
      this.peer?.destroy()
      this.peer = null
      const peer = await registerPeer(hostPeerId)
      if (gen !== this.generation || this.leaving) {
        peer.destroy()
        return
      }
      this.startHost(peer, Engine.recover(view, epoch))
    } catch (e) {
      const type = (e as { type?: string }).type
      try {
        this.peer = await registerPeer()
      } catch {
        return this.fail('Utracono połączenie z pokojem.')
      }
      if (type === 'unavailable-id') {
        // ktoś inny został hostem – dołączamy do niego
        for (let i = 0; i < 8; i++) {
          if (gen !== this.generation || this.leaving) return
          const conn = await this.tryConnect(hostPeerId, 3000)
          if (conn) return this.attachClient(conn)
          await sleep(1000)
        }
      }
      await this.migrate(view, epoch + 1, dead)
    }
  }

  // ---------- host ----------

  private startHost(peer: Peer, engine: Engine) {
    this.peer = peer
    this.engine = engine
    this.hostConn = null
    this.code = engine.s.code
    peer.on('connection', (conn) => {
      conn.on('data', (m) => this.onClientMsg(conn, m as Msg))
      conn.on('close', () => this.onClientClosed(conn))
    })
    peer.on('error', () => {
      /* błędy pojedynczych połączeń nie powinny zabijać pokoju */
    })
    peer.on('disconnected', () => {
      if (!peer.destroyed) peer.reconnect()
    })
    this.tickTimer = setInterval(() => {
      if (this.engine?.tick()) this.flush()
    }, 400)
    this.set({ role: 'host', status: 'connected', error: null, code: engine.s.code })
    this.flush()
  }

  private onClientMsg(conn: DataConnection, m: Msg) {
    const engine = this.engine
    if (!engine) return
    if (m.t === 'hello') {
      const r = engine.join(m.pid, m.name, m.avatar, m.view)
      if (!r.ok) {
        this.sendTo(conn, { t: 'reject', reason: r.reason })
        setTimeout(() => conn.close(), 400)
        return
      }
      const old = this.conns.get(m.pid)
      this.conns.set(m.pid, conn)
      this.connPid.set(conn, m.pid)
      if (old && old !== conn) {
        this.connPid.delete(old)
        old.close()
      }
      this.flush()
    } else if (m.t === 'act') {
      const pid = this.connPid.get(conn)
      if (pid && engine.act(pid, m.a)) this.flush()
    } else if (m.t === 'bye') {
      const pid = this.connPid.get(conn)
      if (pid) {
        engine.leave(pid)
        this.conns.delete(pid)
        this.connPid.delete(conn)
        this.flush()
      }
    }
  }

  private onClientClosed(conn: DataConnection) {
    const pid = this.connPid.get(conn)
    if (!pid || this.conns.get(pid) !== conn) return
    this.conns.delete(pid)
    this.connPid.delete(conn)
    this.engine?.setConnected(pid, false)
    this.flush()
  }

  private flush() {
    const engine = this.engine
    if (!engine) return
    for (const [pid, conn] of this.conns) this.sendTo(conn, { t: 'state', view: engine.viewFor(pid) })
    this.setView(engine.viewFor(this.profile.pid))
  }

  private sendTo(conn: DataConnection, m: Msg) {
    try {
      if (conn.open) conn.send(m)
    } catch {
      /* połączenie padło – obsłuży to zdarzenie close */
    }
  }

  // ---------- API dla UI ----------

  send(a: Action) {
    if (this.engine) {
      if (this.engine.act(this.profile.pid, a)) this.flush()
    } else if (this.hostConn) {
      this.sendTo(this.hostConn, { t: 'act', a })
    }
  }

  leave() {
    this.leaving = true
    if (this.engine) {
      this.engine.leave(this.profile.pid)
      for (const [pid, conn] of this.conns) this.sendTo(conn, { t: 'state', view: this.engine.viewFor(pid) })
    } else if (this.hostConn) {
      this.sendTo(this.hostConn, { t: 'bye' })
    }
    const gen = this.generation
    // krótka zwłoka, by wiadomość „bye” zdążyła wyjść
    setTimeout(() => {
      if (gen !== this.generation) return
      this.teardown()
      this.generation++
      this.lastView = null
      this.set({ status: 'idle', view: null, error: null, role: null, code: null })
    }, 150)
  }
}

export const session = new Session()
