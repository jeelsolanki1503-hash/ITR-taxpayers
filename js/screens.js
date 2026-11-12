import {
  el, button, iconButton, linkButton, textField, amountField, otpInput, optionCard, checkRow, chipGroup, toggleRow,
  pill, badge, progress, spinner, skeletonRow, stepper, card, highlightCard, iconTile, actionCard, row, activityList,
  emptyState, banner, note, kvTable, fileChip, avatar, screen, mainHeader, backHeader, screenFooter, toast, openSheet,
  confirmSheet, announce, setLoading, maskMobile, formatMobile, digitsOnly, relativeTime, formatBytes, dropzone, uid,
} from './components.js';
import { icon, logo } from './icons.js';
import {
  APP, CA, DEADLINE, DEMO, PERSONAS, EXISTING_EMAILS, INCOME_OPTIONS, REMIND_CHANNELS, DOC_LIBRARY, FLAG_PRIORITY,
  STEPS, FILINGS, ACCOUNTS, REPORT_KINDS, TOASTS, UPLOAD_RULES, sourcesLabel, sourcesList, checklistFor,
} from './data.js';
import { store, freshState, seedAnita, seedRitika, buildChecklist, nextId } from './store.js';
import { bp } from './layout.js';

/* ================= Helpers ================= */
const S = () => store.state;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const emailOK = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const isAnita = () => S().session?.persona === 'anita';
const firstName = () => S().profile?.first || '';
const lib = (id) => DOC_LIBRARY[id];
const docById = (id) => S().docs.find((d) => d.id === id);
const docView = (d) => ({ ...lib(d.id), ...d, how: d.how || lib(d.id).how });
const act = (text, kind = 'info') => ({ id: nextId(), text, at: Date.now(), kind, fresh: true });
const PRE_SUBMIT = ['active', 'returning'];

function pushActivity(s, text, kind) {
  s.activity.unshift(act(text, kind));
  s.activity = s.activity.slice(0, 12);
  s.bellUnread = true;
}

function counts() {
  const docs = S().docs;
  const total = docs.length;
  const uploaded = docs.filter((d) => ['uploaded', 'sent', 'received', 'resent'].includes(d.status)).length;
  return {
    total,
    uploaded,
    flagged: docs.filter((d) => d.status === 'flagged'),
    resent: docs.filter((d) => d.status === 'resent'),
    allUploaded: total > 0 && docs.every((d) => d.status === 'uploaded'),
  };
}

function bell() {
  return {
    unread: S().bellUnread,
    onClick: () => {
      const latest = S().activity[0];
      const hadUnread = S().bellUnread;
      store.set({ bellUnread: false });
      toast(hadUnread && latest ? `Latest: ${latest.text}` : TOASTS.bell, { kind: 'info' });
    },
  };
}

function section(title, ...children) {
  return el('div', { class: 'sheet__section' }, el('h3', { class: 't-body-strong', text: title }), children);
}

function nudge() {
  toast(TOASTS.nudged);
  store.update((s) => pushActivity(s, `You nudged ${CA.first}`, 'info'));
}

function askDeepak() {
  toast(TOASTS.asked);
}

function blockedHint(btn, hintNode, message, onBlocked) {
  btn.addEventListener('blocked', () => {
    hintNode.classList.add('is-blocked');
    hintNode.classList.remove('shake');
    void hintNode.offsetWidth;
    hintNode.classList.add('shake');
    announce(message || hintNode.textContent);
    onBlocked?.();
  });
}

function stacked(footer) {
  footer.classList.add('screen-footer--stack');
  return footer;
}

function setOnboardingStep(path) {
  if (S().obStep !== path) store.set({ obStep: path });
}

function fileMeta(d) {
  const f = d.file;
  if (!f) return '';
  let tail;
  if (f.source === 'fetched') tail = 'auto-fetched';
  else if (d.status === 'received') tail = 'received';
  else if (d.corrected) tail = 'corrected';
  else tail = `uploaded ${relativeTime(f.at || Date.now()).toLowerCase()}`;
  return `${f.name} · ${f.size} · ${tail}`;
}

/* ================= Welcome ================= */
export function welcome(ctx) {
  const social = (provider, btn) => async () => {
    setLoading(btn(), true);
    await wait(900);
    startReturning(ctx, PERSONAS.ritika.email);
    toast(TOASTS.social(provider));
  };
  let googleBtn; let appleBtn;
  googleBtn = button({ label: 'Continue with Google', kind: 'secondary', block: true, onClick: social('Google', () => googleBtn) });
  appleBtn = button({ label: 'Continue with Apple', kind: 'secondary', block: true, onClick: social('Apple', () => appleBtn) });

  return el('section', { class: 'screen welcome-screen', 'data-screen': 'welcome' },
    el('div', { class: 'screen-frame' },
      el('div', { class: 'welcome' },
        el('div', { class: 'card card--glass welcome__card' },
          el('div', { class: 'welcome__hero' },
            el('div', { class: 'welcome__brand' },
              logo({ className: 'brand__mark brand__mark--xl', title: '' }),
              el('span', { class: 'welcome__wordmark', text: APP.name }),
            ),
            el('h1', { class: 'welcome__title t-display', text: APP.tagline }),
            el('p', { class: 'welcome__sub t-body-lg', text: APP.pitch }),
          ),
          el('div', { class: 'welcome__actions' },
            button({ label: 'Create account', block: true, onClick: () => ctx.go('/create-account') }),
            button({ label: 'Log in', kind: 'secondary', block: true, onClick: () => ctx.go('/login') }),
            el('p', { class: 'divider-text t-chart-title', text: 'Or continue with' }),
            googleBtn,
            appleBtn,
          ),
        ),
      ),
    ),
  );
}

function startReturning(ctx, email) {
  const key = (email || '').toLowerCase();
  store.update((st) => {
    const saved = st.saved || {};
    if (saved[key]) {
      const restored = { ...saved[key], saved };
      return restored;
    }
    const next = seedRitika({ ...freshState(), saved });
    if (key && key !== PERSONAS.ritika.email) next.profile.email = email;
    return next;
  });
  ctx.go('/home', { replace: true, dir: 'fade' });
}

/* ================= Create account ================= */
export function createAccount(ctx) {
  const d = S().draft || {};
  const formId = uid('create');
  const name = textField({ label: 'Full name', value: d.name, autocomplete: 'name', required: true });
  const email = textField({ label: 'Email address', type: 'email', value: d.email, autocomplete: 'email', inputmode: 'email', required: true });
  const mobile = textField({ label: 'Mobile number', type: 'tel', value: d.mobile, autocomplete: 'tel-national', inputmode: 'numeric', prefix: '+91', required: true, maxlength: '11' });
  mobile.input.addEventListener('input', () => {
    const x = digitsOnly(mobile.input.value).slice(0, 10);
    mobile.input.value = x.length > 5 ? `${x.slice(0, 5)} ${x.slice(5)}` : x;
  });

  const existsSlot = el('div');
  const submit = button({ label: 'Continue', type: 'submit', block: true });
  submit.setAttribute('form', formId);

  const form = el('form', { id: formId, class: 'fields', novalidate: true },
    name.root, email.root, mobile.root, existsSlot,
    el('p', { class: 'legal t-small', text: 'By continuing you agree to the Terms of Service and Privacy Policy.' }),
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    existsSlot.replaceChildren();
    let first = null;
    if (!name.value) { name.setError('Enter your full name'); first ||= name.input; }
    if (!emailOK(email.value)) { email.setError('Enter a valid email, like name@example.com'); first ||= email.input; }
    if (digitsOnly(mobile.value).length !== 10) { mobile.setError('Enter a 10-digit mobile number'); first ||= mobile.input; }
    if (first) { first.focus(); return; }
    const known = [...EXISTING_EMAILS, ...Object.keys(S().saved || {})];
    if (known.includes(email.value.toLowerCase())) {
      email.setError('This email already has an account');
      existsSlot.replaceChildren(card({
        variant: 'solid',
        className: 'fade-up',
        title: 'Looks like you’ve been here before',
        titleTag: 'h2',
        titleClass: 't-body-strong',
        sub: 'Log in to pick up where you left off.',
        children: button({ label: 'Log in instead', kind: 'secondary', block: true, onClick: () => ctx.go('/login') }),
      }));
      email.input.focus();
      return;
    }
    setLoading(submit, true);
    await wait(600);
    store.set({ draft: { name: name.value, email: email.value, mobile: mobile.value } });
    ctx.go('/verify-mobile');
  });

  return screen({
    name: 'create-account',
    header: backHeader({ title: 'Create your account', onBack: () => ctx.back('/welcome') }),
    body: card({
      children: [
        el('p', { class: 'auth-intro t-body-lg', text: 'Takes about 2 minutes. Next you’ll verify your mobile and link your CA.' }),
        form,
      ],
    }),
    footer: screenFooter(
      submit,
      el('p', { class: 'auth-alt t-body' }, 'Already have an account?', linkButton({ label: 'Log in', onClick: () => ctx.go('/login') })),
    ),
  });
}

