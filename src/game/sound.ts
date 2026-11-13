let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new C()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'triangle', vol = 0.18) {
  const a = ac()
  if (!a) return
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.value = freq
  const t0 = a.currentTime + start
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(a.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.05)
}

/** Fanfara po poprawnym odgadnięciu hasła. */
export function fanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5]
  notes.forEach((f, i) => tone(f, i * 0.11, 0.28, 'square', 0.1))
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f) => tone(f, 0.8, 0.9, 'triangle', 0.12))
}

export function ping() {
  tone(880, 0, 0.12, 'sine', 0.15)
  tone(1175, 0.1, 0.15, 'sine', 0.15)
}

export function whoosh() {
  tone(300, 0, 0.1, 'sawtooth', 0.06)
  tone(450, 0.08, 0.12, 'sawtooth', 0.06)
}

export function unlockAudio() {
  ac()
}
