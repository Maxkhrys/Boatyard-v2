# The Boat Yard Sauna — social ad

A 24-second vertical film for Instagram Reels / Facebook, rendered from the
photography already in `src/assets/images`. Everything — picture, motion and
sound — is generated from source in this folder; there is no editing timeline
and no third-party footage or music to license.

```
./build.sh          # plates -> frames -> sound -> out/boatyard-sauna-60fps.mp4
```

Output: **1080 × 1920, 60 fps, H.264 + AAC**, ~24s.

## The film

| time | picture | line |
| --- | --- | --- |
| 0.0 | kayak on flat green water | `Cold sea.` |
| 2.5 | stove chimney, smoke against cloud | `Hot sauna.` |
| 5.0 | sea steps at sunrise | `Clear head.` |
| 7.3 | sauna interior | **HEAT** |
| 8.6 | plunge tank mid-splash | **PLUNGE** |
| 9.8 | swimmers off the pier | **REPEAT** |
| 11.1 | the gate, harbour beyond | `On the harbour's edge.` |
| 13.6 | the yard at dusk | `Good for [sore legs / Sunday resets / after work]` |
| 16.1 | cedar, out of focus | €12 · €110 · gift vouchers |
| 19.2 | sunrise sky, out of focus | Wicklow Town · Arklow |
| 21.5 | navy | logo, tagline, **Book your session** |

Copy is drawn from the live site — prices from `src/components/Pricing.astro`,
locations from `Locations.astro`, the tagline from `Hero.astro`. Nothing claims
opening hours, because they differ between the two harbours.

## How it is put together

**`prep-images.py`** cuts each chosen photograph to 9:16 around a focus point at
1.3× the output size, so a push-in never softens, and keys the logo out of its
navy lockup onto transparency for the end card.

**`scene.html` + `timeline.js`** are the film. There are no CSS transitions or
animations anywhere: `render(t)` is a pure function of time that writes inline
styles for every layer. That is what makes the render deterministic — frame
1,000 is identical on every run — and it is also why the motion is smooth, since
nothing depends on when a browser happens to tick.

The visual system:

- a warmth track running under the whole film, cold blue at the pier and ember
  by the stove, applied as a `soft-light` wash per plate plus a global `overlay`
- continuous Ken Burns on every plate — no shot is ever still
- four transition types (`dissolve`, `wipe`, `whip`, `punch`) chosen per cut,
  with the outgoing plate pushing away under the incoming one
- type that rises out of a clip with a blur that resolves — the blur reads as
  motion blur and is what stops fast text looking cheap
- 12 fps film grain, a bloom that breathes with the heat, and white kisses on
  the three hard cuts

**`render.mjs`** serves the folder over localhost, opens it in Chromium at
exactly 1080×1920, and steps `render(t)` frame by frame, screenshotting each
one. Useful flags:

```
node render.mjs --preview          # 20 stills across the film
node render.mjs --at 8.6,15.2      # specific beats, for checking one moment
node render.mjs --fps 30           # quick pass
```

**`audio.py`** synthesises the soundtrack with numpy against the same beat map:
surf, a drone that moves Am → F → G → C, stove crackle, löyly steam, a splash on
the plunge cut, sub thumps and swept-noise whooshes on every transition, a soft
100bpm pulse under the offer, and an FM bell on the logo. Convolution reverb
from a synthesised hall, gentle bus compression, soft clip, −1 dBFS ceiling at
about −14 dBFS RMS so it sits at platform loudness.

## Changing it

- **Words** — `scene.html`. Swap module options are `SWAP_WORDS` in `timeline.js`.
- **Photographs** — `PLATES` in `prep-images.py` (file + focus point), then the
  `key` in the `SHOTS` table in `timeline.js`.
- **Pace** — `SHOTS[].t` and `BEATS` in `timeline.js`; the same numbers appear as
  `CUTS_SOFT` / `CUTS_HARD` in `audio.py` and must be kept in step.
- **Length** — `DURATION` in both `timeline.js` and `audio.py`.

`assets/`, `frames/` and `node_modules/` are generated and git-ignored; only the
finished mp4 in `out/` is committed.
