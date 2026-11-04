import { photo, esc } from './data'
import { t } from './i18n'

interface Opts {
  sizes?: string
  eager?: boolean
  priority?: boolean
  cls?: string
  decorative?: boolean
}

const base = import.meta.env.BASE_URL
export const photoUrl = (id: string, w: number, ext: 'avif' | 'webp') => `${base}photos/${id}-${w}.${ext}`

const srcset = (id: string, ext: 'avif' | 'webp') =>
  photo(id)
    .sizes.map((w) => `${photoUrl(id, w, ext)} ${w}w`)
    .join(', ')

/** A responsive <picture> with AVIF + WebP, explicit size and a blur-up placeholder. */
export function picture(id: string, o: Opts = {}): string {
  const p = photo(id)
  const mid = p.sizes[Math.min(1, p.sizes.length - 1)]
  return `<picture class="ph ${o.cls ?? ''}" style="--ar:${p.w}/${p.h};background-image:url(${p.blur})">
    <source type="image/avif" srcset="${srcset(id, 'avif')}" sizes="${o.sizes ?? '100vw'}">
    <source type="image/webp" srcset="${srcset(id, 'webp')}" sizes="${o.sizes ?? '100vw'}">
    <img src="${photoUrl(id, mid, 'webp')}" data-photo="${id}" alt="${o.decorative ? '' : esc(t(p.alt))}" ${o.decorative ? 'data-decorative' : ''}
      width="${p.w}" height="${p.h}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async"${o.priority ? ' fetchpriority="high"' : ''}>
  </picture>`
}

let avif: Promise<boolean> | null = null
/** Whether this browser decodes AVIF (used when loading images from script). */
export function supportsAvif(): Promise<boolean> {
  avif ??= new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.width > 0)
    img.onerror = () => resolve(false)
    img.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
  return avif
}

/** Picks the smallest generated width that covers `cssWidth` on this screen. */
export function bestWidth(id: string, cssWidth: number) {
  const need = cssWidth * Math.min(window.devicePixelRatio || 1, 2)
  const s = photo(id).sizes
  return s.find((w) => w >= need) ?? s[s.length - 1]
}

const decoded = new Map<string, Promise<string>>()
/** Loads and decodes a photo at a given width; resolves with its URL once it can paint without a stall. */
export function decodePhoto(id: string, w: number): Promise<string> {
  const key = `${id}@${w}`
  let p = decoded.get(key)
  if (!p) {
    p = supportsAvif().then((ok) => {
      const url = photoUrl(id, w, ok ? 'avif' : 'webp')
      const img = new Image()
      img.src = url
      return img
        .decode()
        .catch(() => undefined)
        .then(() => url)
    })
    decoded.set(key, p)
  }
  return p
}

/** Fades images in once loaded (the blur placeholder sits behind them). */
export function watchLoads(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>('.ph img').forEach((img) => {
    if (img.complete && img.naturalWidth) img.classList.add('is-in')
    else img.addEventListener('load', () => img.classList.add('is-in'), { once: true })
  })
}
