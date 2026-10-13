// Minimal QR code encoder (byte mode, error-correction level M, versions 1-6).
// Good for short strings such as a web address. Returns a square matrix of booleans.

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 256) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}
const gfMul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0)

function rsGenerator(degree) {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMul(poly[j], EXP[i])
    }
    poly = next
  }
  return poly
}

function rsRemainder(data, ecLen) {
  const gen = rsGenerator(ecLen)
  const rem = new Array(ecLen).fill(0)
  for (const byte of data) {
    const factor = byte ^ rem.shift()
    rem.push(0)
    if (factor) for (let i = 0; i < ecLen; i++) rem[i] ^= gfMul(gen[i + 1], factor)
  }
  return rem
}

// Level M, versions 1..6: [data codewords per block, ec codewords per block, block count]
const VERSIONS = {
  1: [16, 10, 1],
  2: [28, 16, 1],
  3: [44, 26, 1],
  4: [32, 18, 2],
  5: [43, 24, 2],
  6: [27, 16, 4],
}
const ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] }

function toUtf8(text) {
  return Array.from(new TextEncoder().encode(text))
}

export function makeQr(text) {
  const bytes = toUtf8(text)
  let version = 0
  for (let v = 1; v <= 6; v++) {
    const [dataPer, , blocks] = VERSIONS[v]
    if (bytes.length + 2 <= dataPer * blocks) {
      version = v
      break
    }
  }
  if (!version) throw new Error('Text is too long for this small QR encoder')
  const [dataPer, ecPer, blocks] = VERSIONS[version]
  const dataCapacity = dataPer * blocks

  // 1. Build the data bit stream
  const bits = []
  const push = (value, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  push(0b0100, 4)
  push(bytes.length, 8)
  bytes.forEach((b) => push(b, 8))
  const maxBits = dataCapacity * 8
  push(0, Math.min(4, maxBits - bits.length))
  while (bits.length % 8) bits.push(0)
  const codewords = []
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j]
    codewords.push(v)
  }
  for (let pad = 0xec; codewords.length < dataCapacity; pad ^= 0xec ^ 0x11) codewords.push(pad)

  // 2. Split into blocks, add error correction, interleave
  const dataBlocks = []
  const ecBlocks = []
  for (let b = 0; b < blocks; b++) {
    const chunk = codewords.slice(b * dataPer, (b + 1) * dataPer)
    dataBlocks.push(chunk)
    ecBlocks.push(rsRemainder(chunk, ecPer))
  }
  const finalWords = []
  for (let i = 0; i < dataPer; i++) dataBlocks.forEach((blk) => finalWords.push(blk[i]))
  for (let i = 0; i < ecPer; i++) ecBlocks.forEach((blk) => finalWords.push(blk[i]))
  const stream = []
  finalWords.forEach((w) => {
    for (let i = 7; i >= 0; i--) stream.push((w >>> i) & 1)
  })
  if (version >= 2) for (let i = 0; i < 7; i++) stream.push(0) // remainder bits

  // 3. Draw function patterns
  const size = 17 + 4 * version
  const mod = Array.from({ length: size }, () => new Array(size).fill(false))
  const fn = Array.from({ length: size }, () => new Array(size).fill(false))
  const setFn = (col, row, dark) => {
    if (col < 0 || row < 0 || col >= size || row >= size) return
    mod[row][col] = dark
    fn[row][col] = true
  }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        setFn(cx + dx, cy + dy, dist !== 2 && dist !== 4)
      }
    }
  }
  // Timing patterns first; finder squares are drawn on top of their ends
  for (let i = 0; i < size; i++) {
    setFn(6, i, i % 2 === 0)
    setFn(i, 6, i % 2 === 0)
  }
  finder(3, 3)
  finder(size - 4, 3)
  finder(3, size - 4)
  const centers = ALIGN[version]
  centers.forEach((cy, yi) => {
    centers.forEach((cx, xi) => {
      const onFinder =
        (xi === 0 && yi === 0) ||
        (xi === 0 && yi === centers.length - 1) ||
        (xi === centers.length - 1 && yi === 0)
      if (onFinder) return
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          setFn(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    })
  })
  // Reserve format areas (real bits are written after masking)
  const drawFormat = (mask) => {
    const data = (0 << 3) | mask // level M = 00
    let rem = data << 10
    for (let i = 14; i >= 10; i--) if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10)
    const fmt = ((data << 10) | rem) ^ 0x5412
    const bit = (i) => ((fmt >>> i) & 1) === 1
    for (let i = 0; i <= 5; i++) setFn(8, i, bit(i))
    setFn(8, 7, bit(6))
    setFn(8, 8, bit(7))
    setFn(7, 8, bit(8))
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(i))
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(i))
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(i))
    setFn(8, size - 8, true) // always-dark module
  }
  drawFormat(0)

  // 4. Place data bits in the zig-zag pattern
  let idx = 0
  let dir = -1
  let row = size - 1
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (;;) {
      for (let k = 0; k < 2; k++) {
        const c = col - k
        if (!fn[row][c]) mod[row][c] = idx < stream.length ? stream[idx++] === 1 : false
      }
      row += dir
      if (row < 0 || row >= size) {
        dir = -dir
        row += dir
        break
      }
    }
  }

  // 5. Choose the best mask
  const maskFn = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ]
  const applyMask = (mask) => {
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (!fn[r][c] && maskFn[mask](r, c)) mod[r][c] = !mod[r][c]
  }
  const penalty = () => {
    let score = 0
    const lines = []
    for (let r = 0; r < size; r++) lines.push(mod[r].slice())
    for (let c = 0; c < size; c++) lines.push(mod.map((row) => row[c]))
    for (const line of lines) {
      let run = 1
      for (let i = 1; i <= size; i++) {
        if (i < size && line[i] === line[i - 1]) run++
        else {
          if (run >= 5) score += 3 + (run - 5)
          run = 1
        }
      }
      const str = line.map((v) => (v ? '1' : '0')).join('')
      const pats = ['00001011101', '10111010000']
      pats.forEach((p) => {
        let at = str.indexOf(p)
        while (at !== -1) {
          score += 40
          at = str.indexOf(p, at + 1)
        }
      })
    }
    for (let r = 0; r < size - 1; r++)
      for (let c = 0; c < size - 1; c++) {
        const v = mod[r][c]
        if (v === mod[r][c + 1] && v === mod[r + 1][c] && v === mod[r + 1][c + 1]) score += 3
      }
    let dark = 0
    mod.forEach((row) => row.forEach((v) => v && dark++))
    const pct = (dark * 100) / (size * size)
    score += Math.floor(Math.abs(pct - 50) / 5) * 10
    return score
  }
  let best = 0
  let bestScore = Infinity
  for (let m = 0; m < 8; m++) {
    applyMask(m)
    drawFormat(m)
    const s = penalty()
    if (s < bestScore) {
      bestScore = s
      best = m
    }
    applyMask(m) // undo
  }
  applyMask(best)
  drawFormat(best)
  return mod
}
