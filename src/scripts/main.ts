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
   Hero — fade in content, ken-burns zoom
   ------------------------------------------------------------------ */

const heroFades = gsap.utils.toArray<HTMLElement>('[data-hero-fade]');
const heroImage = document.querySelector<HTMLElement>('.hero__media img');

if (reducedMotion) {
  gsap.set(heroFades, { clearProps: 'all' });
} else {
  gsap
    .timeline({ delay: 0.3 })
    .fromTo(
      heroFades,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 1.1, stagger: 0.14, ease: 'power2.out' },
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
   Media reveals — images unclip upward while the photo settles.
   One shared pattern so every photo on the site enters the same way.
   ------------------------------------------------------------------ */

gsap.utils.toArray<HTMLElement>('[data-media]').forEach((figure) => {
  const image = figure.querySelector('img');

  if (reducedMotion) {
    gsap.set(figure, { clipPath: 'none' });
    figure.classList.add('is-revealed');
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: { trigger: figure, start: 'top 82%', once: true },
    onComplete: () => {
      figure.classList.add('is-revealed');
      // Non-parallax images hand the transform back to CSS so hover
      // zooms keep working
      if (image && !figure.hasAttribute('data-parallax')) {
        gsap.set(image, { clearProps: 'transform' });
      }
    },
  });

  tl.to(figure, {
    clipPath: 'inset(0% 0% 0% 0%)',
    duration: 1.3,
    ease: 'power3.inOut',
  });

  if (image) {
    tl.from(image, { scale: '+=0.14', duration: 1.5, ease: 'power3.out' }, 0);
  }
});

/* ------------------------------------------------------------------
   Depth parallax — images drift at their own pace as you scroll past.
   data-parallax holds the drift amplitude in percent.
   ------------------------------------------------------------------ */

gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((element) => {
  if (reducedMotion) return;

  const target = element.querySelector('img') ?? element;
  const amount = parseFloat(element.dataset.parallax ?? '5');

  gsap.fromTo(
    target,
    { yPercent: -amount },
    {
      yPercent: amount,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.4,
      },
    },
  );
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
   Mailing list — subscribes via /api/subscribe (Buttondown)
   ------------------------------------------------------------------ */

const mailingForm = document.querySelector<HTMLFormElement>('#mailing-form');

if (mailingForm) {
  const emailInput = mailingForm.querySelector<HTMLInputElement>('input[type="email"]');
  const submitButton = mailingForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  const confirmNote = mailingForm.querySelector<HTMLElement>('.mailing__confirm');

  mailingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!emailInput || mailingForm.classList.contains('is-pending')) return;
    if (!emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }

    mailingForm.classList.add('is-pending');
    mailingForm.classList.remove('is-error');
    if (submitButton) submitButton.disabled = true;
    if (confirmNote) confirmNote.textContent = '';

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value.trim() }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Subscription failed');
      }

      mailingForm.classList.add('is-subscribed');
      emailInput.setAttribute('aria-disabled', 'true');
      emailInput.readOnly = true;
      if (confirmNote) {
        confirmNote.textContent =
          'You’re in — sea temperatures and sauna news coming your way.';
      }
    } catch (error) {
      mailingForm.classList.add('is-error');
      if (submitButton) submitButton.disabled = false;
      if (confirmNote) {
        confirmNote.textContent =
          error instanceof Error && error.message !== 'Subscription failed'
            ? error.message
            : 'The tide took that one — give it another go in a moment.';
      }
    } finally {
      mailingForm.classList.remove('is-pending');
    }
  });
}
