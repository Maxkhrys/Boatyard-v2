import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ------------------------------------------------------------------
   Smooth scrolling (Lenis driven by GSAP's ticker)
   ------------------------------------------------------------------ */

let lenis: Lenis | null = null;

if (!reducedMotion) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Smooth in-page anchors (native scroll-behavior handles the reduced-motion case)
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target || !lenis) return;
    event.preventDefault();
    lenis.scrollTo(target as HTMLElement, { offset: href === '#top' ? 0 : -40 });
  });
});

/* ------------------------------------------------------------------
   "From the Pier to the Heat" — global scroll-driven warming.
   Background interpolates cold navy → warm cedar across the full page;
   --warmth (0→1) drives the amber glow and any accent intensities.
   Kept under reduced motion: it tracks scroll position directly and
   introduces no movement of its own.
   ------------------------------------------------------------------ */

const warmBackground = gsap.utils.interpolate([
  '#0b1d2e', // pier — deep navy
  '#0e2233', // open water
  '#28242a', // dusk, first embers
  '#43301f', // cedar
  '#5a3a20', // the stove — warm amber
]);

ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (self) => {
    root.style.setProperty('--bg', warmBackground(self.progress));
    root.style.setProperty('--warmth', self.progress.toFixed(3));
  },
});

/* ------------------------------------------------------------------
   Sticky nav — glassy blur once the hero is left behind
   ------------------------------------------------------------------ */

ScrollTrigger.create({
  start: 40,
  end: 'max',
  toggleClass: { targets: '#site-nav', className: 'is-scrolled' },
});

/* ------------------------------------------------------------------
   Hero — word-by-word headline reveal, CTA fade, ken-burns zoom
   ------------------------------------------------------------------ */

const heroWords = gsap.utils.toArray<HTMLElement>('.hero__word-inner');
const heroFades = gsap.utils.toArray<HTMLElement>('[data-hero-fade]');
const heroImage = document.querySelector<HTMLElement>('.hero__media img');

if (reducedMotion) {
  gsap.set([...heroWords, ...heroFades], { clearProps: 'all' });
} else {
  gsap
    .timeline({ defaults: { ease: 'power4.out' }, delay: 0.35 })
    .fromTo(heroWords, { yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: 0.14 })
    .fromTo(
      heroFades,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power2.out' },
      '-=0.6',
    );

  if (heroImage) {
    // Slow ken-burns drift, breathing in and out forever
    gsap.fromTo(
      heroImage,
      { scale: 1.08 },
      { scale: 1.18, duration: 26, ease: 'sine.inOut', yoyo: true, repeat: -1 },
    );
  }
}

/* ------------------------------------------------------------------
   Section reveals
   ------------------------------------------------------------------ */

gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
  if (reducedMotion) {
    gsap.set(element, { opacity: 1 });
    return;
  }
  gsap.fromTo(
    element,
    { opacity: 0, y: 44 },
    {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: element, start: 'top 86%', once: true },
    },
  );
});