/* ================= Verify mobile ================= */
export function verifyMobile(ctx) {
  const draft = S().draft;
  const number = formatMobile(draft.mobile);
  let attempts = 3;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const errorSlot = el('div', { 'aria-live': 'assertive' });
  const btn = button({ label: 'Verify and continue', block: true, onClick: () => verify() });

  const otp = otpInput({
    onComplete: () => { setTimeout(() => { if (otp.value.length === 6) verify(); }, 180); },
    onChange: () => errorSlot.replaceChildren(),
  });

  const showError = (msg) => {
    otp.setError(true);
    errorSlot.replaceChildren(el('p', { class: 'field__error', role: 'alert' }, icon('alert', { size: 16 }), el('span', { text: msg })));
  };

  let busy = false;
  async function verify() {
    if (busy) return;
    const value = otp.value;
    if (value.length !== 6) { showError('Enter the 6-digit code we sent you.'); otp.focus(); return; }
    busy = true;
    setLoading(btn, true);
    await wait(700);
    setLoading(btn, false);
    busy = false;
    if (value === DEMO.otpWrong) {
      attempts -= 1;
      showError(`That code didn’t match. You have ${attempts} attempt${attempts === 1 ? '' : 's'} left.`);
      otp.focus();
      return;
    }
    store.update((s) => seedAnita({ ...s }, s.draft));
    setOnboardingStep('/about-you');
    ctx.go('/about-you', { replace: true });
  }

  const resend = () => toast(TOASTS.codeResent(maskMobile(draft.mobile)));

  setTimeout(() => {
    if (document.querySelector('[data-screen="verify-mobile"]')) toast(`SMS from ITR: ${code} is your verification code.`, { kind: 'info' });
  }, 1400);

  return screen({
    name: 'verify-mobile',
    header: backHeader({ title: 'Verify your mobile', onBack: () => ctx.back('/create-account') }),
    body: card({
      children: [
        el('p', { class: 'auth-intro t-body-lg' },
          `We sent a 6-digit code to ${number.replace(/ /g, ' ')}. `,
          linkButton({ label: 'Change', className: 'verify-change', onClick: () => ctx.back('/create-account') }),
        ),
        el('div', { class: 'stack' },
          el('p', { class: 'field__label t-label', id: 'otp-label', text: 'Verification code' }),
          otp.root,
          errorSlot,
          el('p', { class: 'field__helper t-small', text: 'The code expires in 10 minutes.' }),
        ),
        el('p', { class: 'auth-alt t-body only-mobile' }, 'Didn’t get the code?', linkButton({ label: 'Resend code', onClick: resend })),
      ],
    }),
    footer: screenFooter(btn, el('p', { class: 'auth-alt t-body only-desktop' }, 'Didn’t get the code?', linkButton({ label: 'Resend code', onClick: resend }))),
  });
}

/* ================= Login ================= */
export function login(ctx) {
  const formId = uid('login');
  const email = textField({ label: 'Email address', type: 'email', autocomplete: 'email', inputmode: 'email', required: true });
  let shown = false;
  const eye = iconButton({ icon: 'eye', label: 'Show password', onClick: () => {
    shown = !shown;
    password.input.type = shown ? 'text' : 'password';
    eye.replaceChildren(icon(shown ? 'eye-off' : 'eye'));
    eye.setAttribute('aria-label', shown ? 'Hide password' : 'Show password');
  } });
  const password = textField({ label: 'Password', type: 'password', autocomplete: 'current-password', required: true });
  const trailing = password.root.querySelector('.field__trailing');
  trailing.classList.add('field__trailing--btn');
  trailing.removeAttribute('aria-hidden');
  trailing.replaceChildren(eye);
  password.input.classList.add('has-trailing');

  const errorSlot = el('div');
  const submit = button({ label: 'Log in', type: 'submit', block: true });
  submit.setAttribute('form', formId);

  const form = el('form', { id: formId, class: 'fields', novalidate: true }, errorSlot, email.root, password.root,
    el('div', { class: 'auth-row-end' }, linkButton({ label: 'Forgot password?', target: true, onClick: () => {
      if (!emailOK(email.value)) { email.setError('Enter the email you signed up with'); email.input.focus(); return; }
      toast(TOASTS.resetLink);
    } })),
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorSlot.replaceChildren();
    let first = null;
    if (!emailOK(email.value)) { email.setError('Enter the email you signed up with'); first ||= email.input; }
    if (!password.input.value) { password.setError('Enter your password'); first ||= password.input; }
    if (first) { first.focus(); return; }
    setLoading(submit, true);
    await wait(800);
    setLoading(submit, false);
    if (password.input.value.length < DEMO.shortPasswordIsWrong) {
      errorSlot.replaceChildren(banner({ kind: 'danger', className: 'is-new', title: 'That email and password don’t match', text: 'Check them and try again, or reset your password.' }));
      password.input.select();
      return;
    }
    startReturning(ctx, email.value);
  });

  return screen({
    name: 'login',
    header: backHeader({ onBack: () => ctx.back('/welcome') }),
    body: card({
      children: [
        el('div', { class: 'stack stack--tight login-hero' },
          logo({ className: 'brand__mark brand__mark--lg auth-logo', title: 'ITR logo' }),
          el('h1', { class: 't-h1', tabindex: '-1', text: 'Welcome back' }),
          el('p', { class: 'auth-intro t-body-lg', text: 'Sign in to manage your ITR filing' }),
        ),
        form,
      ],
    }),
    footer: screenFooter(
      submit,
      el('p', { class: 'auth-alt t-body' }, 'New here?', linkButton({ label: 'Create account', onClick: () => ctx.go('/create-account') })),
    ),
  });
}

/* ================= Tell us about you ================= */
export function aboutYou(ctx) {
  let incomes = [...S().incomes];
  let remind = [...S().remind];
  const errorSlot = el('div', { 'aria-live': 'assertive' });
  const list = el('div', { class: 'option-list', role: 'group', 'aria-labelledby': 'income-q' },
    INCOME_OPTIONS.map((o) => optionCard({
      title: o.title,
      desc: o.desc,
      checked: incomes.includes(o.id),
      onToggle: (on) => {
        incomes = on ? [...incomes, o.id] : incomes.filter((x) => x !== o.id);
        if (incomes.length) { errorSlot.replaceChildren(); list.classList.remove('is-error'); }
      },
    })),
  );

  const go = () => {
    if (!incomes.length) {
      list.classList.add('is-error');
      errorSlot.replaceChildren(banner({ kind: 'danger', className: 'is-new', text: `Pick at least one so ${CA.first} knows what to ask for.` }));
      errorSlot.closest('.screen')?.scrollTo({ top: 0, behavior: 'smooth' });
      list.querySelector('button')?.focus({ preventScroll: true });
      return;
    }
    store.set({ incomes, remind, notify: { ...S().notify, whatsapp: remind.includes('whatsapp'), email: remind.includes('email'), sms: remind.includes('sms') } });
    setOnboardingStep('/verify-identity');
    ctx.go('/verify-identity');
  };

  const questionCard = card({
    title: 'What income did you have this year?',
    titleTag: 'h2',
    titleClass: 't-h1',
    sub: `Pick all that apply. ${CA.first} builds your checklist from this.`,
    children: list,
  });
  questionCard.querySelector('.card__title').id = 'income-q';

  return screen({
    name: 'about-you',
    header: backHeader({ title: 'Tell us about you', onBack: () => ctx.back('/welcome') }),
    body: [
      errorSlot,
      questionCard,
      card({
        title: 'How should we remind you?',
        titleClass: 't-title',
        sub: 'We’ll nudge you before deadlines, never more than twice a week.',
        children: chipGroup({ label: 'Reminder channels', options: REMIND_CHANNELS, selected: remind, onChange: (v) => { remind = v; } }),
      }),
    ],
    footer: screenFooter(button({ label: 'Continue', block: true, onClick: go })),
  });
}

/* ================= Verify identity ================= */
export function verifyIdentity(ctx) {
  const id = S().identity;
  const both = id.aadhaar === 'ok' && id.pan === 'ok';
  const anyError = id.aadhaar === 'error' || id.pan === 'error';

  const docCard = (key, title, desc) => {
    const status = id[key];
    const statusLine = status === 'ok'
      ? el('p', { class: 'verify-card__status t-code' }, el('span', { text: key === 'aadhaar' ? 'XXXX XXXX 4821' : (S().profile?.pan || 'BKQPD4821L') }))
      : status === 'error'
        ? el('p', { class: 'verify-card__status is-error t-small' }, icon('alert', { size: 16 }), el('span', { text: 'Couldn’t fetch. Tap to try again' }))
        : el('p', { class: 'verify-card__status t-small', text: desc });
    return card({
      className: `verify-card inner-panel${status === 'error' ? ' is-error' : ''}`,
      title,
      titleTag: 'h2',
      titleClass: 't-title',
      children: [
        statusLine,
        status === 'ok'
          ? pill('success', 'Verified')
          : button({ label: 'Fetch via DigiLocker', kind: 'secondary', block: true, onClick: () => openDigiLockerSheet(key, title, ctx) }),
      ],
    });
  };

  const caption = el('p', { class: 'screen-footer__caption t-small', text: 'Verify both to continue' });
  const cont = button({ label: 'Continue', block: true, softDisabled: !both, describedBy: 'verify-caption', onClick: () => {
    setOnboardingStep('/filing-history');
    ctx.go('/filing-history');
  } });
  caption.id = 'verify-caption';
  blockedHint(cont, caption, 'Verify both your Aadhaar and PAN to continue, or skip for now.');

  return screen({
    name: 'verify-identity',
    header: backHeader({ title: 'Verify your identity', onBack: () => ctx.back('/about-you') }),
    body: [
      card({ variant: 'glass', children: el('p', { class: 't-body-lg c-secondary', text: `${CA.first} needs these to confirm your details. It takes about a minute with DigiLocker.` }) }),
      anyError ? banner({ kind: 'danger', className: 'is-new', title: 'DigiLocker couldn’t connect', text: 'This is usually temporary. Try again, or skip and add it later from your checklist.' }) : null,
      docCard('aadhaar', 'Aadhaar card', 'Confirms who you are'),
      docCard('pan', 'PAN card', 'Required to file your ITR'),
      card({ variant: 'glass', className: 'inner-panel', children: note(`Only visible to ${CA.first} · Encrypted end-to-end · Revoke access anytime from Settings`, 'shield') }),
    ],
    footer: screenFooter(
      both ? null : caption,
      cont,
      both ? null : el('p', { class: 'auth-alt t-body' }, linkButton({ label: 'Skip for now', target: true, onClick: () => {
        setOnboardingStep('/filing-history');
        ctx.go('/filing-history');
      } })),
    ),
  });
}

