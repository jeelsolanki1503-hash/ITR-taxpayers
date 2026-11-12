import { PERSONAS, DOC_LIBRARY, checklistFor } from './data.js';

const KEY = 'itr-taxpayer-v1';
const listeners = new Set();
let memory = null;
let storageOK = true;

function readStorage() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    storageOK = false;
    return null;
  }
}

function writeStorage(value) {
  if (!storageOK) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    storageOK = false;
  }
}

function clearStorage() {
  try { window.localStorage.removeItem(KEY); } catch { storageOK = false; }
}

let uid = Date.now();
export const nextId = () => (uid += 1).toString(36);

export function freshState() {
  return {
    version: 1,
    session: null,
    onboarded: false,
    profile: null,
    draft: { name: '', email: '', mobile: '' },
    incomes: ['salary'],
    remind: ['whatsapp', 'email'],
    identity: { aadhaar: 'idle', pan: 'idle' },
    filings: null,
    caLinked: false,
    consent: false,
    stage: 'no-ca',
    docs: [],
    activity: [],
    accounts: [],
    notify: { whatsapp: true, email: true, sms: false, deadline: true, updates: true },
    pending: null,
    bellUnread: false,
    reports: [],
  };
}

export function makeDocs(ids, overrides = {}) {
  return ids.map((id) => ({
    id,
    status: 'todo',
    file: null,
    prevFile: null,
    isNew: false,
    ...(overrides[id] || {}),
  }));
}

function activity(text, minutesAgo = 0, kind = 'info') {
  return { id: nextId(), text, at: Date.now() - minutesAgo * 60000, kind };
}

export function seedRitika(base) {
  const p = PERSONAS.ritika;
  const lib = DOC_LIBRARY;
  return {
    ...base,
    session: { persona: 'ritika' },
    onboarded: true,
    profile: { name: p.name, first: p.first, email: p.email, mobile: p.mobile, pan: p.pan, aadhaar: true },
    incomes: ['salary', 'interest', 'shares', 'freelance', 'foreign'],
    sources: p.sources,
    identity: { aadhaar: 'ok', pan: 'ok' },
    filings: 'ritika',
    caLinked: true,
    consent: true,
    stage: 'returning',
    docs: makeDocs(['bankInterest', 'brokerPnl', 'fd', 'form16', 'foreign'], {
      bankInterest: { status: 'uploaded', file: { name: lib.bankInterest.fetched.name, size: lib.bankInterest.fetched.size, source: 'fetched' } },
      brokerPnl: { status: 'uploaded', file: { name: lib.brokerPnl.fetched.name, size: lib.brokerPnl.fetched.size, source: 'fetched' } },
      fd: { how: 'ICICI net banking → Deposits → your FD → TDS certificate', attention: 'To upload · fetch from ICICI Bank or upload the PDF' },
      form16: { status: 'flagged', prevFile: { name: 'Form16_FY2025-26.pdf', size: '1.2 MB', source: 'upload' }, flagNote: lib.form16.flag.note },
      foreign: { isNew: true, attention: 'New this year · your CA noticed a foreign equity investment on your profile' },
    }),
    activity: [activity('Bank statement auto-fetched', 120, 'success'), activity('Deepak flagged Form 16', 60 * 26, 'warning')],
    accounts: ['hdfc', 'zerodha'],
    bellUnread: true,
  };
}

export function seedAnita(base, draft) {
  const p = PERSONAS.anita;
  return {
    ...base,
    session: { persona: 'anita' },
    onboarded: false,
    profile: {
      name: draft.name || p.name,
      first: (draft.name || p.name).trim().split(/\s+/)[0],
      email: draft.email || p.email,
      mobile: draft.mobile || p.mobile,
      pan: p.pan,
      aadhaar: false,
    },
    stage: 'no-ca',
    activity: [activity('You created your account', 0, 'info')],
  };
}

export function buildChecklist(incomes) {
  return makeDocs(checklistFor(incomes));
}

let state = readStorage() || freshState();
if (!storageOK) memory = state;

function emit(prev) {
  listeners.forEach((fn) => {
    try { fn(state, prev); } catch (err) { console.error(err); }
  });
}

export const store = {
  get state() { return state; },
  get persistent() { return storageOK; },

  set(patch) {
    const prev = state;
    state = { ...state, ...patch };
    memory = state;
    writeStorage(state);
    emit(prev);
  },

  update(mutator) {
    const prev = state;
    const draft = typeof structuredClone === 'function' ? structuredClone(state) : JSON.parse(JSON.stringify(state));
    const out = mutator(draft);
    state = out || draft;
    memory = state;
    writeStorage(state);
    emit(prev);
  },

  log(text, kind = 'info') {
    this.update((s) => {
      s.activity.unshift({ id: nextId(), text, at: Date.now(), kind, fresh: true });
      s.activity = s.activity.slice(0, 12);
      s.bellUnread = true;
    });
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  reset() {
    clearStorage();
    const prev = state;
    state = freshState();
    memory = state;
    emit(prev);
  },
};
