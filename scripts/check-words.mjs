import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/game/words.ts', import.meta.url), 'utf8')
const cats = [...src.matchAll(/id: '(\w+)',[\s\S]*?words: \[([\s\S]*?)\],\r?\n  \}/g)]
const all = new Set()
let total = 0
let bad = cats.length !== 6
for (const [, id, body] of cats) {
  const ws = [...body.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1])
  total += ws.length
  ws.forEach((w) => all.add(w.toLowerCase()))
  const dup = new Set(ws.map((w) => w.toLowerCase())).size !== ws.length
  console.log(id, ws.length, dup ? 'DUPLICATES!' : '')
  if (ws.length < 50 || dup) bad = true
}
console.log('total', total, 'unique', all.size)
if (total < 300 || all.size !== total) bad = true
process.exit(bad ? 1 : 0)