function openDigiLockerSheet(key, title, ctx) {
  openSheet({
    title: 'Fetch from DigiLocker',
    render: (api) => ({
      body: [
        el('p', { class: 'sheet__sub t-body', text: `ITR will read your name, date of birth and ID number from DigiLocker. Nothing else is shared, and only ${CA.first} can see it.` }),
        kvTable([['Document', title]]),
      ],
      actions: [
        button({ label: 'Allow', block: true, onClick: async (e) => {
          setLoading(e.currentTarget, true, 'Connecting...');
          api.dismissible = false;
          await wait(DEMO.timers.fetch);
          const ok = navigator.onLine;
          store.update((s) => { s.identity[key] = ok ? 'ok' : 'error'; if (ok && key === 'aadhaar' && s.profile) s.profile.aadhaar = true; });
          api.close(true);
          if (ok) toast(TOASTS.verified(title));
          ctx.rerender();
        } }),
        button({ label: 'Cancel', kind: 'secondary', block: true, onClick: () => api.close() }),
      ],
    }),
  });
}

/* ================= Filing history ================= */
export function filingHistory(ctx) {
  const canFetch = S().identity.pan === 'ok';
  const body = el('div', { class: 'column' });
  const footer = screenFooter();

  const fetching = () => {
    body.replaceChildren(
      card({
        className: 'card--center',
        children: [
          el('span', { class: 'c-secondary' }, spinner('md')),
          el('h2', { class: 't-title', text: 'Looking for your earlier filings...' }),
          el('p', { class: 't-body c-secondary', text: 'We’re checking the Income Tax portal with your consent. This takes a few seconds.' }),
        ],
      }),
      skeletonRow(), skeletonRow(), skeletonRow(),
    );
    body.setAttribute('aria-busy', 'true');
    footer.replaceChildren(el('p', { class: 'auth-alt t-body' }, linkButton({ label: 'Skip for now', target: true, onClick: () => next(null) })));
  };

  const found = () => {
    body.removeAttribute('aria-busy');
    body.replaceChildren(
      card({
        className: 'fade-up',
        children: [
          el('div', {}, pill('success', 'Fetched from the Income Tax portal, with your consent')),
          el('p', { class: 't-body-lg c-secondary', text: `We found two earlier returns. ${CA.first} uses them to pre-build your checklist for this year.` }),
          el('div', { class: 'row-list' }, FILINGS.fetched.map((f) => row({ title: f.ay, sub: f.sub, titleClass: 't-title', trailing: el('span', { class: 'filing-row__check' }, icon('check-circle', { label: 'Found' })) }))),
        ],
      }),
    );
    footer.replaceChildren(
      button({ label: 'Continue', block: true, onClick: () => next('fetched') }),
      el('p', { class: 'auth-alt t-body' }, linkButton({ label: 'These aren’t mine, skip', target: true, onClick: () => next(null) })),
    );
    announce('We found two earlier returns.');
  };

  const none = () => {
    body.removeAttribute('aria-busy');
    body.replaceChildren(card({
      className: 'fade-up inner-panel',
      children: emptyState({ icon: 'file', title: 'No earlier filings added', text: `If this is your first return, or those filings weren’t yours, that’s fine. ${CA.first} will build your checklist from what you tell us.` }),
    }));
    footer.replaceChildren(button({ label: 'Continue', block: true, onClick: () => next(null) }));
  };

  const next = (mode) => {
    store.set({ filings: mode });
    setOnboardingStep('/link-ca');
    ctx.go('/link-ca');
  };

  fetching();
  setTimeout(() => { if (body.isConnected) (canFetch && navigator.onLine ? found : none)(); }, DEMO.timers.history);

  return screen({
    name: 'filing-history',
    header: backHeader({ title: 'Your filing history', onBack: () => ctx.back('/verify-identity') }),
    body,
    footer,
  });
}

/* ================= Link your CA ================= */
export function linkCa(ctx) {
  const from = ctx.query.from;
  const done = () => {
    if (from === 'settings') ctx.go('/settings/ca', { replace: true, dir: 'back' });
    else if (from === 'home') ctx.go('/home', { replace: true, dir: 'back' });
    else { setOnboardingStep('/privacy'); ctx.go('/privacy'); }
  };

  const field = textField({ label: 'Invite code', helper: `It’s in the invite ${CA.first} sent you on WhatsApp or email.`, autocomplete: 'off' });
  field.input.setAttribute('autocapitalize', 'characters');
  field.input.addEventListener('input', () => { field.input.value = field.input.value.toUpperCase(); });

  const noLinkNote = 'Without a linked CA you can prepare your documents, but nobody reviews them until you link.';
  // Mobile shows this note in the body; the desktop wireframe puts it under the actions
  const infoSlot = el('div', { class: from ? null : 'only-mobile' }, note(noLinkNote, 'link', 'info-box'));
  const footNote = from ? null : note(noLinkNote, 'link', 'info-box only-desktop');
  const cont = button({ label: 'Continue', block: true, onClick: () => submit() });
  const skip = from ? null : el('p', { class: 'auth-alt t-body' }, linkButton({ label: 'I don’t have a code, skip for now', target: true, onClick: () => { store.set({ caLinked: false }); done(); } }));
  const bodyCard = card({ children: [el('p', { class: 'auth-intro t-body-lg', text: `${CA.first} sent you an invite code. Enter it to share your documents with him.` }), field.root, infoSlot] });
  const footer = screenFooter(cont, skip, footNote);

  let linking = false;
  async function submit() {
    if (linking) return;
    const raw = field.value.toUpperCase().replace(/\s+/g, '');
    if (!raw) { field.setError(`Enter the invite code ${CA.first} sent you`); field.input.focus(); return; }
    const normal = raw.replace(/[^A-Z0-9]/g, '');
    if (normal !== CA.inviteCode.replace(/[^A-Z0-9]/g, '')) {
      field.setError(`We couldn’t find that code. Check it with ${CA.first} and try again.`);
      field.input.focus();
      return;
    }
    linking = true;
    field.input.readOnly = true;
    field.input.value = CA.inviteCode;
    infoSlot.classList.remove('only-mobile');
    infoSlot.replaceChildren(el('p', { class: 'info-box upload-status t-body' }, spinner(), el('span', { text: `Linking you to ${CA.name}...` })));
    setLoading(cont, true, 'Linking...');
    skip?.remove();
    footNote?.remove();
    await wait(DEMO.timers.linking);
    store.update((s) => {
      s.caLinked = true;
      pushActivity(s, `You linked ${CA.name}`, 'success');
      if (s.onboarded && s.stage === 'no-ca') {
        s.stage = s.pausedStage || 'waiting';
        s.pausedStage = null;
        if (s.stage === 'waiting') s.pending = { type: 'checklist', at: Date.now() + DEMO.timers.checklist };
      }
    });
    if (from) toast(TOASTS.linked);
    bodyCard.replaceWith(card({
      children: [
        el('p', { class: 'auth-intro t-body-lg', text: 'You’re all set.' }),
        el('div', { class: 'linked-panel' },
          el('span', { class: 'linked-panel__mark pop-in' }, icon('check', { size: 28, strokeWidth: 2.5 })),
          el('h2', { class: 't-h2', text: `Linked to ${CA.name}` }),
          el('p', { class: 't-body c-secondary', text: `${CA.firm} · ${CA.title}` }),
          el('p', { class: 't-body c-secondary', text: 'He’ll send your checklist soon. We’ll let you know the moment it arrives.' }),
        ),
      ],
    }));
    footer.replaceChildren(button({ label: 'Continue', block: true, onClick: done }));
    announce(`Linked to ${CA.name}`);
    footer.querySelector('button').focus();
  }

  field.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

  setTimeout(() => {
    if (document.querySelector('[data-screen="link-ca"]') && !S().caLinked) toast(`WhatsApp from ${CA.first}: Your ITR invite code is ${CA.inviteCode}`, { kind: 'info' });
  }, 1200);

  return screen({
    name: 'link-ca',
    header: backHeader({ title: 'Link your CA', onBack: () => ctx.back(from === 'settings' ? '/settings/ca' : from === 'home' ? '/home' : '/filing-history') }),
    body: from ? el('div', { class: 'column' }, bodyCard) : bodyCard,
    footer,
  });
}

