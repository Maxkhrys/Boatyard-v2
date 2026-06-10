# The Boat Yard Sauna

Marketing site for The Boat Yard Sauna — a seaside sauna in Ireland with two
locations: **Wicklow Town** and **Arklow**.

## Concept: "From the Pier to the Heat"

The page begins cold — deep navy, sea mist — and warms toward cedar and amber
as you scroll. A global ScrollTrigger interpolates the background colour across
total scroll progress (`--bg`), and a `--warmth` variable (0 → 1) strengthens
the amber glow toward the booking section.

## Stack

- [Astro](https://astro.build) — static output, `astro:assets` image optimisation (WebP, responsive srcset, lazy-loading)
- [Lenis](https://lenis.darkroom.engineering) — smooth scrolling, driven by GSAP's ticker
- [GSAP + ScrollTrigger](https://gsap.com) — scroll colour-warming, hero reveal, ken-burns, section reveals
- Fraunces (display serif) + Inter (body), self-hosted via Fontsource

All motion respects `prefers-reduced-motion`: Lenis, the ken-burns zoom, mist
drift and entrance animations are disabled; the scroll-driven colour warming is
kept since it tracks scroll position directly and introduces no movement.

## Commands

| Command           | Action                       |
| ----------------- | ---------------------------- |
| `npm install`     | Install dependencies         |
| `npm run dev`     | Dev server at localhost:4321 |
| `npm run build`   | Production build to `dist/`  |
| `npm run preview` | Preview the build locally    |

## Structure

```text
src/
├── assets/images/     Source photography (optimised at build time)
├── components/        Nav, Hero, IntroStatement, Experience, Locations,
│                      Pricing, Journal + JournalCard, MailingList, Footer
├── layouts/Base.astro Fonts, meta, nav/footer, grain overlay, script entry
├── pages/index.astro  The one-pager
├── scripts/main.ts    Lenis + GSAP: warming system, hero, pinned
│                      Experience, statement fill, reveals, subscribe
└── styles/global.css  Design tokens & shared primitives
```

## Standout moments

Calm by default, with two cinematic scroll moments:

1. **The Experience** — pinned section cycling Heat → Plunge → Repeat with
   crossfading parallax imagery. Degrades to a calm stacked layout below
   800px and under reduced motion.
2. **Mailing list** — the warmest point of the page; the global colour
   system peaks here (`endTrigger: #mailing`).

## Placeholders to replace

- Hero headline — `headline` constant in `src/components/Hero.astro`
- Addresses & opening hours — `src/components/Locations.astro`, `Footer.astro`
- Prices — `src/components/Pricing.astro`
- Journal posts — data array in `src/components/Journal.astro` (cards are
  CMS-ready via `JournalCard.astro` props)
- Mailing-list form is front-end only — wire `#mailing-form` to a provider
- Social URLs — `src/components/Footer.astro`
