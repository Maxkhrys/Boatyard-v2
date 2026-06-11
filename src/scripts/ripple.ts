// Full-page water ripple effect — follows the mouse on desktop, skipped on
// touch devices and for users with reduced motion preferences.

const canvas = document.querySelector<HTMLCanvasElement>('.ripple-canvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

if (canvas && !reduceMotion && finePointer) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    interface Ripple {
      x: number;
      y: number;
      r: number;
      life: number;
    }

    let dpr = 1;
    let ripples: Ripple[] = [];
    let raf = 0;
    let lastX = -100;
    let lastY = -100;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      ripples = ripples.filter((ripple) => ripple.life > 0);
      for (const ripple of ripples) {
        ripple.r += 1.1 + ripple.r * 0.018;
        ripple.life -= 0.014;
        const alpha = Math.max(ripple.life, 0) ** 2 * 0.4;
        ctx.lineWidth = 1.4 * ripple.life;
        ctx.strokeStyle = `rgba(237, 242, 240, ${alpha})`;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(237, 242, 240, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.r * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      raf = ripples.length ? requestAnimationFrame(tick) : 0;
    };

    document.addEventListener('pointermove', (event) => {
      const x = event.clientX;
      const y = event.clientY;
      const dx = x - lastX;
      const dy = y - lastY;
      if (dx * dx + dy * dy < 1100) return;
      lastX = x;
      lastY = y;
      ripples.push({ x, y, r: 3, life: 1 });
      if (ripples.length > 28) ripples.shift();
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }
}