/* ================= Data and privacy ================= */
export function privacy(ctx) {
  let agreed = S().consent;
  const caption = el('p', { class: 'screen-footer__caption t-small', id: 'privacy-caption', text: 'Tick the box to continue' });
  const start = button({ label: 'Get started', block: true, softDisabled: !agreed, describedBy: 'privacy-caption', onClick: () => {
    store.update((s) => {
      s.consent = true;
      s.onboarded = true;
      s.obStep = null;
      s.stage = s.caLinked ? 'waiting' : 'no-ca';
      if (s.caLinked) s.pending = { type: 'checklist', at: Date.now() + DEMO.timers.checklist };
    });
    ctx.go('/home', { replace: true, dir: 'fade' });
  } });
  blockedHint(start, caption, null, () => agree.classList.add('is-error'));
  const agree = checkRow({ label: 'I understand and agree', checked: agreed, onToggle: (on) => {
    agreed = on;
    start.setAttribute('aria-disabled', String(!on));
    caption.hidden = on;
    caption.classList.remove('is-blocked');
    agree.classList.remove('is-error');
  } });
  caption.hidden = agreed;

  return screen({
    name: 'privacy',
    header: backHeader({ title: 'Your data, your control', onBack: () => ctx.back('/link-ca') }),
    body: card({
      className: 'privacy-hero',
      children: [
        iconTile('shield', 'accent', 'icon-tile--round icon-tile--lg'),
        el('h2', { class: 't-h2', text: 'Only you and your linked CA can see your documents.' }),
        el('p', { class: 't-body c-secondary', text: 'Bank and investment access uses secure, consent-based linking. You choose exactly what is shared.' }),
        el('p', { class: 't-body c-secondary', text: 'You can revoke access or delete linked accounts anytime from Settings.' }),
        agree,
      ],
    }),
    footer: screenFooter(caption, start),
  });
}

/* ================= Home ================= */
function stepStates() {
  const s = S();
  const idx = { 'no-ca': 0, waiting: 1, active: 2, review: 3, fixing: 3, rechecking: 3, complete: 5 }[s.stage] ?? 0;
  return STEPS.map((step, i) => ({
    title: step.title,
    sub: step.id === 'link' ? (s.caLinked ? step.done : step.todo) : step.sub,
    state: i < idx ? 'done' : i === idx ? 'current' : 'upcoming',
  }));
}

function reportCard(ctx) {
  return card({
    title: 'Report something new',
    titleClass: 't-h2',
    sub: 'Let your CA know about new income, investments, or expenses as they happen',
    children: el('div', { class: 'action-grid' },
      actionCard({ icon: 'bank', label: 'New Investment', onClick: () => ctx.go('/report/investment') }),
      actionCard({ icon: 'plus', label: 'New Income', onClick: () => ctx.go('/report/income') }),
      actionCard({ icon: 'minus', label: 'New Expenditure', onClick: () => ctx.go('/report/expenditure') }),
    ),
  });
}

function activityCard() {
  const items = S().activity;
  return card({
    title: 'Recent activity',
    titleClass: 't-h2',
    children: items.length ? activityList(items.slice(0, 5)) : el('p', { class: 't-body c-muted', text: 'Nothing yet. Your updates will show up here.' }),
  });
}

function homeHighlight(ctx) {
  const s = S();
  const c = counts();
  const n = c.total;
  const f = CA.first;
  switch (s.stage) {
    case 'no-ca':
      return highlightCard({ title: 'Link your CA to get started', message: 'Your checklist appears here once your CA sends it. Ask your CA for their invite code. It’s in the email or SMS they sent you.', action: { label: 'Link your CA', onClick: () => ctx.go('/link-ca?from=home') } });
    case 'waiting':
      return highlightCard({ title: `${f} is preparing your checklist`, message: `You’re linked. He builds it from your income sources: ${sourcesLabel(s.incomes)}. Usually within a day, and we’ll tell you the moment it’s ready.`, action: { label: `Nudge ${f}`, onClick: nudge } });
    case 'active':
    case 'returning':
      if (c.allUploaded) {
        return highlightCard({ title: `All ${n} documents uploaded`, message: `Review them, then send everything to ${f} in one go.`, bar: { value: n, max: n, label: `${n} of ${n} uploaded` }, action: { label: 'Review and submit', onClick: () => ctx.go('/review') } });
      }
      if (s.stage === 'returning') {
        return highlightCard({ title: `${DEADLINE.daysLeft} days left to file`, message: `Deadline: ${DEADLINE.label}`, bar: { value: c.uploaded, max: n, label: `${c.uploaded} of ${n} uploaded` }, action: { label: 'Open checklist', onClick: () => ctx.go('/checklist') } });
      }
      return highlightCard({ title: `${n} documents requested by ${f}`, message: `Due ${DEADLINE.label} · ${DEADLINE.daysLeft} days left`, bar: { value: c.uploaded, max: n, label: `${c.uploaded} of ${n} uploaded` }, action: { label: c.uploaded ? 'Continue uploading' : 'Start uploading', onClick: () => ctx.go('/checklist') } });
    case 'review':
      return highlightCard({
        title: `Sent to ${f}. He’s reviewing your ${n} documents.`,
        message: 'We’ll tell you the moment anything needs fixing. Most reviews take 1–2 days. Nothing for you to do right now.',
        bar: isAnita() ? null : { value: n, max: n, label: `${n} of ${n} sent` },
      });
    case 'fixing': {
      const d = c.flagged[0];
      return highlightCard({ title: `1 document needs fixing: ${lib(d.id).title}`, message: `${f} says: “${d.flagNote}” The other ${n - 1} documents are received.`, bar: { value: n - 1, max: n, label: `${n - 1} of ${n} received` }, action: { label: 'Fix now', onClick: () => ctx.go(`/flagged/${d.id}`) } });
    }
    case 'rechecking': {
      const d = c.resent[0];
      return highlightCard({ title: `Sent again. ${f} is checking ${lib(d.id).title}.`, message: `The other ${n - 1} documents are already received. We’ll tell you as soon as he’s done.`, bar: { value: n - 1, max: n, label: `${n - 1} of ${n} received · 1 being checked` } });
    }
    case 'complete':
      return highlightCard({ title: 'All received. Nothing pending.', message: `${f} has everything he needs. He’ll prepare your return and message you here. Your documents are stored securely. Only you and ${f} can see them.`, bar: { value: n, max: n, label: `${n} of ${n} received` }, action: { label: 'View my documents', onClick: () => ctx.go('/checklist') } });
    default:
      return null;
  }
}

function attentionCard(ctx) {
  const items = S().docs.filter((d) => d.status === 'todo' || d.status === 'flagged');
  if (!items.length) return null;
  return card({
    title: 'Needs your attention',
    titleClass: 't-h2',
    children: el('div', { class: 'row-list' }, items.map((d) => {
      const v = docView(d);
      const flagged = d.status === 'flagged';
      return el('div', { class: 'attention-item' },
        el('div', { class: 'attention-item__text' },
          el('h3', { class: 't-body-strong', text: flagged ? `${v.title} · ${CA.first} flagged this` : v.title }),
          el('p', { class: 'attention-item__sub t-small', text: flagged ? d.flagNote : (d.attention || `To upload · ${v.how}`) }),
        ),
        flagged
          ? button({ label: 'Fix', onClick: () => ctx.go(`/flagged/${d.id}`) })
          : button({ label: d.isNew ? 'Add' : 'Upload', kind: 'secondary', onClick: () => openUploadSheet(d.id) }),
      );
    })),
  });
}

function headStartCard() {
  const s = S();
  const docs = checklistFor(s.incomes).map((id) => lib(id).headStart);
  return card({
    title: 'Get a head start',
    titleClass: 't-h2',
    children: [
      el('p', { class: 't-body-strong', text: `People with ${sourcesLabel(s.incomes)} usually need:` }),
      el('p', { class: 'head-start__docs t-body' }, docs.map((t) => el('span', { text: t }))),
      el('p', { class: 'head-start__note t-small', text: `${CA.first}’s checklist may differ. You don’t need to upload anything until it arrives.` }),
    ],
  });
}

export function home(ctx) {
  const s = S();
  const stage = s.stage;
  const welcomeTitle = ['no-ca', 'waiting'].includes(stage) && isAnita() ? `Welcome, ${firstName()}` : `Hi ${firstName()}`;
  const body = [homeHighlight(ctx)];
  if (isAnita()) {
    body.push(card({ label: 'Your filing progress', children: stepper(stepStates()) }));
    if (stage === 'waiting') body.push(headStartCard());
    if (!['no-ca', 'waiting'].includes(stage)) body.push(reportCard(ctx));
  } else {
    if (stage === 'returning') body.push(attentionCard(ctx));
    if (stage !== 'no-ca') body.push(reportCard(ctx));
  }
  body.push(activityCard());
  return screen({ name: 'home', header: mainHeader({ title: welcomeTitle, bell: bell() }), body });
}

/* ================= Checklist ================= */
const STATUS = {
  todo: { kind: 'neutral', label: 'To upload', icon: 'ring', cls: '' },
  busy: { kind: 'info', label: 'Fetching', icon: 'clock', cls: '' },
  uploaded: { kind: 'success', label: 'Uploaded', icon: 'check', cls: 'done' },
  sent: { kind: 'success', label: 'Uploaded', icon: 'check', cls: 'done' },
  received: { kind: 'success', label: 'Received', icon: 'check', cls: 'done' },
  flagged: { kind: 'warning', label: 'Needs fixing', icon: 'alert', cls: 'flag' },
  resent: { kind: 'info', label: 'Being checked', icon: 'clock', cls: '' },
};

