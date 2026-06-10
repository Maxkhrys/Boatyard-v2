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
├── components/        Nav, Hero, Ritual, Locations, Booking, Footer
├── layouts/Base.astro Fonts, meta, nav/footer, script entry
├── pages/index.astro  The one-pager
├── scripts/main.ts    Lenis + GSAP: warming system, hero, nav, reveals
└── styles/global.css  Design tokens & shared primitives
```

The hero headline is a placeholder — change the `headline` constant at the top
of `src/components/Hero.astro`.
