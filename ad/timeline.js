/* The Boat Yard Sauna — 24s vertical social ad.
 *
 * Everything here is a pure function of time. Nothing uses CSS transitions,
 * CSS animations or requestAnimationFrame timing, so the offline renderer can
 * seek to any frame and get the exact same pixels. `render(t)` writes inline
 * styles; `build()` runs once to split type and measure the swap module.
 */

const W = 1080;
const H = 1920;
const DURATION = 24.0;

/* ---------------------------------------------------------------- easing */

const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

/** Progress through [a, b], clamped to 0..1. */
const span = (t, a, b) => clamp((t - a) / (b - a));

const ease = {
  linear: (p) => p,
  inOutSine: (p) => 0.5 - 0.5 * Math.cos(Math.PI * p),
  outCubic: (p) => 1 - Math.pow(1 - p, 3),
  outQuart: (p) => 1 - Math.pow(1 - p, 4),
  outQuint: (p) => 1 - Math.pow(1 - p, 5),
  outExpo: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  inOutQuint: (p) => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2),
  /* one soft overshoot — used only for the pill so it feels sprung, not bouncy */
  outBackSoft: (p) => 1 + 1.9 * Math.pow(p - 1, 3) + 1.0 * Math.pow(p - 1, 2),
};

const mix = (a, b, p) => a + (b - a) * p;

/** Piecewise-linear keyframe track: [[time, value], ...]. */
function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      return mix(v0, v1, ease.inOutSine(span(t, t0, t1)));
    }
  }
  return keys[keys.length - 1][1];
}

/* ------------------------------------------------------------------ shots
 *
 * `t`  — when this plate takes over
 * `T`  — length of its entrance (the previous plate is still underneath)
 * `tr` — how it arrives: wipe / whip / dissolve / punch
 * `kb` — Ken Burns from → to, as {s: scale, x, y} in stage pixels
 */

const SHOTS = [
  { key: 'kayak',        t:  0.00, T: 0.90, tr: 'dissolve', kb: [{ s: 1.13, x:  16, y: -30 }, { s: 1.03, x: -12, y:  22 }], grade: 'ice',   b: 0.00 },
  { key: 'chimney',      t:  2.50, T: 0.60, tr: 'wipe',     kb: [{ s: 1.02, x:   0, y:  34 }, { s: 1.12, x:  -8, y: -26 }], grade: 'ember', b: 0.10 },
  { key: 'sea-steps',    t:  5.00, T: 0.70, tr: 'dissolve', kb: [{ s: 1.11, x: -26, y:  16 }, { s: 1.02, x:  20, y: -14 }], grade: 'dawn',  b: 0.06 },
  { key: 'interior',     t:  7.30, T: 0.34, tr: 'punch',    kb: [{ s: 1.14, x:  18, y:  10 }, { s: 1.04, x: -10, y:  -8 }], grade: 'ember', b: 0.22 },
  { key: 'plunge',       t:  8.55, T: 0.30, tr: 'punch',    kb: [{ s: 1.03, x: -14, y: -12 }, { s: 1.13, x:  12, y:  14 }], grade: 'ice',   b: 0.04 },
  { key: 'swimmers',     t:  9.80, T: 0.30, tr: 'punch',    kb: [{ s: 1.12, x:  20, y:  16 }, { s: 1.03, x: -16, y: -10 }], grade: 'dawn',  b: 0.06 },
  { key: 'gate-harbour', t: 11.05, T: 0.66, tr: 'wipe',     kb: [{ s: 1.02, x:   0, y: -18 }, { s: 1.12, x:   0, y:  20 }], grade: 'dawn',  b: 0.10 },
  { key: 'aerial-dusk',  t: 13.60, T: 0.62, tr: 'whip',     kb: [{ s: 1.12, x: -18, y: -20 }, { s: 1.02, x:  14, y:  18 }], grade: 'ember', b: 0.16 },
  // The last two plates only ever read as a field of colour behind the panels,
  // so they are chosen for their light — warm cedar, then a sunrise sky — and
  // pushed well out of focus.
  { key: 'cedar-door',   t: 16.10, T: 0.62, tr: 'whip',     kb: [{ s: 1.20, x:   0, y:  24 }, { s: 1.06, x:   0, y: -20 }], grade: 'ember', b: 0.20, soft: 30, dim: 0.56 },
  { key: 'lighthouse-sunrise', t: 19.20, T: 0.58, tr: 'wipe', kb: [{ s: 1.18, x:  16, y:   0 }, { s: 1.05, x: -14, y:  12 }], grade: 'ember', b: 0.18, soft: 26, dim: 0.5 },
];