function docCard(d, ctx) {
  const v = docView(d);
  const key = d.busy ? 'busy' : d.status;
  const st = STATUS[key];
  const pre = PRE_SUBMIT.includes(S().stage);
  const desc = d.status === 'todo'
    ? el('p', { class: 'doc-card__desc t-body', text: v.how })
    : d.status === 'flagged'
      ? el('p', { class: 'doc-card__desc t-body' }, el('strong', { class: 't-body-strong', text: `${CA.first}: ` }), d.flagShort || v.flag?.short?.replace(/^[^:]+:\s*/, '') || d.flagNote)
      : el('p', { class: 'doc-card__desc t-body', text: fileMeta(d) });

  const links = [];
  if (d.status === 'todo' && pre && !d.busy) {
    if (v.canFetch) links.push(linkButton({ label: 'Fetch from your bank instead', onClick: () => fetchFromBank(d.id) }));
    links.push(linkButton({ label: `Can’t find it? Ask ${CA.first}`, onClick: askDeepak }));
  }

  let action;
  if (d.busy) {
    action = button({ label: 'Fetching', kind: 'secondary', disabled: true });
    action.prepend(spinner());
  } else if (d.status === 'todo') {
    action = button({ label: 'Upload', kind: 'secondary', onClick: () => openUploadSheet(d.id) });
  } else if (d.status === 'flagged') {
    action = button({ label: 'Fix', onClick: () => ctx.go(`/flagged/${d.id}`) });
  } else {
    action = button({ label: 'View', kind: 'secondary', onClick: () => openFileSheet(d.id) });
  }
  action.dataset.key = `doc-${d.id}`;
  action.setAttribute('aria-label', `${action.textContent.trim()} ${v.title}`);

  return el('article', { class: `card card--glass doc-card${d.busy ? ' is-busy' : ''}`, 'aria-label': v.title },
    el('span', { class: `doc-card__icon${st.cls ? ` doc-card__icon--${st.cls}` : ''}`, 'aria-hidden': 'true' }, icon(st.icon)),
    el('div', { class: 'doc-card__main' },
      el('h3', { class: 'doc-card__title t-title' }, v.title, d.isNew ? badge('New this year') : null),
      desc,
      links.length ? el('div', { class: 'doc-card__links t-body' }, links) : null,
    ),
    el('div', { class: 'doc-card__status' }, pill(st.kind, st.label)),
    el('div', { class: 'doc-card__action' }, action),
  );
}

function summaryCard() {
  const s = S();
  const c = counts();
  const n = c.total;
  const f = CA.first;
  let line; let hint; let bar; let kind = '';
  switch (s.stage) {
    case 'review':
      line = `${n} of ${n} sent · ${f} is reviewing`; hint = 'You can’t change files while he reviews'; bar = n; kind = 'dark'; break;
    case 'fixing':
      line = `${n - 1} of ${n} received · 1 needs fixing`; hint = `${f} is waiting on ${lib(c.flagged[0].id).title}`; bar = n - 1; kind = 'dark'; break;
    case 'rechecking':
      line = `${n - 1} of ${n} received · 1 being checked`; hint = `${f} is checking ${lib(c.resent[0].id).title}`; bar = n - 1; kind = 'dark'; break;
    case 'complete':
      line = `${n} of ${n} received`; hint = `Stored securely · only you and ${f} can see them`; bar = n; kind = 'done'; break;
    default:
      line = `${c.uploaded} of ${n} uploaded`; hint = 'Saved automatically. You can finish later.'; bar = c.uploaded;
  }
  return card({
    className: 'summary-card',
    label: 'Checklist progress',
    children: [
      el('p', { class: 'summary-card__sources t-body', text: checklistSources() }),
      el('div', { class: 'summary-card__line' },
        el('h2', { class: 't-title', text: line }),
        el('p', { class: 'summary-card__hint t-small', text: hint }),
      ),
      progress({ value: bar, max: n, kind, ariaLabel: line }),
    ],
  });
}

function checklistSources() {
  const s = S();
  if (!s.caLinked && !s.docs.length) return 'No CA linked yet';
  const src = s.sources || sourcesList(s.incomes);
  return isAnita() ? `Built by ${CA.first} from your income sources · ${src}` : src;
}

export function checklist(ctx) {
  const s = S();
  const stage = s.stage;
  const c = counts();
  const body = [];
  const sourcesLine = el('p', { class: 'summary-card__sources t-body', text: checklistSources() });

  if (!s.docs.length && stage === 'no-ca') {
    body.push(card({ children: [sourcesLine, emptyState({ icon: 'link', title: 'Link your CA to see your checklist', text: 'Your CA builds the checklist for you. Enter the invite code from their email or SMS and it appears here.', action: { label: 'Link your CA', onClick: () => ctx.go('/link-ca?from=home') } })] }));
  } else if (!s.docs.length) {
    const channels = REMIND_CHANNELS.filter((ch) => s.notify[ch.id]).map((ch) => ch.label);
    const via = channels.length ? ` on ${channels.join(' and ')}` : '';
    body.push(card({ children: [sourcesLine, emptyState({ icon: 'file', title: 'Your checklist isn’t ready yet', text: `${CA.first} is building it from your income sources. We’ll notify you${via} the moment it’s ready, usually within a day.`, action: { label: `Nudge ${CA.first}`, kind: 'secondary', onClick: nudge } })] }));
  } else {
    body.push(summaryCard());
    body.push(el('div', { class: 'doc-list' }, s.docs.map((d) => docCard(d, ctx))));
    if (PRE_SUBMIT.includes(stage)) {
      const n = c.total;
      const ready = c.allUploaded;
      const hint = el('p', { class: 't-small c-muted', id: 'submit-hint', text: ready
        ? `All ${n} documents are uploaded. Review them, then send.`
        : (isAnita() ? `Upload all ${n} documents to submit. We’ll check them for you first.` : 'Upload or fix the remaining documents to submit.') });
      const btn = button({ label: `Submit to ${CA.first}`, softDisabled: !ready, describedBy: 'submit-hint', onClick: () => ctx.go('/review') });
      blockedHint(btn, hint);
      body.push(card({ className: 'submit-card', children: [btn, hint] }));
    }
  }
  return screen({ name: 'checklist', header: mainHeader({ title: 'Your checklist', sub: checklistSources(), bell: bell() }), body });
}

/* ================= Review and submit ================= */
export function review(ctx) {
  const s = S();
  const n = s.docs.length;
  const corrected = s.docs.find((d) => d.corrected);
  const noteField = textField({ label: `Note for ${CA.first} (optional)`, multiline: true, placeholder: 'Write a short note' });
  const send = button({ label: `Send to ${CA.first}`, block: true, onClick: async () => {
    setLoading(send, true, 'Sending...');
    await wait(900);
    store.update((st) => {
      st.docs.forEach((d) => { d.status = 'sent'; });
      st.stage = 'review';
      if (noteField.value) st.lastNote = noteField.value;
      pushActivity(st, `You sent ${n} documents to ${CA.first}`, 'success');
      if (st.session?.persona === 'anita' && !st.flaggedOnce) st.pending = { type: 'flag', at: Date.now() + DEMO.timers.flag };
    });
    ctx.go('/sent', { replace: true });
  } });

  return screen({
    name: 'review',
    header: backHeader({ title: 'Review and submit', onBack: () => ctx.back('/checklist') }),
    body: el('div', { class: 'column' },
      card({
        children: el('div', { class: 'page-hero' },
          el('h2', { class: 't-h1', text: `Ready to send to ${CA.first}` }),
          el('p', { class: 'page-hero__sub t-body', text: corrected ? `All ${n} documents are uploaded, including the corrected ${lib(corrected.id).title}.` : `All ${n} documents are uploaded.` }),
        ),
      }),
      el('ul', { class: 'review-list', 'aria-label': 'Documents to send' }, s.docs.map((d) => el('li', {},
        row({ icon: 'check-circle', iconVariant: 'success', title: lib(d.id).title, sub: `${d.file?.name} · ${d.file?.source === 'fetched' ? 'auto-fetched' : d.corrected ? `corrected · ${d.file?.size}` : d.file?.size}`, titleClass: 't-title', className: 'row--glass' }),
      ))),
      card({ children: [noteField.root, note(`Encrypted. Only ${CA.first} can see your documents.`, 'shield')] }),
    ),
    footer: screenFooter(send, button({ label: 'Back to checklist', kind: 'secondary', block: true, onClick: () => ctx.back('/checklist') })),
  });
}

/* ================= Sent to CA ================= */
export function sent(ctx) {
  return screen({
    name: 'sent',
    body: el('div', { class: 'column' },
      card({
        className: 'sent-hero',
        children: [
          el('span', { class: 'sent-hero__mark pop-in', 'aria-hidden': 'true' }, icon('check', { size: 36, strokeWidth: 2.5 })),
          el('h1', { class: 't-h1', tabindex: '-1', text: `Sent to ${CA.first}` }),
          el('p', { class: 'sent-hero__sub t-body-lg', text: `${CA.first} usually reviews within 1–2 days. We’ll tell you here the moment he’s done or needs something fixed.` }),
        ],
      }),
      card({
        title: 'What happens next',
        titleClass: 't-title',
        children: el('ol', { class: 'numbered t-body' },
          el('li', { text: `${CA.first} checks every document` }),
          el('li', { text: 'Anything unclear is flagged here, with a note' }),
          el('li', { text: 'Once all is in order, he files your return' }),
        ),
      }),
    ),
    footer: stacked(screenFooter(
      button({ label: 'Back to Home', block: true, onClick: () => ctx.go('/home', { dir: 'fade' }) }),
      button({ label: 'View what I sent', kind: 'secondary', block: true, onClick: () => ctx.go('/checklist', { dir: 'fade' }) }),
    )),
  });
}

