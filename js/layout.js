import { el, brand } from './components.js';
import { icon } from './icons.js';
import { APP } from './data.js';

// One nav tree, two forms: tab bar below 768, sidebar (rail then full) from 768.
export const NAV = [
  { id: 'home', label: 'Home', icon: 'home', path: '/home' },
  { id: 'checklist', label: 'Checklist', icon: 'checklist', path: '/checklist' },
  { id: 'history', label: 'History', icon: 'history', path: '/history' },
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
];

let app;
let navLinks = [];

export function mountLayout({ onNavigate }) {
  app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const tabbar = document.getElementById('tabbar');

  const sideList = el('ul', { class: 'nav-list' });
  const tabList = [];
  NAV.forEach((item) => {
    const side = el('a', { class: 'nav-item', href: `#${item.path}`, dataset: { tab: item.id } }, icon(item.icon), el('span', { text: item.label }));
    const tab = el('a', { class: 'tab-item', href: `#${item.path}`, dataset: { tab: item.id } },
      el('span', { class: 'tab-item__icon' }, icon(item.icon)), el('span', { text: item.label }));
    [side, tab].forEach((link) => link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      onNavigate(item);
    }));
    sideList.append(el('li', {}, side));
    tabList.push(tab);
    navLinks.push(side, tab);
  });

  sidebar.replaceChildren(
    brand({ name: APP.name, sub: APP.role }),
    el('nav', { 'aria-label': 'Main' }, sideList),
  );
  tabbar.replaceChildren(...tabList);
}

export function setShell(shell, tab) {
  if (!app) return;
  app.dataset.shell = shell;
  navLinks.forEach((link) => {
    if (link.dataset.tab === tab) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

const mqDesktop = window.matchMedia('(min-width: 1024px)');
const mqTablet = window.matchMedia('(min-width: 768px)');
export const bp = {
  get desktop() { return mqDesktop.matches; },
  get tablet() { return mqTablet.matches && !mqDesktop.matches; },
  get mobile() { return !mqTablet.matches; },
  get touch() { return window.matchMedia('(hover: none)').matches; },
};
