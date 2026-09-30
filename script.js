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