/* ================= Document flagged ================= */
export function flagged(ctx) {
  const d = docById(ctx.params.id);
  const v = docView(d);
  return screen({
    name: 'flagged',
    header: backHeader({ title: 'Document flagged', onBack: () => ctx.back('/home') }),
    body: el('div', { class: 'column' },
      card({
        children: [
          el('div', { class: 'page-hero page-hero--icon' },
            iconTile('alert', 'warning', 'icon-tile--round icon-tile--lg'),
            el('h2', { class: 't-h1', text: v.title }),
            el('p', { class: 'page-hero__sub t-body', text: `${CA.first} flagged this document and needs a small correction.` }),
          ),
          banner({ kind: 'warning', title: 'What needs fixing', text: `${d.flagNote} — ${CA.first}` }),
          d.prevFile ? fileChip({ name: d.prevFile.name, meta: 'Your first upload', side: pill('warning', 'Flagged') }) : null,
          el('div', { class: 'stack stack--tight' },
            el('h3', { class: 't-body-strong', text: 'Where to find the right one' }),
            el('p', { class: 't-body c-secondary', text: v.find }),
          ),
        ],
      }),
    ),
    footer: stacked(screenFooter(
      button({ label: 'Upload the corrected document', block: true, onClick: () => openUploadSheet(d.id, {
        mode: 'resend',
        onDone: (result) => ctx.go(result === 'resent' ? '/home' : '/checklist', { replace: true, dir: 'back' }),
      }) }),
      button({ label: `Ask ${CA.first}`, kind: 'secondary', block: true, onClick: askDeepak }),
    )),
  });
}

/* ================= Report something new ================= */
export function report(ctx) {
  const k = REPORT_KINDS[ctx.params.kind] || REPORT_KINDS.investment;
  const listId = uid('suggest');
  const type = textField({ label: k.typeLabel, list: listId, autocomplete: 'off' });
  const amount = amountField({ label: 'Amount (₹)' });
  const date = textField({ label: k.dateLabel, type: 'date' });
  date.input.max = '2027-03-31';
  const notes = textField({ label: 'Notes (optional)', multiline: true });
  const datalist = el('datalist', { id: listId }, k.suggestions.map((sug) => el('option', { value: sug })));

  const send = button({ label: `Send to ${CA.first}`, block: true, onClick: async () => {
    let first = null;
    if (!type.value) { type.setError(k.typeError); first ||= type.input; }
    if (!digitsOnly(amount.value)) { amount.setError('Enter the amount in ₹'); first ||= amount.input; }
    if (!date.input.value) { date.setError('Pick the date'); first ||= date.input; }
    if (first) { first.focus(); return; }
    setLoading(send, true, 'Sending...');
    await wait(800);
    store.update((s) => {
      s.reports.unshift({ id: nextId(), kind: ctx.params.kind, type: type.value, amount: amount.value, date: date.input.value, notes: notes.value, at: Date.now() });
      pushActivity(s, `${k.activity}: ${type.value}`, 'info');
    });
    toast(TOASTS.reportSent);
    ctx.back('/home');
  } });
  date.input.addEventListener('change', () => date.clearError());

  return screen({
    name: 'report',
    header: backHeader({ title: k.title, titleDesktop: k.heading, onBack: () => ctx.back('/home') }),
    body: el('div', { class: 'column' },
      card({
        children: [
          el('div', { class: 'page-hero page-hero--icon' },
            iconTile(k.icon, 'accent', 'icon-tile--round'),
            el('h2', { class: 't-h1', text: k.heading }),
            el('p', { class: 'page-hero__sub t-body', text: k.sub }),
          ),
          el('div', { class: 'fields' }, type.root, amount.root, date.root, notes.root, datalist),
        ],
      }),
    ),
    footer: screenFooter(send),
  });
}

/* ================= History ================= */
export function history(ctx) {
  const s = S();
  const filings = s.filings ? FILINGS[s.filings] : [];
  const content = filings.length
    ? el('div', { class: 'row-list' }, filings.map((f) => row({ title: f.ay, sub: f.sub, titleClass: 't-title', chevron: true, onClick: () => openPastFilingSheet(f) })))
    : emptyState({ icon: 'clock', title: 'No past filings yet', text: `Once ${CA.first} files your return, it shows up here with the acknowledgement you can download.` });
  return screen({
    name: 'history',
    header: mainHeader({ title: 'History', bell: bell() }),
    body: card({ title: 'Past filings', titleClass: 't-h2', children: content }),
  });
}

function openPastFilingSheet(f) {
  openSheet({
    title: f.ay,
    render: (api) => ({
      body: [
        el('p', { class: 'sheet__sub t-body', text: `${f.by} Your acknowledgement (ITR-V) is ready to download.` }),
        kvTable(f.rows),
      ],
      actions: [
        button({ label: 'Download', icon: 'download', block: true, onClick: () => { toast(TOASTS.downloading, { kind: 'info' }); api.close(); } }),
        button({ label: 'Close', kind: 'secondary', block: true, onClick: () => api.close() }),
      ],
    }),
  });
}

/* ================= Settings ================= */
function logout(ctx) {
  store.update((s) => {
    const saved = { ...(s.saved || {}) };
    const email = s.profile?.email?.toLowerCase();
    if (email) { const snap = { ...s }; delete snap.saved; saved[email] = snap; }
    const fresh = freshState();
    fresh.saved = saved;
    return fresh;
  });
  toast(TOASTS.loggedOut, { kind: 'info' });
  ctx.go('/welcome', { replace: true, dir: 'fade' });
}

export function settings(ctx) {
  const s = S();
  const group = (label, rows) => card({ className: 'settings-card', children: [el('h2', { class: 'card__group-label t-chart-title', text: label }), el('div', { class: 'group' }, rows)] });
  const accounts = s.accounts.length;
  return screen({
    name: 'settings',
    header: mainHeader({ title: 'Settings', bell: bell() }),
    body: [
      group('Profile', [
        row({ icon: 'user', title: 'Profile & document details', sub: s.profile?.pan, chevron: true, onClick: () => ctx.go('/settings/profile') }),
        row({ icon: 'link', title: 'Linked CA', sub: s.caLinked ? CA.name : 'No CA linked', chevron: true, onClick: () => ctx.go('/settings/ca') }),
      ]),
      group('Accounts & consent', [
        row({ icon: 'bank', title: 'Linked accounts', sub: accounts ? `${accounts} account${accounts > 1 ? 's' : ''} connected` : 'No accounts connected yet', chevron: true, onClick: () => ctx.go('/settings/accounts') }),
        row({ icon: 'shield', title: 'Data storage & access', sub: 'Where docs are stored, who can access', chevron: true, onClick: () => ctx.go('/settings/data') }),
      ]),
      group('Notifications', [
        row({ icon: 'bell', title: 'Notification preferences', sub: REMIND_CHANNELS.filter((c) => s.notify[c.id]).map((c) => c.label).join(', ') || 'All reminders off', chevron: true, onClick: () => ctx.go('/settings/notifications') }),
      ]),
      group('About', [
        row({ icon: 'help', title: 'Help & support', chevron: true, onClick: () => toast(TOASTS.help, { kind: 'info' }) }),
        row({ icon: 'logout', title: 'Log out', chevron: true, onClick: () => logout(ctx) }),
      ]),
    ],
  });
}

export function settingsProfile(ctx) {
  const p = S().profile;
  const name = textField({ label: 'Full name', value: p.name, autocomplete: 'name' });
  const email = textField({ label: 'Email address', type: 'email', value: p.email, autocomplete: 'email' });
  const mobile = textField({ label: 'Mobile number', type: 'tel', value: p.mobile, prefix: '+91', inputmode: 'numeric' });
  const pan = textField({ label: 'PAN', value: p.pan, readonly: true });
  pan.input.classList.add('t-code');
  const aadhaarOk = S().identity.aadhaar === 'ok' || p.aadhaar;
  const save = button({ label: 'Save changes', block: true, onClick: async () => {
    let first = null;
    if (!name.value) { name.setError('Enter your full name'); first ||= name.input; }
    if (!emailOK(email.value)) { email.setError('Enter a valid email, like name@example.com'); first ||= email.input; }
    if (digitsOnly(mobile.value).length !== 10) { mobile.setError('Enter a 10-digit mobile number'); first ||= mobile.input; }
    if (first) { first.focus(); return; }
    setLoading(save, true, 'Saving...');
    await wait(600);
    setLoading(save, false);
    store.update((s) => { s.profile.name = name.value; s.profile.first = name.value.split(/\s+/)[0]; s.profile.email = email.value; s.profile.mobile = mobile.value; });
    toast(TOASTS.saved);
  } });

  return screen({
    name: 'settings-profile',
    header: backHeader({ title: 'Profile & details', titleDesktop: 'Profile & document details', onBack: () => ctx.back('/settings') }),
    body: el('div', { class: 'column' },
      card({
        children: [
          el('div', { class: 'page-hero' },
            el('h2', { class: 't-h1', text: 'Your details' }),
            el('p', { class: 'page-hero__sub t-body', text: `${CA.first} uses these to prepare your return. PAN and Aadhaar can’t be edited here.` }),
          ),
          el('div', { class: 'fields' }, name.root, email.root, mobile.root, pan.root),
          row({ title: 'Aadhaar', sub: aadhaarOk ? 'Verified with DigiLocker' : 'Not verified yet', trailing: aadhaarOk ? pill('success', 'Verified') : pill('neutral', 'Not verified') }),
        ],
      }),
    ),
    footer: screenFooter(save),
  });
}

