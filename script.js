const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
const links = [...document.querySelectorAll('.nav-links a')];
const sections = links.map(link => document.querySelector(link.hash)).filter(Boolean);
const themeToggle = document.querySelector('.theme-toggle');
const themeLabel = themeToggle?.querySelector('.theme-label');
const root = document.documentElement;

const setTheme = theme => {
  const dark = theme === 'dark';
  root.dataset.theme = theme;
  if (!themeToggle || !themeLabel) return;
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
  themeLabel.textContent = dark ? 'Light' : 'Dark';
};

let savedTheme = null;
try {
  savedTheme = localStorage.getItem('theme');
} catch (_error) {
  // The switch still works when browser privacy settings disable storage.
}
const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
setTheme(savedTheme || preferredTheme);

themeToggle?.addEventListener('click', () => {
  const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
  try {
    localStorage.setItem('theme', nextTheme);
  } catch (_error) {
    // Keep the selected theme for this page even if it cannot be saved.
  }
});

menuButton.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

links.forEach(link => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  });
}, { rootMargin: '-30% 0px -60% 0px' });

sections.forEach(section => observer.observe(section));

const articleToc = document.querySelector('.article-toc-sticky');
const articleTocLinks = articleToc ? [...articleToc.querySelectorAll('a[href^="#"]')] : [];
const articleSections = articleTocLinks
  .map(link => document.getElementById(link.hash.slice(1)))
  .filter(Boolean);

const setActiveArticleSection = sectionId => {
  articleTocLinks.forEach(link => {
    const active = link.hash === `#${sectionId}`;
    link.classList.toggle('active', active);
    if (active) {
      link.setAttribute('aria-current', 'location');
      link.scrollIntoView({ block:'nearest', inline:'nearest' });
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

if (articleSections.length && 'IntersectionObserver' in window) {
  const articleObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible[0]) setActiveArticleSection(visible[0].target.id);
  }, { rootMargin:'-15% 0px -72% 0px', threshold:0 });

  articleSections.forEach(section => articleObserver.observe(section));
  setActiveArticleSection(articleSections[0].id);
}

const revealGroups = [
  ['.section-heading', 0],
  ['.timeline-item', 90],
  ['.experience', 80],
  ['.publication', 75],
  ['.blog-post-card', 0],
  ['.blog-note', 0]
];

const revealElements = revealGroups.flatMap(([selector, stagger]) =>
  [...document.querySelectorAll(selector)].map((element, index) => {
    element.classList.add('scroll-reveal');
    element.style.setProperty('--reveal-delay', `${(index % 4) * stagger}ms`);
    return element;
  })
);

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold:0.12, rootMargin:'0px 0px -40px' });

  revealElements.forEach(element => revealObserver.observe(element));
} else {
  revealElements.forEach(element => element.classList.add('revealed'));
}

/* Background: a registration lattice spread over the whole site, deformed by
   several scattered "hearts" that beat slightly out of phase. */