/* soft-light washes that carry the cold → warm arc */
const GRADES = {
  ice:   'linear-gradient(196deg, rgba(96,168,208,0.55), rgba(20,58,90,0.5))',
  dawn:  'linear-gradient(196deg, rgba(190,168,164,0.4), rgba(52,72,102,0.45))',
  ember: 'linear-gradient(196deg, rgba(255,176,96,0.5), rgba(126,54,20,0.42))',
};

/* how warm the whole film feels, 0 = pier, 1 = the stove */
const WARMTH = [
  [0.0, 0.0], [2.3, 0.04], [3.4, 0.4], [5.0, 0.46], [6.4, 0.22],
  [7.3, 0.34], [8.4, 0.62], [8.7, 0.16], [9.9, 0.3], [11.4, 0.44],
  [13.8, 0.62], [16.3, 0.8], [19.4, 0.78], [21.3, 0.5], [24.0, 0.5],
];

/* the amber core-light that blooms on the heat beats */
const BLOOM = [
  [0.0, 0.0], [2.6, 0.0], [4.2, 0.34], [5.2, 0.1], [7.3, 0.18],
  [8.4, 0.46], [8.6, 0.05], [11.0, 0.1], [13.8, 0.3], [16.2, 0.36],
  [19.2, 0.28], [21.3, 0.0], [24.0, 0.0],
];

/* ------------------------------------------------------------- type beats
 * [start, end] — the block reveals at `start` and clears out before `end`
 */
const BEATS = {
  ch1:       [0.45, 2.42],
  ch2:       [2.92, 4.92],
  ch3:       [5.42, 7.22],
  w1:        [7.36, 8.50],
  w2:        [8.61, 9.75],
  w3:        [9.86, 11.00],
  ch4:       [11.42, 13.52],
  swaplayer: [13.92, 16.02],
  offer:     [16.44, 19.12],
  locations: [19.52, 21.22],
  end:       [21.46, 24.00],
};

const SWAP_WORDS = ['sore legs', 'Sunday resets', 'after work'];

/* -------------------------------------------------------------- elements */

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const el = {};
const shotNodes = [];
let swapNodes = [];
let swapWidths = [];

/* ------------------------------------------------------------------ build */

function splitWords(node) {
  const words = node.textContent.trim().split(/\s+/);
  node.textContent = '';
  return words.map((w, i) => {
    const outer = document.createElement('span');
    outer.className = 'word';
    const inner = document.createElement('i');
    inner.textContent = w;
    outer.appendChild(inner);
    node.appendChild(outer);
    if (i < words.length - 1) node.appendChild(document.createTextNode(' '));
    return inner;
  });
}

