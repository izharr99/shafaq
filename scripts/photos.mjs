// Turns the originals in photos-src/ into responsive AVIF + WebP files in
// public/photos/, then writes each photo's size, colour palette and blur-up
// placeholder back into src/content.json.
//
//   pnpm photos            process new or changed photos
//   pnpm photos --force    re-encode everything
//
// A photo is listed in content.json under "photos" with a "file" that exists
// in photos-src/. Everything else (w, h, sizes, palette, blur) is generated.
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const contentPath = path.join(root, 'src/content.json')
const srcDir = path.join(root, 'photos-src')
const outDir = path.join(root, 'public/photos')
const force = process.argv.includes('--force')

const LANDSCAPE = [800, 1600, 2400]
const PORTRAIT = [600, 1200, 1800]

fs.mkdirSync(outDir, { recursive: true })
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'))

// ---------- colour helpers ----------
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
const lum = ([r, g, b]) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h /= 6
  }
  return [h, s, l]
}
function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const hue = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255]
}

// Small k-means over a 48px thumbnail: returns clusters sorted by population.
function kmeans(pixels, k = 6, iters = 12) {
  let centers = Array.from({ length: k }, (_, i) => pixels[Math.floor((i + 0.5) * pixels.length / k)].slice())
  let counts = new Array(k).fill(0)
  for (let it = 0; it < iters; it++) {
    const sums = Array.from({ length: k }, () => [0, 0, 0])
    counts = new Array(k).fill(0)
    for (const p of pixels) {
      let best = 0, bd = Infinity
      for (let c = 0; c < k; c++) {
        const d = (p[0] - centers[c][0]) ** 2 + (p[1] - centers[c][1]) ** 2 + (p[2] - centers[c][2]) ** 2
        if (d < bd) { bd = d; best = c }
      }
      sums[best][0] += p[0]; sums[best][1] += p[1]; sums[best][2] += p[2]; counts[best]++
    }
    centers = centers.map((c, i) => (counts[i] ? sums[i].map((v) => v / counts[i]) : c))
  }
  return centers.map((c, i) => ({ rgb: c, n: counts[i] / pixels.length })).filter((c) => c.n > 0).sort((a, b) => b.n - a.n)
}

// bg: the photo's dominant hue, pushed dark enough to sit around it.
// accent: its most vivid bright colour. ink: a light tint of the accent that
// always clears 7:1 against bg.
function palette(clusters) {
  const dom = clusters[0].rgb
  const scored = clusters.filter((c) => c.n > 0.04).map((c) => {
    const [, s, l] = rgbToHsl(c.rgb)
    return { ...c, score: s * (1 - Math.abs(l - 0.55)) * Math.sqrt(c.n) }
  }).sort((a, b) => b.score - a.score)
  const accentSrc = scored[0].rgb
  const [dh, ds] = rgbToHsl(dom)
  const bg = hslToRgb([dh, ds < 0.06 ? ds : Math.min(0.62, ds * 1.35 + 0.08), 0.115])
  const [ah, as, al] = rgbToHsl(accentSrc)
  const accent = hslToRgb([ah, Math.min(0.85, Math.max(as, 0.45)), Math.min(Math.max(al, 0.6), 0.72)])
  let ink = hslToRgb([ah, Math.min(as, 0.5) * 0.6, 0.93])
  for (let l = 0.93; contrast(ink, bg) < 7 && l < 0.99; l += 0.01) ink = hslToRgb([ah, Math.min(as, 0.5) * 0.4, l])
  return {
    bg: toHex(bg),
    ink: toHex(ink),
    accent: toHex(accent),
    swatches: clusters.slice(0, 5).map((c) => toHex(c.rgb)),
  }
}

async function processPhoto(id, photo) {
  const src = path.join(srcDir, photo.file)
  if (!fs.existsSync(src)) {
    console.warn(`  ! ${id}: ${photo.file} not found in photos-src/, skipped`)
    return
  }
  const img = sharp(src).rotate()
  const meta = await img.metadata()
  const portrait = meta.height > meta.width
  const widths = (portrait ? PORTRAIT : LANDSCAPE).filter((w) => w <= meta.width)
  if (!widths.length) widths.push(meta.width)
  const srcTime = fs.statSync(src).mtimeMs

  for (const w of widths) {
    for (const [ext, opts] of [['avif', { quality: 50, effort: 4 }], ['webp', { quality: 74, effort: 5 }]]) {
      const out = path.join(outDir, `${id}-${w}.${ext}`)
      if (!force && fs.existsSync(out) && fs.statSync(out).mtimeMs > srcTime) continue
      await sharp(src).rotate().resize({ width: w }).toFormat(ext, opts).toFile(out)
    }
  }

  const { data, info } = await sharp(src).rotate().resize(48, 48, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const px = []
  for (let i = 0; i < data.length; i += info.channels) px.push([data[i], data[i + 1], data[i + 2]])
  const blurBuf = await sharp(src).rotate().resize(24).webp({ quality: 40 }).toBuffer()

  const h = Math.round((meta.height / meta.width) * 1000)
  Object.assign(photo, {
    w: 1000,
    h,
    sizes: widths,
    palette: palette(kmeans(px)),
    blur: `data:image/webp;base64,${blurBuf.toString('base64')}`,
  })
  console.log(`  ✓ ${id} (${widths.join('/')}) ${photo.palette.bg} ${photo.palette.accent}`)
}

const entries = Object.entries(content.photos)
console.log(`Processing ${entries.length} photos…`)
const queue = [...entries]
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const [id, photo] = queue.shift()
    await processPhoto(id, photo)
  }
}))
fs.writeFileSync(contentPath, JSON.stringify(content, null, 2) + '\n')
console.log('Updated src/content.json')