export function settingsCa(ctx) {
  const linked = S().caLinked;
  if (!linked) {
    return screen({
      name: 'settings-ca',
      header: backHeader({ title: 'Linked CA', onBack: () => ctx.back('/settings') }),
      body: el('div', { class: 'column' }, card({ children: emptyState({ icon: 'link', title: 'No CA linked', text: 'You can prepare documents on your own. Link your CA to share them and get a checklist.' }) })),
      footer: screenFooter(button({ label: 'Link a CA', block: true, onClick: () => ctx.go('/link-ca?from=settings') })),
    });
  }
  const unlink = async () => {
    const ok = await confirmSheet({
      title: `Unlink ${CA.name}?`,
      message: 'He’ll stop seeing your documents and can’t send you new checklists. Files you’ve already uploaded stay in your account.',
      confirmLabel: 'Unlink CA',
      cancelLabel: 'Keep linked',
      destructive: true,
    });
    if (!ok) return;
    store.update((s) => {
      s.caLinked = false;
      s.pausedStage = s.stage === 'no-ca' ? null : s.stage;
      s.stage = 'no-ca';
      s.pending = null;
      pushActivity(s, `You unlinked ${CA.name}`, 'warning');
    });
    toast(TOASTS.unlinked, { kind: 'info' });
  };
  return screen({
    name: 'settings-ca',
    header: backHeader({ title: 'Linked CA', onBack: () => ctx.back('/settings') }),
    body: el('div', { class: 'column' },
      card({
        children: [
          el('div', { class: 'ca-card__head' },
            avatar(CA.initials, 'lg'),
            el('div', { class: 'stack stack--tight' },
              el('h2', { class: 't-h2', text: CA.name }),
              el('p', { class: 'ca-card__sub t-body', text: `${CA.firm} · ${CA.title}` }),
            ),
          ),
          el('hr', { class: 'rule' }),
          el('h3', { class: 't-body-strong', text: `What ${CA.first} can see` }),
          el('ul', { class: 'check-list t-body' },
            el('li', {}, icon('check'), el('span', { text: 'Your checklist and the documents you upload' })),
            el('li', {}, icon('check'), el('span', { text: 'Reports you send him about new income or investments' })),
            el('li', {}, icon('check'), el('span', { text: 'Nothing else. He can’t see other apps or accounts.' })),
          ),
        ],
      }),
    ),
    footer: screenFooter(button({ label: 'Unlink CA', kind: 'secondary', block: true, onClick: unlink })),
  });
}

export function settingsAccounts(ctx) {
  const ids = S().accounts;
  const list = ACCOUNTS.filter((a) => ids.includes(a.id));
  const disconnect = async (a) => {
    const ok = await confirmSheet({
      title: `Revoke access to ${a.short}?`,
      message: 'We’ll stop fetching documents from this account. Anything already fetched stays on your checklist.',
      confirmLabel: 'Revoke access',
      cancelLabel: 'Keep access',
      destructive: true,
    });
    if (!ok) return;
    store.update((s) => { s.accounts = s.accounts.filter((x) => x !== a.id); });
    toast(TOASTS.revoked(a.short), { kind: 'info' });
  };
  if (!list.length) {
    return screen({
      name: 'settings-accounts',
      header: backHeader({ title: 'Linked accounts', onBack: () => ctx.back('/settings') }),
      body: el('div', { class: 'column' }, card({ children: emptyState({ icon: 'folder', title: 'No accounts connected yet', text: 'Connect a bank so we can fetch interest statements and certificates for you. You choose exactly what is shared.' }) })),
      footer: screenFooter(button({ label: 'Connect an account', block: true, onClick: () => openConnectSheet({}) })),
    });
  }
  return screen({
    name: 'settings-accounts',
    header: backHeader({ title: 'Linked accounts', onBack: () => ctx.back('/settings') }),
    body: el('div', { class: 'column' },
      card({
        children: el('div', { class: 'page-hero' },
          el('h2', { class: 't-h1', text: `${list.length} account${list.length > 1 ? 's' : ''} connected` }),
          el('p', { class: 'page-hero__sub t-body', text: 'Connected through India’s Account Aggregator framework. Disconnect anytime.' }),
        ),
      }),
      list.map((a) => card({
        className: 'account-card',
        title: a.title,
        titleTag: 'h3',
        titleClass: 't-title',
        sub: a.desc,
        children: button({ label: 'Disconnect', kind: 'secondary', block: true, onClick: () => disconnect(a) }),
      })),
    ),
    footer: screenFooter(button({ label: 'Connect another account', kind: 'secondary', block: true, onClick: () => openConnectSheet({}) })),
  });
}

export function settingsData(ctx) {
  const s = S();
  const del = async () => {
    const ok = await confirmSheet({
      title: 'Delete all your data?',
      message: `This removes your documents, history and account. ${CA.first} keeps nothing you’ve deleted. This can’t be undone.`,
      confirmLabel: 'Delete everything',
      destructive: true,
    });
    if (!ok) return;
    const email = S().profile?.email?.toLowerCase();
    store.update((st) => {
      const saved = { ...(st.saved || {}) };
      if (email) delete saved[email];
      const fresh = freshState();
      fresh.saved = saved;
      return fresh;
    });
    toast('All your data is deleted.', { kind: 'info' });
    ctx.go('/welcome', { replace: true, dir: 'fade' });
  };
  return screen({
    name: 'settings-data',
    header: backHeader({ title: 'Data storage & access', onBack: () => ctx.back('/settings') }),
    body: el('div', { class: 'column' },
      card({
        children: [
          banner({ kind: 'success', title: 'Your documents are encrypted', text: 'Stored in India with AES-256 encryption. Only you and your linked CA can open them.' }),
          el('div', { class: 'row-list' },
            row({ icon: 'users', title: 'Who can see your documents', sub: s.caLinked ? `${CA.name} · full access to your checklist` : 'Only you. No CA is linked.' }),
            row({ icon: 'download', title: 'Download my data', sub: 'Get a copy of everything you’ve uploaded', chevron: true, onClick: () => toast(TOASTS.downloading, { kind: 'info' }) }),
            row({ icon: 'trash', title: 'Delete all my data', sub: 'Removes your documents, history and account', chevron: true, className: 'danger-row', onClick: del }),
          ),
        ],
      }),
    ),
  });
}

export function settingsNotifications(ctx) {
  const n = S().notify;
  const set = (key) => (on) => {
    store.update((s) => { s.notify[key] = on; });
    toast(TOASTS.saved);
  };
  return screen({
    name: 'settings-notifications',
    header: backHeader({ title: 'Notifications', titleDesktop: 'Notification preferences', onBack: () => ctx.back('/settings') }),
    body: el('div', { class: 'column' },
      card({
        children: el('div', { class: 'page-hero' },
          el('h2', { class: 't-h1', text: 'Notifications' }),
          el('p', { class: 'page-hero__sub t-body', text: 'Choose how we reach you. We never send more than two reminders a week.' }),
        ),
      }),
      card({
        title: 'Reminder channels',
        titleClass: 't-chart-title',
        className: 'settings-card',
        children: el('div', { class: 'row-list' },
          toggleRow({ title: 'WhatsApp', desc: 'Nudges before deadlines', checked: n.whatsapp, onChange: set('whatsapp') }),
          toggleRow({ title: 'Email', desc: 'Weekly summary and nudges', checked: n.email, onChange: set('email') }),
          toggleRow({ title: 'SMS', desc: 'Short deadline alerts only', checked: n.sms, onChange: set('sms') }),
        ),
      }),
      card({
        title: 'What to tell me about',
        titleClass: 't-chart-title',
        className: 'settings-card',
        children: el('div', { class: 'row-list' },
          toggleRow({ title: 'Deadline countdown', desc: 'Days left to file', checked: n.deadline, onChange: set('deadline') }),
          toggleRow({ title: `Updates from ${CA.first}`, desc: 'Checklist, flags and when your file is complete', checked: n.updates, onChange: set('updates') }),
        ),
      }),
    ),
  });
}

/* ================= Sheets: upload, file, connect ================= */
function flash() {
  const f = el('div', { class: 'camera-flash', 'aria-hidden': 'true' });
  document.body.append(f);
  setTimeout(() => f.remove(), 450);
}

