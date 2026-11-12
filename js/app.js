import { router, defineRoutes } from './router.js';
import { mountLayout, setShell } from './layout.js';
import { store, buildChecklist, nextId } from './store.js';
import { toast } from './components.js';
import { CA, DOC_LIBRARY, FLAG_PRIORITY, TOASTS } from './data.js';
import * as screens from './screens.js';

/* ---------------- Routes ---------------- */
const ONBOARDING = ['/about-you', '/verify-identity', '/filing-history', '/link-ca', '/privacy'];

defineRoutes([
  { path: '/', title: 'ITR', redirect: (s) => (s.session ? (s.onboarded ? '/home' : (s.obStep || '/about-you')) : '/welcome') },
  { path: '/welcome', title: 'Welcome', shell: 'auth', guest: true, factory: screens.welcome },
  { path: '/create-account', title: 'Create your account', shell: 'auth', guest: true, factory: screens.createAccount },
  { path: '/verify-mobile', title: 'Verify your mobile', shell: 'auth', guest: true, needsDraft: true, factory: screens.verifyMobile },
  { path: '/login', title: 'Log in', shell: 'auth', guest: true, factory: screens.login },
  { path: '/about-you', title: 'Tell us about you', shell: 'auth', auth: true, onboarding: true, factory: screens.aboutYou },
  { path: '/verify-identity', title: 'Verify your identity', shell: 'auth', auth: true, onboarding: true, factory: screens.verifyIdentity },
  { path: '/filing-history', title: 'Your filing history', shell: 'auth', auth: true, onboarding: true, factory: screens.filingHistory },
  { path: '/link-ca', title: 'Link your CA', shell: (ctx) => (ctx.query.from ? 'sub' : 'auth'), tab: (ctx) => (ctx.query.from === 'settings' ? 'settings' : 'home'), auth: true, onboarding: true, factory: screens.linkCa },
  { path: '/privacy', title: 'Your data, your control', shell: 'auth', auth: true, onboarding: true, factory: screens.privacy },

  { path: '/home', title: 'Home', shell: 'tab', tab: 'home', auth: true, app: true, live: true, factory: screens.home },
  { path: '/checklist', title: 'Your checklist', shell: 'tab', tab: 'checklist', auth: true, app: true, live: true, factory: screens.checklist },
  { path: '/history', title: 'History', shell: 'tab', tab: 'history', auth: true, app: true, live: true, factory: screens.history },
  { path: '/settings', title: 'Settings', shell: 'tab', tab: 'settings', auth: true, app: true, live: true, factory: screens.settings },

  { path: '/review', title: 'Review and submit', shell: 'sub', tab: 'checklist', auth: true, app: true, needsReady: true, factory: screens.review },
  { path: '/sent', title: 'Sent', shell: 'sub', tab: 'checklist', auth: true, app: true, factory: screens.sent },
  { path: '/flagged/:id', title: 'Document flagged', shell: 'sub', tab: 'checklist', auth: true, app: true, needsFlag: true, factory: screens.flagged },
  { path: '/report/:kind', title: 'Report something new', shell: 'sub', tab: 'home', auth: true, app: true, factory: screens.report },
  { path: '/settings/profile', title: 'Profile & details', shell: 'sub', tab: 'settings', auth: true, app: true, factory: screens.settingsProfile },
  { path: '/settings/ca', title: 'Linked CA', shell: 'sub', tab: 'settings', auth: true, app: true, live: true, factory: screens.settingsCa },
  { path: '/settings/accounts', title: 'Linked accounts', shell: 'sub', tab: 'settings', auth: true, app: true, live: true, factory: screens.settingsAccounts },
  { path: '/settings/data', title: 'Data storage & access', shell: 'sub', tab: 'settings', auth: true, app: true, live: true, factory: screens.settingsData },
  { path: '/settings/notifications', title: 'Notifications', shell: 'sub', tab: 'settings', auth: true, app: true, factory: screens.settingsNotifications },
]);

function guard(route, loc) {
  const s = store.state;
  if (route.redirect) return route.redirect(s);
  if (route.guest && s.session) return s.onboarded ? '/home' : (s.obStep || '/about-you');
  if (route.needsDraft && !s.draft?.email) return '/create-account';
  if (route.auth && !s.session) return '/welcome';
  if (route.app && !s.onboarded) return s.obStep || '/about-you';
  if (route.onboarding && s.onboarded && !loc.query.from) return '/home';
  if (route.needsReady && !(s.docs.length && s.docs.every((d) => d.status === 'uploaded'))) return '/checklist';
  if (route.needsFlag) {
    const id = loc.path.split('/').pop();
    if (!s.docs.find((d) => d.id === id && d.status === 'flagged')) return '/checklist';
  }
  return null;
}

