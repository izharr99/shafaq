# Shafaq · sky photographer portfolio template

**Live demo:** https://shafaq.izhar.dev

Shafaq (شفق, the glow left in the sky after sunset) is a static, bilingual (English and Arabic) portfolio template for a sky photographer: sunrises, sunsets, moonrises, storms, city lights and patterns. The photos are the hero; the interface stays out of the way and takes its colour from whatever photo is on screen.

The page is deliberately short: hero, the photographer's story, six chapters, the sun path dial, and one booking section with prices. Everything on it (name, city, story, collections, photos and their metadata, prices, contact details and both languages) comes from `src/content.json`, so it can be rebranded without touching code. The photographer, brand, prices and contacts are fictional placeholders.

Built with Vite + TypeScript (no framework), GSAP (ScrollTrigger, Flip) and Lenis. No backend, no API keys.

## Features

- **One day in one scroll.** The hero is pinned while seven skies (blue hour, sunrise, golden hour, sunset, dusk, moonrise, night) rise into the frame one after another. The page background, text colour, accent, clock, sun altitude and place all morph with scroll progress, using palettes extracted from each photo at build time.
- **Meet the photographer.** A first-person story section: the portrait rises through a circular "sunrise" mask and is tinted with the live palette, paragraphs reveal line by line (real line breaks, measured after fonts load, in both languages), a pull quote brightens word by word above a signature, a milestone line draws across the years and counters run up.
- **Six chapters** (Sunrise, Sunset, Moon, Storms, City Lights, Patterns), each with a scroll-scrubbed cover reveal and a masonry gallery whose columns drift at different speeds. The chapter index floats a cover preview under the cursor. Storms opens with one faint lightning flicker.
- **Adaptive colour.** Each section hands the page theme to its photo's palette as it reaches the middle of the screen.
- **Lightbox.** GSAP Flip carries the thumbnail into a full-screen viewer (thumbnails keep each photo's true aspect, so the scale stays uniform), with camera, lens, exposure, time, place and credit (sample data, see Credits); keyboard (arrows follow the reading direction, Esc, focus trap and focus return), swipe on touch, the sharp file swapped in only after `decode()`, and neighbours decoded ahead.
- **Sun path dial.** A 24-hour dial with noon at the top and midnight at the bottom. Drag the sun (or focus it and use arrow keys, Page Up/Down, Home/End) and the photo, readout and page colour follow; below the horizon it turns into the moon.
- **Book a sky.** One closing section: WhatsApp (pre-filled message in the visitor's language) and email, then three offerings with USD prices.
- **English and Arabic.** Toggle in the header, saved in `localStorage`; `lang` and `dir` update, layout mirrors through logical CSS properties, horizontal motion and arrows flip, the dial puts morning on the reader's starting side. Arabic uses IBM Plex Sans Arabic, Latin uses Manrope. Times, prices and numbers stay in Western digits and are isolated with `<bdi>`.
- Desktop cursor that eases after the pointer and opens into a "View" lens over photos; magnetic buttons.
- Accessibility: semantic sections and headings, alt text in both languages, skip link, keyboard dial and lightbox, `prefers-reduced-motion` turns off smooth scrolling, parallax, flicker and reveals.

## Performance

Lenis drives ScrollTrigger from GSAP's ticker with `lagSmoothing(0)`. Motion uses only transform, opacity and clip-path (no animated filters, backdrop-filter or blend modes). Photos ship as AVIF and WebP at three widths with explicit dimensions, blur-up placeholders and lazy loading; hero frames are decoded ahead of time.

Measured with a scripted wheel scroll through the whole page in headless Chrome (production build, images warmed):

| Viewport | CPU | Frames | Average | p95 | p99 | Frames > 33 ms |
| --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 1× | 1370 | 8.35 ms | 9.2 ms | 9.3 ms | 1 |
| 390×844 | 1× | 3538 | 8.31 ms | 9.0 ms | 9.3 ms | 0 |
| 1440×900 | 4× throttled | 1106 | 12.36 ms | 24.9 ms | 25.8 ms | 5 |

## Run it

```bash
pnpm install
pnpm dev                 # http://localhost:5173
pnpm build && pnpm preview
```

## Customise

Edit `src/content.json`:

- `brand`: name, Arabic name, photographer, city, tagline, email, WhatsApp number (`number` is digits only for wa.me links).
- `hero.stops`: the photo sequence for the hero, each with a phase name, time and sun (or moon) altitude.
- `about`: the photographer's story, portrait, quote, milestones and counters.
- `chapters.items`: collections with a cover and an ordered list of photo ids. Add `"effect": "lightning"` to any chapter for the flicker.
- `sunpath`: sunrise and sunset times, maximum sun altitude, start time and the photos the dial picks between.
- `contact` and `services`: the booking section and its three offerings.
- `credits`: footer links (author, template repo, licence, photo credits).
- Every piece of copy is an `{ "en": "...", "ar": "..." }` pair.

### Adding photos

1. Put the original JPG in `photos-src/` (git-ignored).
2. Add an entry under `photos` in `content.json` with `file`, `alt` (both languages), `credit` and `meta` (camera, lens, exposure, time, place).
3. Run `pnpm photos`. It writes `public/photos/<id>-<width>.avif|webp` (800/1600/2400 wide for landscape, 600/1200/1800 for portrait), then fills in `w`, `h`, `sizes`, the colour `palette` (k-means over a thumbnail: background, ink with at least 7:1 contrast, accent) and the base64 `blur` placeholder. Use `pnpm photos --force` to re-encode everything.
4. Reference the id from a chapter, the hero, the dial or the about section.

## Credits

All photographs come from [Pexels](https://www.pexels.com) under the [Pexels License](https://www.pexels.com/license/) (free for commercial use, no attribution required). Each was checked on its Pexels page. They are credited here anyway, with thanks. **The metadata shown in the lightbox (camera, lens, exposure, time) is sample data** written for a fictional phone-first sky photographer (iPhone 15 Pro, with a small mirrorless kit for storms and long lenses). It is not the photographers' real EXIF. Captions and times are illustrative; places are real only where Pexels recorded them.

- `blue-hour-skyline`: [Alfred GF](https://www.pexels.com/photo/11545441/)
- `dawn-boat`: [Nuno Obey](https://www.pexels.com/photo/128302/)
- `golden-coast`: [Abet Llacer](https://www.pexels.com/photo/4383348/)
- `sunset-boat`: [Nivek Kram Aibab](https://www.pexels.com/photo/7864468/)
- `dusk-city`: [Suki Lee](https://www.pexels.com/photo/18694287/)
- `moonrise-sea`: [Александр Максин](https://www.pexels.com/photo/25819968/)
- `milky-way-sea`: [Maksud](https://www.pexels.com/photo/4090111/)
- `sunrise-haze`: [The Shejz](https://www.pexels.com/photo/35030749/)
- `sunrise-shore`: [Pok Rie](https://www.pexels.com/photo/408914/)
- `sunrise-sail`: [Stefan Grage](https://www.pexels.com/photo/4282521/)
- `sunrise-rooftops`: [Amanda Leoni](https://www.pexels.com/photo/8529226/)
- `clouds-ember`: [David Kanigan](https://www.pexels.com/photo/12988245/)
- `sunset-city-sun`: [Quang Nguyen Vinh](https://www.pexels.com/photo/6710686/)
- `sunset-silhouette`: [Italo Melo](https://www.pexels.com/photo/2356139/)
- `sunset-storm-sea`: [Willian Justen de Vasconcellos](https://www.pexels.com/photo/16116629/)
- `moon-towers`: [Jesus Toledo](https://www.pexels.com/photo/30199537/)
- `moon-path`: [Adelin M](https://www.pexels.com/photo/5052131/)
- `moon-dusk-sea`: [Alina Rossoshanska](https://www.pexels.com/photo/17241532/)
- `crescent-clouds`: [Pramod Tiwari](https://www.pexels.com/photo/13581999/)
- `crescent-detail`: [Tom Fisk](https://www.pexels.com/photo/12705640/)
- `moon-building`: [Magali Guimarães](https://www.pexels.com/photo/5206826/)
- `lightning-sea`: [Philippe Donn](https://www.pexels.com/photo/1114690/)
- `lightning-pillars`: [Pixabay](https://www.pexels.com/photo/248775/)
- `lightning-lake`: [Raychel Sanner](https://www.pexels.com/photo/4870641/)
- `shelf-cloud`: [Dijanynni Kiratza](https://www.pexels.com/photo/15470681/)
- `storm-sea`: [Josh Sorenson](https://www.pexels.com/photo/9712998/)
- `lightning-city`: [emre varışlı](https://www.pexels.com/photo/28823583/)
- `harbour-night`: [Maximilian Ruther](https://www.pexels.com/photo/11557796/)
- `skyline-night`: [Pixabay](https://www.pexels.com/photo/258173/)
- `light-trails`: [Renan Rezende](https://www.pexels.com/photo/12110342/)
- `city-dusk-above`: [Kendrick Chen](https://www.pexels.com/photo/20498898/)
- `city-golden-aerial`: [Lio Photography](https://www.pexels.com/photo/1598338/)
- `mashrabiya`: [Sami Raad](https://www.pexels.com/photo/30615454/)
- `lattice-light`: [Elkhan Ganiyev](https://www.pexels.com/photo/18453549/)
- `star-pattern`: [Arif YILMAZ](https://www.pexels.com/photo/34680960/)
- `jali-window`: [Jose Aragones](https://www.pexels.com/photo/3254036/)
- `wood-geometry`: [Mohammed Alim](https://www.pexels.com/photo/32820923/)
- `minarets-sunset`: [Kaan ALTUN](https://www.pexels.com/photo/16737017/)
- `coastal-golden`: [Matthias Groeneveld](https://www.pexels.com/photo/2808320/)
- `cumulus`: [Tim Mossholder](https://www.pexels.com/photo/1605148/)
- `photographer`: [Yunus Tuğ](https://www.pexels.com/photo/13070128/)
- `rooftop-start`: [Miguel González](https://www.pexels.com/photo/16418579/)

Fonts: [Manrope](https://fonts.google.com/specimen/Manrope) and [IBM Plex Sans Arabic](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic) (SIL Open Font License) via [Fontsource](https://fontsource.org). Motion: [GSAP](https://gsap.com) and [Lenis](https://lenis.darkroom.engineering) (MIT).

## Author

Designed and built by [Muhammad Izhar](https://izhar.dev). Change `credits` in `content.json` to put your own name in the footer.

## License

Code: MIT, see [LICENSE](LICENSE). Photographs stay under the Pexels License.
