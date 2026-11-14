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

/* Background: a faint registration lattice deformed by a heartbeat-driven displacement field. */
(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'bg-field';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const SPACING = 54, STEP = 12, PERIOD = 1.6;
  let w = 0, h = 0, dpr = 1, cx = 0, cy = 0, R = 1, rgb = '88,120,147', frame = 0;

  const readColor = () => {
    const hex = getComputedStyle(root).getPropertyValue('--accent').trim().replace('#', '');
    if (hex.length === 6) rgb = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const narrow = w < 760;
    cx = w * (narrow ? 0.74 : 0.82); cy = h * (narrow ? 0.3 : 0.44);
    R = Math.min(w, h) * (narrow ? 0.34 : 0.3);
  };

  // Two-phase "lub-dub" pulse in [0, 1].
  const beat = t => {
    const p = (t % PERIOD) / PERIOD;
    return Math.exp(-(((p - 0.12) / 0.055) ** 2)) + 0.45 * Math.exp(-(((p - 0.3) / 0.06) ** 2));
  };

  // Displacement field u(x, t): local contraction + slight twist + slow global drift.
  const warp = (x, y, t, b) => {
    const dx = x - cx, dy = y - cy;
    const g = Math.exp(-(dx * dx + dy * dy) / (R * R));
    const k = (b * g) / R;
    return [
      x - 24 * k * dx - 7 * k * dy + 5 * Math.sin(y / 230 + t * 0.23),
      y - 24 * k * dy + 7 * k * dx + 5 * Math.sin(x / 270 - t * 0.19)
    ];
  };

  const draw = t => {
    const b = reduceMotion.matches ? 0.35 : beat(t);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = ctx.fillStyle = `rgb(${rgb})`;

    // Lattice lines.
    ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
    ctx.beginPath();
    const ox = ((cx % SPACING) + SPACING) % SPACING - SPACING, oy = ((cy % SPACING) + SPACING) % SPACING - SPACING;
    for (let gx = ox; gx <= w + SPACING; gx += SPACING) {
      for (let y = -SPACING; y <= h + SPACING; y += STEP) {
        const [px, py] = warp(gx, y, t, b);
        y === -SPACING ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
    }
    for (let gy = oy; gy <= h + SPACING; gy += SPACING) {
      for (let x = -SPACING; x <= w + SPACING; x += STEP) {
        const [px, py] = warp(x, gy, t, b);
        x === -SPACING ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Control points.
    ctx.globalAlpha = 0.8;
    for (let gx = ox; gx <= w + SPACING; gx += SPACING) {
      for (let gy = oy; gy <= h + SPACING; gy += SPACING) {
        const [px, py] = warp(gx, gy, t, b);
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }
    }

    // A soft anatomical contour carried by the same field.
    ctx.globalAlpha = 1; ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const r = R * 0.42 * (1 + 0.07 * Math.sin(2 * a + 0.6) + 0.045 * Math.sin(3 * a + 1.4));
      const [px, py] = warp(cx + r * Math.cos(a), cy + r * Math.sin(a) * 1.12, t, b);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Fade everything out away from the "heart" so reading areas stay quiet.
    ctx.globalCompositeOperation = 'destination-in';
    const fade = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.4);
    fade.addColorStop(0, 'rgba(0,0,0,.32)');
    fade.addColorStop(0.45, 'rgba(0,0,0,.14)');
    fade.addColorStop(1, 'rgba(0,0,0,.025)');
    ctx.globalAlpha = 1; ctx.fillStyle = fade;
    ctx.fillRect(0, 0, w, h);
  };

  const loop = ms => { draw(ms / 1000); frame = requestAnimationFrame(loop); };
  const start = () => {
    cancelAnimationFrame(frame);
    reduceMotion.matches ? draw(0) : (frame = requestAnimationFrame(loop));
  };

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); if (reduceMotion.matches) draw(0); }, 120);
  });
  new MutationObserver(() => { readColor(); if (reduceMotion.matches) draw(0); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  reduceMotion.addEventListener?.('change', start);

  readColor(); resize(); start();
})();