/* ---------------- Simulated CA: checklist, flag, complete ---------------- */
let simTimer = null;

function fire(event) {
  const s = store.state;
  if (!s.pending || s.pending.type !== event.type) return;
  if (event.type === 'checklist') {
    let n = 0;
    store.update((st) => {
      st.pending = null;
      if (st.stage !== 'waiting') return;
      st.docs = buildChecklist(st.incomes);
      n = st.docs.length;
      st.stage = 'active';
      st.activity.unshift({ id: nextId(), text: `${CA.first} sent your checklist`, at: Date.now(), kind: 'info', fresh: true });
      st.bellUnread = true;
    });
    if (n) toast(TOASTS.checklistReceived(n));
  }
  if (event.type === 'flag') {
    let title = '';
    store.update((st) => {
      st.pending = null;
      if (st.stage !== 'review') return;
      const id = FLAG_PRIORITY.find((k) => st.docs.some((d) => d.id === k)) || st.docs[0].id;
      st.docs.forEach((d) => {
        if (d.id === id) {
          d.status = 'flagged';
          d.prevFile = d.file;
          d.file = null;
          d.flagNote = DOC_LIBRARY[id].flag?.note || 'This copy is hard to read. Could you upload a clearer PDF?';
        } else {
          d.status = 'received';
        }
      });
      title = DOC_LIBRARY[id].title;
      st.stage = 'fixing';
      st.flaggedOnce = true;
      st.activity.unshift({ id: nextId(), text: `${CA.first} flagged ${title}`, at: Date.now(), kind: 'warning', fresh: true });
      st.bellUnread = true;
    });
    if (title) toast(TOASTS.flagged(title));
  }
  if (event.type === 'complete') {
    let ok = false;
    store.update((st) => {
      st.pending = null;
      if (st.stage !== 'rechecking') return;
      st.docs.forEach((d) => { d.status = 'received'; });
      st.stage = 'complete';
      st.activity.unshift({ id: nextId(), text: `${CA.first} marked your file complete`, at: Date.now(), kind: 'success', fresh: true });
      st.bellUnread = true;
      ok = true;
    });
    if (ok) toast(TOASTS.complete);
  }
}

function schedule() {
  clearTimeout(simTimer);
  const p = store.state.pending;
  if (!p) return;
  simTimer = setTimeout(() => fire(p), Math.max(0, p.at - Date.now()));
}

/* ---------------- Boot ---------------- */
function cleanStaleFlags() {
  if (!store.state.docs?.some((d) => d.busy)) return;
  store.update((s) => { s.docs.forEach((d) => { d.busy = false; }); });
}

function runSplash(done) {
  const splash = document.getElementById('splash');
  if (!splash) { done(); return; }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) splash.classList.add('is-static');
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    splash.remove();
    done();
  };
  splash.addEventListener('click', finish);
  document.addEventListener('keydown', function skip(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { document.removeEventListener('keydown', skip); finish(); }
  });
  setTimeout(finish, reduce ? 900 : 2000);
}

function boot() {
  const app = document.getElementById('app');
  cleanStaleFlags();

  mountLayout({
    onNavigate: (item) => {
      const cur = router.current?.loc.path;
      if (cur === item.path) {
        document.querySelector('.screen:not(.is-exiting)')?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      router.go(item.path, { dir: 'fade' });
    },
  });

  router.configure({
    guard,
    beforeRender: (route, ctx) => {
      const shell = typeof route.shell === 'function' ? route.shell(ctx) : route.shell;
      const tab = typeof route.tab === 'function' ? route.tab(ctx) : route.tab;
      setShell(shell, tab);
    },
    afterRender: (route, ctx, node, meta) => {
      document.title = `${route.title} · ITR`;
      if (meta?.refresh || ctx.dir === 'none') return;
      const heading = node.querySelector('h1');
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        requestAnimationFrame(() => heading.focus({ preventScroll: true }));
      }
    },
  });

  store.subscribe((state, prev) => {
    if (state.pending !== prev.pending) schedule();
    router.refresh();
  });

  schedule();
  router.start();
  app.dataset.ready = 'true';

  runSplash(() => {
    app.classList.add('is-entering');
    app.addEventListener('animationend', () => app.classList.remove('is-entering'), { once: true });
  });

  window.addEventListener('offline', () => toast('You’re offline. We’ll keep your place and try again when you’re back.', { kind: 'error' }));
  window.addEventListener('online', () => toast('You’re back online.', { kind: 'info' }));
}

boot();