export function openUploadSheet(docId, { mode = 'upload', onDone } = {}) {
  const d = docById(docId);
  if (!d) return;
  const v = docView(d);
  const resend = mode === 'resend';
  const postSubmit = S().stage === 'fixing';
  let file = null;
  let progressTimer = null;
  let cancelled = false;

  const sheet = openSheet({ title: v.title, render: (api) => chooseView(api) });

  function chooseView(api, error) {
    const dz = dropzone({
      hint: UPLOAD_RULES.hint,
      error,
      accept: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png',
      onFiles: (files) => acceptFile(api, files[0]),
    });
    const body = [];
    if (resend) {
      body.push(el('p', { class: 'sheet__sub t-body', text: `${CA.first} asked for a corrected file.` }));
      body.push(banner({ kind: 'warning', title: `${CA.first}’s note`, text: d.flagNote }));
    } else {
      body.push(section('What’s needed', el('p', { class: 't-body c-secondary', text: v.needed })));
    }
    body.push(section('Where to find it', el('p', { class: 'info-box t-body', text: v.find })));
    if (resend && d.prevFile) body.push(note(`Previous file · flagged: ${d.prevFile.name}`, 'alert'));
    body.push(dz.root);
    const choose = button({ label: 'Choose file', block: true, onClick: dz.open });
    choose.dataset.autofocus = '';
    return {
      body,
      actions: [
        choose,
        button({ label: 'Take photo', kind: 'secondary', block: true, onClick: () => takePhoto(api) }),
        button({ label: 'Cancel', kind: 'secondary', block: true, onClick: () => api.close() }),
      ],
      dismissible: true,
    };
  }

  function acceptFile(api, f) {
    if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!UPLOAD_RULES.extensions.includes(ext) || (f.type && !UPLOAD_RULES.types.includes(f.type))) { api.update(chooseView(api, UPLOAD_RULES.errors.type)); return; }
    if (f.size > UPLOAD_RULES.maxBytes) { api.update(chooseView(api, UPLOAD_RULES.errors.size)); return; }
    if (f.size === 0) { api.update(chooseView(api, UPLOAD_RULES.errors.unreadable)); return; }
    upload(api, { name: f.name, size: formatBytes(f.size), kind: ext === 'pdf' ? 'PDF' : 'JPG', source: 'upload' });
  }

  function takePhoto(api) {
    if (bp.touch) {
      const input = el('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'sr-only' });
      input.addEventListener('change', () => { if (input.files?.[0]) acceptFile(api, input.files[0]); input.remove(); });
      document.body.append(input);
      input.click();
      return;
    }
    flash();
    const sample = resend && v.corrected ? v.corrected : v.sample;
    upload(api, { name: sample.name, size: sample.size, kind: 'PDF', source: 'photo' });
  }

  function upload(api, f) {
    file = f;
    cancelled = false;
    const bar = progress({ value: 0, max: 100, ariaLabel: 'Upload progress', kind: 'live' });
    const fill = bar.querySelector('.progress__fill');
    const track = bar.querySelector('.progress__track');
    const status = el('p', { class: 't-small c-secondary', 'aria-live': 'polite', text: 'Uploading... 0%. You can keep this window open.' });
    api.update({
      body: [fileChip({ name: f.name, meta: `${f.size} · ${f.kind}`, side: 'Uploading...', bar }), status],
      actions: [button({ label: 'Cancel upload', kind: 'secondary', block: true, onClick: () => { cancelled = true; clearInterval(progressTimer); api.update(chooseView(api)); } })],
      dismissible: false,
    });
    const startAt = performance.now();
    const total = DEMO.timers.check;
    const offline = !navigator.onLine;
    let lastAnnounced = -1;
    // A timer, not requestAnimationFrame, so an upload still finishes in a background tab
    const tick = () => {
      if (cancelled || !api.isOpen) { clearInterval(progressTimer); return; }
      const t = Math.min(1, (performance.now() - startAt) / total);
      const eased = 1 - (1 - t) ** 2;
      const pct = Math.round(eased * 100);
      fill.style.setProperty('--progress', `${pct}%`);
      track.setAttribute('aria-valuenow', String(pct));
      if (pct !== lastAnnounced) { status.textContent = `Uploading... ${pct}%. You can keep this window open.`; lastAnnounced = pct; }
      if (offline && pct >= 40) { clearInterval(progressTimer); api.update(chooseView(api, UPLOAD_RULES.errors.failed)); return; }
      if (t >= 1) {
        clearInterval(progressTimer);
        setTimeout(() => { if (!cancelled && api.isOpen) checkView(api); }, 250);
      }
    };
    progressTimer = setInterval(tick, 40);
  }

  function checkView(api) {
    const read = (resend && v.corrected ? v.corrected.read : v.sample.read);
    file.read = read;
    const okText = resend ? (v.correctedNote || 'Uploaded. We could read this file.') : 'Uploaded. We could read this file.';
    const primaryLabel = resend && postSubmit ? `Resend to ${CA.first}` : 'Looks right';
    const primary = button({ label: primaryLabel, block: true, onClick: () => commit(api, primary) });
    primary.dataset.autofocus = '';
    api.update({
      body: [
        el('p', { class: 'banner banner--success t-body', role: 'status' }, icon('check-circle'), el('span', { class: 'banner__msg', text: okText })),
        fileChip({ name: file.name, meta: `${file.size} · ${file.kind}` }),
        kvTable(read, 'What we read from this file'),
        el('p', { class: 't-small c-muted', text: `Check these look right. ${CA.first} always sees the original file, so small slips here won’t cause problems.` }),
      ],
      actions: [primary, button({ label: 'Replace file', kind: 'secondary', block: true, onClick: () => api.update(chooseView(api)) })],
      dismissible: true,
      focus: primary,
    });
  }

  async function commit(api, btn) {
    if (resend && postSubmit) {
      setLoading(btn, true, 'Sending...');
      await wait(700);
      store.update((s) => {
        const doc = s.docs.find((x) => x.id === docId);
        doc.status = 'resent';
        doc.file = { ...file, at: Date.now() };
        doc.corrected = true;
        s.stage = 'rechecking';
        s.flaggedOnce = true;
        pushActivity(s, `You resent ${v.title}`, 'info');
        if (s.session?.persona === 'anita') s.pending = { type: 'complete', at: Date.now() + DEMO.timers.complete };
      });
      toast(TOASTS.resent);
      api.close('resent');
      onDone?.('resent');
      return;
    }
    store.update((s) => {
      const doc = s.docs.find((x) => x.id === docId);
      doc.status = 'uploaded';
      doc.file = { ...file, at: Date.now() };
      if (resend) { doc.corrected = true; doc.flagNote = null; }
    });
    toast(TOASTS.uploaded(v.title));
    api.close('uploaded');
    onDone?.('uploaded');
  }

  return sheet;
}

export function openFileSheet(docId) {
  const d = docById(docId);
  if (!d?.file) return;
  const v = docView(d);
  const pre = PRE_SUBMIT.includes(S().stage) && d.status === 'uploaded';
  const text = pre
    ? `Not sent yet. You can swap this file until you submit everything to ${CA.first}.`
    : d.status === 'received'
      ? `${CA.first} received this file. It’s stored securely.`
      : `Sent to ${CA.first}. He’ll flag it here if anything needs fixing.`;
  const side = pre
    ? (d.file.source === 'fetched' ? 'Auto-fetched' : `Uploaded ${relativeTime(d.file.at || Date.now()).toLowerCase()}`)
    : d.status === 'received' ? 'Received' : `With ${CA.first}`;
  openSheet({
    title: v.title,
    render: (api) => ({
      body: [
        el('p', { class: 'sheet__sub t-body', text }),
        fileChip({ name: d.file.name, meta: `${d.file.size} · ${d.file.kind || 'PDF'}`, side }),
        kvTable(d.file.read || v.sample.read, 'What we read from this file'),
      ],
      actions: pre
        ? [
          button({ label: 'Close', block: true, onClick: () => api.close() }),
          button({ label: 'Remove file', kind: 'secondary', block: true, onClick: () => {
            store.update((s) => { const doc = s.docs.find((x) => x.id === docId); doc.status = 'todo'; doc.file = null; doc.corrected = false; });
            toast(TOASTS.removed);
            api.close();
          } }),
        ]
        : [button({ label: 'Close', block: true, onClick: () => api.close() })],
    }),
  });
}

export function openConnectSheet({ onDone }) {
  const current = S().accounts;
  const chosen = new Set(current.length ? current : ACCOUNTS.filter((a) => a.defaultOn).map((a) => a.id));
  openSheet({
    title: 'Choose what to share',
    render: (api) => {
      const allow = button({ label: 'Allow selected accounts', block: true, onClick: async () => {
        if (!chosen.size) { announce('Turn on at least one account to continue.'); return; }
        setLoading(allow, true, 'Connecting...');
        api.dismissible = false;
        await wait(1000);
        store.update((s) => { s.accounts = ACCOUNTS.filter((a) => chosen.has(a.id)).map((a) => a.id); });
        toast(TOASTS.accountsAllowed);
        api.close(true);
        onDone?.();
      } });
      return {
        body: [
          el('p', { class: 'sheet__sub t-body', text: 'You control exactly what data is linked. Nothing is shared until you allow it.' }),
          el('div', { class: 'row-list' }, ACCOUNTS.map((a) => toggleRow({ title: a.name, checked: chosen.has(a.id), onChange: (on) => { if (on) chosen.add(a.id); else chosen.delete(a.id); } }))),
          el('div', { class: 'info-box stack stack--tight' },
            el('p', { class: 't-body-strong c-primary', text: 'Bank-grade security' }),
            el('p', { class: 't-small', text: 'This uses India’s Account Aggregator framework. You can revoke access anytime from Settings.' }),
          ),
        ],
        actions: [allow, button({ label: 'Cancel', kind: 'secondary', block: true, onClick: () => api.close() })],
      };
    },
  });
}

function fetchFromBank(docId) {
  const run = async () => {
    store.update((s) => { const d = s.docs.find((x) => x.id === docId); d.busy = true; });
    await wait(DEMO.timers.fetch);
    const v = lib(docId);
    const fetched = v.fetched || v.sample;
    store.update((s) => {
      const d = s.docs.find((x) => x.id === docId);
      d.busy = false;
      d.status = 'uploaded';
      d.file = { name: fetched.name, size: fetched.size, kind: 'PDF', source: 'fetched', at: Date.now(), read: v.sample.read };
      pushActivity(s, `${v.title} auto-fetched`, 'success');
    });
    toast(TOASTS.fetched);
  };
  if (!S().accounts.length) openConnectSheet({ onDone: run });
  else run();
}
