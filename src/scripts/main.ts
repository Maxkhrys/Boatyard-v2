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
    .timeline({ delay: 0.4 })
    .fromTo(
      heroWords,
      { yPercent: 115, rotate: 2.5 },
      {
        yPercent: 0,
        rotate: 0,
        duration: 1.6,
        stagger: 0.13,
        ease: 'expo.out',
        transformOrigin: 'left bottom',
      },
    )
    .fromTo(
      heroFades,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power2.out' },
      '-=0.9',
    );

  if (heroImage) {
    // Slow, cinematic ken-burns — barely perceptible in any given second
    gsap.fromTo(
      heroImage,
      { scale: 1.06 },
      { scale: 1.17, duration: 40, ease: 'sine.inOut', yoyo: true, repeat: -1 },
    );

    // Gentle parallax as the hero scrolls away
    gsap.to('.hero__media', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

/* ------------------------------------------------------------------
   Intro statement — words ink in as you read down the page.
   Scroll-scrubbed, so it tracks user input directly.
   ------------------------------------------------------------------ */

const statementWords = gsap.utils.toArray<HTMLElement>('.statement__word');

if (statementWords.length && !reducedMotion) {
  gsap.to(statementWords, {
    opacity: 1,
    duration: 0.4,
    stagger: 0.08,
    ease: 'none',
    scrollTrigger: {
      trigger: '#intro',
      start: 'top 75%',
      end: 'bottom 60%',
      scrub: 0.6,
    },
  });
}

/* ------------------------------------------------------------------
   The Experience — standout moment #1.
   Desktop + full motion: pinned stage, three beats crossfading with
   parallax. Mobile / reduced motion: calm stacked layout.
   ------------------------------------------------------------------ */

const experience = document.querySelector<HTMLElement>('.experience');

if (experience) {
  const mm = gsap.matchMedia();

  mm.add(
    {
      cinematic: '(min-width: 800px) and (prefers-reduced-motion: no-preference)',
      calm: '(max-width: 799.98px), (prefers-reduced-motion: reduce)',
    },
    (context) => {
      const { cinematic } = context.conditions as { cinematic: boolean };
      const beats = gsap.utils.toArray<HTMLElement>('.experience__beat', experience);

      if (!cinematic) {
        if (!reducedMotion) {
          beats.forEach((beat) => {
            gsap.fromTo(
              beat,
              { opacity: 0, y: 44 },
              {
                opacity: 1,
                y: 0,
                duration: 1.1,
                ease: 'power3.out',
                scrollTrigger: { trigger: beat, start: 'top 86%', once: true },
              },
            );
          });
        }
        return;
      }

      experience.classList.add('is-cinematic');

      gsap.set(beats, { autoAlpha: 0 });
      gsap.set(beats[0], { autoAlpha: 1 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: experience,
          start: 'top top',
          end: '+=280%',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });

      beats.forEach((beat, index) => {
        const image = beat.querySelector('img');
        const copy = beat.querySelector('.experience__copy');

        // Each beat's image drifts slowly through its act — the parallax
        if (image) {
          tl.fromTo(
            image,
            { yPercent: -6, scale: 1.14 },
            { yPercent: 6, scale: 1.04, duration: 1 },
            index,
          );
        }
        if (copy) {
          tl.fromTo(copy, { y: 36 }, { y: -12, duration: 1 }, index);
        }

        // Crossfade into the next act
        if (index > 0) {
          tl.to(beats[index - 1], { autoAlpha: 0, duration: 0.16 }, index - 0.08);
          tl.to(beat, { autoAlpha: 1, duration: 0.16 }, index - 0.08);
        }
      });

      tl.fromTo(
        '.experience__rail-fill',
        { scaleY: 0 },
        { scaleY: 1, duration: beats.length },
        0,
      );

      return () => {
        experience.classList.remove('is-cinematic');
        gsap.set(beats, { clearProps: 'all' });
      };
    },
  );
}

/* ------------------------------------------------------------------
   "From the Pier to the Heat" — global scroll-driven warming.
   Background interpolates cold navy → warm cedar, peaking at the
   mailing-list section; --warmth (0→1) drives the amber glow.
   Kept under reduced motion: it tracks scroll position directly and
   introduces no movement of its own.
   Created after the pinned section so its measurements include the
   pin spacer.
   ------------------------------------------------------------------ */

const warmBackground = gsap.utils.interpolate([
  '#0b1d2e', // pier — deep navy
  '#0e2233', // open water
  '#28242a', // dusk, first embers
  '#43301f', // cedar
  '#5a3a20', // the stove — warm amber
]);

const mailing = document.querySelector<HTMLElement>('#mailing');

const applyWarmth = (progress: number) => {
  root.style.setProperty('--bg', warmBackground(progress));
  root.style.setProperty('--warmth', progress.toFixed(3));
};

ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  endTrigger: mailing ?? document.body,
  end: mailing ? 'center center' : 'bottom bottom',
  onUpdate: (self) => applyWarmth(self.progress),
  onRefresh: (self) => applyWarmth(self.progress),
});

/* ------------------------------------------------------------------
   Section reveals — calm entrances everywhere else
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

/* ------------------------------------------------------------------
   Mailing list — front-end only subscribe with a quiet thank-you
   ------------------------------------------------------------------ */

const mailingForm = document.querySelector<HTMLFormElement>('#mailing-form');

if (mailingForm) {
  const emailInput = mailingForm.querySelector<HTMLInputElement>('input[type="email"]');
  const confirmNote = mailingForm.querySelector<HTMLElement>('.mailing__confirm');

  mailingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!emailInput) return;
    if (!emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }
    mailingForm.classList.add('is-subscribed');
    emailInput.setAttribute('aria-disabled', 'true');
    emailInput.readOnly = true;
    if (confirmNote) {
      confirmNote.textContent = 'Grand. One short note a week — first one is on its way.';
    }
  });
}
