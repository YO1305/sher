/**
 * Generates solid-color PNG icons for PWA (no external deps).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcBuf))
  return Buffer.concat([len, typeBuf, data, crc])
}

function createPng(size, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const rowSize = 1 + size * 3
  const raw = Buffer.alloc(rowSize * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize
    raw[rowStart] = 0
    for (let x = 0; x < size; x++) {
      const i = rowStart + 1 + x * 3
      const edge = Math.min(x, y, size - 1 - x, size - 1 - y)
      const corner = size * 0.12
      if (edge < corner) {
        const t = edge / corner
        raw[i] = Math.round(r * t)
        raw[i + 1] = Math.round(g * t)
        raw[i + 2] = Math.round(b * t)
      } else {
        raw[i] = r
        raw[i + 1] = g
        raw[i + 2] = b
      }
    }
  }

  const compressed = zlib.deflateSync(raw)
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })
const color = { r: 99, g: 102, b: 241 }
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPng(192, color.r, color.g, color.b))
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPng(512, color.r, color.g, color.b))
console.log('PWA icons generated')