function grainTexture() {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">` +
    `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/></filter>` +
    `<rect width="320" height="320" filter="url(#n)"/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function build() {
  el.stage = $('#stage');
  el.plates = $('#plates');
  el.warmth = $('#warmth');
  el.bloom = $('#bloom');
  el.flash = $('#flash');
  el.grain = $('#grain');
  el.scrim = $('#scrim');

  // plates, in timeline order so later shots stack on top
  for (const s of SHOTS) {
    const shot = document.createElement('div');
    shot.className = 'shot';
    const inner = document.createElement('div');
    inner.className = 'shot__inner';
    const img = document.createElement('img');
    img.src = `assets/${s.key}.jpg`;
    inner.appendChild(img);
    const grade = document.createElement('div');
    grade.className = 'shot__grade';
    grade.style.background = GRADES[s.grade];
    const lift = document.createElement('div');
    lift.className = 'shot__lift';
    lift.style.background = '#0b1a26';
    shot.append(inner, grade, lift);
    el.plates.appendChild(shot);
    shotNodes.push({ cfg: s, shot, inner, grade, lift });
  }

  // each shot ends when the next one has finished arriving
  shotNodes.forEach((n, i) => {
    const next = SHOTS[i + 1];
    n.end = next ? next.t + next.T : DURATION;
  });

  // type
  for (const node of $$('[data-split]')) node.__words = splitWords(node);
  el.layers = {};
  for (const id of Object.keys(BEATS)) el.layers[id] = $('#' + id);

  // swap module
  const holder = $('#pillwords');
  swapNodes = SWAP_WORDS.map((w) => {
    const d = document.createElement('div');
    d.className = 'pillword';
    d.textContent = w;
    holder.appendChild(d);
    return d;
  });
  swapWidths = swapNodes.map((d) => d.getBoundingClientRect().width);

  el.pill = $('#pill');
  el.rows = $$('[data-row]');
  el.locs = $$('[data-loc]');
  el.rings = $$('[data-ring]');
  el.logo = $('#logo');
  el.wordmark = $('#wordmark');
  el.endsub = $('#endsub');
  el.cta = $('#cta');
  el.url = $('#url');
  el.foot = $('[data-foot]');

  el.grain.style.backgroundImage = grainTexture();
}

/* ----------------------------------------------------------------- render */

/** Reveal a set of split words: rise + de-blur, staggered. */
function revealWords(words, t, start, opts = {}) {
  const stagger = opts.stagger ?? 0.055;
  const dur = opts.dur ?? 0.9;
  const rise = opts.rise ?? 106;
  const blur = opts.blur ?? 15;
  words.forEach((w, i) => {
    const p = ease.outQuint(span(t, start + i * stagger, start + i * stagger + dur));
    w.style.transform = `translate3d(0, ${((1 - p) * rise).toFixed(3)}%, 0)`;
    w.style.filter = p > 0.995 ? 'none' : `blur(${((1 - p) * blur).toFixed(2)}px)`;
    w.style.opacity = clamp(p * 1.6).toFixed(3);
  });
}

/** A whole block leaving frame: lifts, softens, fades. */
function layerExit(t, end, dur = 0.46) {
  const p = ease.inOutCubic(span(t, end - dur, end));
  return { opacity: 1 - p, y: -p * 64, blur: p * 9 };
}

function renderShots(t) {
  for (const n of shotNodes) {
    const c = n.cfg;
    const live = t >= c.t - 0.05 && t <= n.end + 0.05;
    if (!live) {
      if (n.shot.style.display !== 'none') n.shot.style.display = 'none';
      continue;
    }
    if (n.shot.style.display === 'none') n.shot.style.display = '';

    // Ken Burns runs across the plate's whole life, on a sine so it never
    // starts or stops abruptly.
    const life = span(t, c.t, n.end);
    const k = ease.inOutSine(life * 0.86 + 0.07);
    const s = mix(c.kb[0].s, c.kb[1].s, k);
    const x = mix(c.kb[0].x, c.kb[1].x, k);
    const y = mix(c.kb[0].y, c.kb[1].y, k);

    // entrance
    const p = span(t, c.t, c.t + c.T);
    let opacity = 1;
    let blur = c.soft || 0;
    let extra = 1;
    let clip = '';

    if (p < 1) {
      switch (c.tr) {
        case 'wipe': {
          const e = ease.inOutQuint(p);
          opacity = 1;
          clip = `inset(${((1 - e) * 100).toFixed(3)}% 0% 0% 0%)`;
          extra = mix(1.055, 1, ease.outQuart(p));
          blur += (1 - ease.outQuart(p)) * 5;
          break;
        }
        case 'whip': {
          const e = ease.outQuart(p);
          opacity = clamp(p * 2.1);
          extra = mix(1.1, 1, e);
          blur += (1 - e) * 22;
          break;
        }
        case 'punch': {
          const e = ease.outExpo(p);
          opacity = clamp(p * 3.4);
          extra = mix(1.055, 1, e);
          blur += (1 - e) * 9;
          break;
        }
        default: {
          const e = ease.inOutCubic(p);
          opacity = e;
          extra = mix(1.045, 1, ease.outCubic(p));
          blur += (1 - ease.outCubic(p)) * 6;
        }
      }
    }

    // exit — while the next plate arrives this one pushes away a little
    const nextIdx = shotNodes.indexOf(n) + 1;
    if (nextIdx < SHOTS.length) {
      const nx = SHOTS[nextIdx];
      const q = span(t, nx.t, nx.t + nx.T);
      if (q > 0) {
        const e = ease.inOutCubic(q);
        extra *= mix(1, nx.tr === 'wipe' ? 0.965 : 1.05, e);
        blur += e * (nx.tr === 'punch' ? 2 : 7);
      }
    }

    n.shot.style.opacity = opacity.toFixed(4);
    n.shot.style.clipPath = clip;
    n.shot.style.filter = blur > 0.02 ? `blur(${blur.toFixed(2)}px)` : 'none';
    n.inner.style.transform =
      `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(s * extra).toFixed(5)})`;
    n.grade.style.opacity = (0.5 + 0.28 * Math.sin(life * Math.PI)).toFixed(3);
    n.lift.style.opacity = (c.dim || 0).toFixed(3);
  }
}

function renderChapter(id, t) {
  const [a, b] = BEATS[id];
  const layer = el.layers[id];
  if (t < a - 0.4 || t > b + 0.1) {
    layer.style.opacity = 0;
    layer.style.display = 'none';
    return false;
  }
  layer.style.display = '';
  const ex = layerExit(t, b);
  layer.style.opacity = ex.opacity.toFixed(3);
  const block = layer.querySelector('.block');
  if (block) {
    block.style.transform = `translate3d(0, ${ex.y.toFixed(2)}px, 0)`;
    block.style.filter = ex.blur > 0.05 ? `blur(${ex.blur.toFixed(2)}px)` : 'none';
  }
  // eyebrows and supporting copy
  layer.querySelectorAll('[data-fade]').forEach((n, i) => {
    const isSub = n.classList.contains('sub');
    const start = a + (isSub ? 0.42 : 0.02) + i * 0.06;
    const p = ease.outQuart(span(t, start, start + 0.8));
    n.style.opacity = p.toFixed(3);
    n.style.transform = `translate3d(0, ${((1 - p) * 22).toFixed(2)}px, 0)`;
    n.style.filter = p > 0.99 ? 'none' : `blur(${((1 - p) * 5).toFixed(2)}px)`;
  });
  layer.querySelectorAll('[data-split]').forEach((n) => {
    revealWords(n.__words, t, a + 0.16);
  });
  return true;
}

function renderBigWord(id, t) {
  const [a, b] = BEATS[id];
  const layer = el.layers[id];
  if (t < a - 0.2 || t > b + 0.1) {
    layer.style.opacity = 0;
    layer.style.display = 'none';
    return;
  }
  layer.style.display = '';
  const node = layer.querySelector('.bigword');
  const inP = ease.outExpo(span(t, a, a + 0.5));
  const outP = ease.inOutCubic(span(t, b - 0.3, b));
  const scale = mix(1.14, 1.0, inP) * mix(1, 0.965, outP);
  layer.style.opacity = (clamp(inP * 2.2) * (1 - outP)).toFixed(3);
  node.style.transform = `translateY(-50%) scale(${scale.toFixed(4)})`;
  const blur = (1 - inP) * 26 + outP * 12;
  node.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  const em = node.querySelector('em');
  const p2 = ease.outQuart(span(t, a + 0.26, a + 1.0));
  em.style.opacity = (p2 * (1 - outP)).toFixed(3);
  em.style.transform = `translate3d(0, ${((1 - p2) * 18).toFixed(2)}px, 0)`;
}

function renderSwap(t) {
  if (!renderChapter('swaplayer', t)) return;
  const [a, b] = BEATS.swaplayer;
  const first = a + 0.62;
  const hold = 0.5;
  const move = 0.34;

  // which word, and how far through its handover
  let idx = 0;
  let p = 1;
  for (let i = 0; i < SWAP_WORDS.length; i++) {
    const at = first + i * (hold + move);
    if (t >= at) {
      idx = i;
      p = span(t, at, at + move);
    }
  }

  const prevW = idx === 0 ? 220 : swapWidths[idx - 1];
  const w = mix(prevW, swapWidths[idx], ease.outBackSoft(clamp(p)));
  const gate = ease.outQuart(span(t, a + 0.2, a + 0.8));
  el.pill.style.width = `${(w + 92).toFixed(2)}px`;
  el.pill.style.transform = `scaleY(${mix(0.6, 1, gate).toFixed(4)})`;
  el.pill.style.opacity = gate.toFixed(3);

  swapNodes.forEach((n, i) => {
    let o = 0;
    let y = 0;
    let bl = 0;
    if (i === idx) {
      const e = ease.outQuint(clamp(p / 0.8));
      o = e;
      y = (1 - e) * 74;
      bl = (1 - e) * 16;
    } else if (i === idx - 1) {
      const e = ease.inOutCubic(clamp(p / 0.7));
      o = 1 - e;
      y = -e * 74;
      bl = e * 16;
    }
    n.style.opacity = (o * gate).toFixed(3);
    n.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    n.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : 'none';
  });
}

function renderOffer(t) {
  if (!renderChapter('offer', t)) return;
  const [a, b] = BEATS.offer;
  const layer = el.layers.offer;
  const head = layer.querySelector('.head');
  const ex = layerExit(t, b);
  head.style.transform = `translate3d(0, ${ex.y.toFixed(2)}px, 0)`;

  el.rows.forEach((row, i) => {
    const start = a + 0.5 + i * 0.14;
    const p = ease.outExpo(span(t, start, start + 0.95));
    // a slow settle after landing keeps the panel alive rather than static
    const drift = Math.sin((t - start) * 0.9) * 3 * p;
    const y = (1 - p) * 92 + ex.y * (1 + i * 0.18) + drift;
    const s = mix(0.93, 1, p);
    row.style.opacity = (p * ex.opacity).toFixed(3);
    row.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
    const bl = (1 - p) * 14 + ex.blur;
    row.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : 'none';
  });
}

function renderLocations(t) {
  if (!renderChapter('locations', t)) return;
  const [a, b] = BEATS.locations;
  const layer = el.layers.locations;
  const ex = layerExit(t, b, 0.4);
  layer.querySelector('.head').style.transform = `translate3d(0, ${ex.y.toFixed(2)}px, 0)`;

  el.locs.forEach((loc, i) => {
    const start = a + 0.42 + i * 0.16;
    const p = ease.outQuint(span(t, start, start + 0.9));
    loc.style.opacity = (clamp(p * 1.5) * ex.opacity).toFixed(3);
    loc.style.clipPath = `inset(${((1 - p) * 100).toFixed(2)}% 0% 0% 0% round 36px)`;
    loc.style.transform =
      `translate3d(0, ${(ex.y * (1 + i * 0.2)).toFixed(2)}px, 0) scale(${mix(0.97, 1, p).toFixed(4)})`;
    const img = loc.querySelector('img');
    const k = span(t, start, b);
    img.style.transform =
      `translate3d(0, ${mix(i ? 26 : -26, i ? -26 : 26, ease.inOutSine(k)).toFixed(2)}px, 0) scale(1.08)`;
  });

  const fp = ease.outQuart(span(t, a + 0.9, a + 1.6));
  el.foot.style.opacity = (fp * ex.opacity).toFixed(3);
  el.foot.style.transform = `translate3d(0, ${((1 - fp) * 20 + ex.y).toFixed(2)}px, 0)`;
}

function renderEnd(t) {
  const [a, b] = BEATS.end;
  const layer = el.layers.end;
  if (t < a - 0.3) {
    layer.style.opacity = 0;
    layer.style.display = 'none';
    return;
  }
  layer.style.display = '';
  layer.style.opacity = ease.inOutCubic(span(t, a, a + 0.55)).toFixed(3);

  // rings pushing out from behind the mark
  el.rings.forEach((r, i) => {
    const start = a + 0.18 + i * 0.26;
    const p = ease.outQuart(span(t, start, start + 1.7));
    r.style.transform = `scale(${mix(0.34, 2.9, p).toFixed(4)})`;
    r.style.opacity = (Math.sin(Math.PI * clamp(p)) * 0.5).toFixed(3);
  });

  const lp = ease.outExpo(span(t, a + 0.1, a + 1.05));
  el.logo.style.opacity = clamp(lp * 1.5).toFixed(3);
  el.logo.style.transform = `scale(${mix(1.28, 1, lp).toFixed(4)})`;
  el.logo.style.filter = lp > 0.99 ? 'none' : `blur(${((1 - lp) * 22).toFixed(2)}px)`;

  const wp = ease.outQuart(span(t, a + 0.5, a + 1.35));
  el.wordmark.style.opacity = wp.toFixed(3);
  el.wordmark.style.transform = `translate3d(0, ${((1 - wp) * 26).toFixed(2)}px, 0)`;
  el.wordmark.style.filter = wp > 0.99 ? 'none' : `blur(${((1 - wp) * 8).toFixed(2)}px)`;

  const sp = ease.outQuart(span(t, a + 0.72, a + 1.5));
  el.endsub.style.opacity = (sp * 0.95).toFixed(3);
  el.endsub.style.transform = `translate3d(0, ${((1 - sp) * 20).toFixed(2)}px, 0)`;

  const cp = ease.outExpo(span(t, a + 1.0, a + 1.75));
  // one slow breath on the button so the last second still moves
  const pulse = 1 + 0.018 * Math.sin(span(t, a + 1.7, b) * Math.PI * 2);
  el.cta.style.opacity = cp.toFixed(3);
  el.cta.style.transform =
    `translateX(-50%) translateY(${((1 - cp) * 26).toFixed(2)}px) scale(${(mix(0.94, 1, cp) * pulse).toFixed(4)})`;

  const up = ease.outQuart(span(t, a + 1.3, a + 2.0));
  el.url.style.opacity = (up * 0.9).toFixed(3);
  el.url.style.transform = `translate3d(0, ${((1 - up) * 18).toFixed(2)}px, 0)`;
}

/* white kisses on the hard cuts — 3 frames each, never a strobe */
function flashAt(t) {
  let v = 0;
  for (const s of SHOTS) {
    if (s.tr !== 'punch') continue;
    const p = span(t, s.t, s.t + 0.16);
    if (p > 0 && p < 1) v = Math.max(v, (1 - p) * 0.13);
  }
  const open = 1 - ease.outCubic(span(t, 0, 0.7));
  return Math.max(v, open * 0.0);
}

function render(t) {
  t = clamp(t, 0, DURATION);

  renderShots(t);

  el.warmth.style.opacity = track(WARMTH, t).toFixed(4);
  const bloom = track(BLOOM, t);
  el.bloom.style.opacity = bloom.toFixed(4);
  el.bloom.style.transform = `scale(${(1 + 0.16 * Math.sin(t * 0.55)).toFixed(4)})`;

  // the scrim only needs to be there when type sits over photography
  const overEnd = span(t, BEATS.end[0] - 0.2, BEATS.end[0] + 0.4);
  el.scrim.style.opacity = (1 - overEnd).toFixed(3);

  renderChapter('ch1', t);
  renderChapter('ch2', t);
  renderChapter('ch3', t);
  renderBigWord('w1', t);
  renderBigWord('w2', t);
  renderBigWord('w3', t);
  renderChapter('ch4', t);
  renderSwap(t);
  renderOffer(t);
  renderLocations(t);
  renderEnd(t);

  el.flash.style.opacity = flashAt(t).toFixed(4);

  // grain resamples on a 12fps step — film, not video noise
  const g = Math.floor(t * 12);
  const gx = ((g * 137) % 311) - 155;
  const gy = ((g * 89) % 293) - 146;
  el.grain.style.backgroundPosition = `${gx}px ${gy}px`;

  // hold on black for the first two frames so the open reads as a cut-in
  el.stage.style.opacity = t < 0.03 ? '0' : '1';
}

/* ------------------------------------------------------------------ boot */

async function ready() {
  build();
  await document.fonts.ready;
  await Promise.all(
    Array.from(document.images).map((img) =>
      img.complete ? img.decode().catch(() => {}) : new Promise((r) => {
        img.onload = () => img.decode().then(r, r);
        img.onerror = r;
      })
    )
  );
  // re-measure the swap words now the variable font is really loaded
  swapWidths = swapNodes.map((d) => d.getBoundingClientRect().width);
  render(0);
  return true;
}

window.__DURATION = DURATION;
window.__SIZE = { W, H };
window.__render = render;
window.__ready = ready();
