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

const revealGroups = [
  ['.section-heading', 0],
  ['.timeline-item', 90],
  ['.experience', 80],
  ['.publication', 75],
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