(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'bg-field';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const SPACING = 48, STEP = 12, PARALLAX = 0.35;
  let w = 0, h = 0, dpr = 1, rgb = '88,120,147', dark = false, frame = 0;
  let hearts = [];

  // Deterministic pseudo-random numbers so the layout is stable between visits.
  const rand = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const readColor = () => {
    dark = root.dataset.theme === 'dark';
    const hex = getComputedStyle(root).getPropertyValue('--accent').trim().replace('#', '');
    if (hex.length === 6) rgb = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
  };

  // Scatter hearts over the full (parallax-scaled) page height on a jittered grid.
  const layout = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const worldH = h + (document.documentElement.scrollHeight - h) * PARALLAX + h * 0.5;
    const base = Math.max(110, Math.min(w, h) * 0.17);
    const cols = Math.max(2, Math.round(w / (base * 2.5)));
    const cell = w / cols;
    const rowH = cell * 0.8;
    const rows = Math.max(1, Math.ceil(worldH / rowH));
    const r = rand(20250806);
    hearts = [];
    for (let row = 0; row < rows; row++) {
      const offset = row % 2 ? 0.5 : 0;
      for (let col = 0; col < cols + 1; col++) {
        if (r() < 0.12) continue;
        hearts.push({
          x: (col - offset + 0.25 + r() * 0.5) * cell,
          y: (row + 0.25 + r() * 0.5) * rowH,
          R: base * (0.7 + r() * 0.6),
          phase: r(),
          period: 1.4 + r() * 0.6,
          twist: (r() - 0.5) * 16,
          s2: r() * 6, s3: r() * 6,
          elong: 0.9 + r() * 0.35
        });
      }
    }
  };

  // Two-phase "lub-dub" pulse in [0, 1].
  const beat = (t, H) => {
    const p = ((t / H.period) + H.phase) % 1;
    return Math.exp(-(((p - 0.12) / 0.055) ** 2)) + 0.45 * Math.exp(-(((p - 0.3) / 0.06) ** 2));
  };

  let active = [];
  const warp = (x, y, t) => {
    let px = x + 5 * Math.sin(y / 230 + t * 0.23);
    let py = y + 5 * Math.sin(x / 270 - t * 0.19);
    for (const H of active) {
      const dx = x - H.cx, dy = y - H.cy;
      const d2 = dx * dx + dy * dy, R2 = H.R * H.R;
      if (d2 > 6 * R2) continue;
      const k = (H.b * Math.exp(-d2 / R2)) / H.R;
      px -= 26 * k * dx + H.twist * k * dy;
      py -= 26 * k * dy - H.twist * k * dx;
    }
    return [px, py];
  };

  const draw = t => {
    const shift = window.scrollY * PARALLAX;
    active = hearts
      .map(H => ({ ...H, cx: H.x, cy: H.y - shift, b: reduceMotion.matches ? 0.35 : beat(t, H) }))
      .filter(H => H.cy > -3 * H.R && H.cy < h + 3 * H.R);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = ctx.fillStyle = `rgb(${rgb})`;
    const a = dark ? 1 : 1.15;

    // Lattice lines (scroll with a gentle parallax).
    const oy = -(((shift % SPACING) + SPACING) % SPACING);
    ctx.globalAlpha = 0.13 * a; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 0; gx <= w + SPACING; gx += SPACING) {
      for (let y = -SPACING; y <= h + SPACING; y += STEP) {
        const [px, py] = warp(gx, y, t);
        y === -SPACING ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
    }
    for (let gy = oy - SPACING; gy <= h + SPACING; gy += SPACING) {
      for (let x = -SPACING; x <= w + SPACING; x += STEP) {
        const [px, py] = warp(x, gy, t);
        x === -SPACING ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Control points.
    ctx.globalAlpha = 0.3 * a;
    for (let gx = 0; gx <= w + SPACING; gx += SPACING) {
      for (let gy = oy - SPACING; gy <= h + SPACING; gy += SPACING) {
        const [px, py] = warp(gx, gy, t);
        ctx.fillRect(px - 1.1, py - 1.1, 2.2, 2.2);
      }
    }

    // Anatomical contours carried by the same field, brightening on each beat.
    ctx.lineWidth = 1.4;
    for (const H of active) {
      ctx.globalAlpha = (0.26 + 0.2 * Math.min(H.b, 1)) * a;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const ang = (i / 80) * Math.PI * 2;
        const r = H.R * 0.5 * (1 + 0.07 * Math.sin(2 * ang + H.s2) + 0.045 * Math.sin(3 * ang + H.s3));
        const [px, py] = warp(H.cx + r * Math.cos(ang), H.cy + r * Math.sin(ang) * H.elong, t);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  };

  const loop = ms => { draw(ms / 1000); frame = requestAnimationFrame(loop); };
  const redrawStatic = () => { if (reduceMotion.matches) draw(0); };
  const start = () => {
    cancelAnimationFrame(frame);
    reduceMotion.matches ? draw(0) : (frame = requestAnimationFrame(loop));
  };

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { layout(); redrawStatic(); }, 120);
  });
  window.addEventListener('load', () => { layout(); redrawStatic(); });
  window.addEventListener('scroll', redrawStatic, { passive: true });
  new MutationObserver(() => { readColor(); redrawStatic(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  reduceMotion.addEventListener?.('change', start);

  readColor(); layout(); start();
})();
