import { C, photos, type L, type Lang } from './data'

const html = document.documentElement
export let lang: Lang = html.lang === 'ar' ? 'ar' : 'en'

export const t = (v: L | string | null | undefined): string => (v == null ? '' : typeof v === 'string' ? v : v[lang])

/** Resolves "ui.nav.work" against content.json. */
export function get(path: string): L | string | undefined {
  return path.split('.').reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), C) as
    | L
    | string
    | undefined
}

export const isRTL = () => lang === 'ar'
/** +1 in English, -1 in Arabic: multiply any horizontal motion by this. */
export const dirSign = () => (isRTL() ? -1 : 1)

const listeners: Array<(l: Lang) => void> = []
export const onLang = (fn: (l: Lang) => void) => listeners.push(fn)

/** Writes every [data-t] text, [data-t-aria] label and photo alt for the current language. */
export function applyText(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-t]').forEach((el) => {
    el.textContent = t(get(el.dataset.t!))
  })
  root.querySelectorAll<HTMLElement>('[data-t-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(get(el.dataset.tAria!)))
  })
  root.querySelectorAll<HTMLImageElement>('img[data-photo]').forEach((img) => {
    const p = photos[img.dataset.photo!]
    if (p && !img.hasAttribute('data-decorative')) img.alt = t(p.alt)
  })
  root.querySelectorAll<HTMLElement>('[data-photo-label]').forEach((el) => {
    const p = photos[el.dataset.photoLabel!]
    if (p) el.setAttribute('aria-label', `${t(C.ui.view)}: ${t(p.alt)}`)
  })
}

export function setLang(next: Lang) {
  if (next === lang) return
  lang = next
  html.lang = next
  html.dir = next === 'ar' ? 'rtl' : 'ltr'
  try {
    localStorage.setItem('lang', next)
  } catch {
    /* private mode */
  }
  applyText()
  listeners.forEach((fn) => fn(next))
}
