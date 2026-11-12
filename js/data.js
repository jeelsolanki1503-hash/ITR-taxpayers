// All dummy data and copy for the taxpayer flow. Shapes live here and nowhere else.

export const APP = {
  name: 'ITR',
  role: 'Taxpayer',
  tagline: 'File your taxes, stress-free',
  pitch: 'One place to collect documents, track status, and stay in sync with your CA.',
  supportEmail: 'help@itr.app',
};

export const CA = {
  name: 'Deepak Mehta',
  first: 'Deepak',
  firm: 'Deepak Mehta & Associates',
  title: 'Chartered Accountant',
  initials: 'DM',
  inviteCode: 'DEEPAK-4821',
};

export const DEADLINE = { label: '31 July 2026', daysLeft: 42 };

export const DEMO = {
  otpWrong: '000000',
  shortPasswordIsWrong: 6,
  timers: { checklist: 6000, flag: 7000, complete: 7000, check: 2000, linking: 1400, fetch: 1300, history: 1600 },
};

export const PERSONAS = {
  anita: {
    id: 'anita',
    name: 'Anita Sharma',
    first: 'Anita',
    email: 'anita.sharma@gmail.com',
    mobile: '98765 43210',
    pan: 'BKQPD4821L',
  },
  ritika: {
    id: 'ritika',
    name: 'Ritika Nair',
    first: 'Ritika',
    email: 'ritika.nair@gmail.com',
    mobile: '99887 76655',
    pan: 'AFKPN7731Q',
    sources: 'Salaried · SIPs · FD · Freelance income',
  },
};

export const EXISTING_EMAILS = ['ritika.nair@gmail.com'];

export const INCOME_OPTIONS = [
  { id: 'salary', title: 'Salary', desc: 'Form 16 from your employer', short: 'Salary' },
  { id: 'rental', title: 'Rental income', desc: 'Rent from a house or property you own', short: 'Rental income' },
  { id: 'interest', title: 'Interest and deposits', desc: 'Savings account, FD or RD interest', short: 'Interest and deposits' },
  { id: 'shares', title: 'Shares and mutual funds', desc: 'Gains, dividends or SIPs', short: 'Shares and mutual funds' },
  { id: 'freelance', title: 'Freelance or business', desc: 'Consulting, gigs or a registered business', short: 'Freelance income' },
  { id: 'foreign', title: 'Foreign income or assets', desc: 'Salary, stocks or accounts outside India', short: 'Foreign income' },
];

export const REMIND_CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
];

// Every document Deepak can ask for. `read` is what the app "reads" from a file.
export const DOC_LIBRARY = {
  form16: {
    title: 'Form 16',
    how: 'Ask your employer’s HR or payroll team, or download it from TRACES · PDF',
    needed: 'Form 16 Part A and Part B from your employer for FY 2025-26',
    find: 'Your employer’s HR or payroll team, or the TRACES portal.',
    canFetch: false,
    headStart: 'Form 16',
    sample: { name: 'Form16_FY2025-26.pdf', size: '1.2 MB', read: [['Employer', 'Zephyr Labs Pvt Ltd'], ['Period', 'Apr 2025 – Mar 2026'], ['TDS deducted', '₹1,24,500']] },
    corrected: { name: 'Form16_FY2025-26_v2.pdf', size: '1.1 MB', read: [['Employer', 'Zephyr Labs Pvt Ltd'], ['Period', 'Apr 2025 – Mar 2026'], ['TDS deducted', '₹1,31,200']] },
    correctedNote: 'Uploaded. The TDS now matches Form 26AS.',
    flag: {
      note: 'The TDS doesn’t match Form 26AS. Upload your latest employer’s Form 16.',
      short: 'Deepak: the TDS doesn’t match Form 26AS. Upload your latest employer’s Form 16.',
    },
  },
  bankInterest: {
    title: 'Bank interest statement',
    how: 'Net banking → Statements → Interest certificate (Apr 2025 – Mar 2026)',
    needed: 'An interest certificate from each savings account for Apr 2025 – Mar 2026',
    find: 'Net banking → Statements → Interest certificate.',
    canFetch: true,
    headStart: 'Bank interest statements',
    sample: { name: 'HDFC_Interest_FY25-26.pdf', size: '214 KB', read: [['Bank', 'HDFC Bank'], ['Period', 'Apr 2025 – Mar 2026'], ['Interest earned', '₹18,240']] },
    fetched: { name: 'HDFC_Interest_FY25-26.pdf', size: '210 KB' },
  },
  fd: {
    title: 'FD certificate',
    how: 'Net banking → Deposits → your FD → TDS / interest certificate',
    needed: 'The TDS or interest certificate for each fixed deposit',
    find: 'Net banking → Deposits → your FD → TDS / interest certificate.',
    canFetch: true,
    headStart: 'FD certificates',
    sample: { name: 'ICICI_FD_TDS_2025-26.pdf', size: '188 KB', read: [['Bank', 'ICICI Bank'], ['FD interest', '₹42,600'], ['TDS deducted', '₹4,260']] },
    fetched: { name: 'ICICI_FD_TDS.pdf', size: '190 KB' },
  },
  rent: {
    title: 'Rent received details',
    how: 'Your bank statement showing rent credits, or receipts from your tenant',
    needed: 'A statement of rent received for the full year, with your tenant’s name',
    find: 'Your bank statement showing rent credits, or receipts from your tenant.',
    canFetch: false,
    headStart: 'Rent receipts',
    sample: { name: 'Rent_Apr-Sep.pdf', size: '342 KB', read: [['Tenant', 'R. Menon'], ['Period', 'Apr 2025 – Sep 2025'], ['Rent received', '₹1,80,000']] },
    corrected: { name: 'Rent_Apr-Mar_full-year.pdf', size: '410 KB', read: [['Tenant', 'R. Menon'], ['Period', 'Apr 2025 – Mar 2026'], ['Rent received', '₹3,60,000']] },
    correctedNote: 'Uploaded. This looks like the full year now.',
    flag: {
      note: 'The March rent entry looks incomplete. Could you upload the full-year rent statement, not just the first half?',
      short: 'Deepak: the March entry looks incomplete. Upload the full-year statement.',
    },
  },
  propertyTax: {
    title: 'Property tax receipt',
    how: 'Your municipal corporation’s website → Property tax → Payment history',
    needed: 'The property tax receipt for 2025-26',
    find: 'Your municipal corporation’s website → Property tax → Payment history.',
    canFetch: false,
    headStart: 'Property tax receipt',
    sample: { name: 'PropertyTax_2025-26.pdf', size: '96 KB', read: [['Property', 'Flat 402, Powai'], ['Year', '2025-26'], ['Tax paid', '₹14,800']] },
  },
  homeLoan: {
    title: 'Home loan interest certificate',
    how: 'Your lender’s net banking → Loans → Interest certificate for FY 2025-26',
    needed: 'The home loan interest certificate for FY 2025-26',
    find: 'Your lender’s net banking → Loans → Interest certificate.',
    canFetch: true,
    headStart: 'Home loan interest certificate',
    sample: { name: 'SBI_HomeLoan_Interest.pdf', size: '120 KB', read: [['Lender', 'SBI'], ['Interest paid', '₹1,92,000'], ['Principal repaid', '₹86,000']] },
    fetched: { name: 'SBI_HomeLoan_Interest.pdf', size: '120 KB' },
  },
  brokerPnl: {
    title: 'Broker P&L statement',
    how: 'Your broker’s console → Reports → Tax P&L for FY 2025-26',
    needed: 'Your capital gains (tax P&L) statement for FY 2025-26',
    find: 'Your broker’s console → Reports → Tax P&L.',
    canFetch: true,
    headStart: 'Broker P&L statement',
    sample: { name: 'Zerodha_PnL_FY25-26.pdf', size: '1.4 MB', read: [['Broker', 'Zerodha'], ['Period', 'Apr 2025 – Mar 2026'], ['Net gains', '₹64,300']] },
    fetched: { name: 'Zerodha_PnL_FY25-26.pdf', size: '1.4 MB' },
  },
  freelance: {
    title: 'Freelance income summary',
    how: 'Your invoices, or the bank statement showing client payments',
    needed: 'A list of client payments received in FY 2025-26',
    find: 'Your invoices, or the bank statement showing client payments.',
    canFetch: false,
    headStart: 'Freelance invoices',
    sample: { name: 'Freelance_Invoices_FY25-26.pdf', size: '520 KB', read: [['Clients', '3'], ['Invoices', '6'], ['Total received', '₹4,20,000']] },
  },
  foreign: {
    title: 'Foreign investment proof',
    how: 'Your foreign broker’s “Tax Documents” or “Annual Statement” section',
    needed: 'A year-end statement for each foreign account or holding',
    find: 'Your foreign broker’s “Tax Documents” or “Annual Statement” section.',
    canFetch: false,
    headStart: 'Foreign investment proof',
    sample: { name: 'Foreign_broker_statement.pdf', size: '860 KB', read: [['Holding', 'US equity · 42 shares'], ['Value on 31 Mar', '₹6,80,000'], ['Dividends', '₹9,850']] },
  },
};

// Deepak builds the checklist from the income sources the person picks.
export function checklistFor(incomes = []) {
  const ids = [];
  if (incomes.includes('salary')) ids.push('form16');
  ids.push('bankInterest', 'fd');
  if (incomes.includes('rental')) ids.push('rent', 'propertyTax', 'homeLoan');
  if (incomes.includes('shares')) ids.push('brokerPnl');
  if (incomes.includes('freelance')) ids.push('freelance');
  if (incomes.includes('foreign')) ids.push('foreign');
  return ids;
}

export function sourcesLabel(incomes = []) {
  const names = INCOME_OPTIONS.filter((o) => incomes.includes(o.id)).map((o) => o.short);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function sourcesList(incomes = []) {
  return INCOME_OPTIONS.filter((o) => incomes.includes(o.id)).map((o) => o.short).join(', ');
}

// Which document Deepak flags after the first send
export const FLAG_PRIORITY = ['rent', 'form16', 'fd', 'bankInterest'];

export const STEPS = [
  { id: 'link', title: 'Link your CA', done: `Linked to ${CA.name}`, todo: 'Enter your CA’s invite code' },
  { id: 'checklist', title: 'Get checklist', sub: `${CA.first} sends the list` },
  { id: 'upload', title: 'Upload documents', sub: 'Add each one' },
  { id: 'review', title: `${CA.first} reviews`, sub: 'Usually 1–2 days' },
  { id: 'done', title: 'All received', sub: 'Nothing pending' },
];

export const FILINGS = {
  fetched: [
    { id: 'ay2526', ay: 'AY 2025-26', sub: 'Filed 28 Jul 2025 · Refund ₹12,400 received', by: 'Fetched from the Income Tax portal.', rows: [['Status', 'Filed and verified'], ['Filed on', '28 Jul 2025'], ['Result', 'Refund ₹12,400 received'], ['Acknowledgement', 'ITR-V · PDF']] },
    { id: 'ay2425', ay: 'AY 2024-25', sub: 'Filed 30 Jul 2024 · Tax paid ₹18,200', by: 'Fetched from the Income Tax portal.', rows: [['Status', 'Filed and verified'], ['Filed on', '30 Jul 2024'], ['Result', 'Tax paid ₹18,200'], ['Acknowledgement', 'ITR-V · PDF']] },
  ],
  ritika: [
    { id: 'ay2526', ay: 'AY 2025-26', sub: '6 of 6 documents · Filed on time', by: `Filed on time by ${CA.name}.`, rows: [['Status', 'Filed and verified'], ['Documents shared', 'All requested documents'], ['Acknowledgement', 'ITR-V · PDF']] },
    { id: 'ay2425', ay: 'AY 2024-25', sub: '6 of 6 documents · Filed on time', by: `Filed on time by ${CA.name}.`, rows: [['Status', 'Filed and verified'], ['Documents shared', 'All requested documents'], ['Acknowledgement', 'ITR-V · PDF']] },
    { id: 'ay2324', ay: 'AY 2023-24', sub: '5 of 6 documents · Filed on time', by: `Filed on time by ${CA.name}.`, rows: [['Status', 'Filed and verified'], ['Documents shared', '5 of 6 documents'], ['Acknowledgement', 'ITR-V · PDF']] },
  ],
};

export const ACCOUNTS = [
  { id: 'hdfc', name: 'HDFC Bank · Savings Account', title: 'HDFC Bank · Savings ···4821', short: 'HDFC Bank', desc: 'Statements fetched automatically', defaultOn: true },
  { id: 'zerodha', name: 'Zerodha · Investment Account', title: 'Zerodha · Investments ···3390', short: 'Zerodha', desc: 'Tax P&L fetched automatically', defaultOn: true },
  { id: 'icici', name: 'ICICI Bank · FD Account', title: 'ICICI Bank · FD ···7710', short: 'ICICI Bank', desc: 'TDS and interest certificates', defaultOn: false },
];

export const REPORT_KINDS = {
  investment: {
    title: 'New investment',
    heading: 'Report a new investment',
    sub: `Let ${CA.first} know so he can guide you on what’s needed for it.`,
    icon: 'bank',
    typeLabel: 'Investment type',
    typeError: 'Choose what you invested in',
    dateLabel: 'Date',
    suggestions: ['Mutual funds · SIP', 'Shares', 'Fixed deposit', 'PPF', 'NPS', 'Sovereign gold bonds', 'Foreign equity'],
    activity: 'You reported a new investment',
  },
  income: {
    title: 'New income',
    heading: 'Report a new income',
    sub: `Let ${CA.first} know so he can add it to your return.`,
    icon: 'plus',
    typeLabel: 'Income type',
    typeError: 'Choose the type of income',
    dateLabel: 'Date received',
    suggestions: ['Freelance project', 'Rent', 'Interest', 'Dividend', 'Bonus', 'Capital gains'],
    activity: 'You reported a new income',
  },
  expenditure: {
    title: 'New expenditure',
    heading: 'Report a new expenditure',
    sub: `Let ${CA.first} know so he can check if it can be claimed.`,
    icon: 'minus',
    typeLabel: 'Expense type',
    typeError: 'Choose the type of expense',
    dateLabel: 'Date paid',
    suggestions: ['Health insurance premium', 'Medical bills', 'Donation', 'Education loan interest', 'Rent paid'],
    activity: 'You reported a new expenditure',
  },
};

export const TOASTS = {
  checklistReceived: (n) => `${CA.first} sent your checklist: ${n} documents to upload.`,
  nudged: `Nudged ${CA.first}. He’ll get a message right away.`,
  asked: `Message sent. ${CA.first} will help you find this document.`,
  fetched: 'Done.',
  flagged: (title) => `${CA.first} flagged 1 document: ${title}.`,
  resent: `Sent again. ${CA.first} will take another look.`,
  complete: `All received. ${CA.first} marked your file complete.`,
  removed: 'File removed. You can upload a new one.',
  codeResent: (masked) => `New code sent to ${masked}.`,
  resetLink: 'Password reset link sent to your email.',
  saved: 'Saved.',
  help: `Help & support: reply here or write to ${APP.supportEmail}`,
  downloading: 'Downloading your documents...',
  reportSent: `Sent to ${CA.first}. He’ll tell you if he needs a document.`,
  bell: 'You’re all caught up.',
  unlinked: `${CA.name} is unlinked.`,
  linked: `Linked to ${CA.name}.`,
  accountsAllowed: 'Accounts connected.',
  revoked: (name) => `Access to ${name} revoked.`,
  uploaded: (title) => `${title} uploaded.`,
  verified: (doc) => `${doc} verified with DigiLocker.`,
  loggedOut: 'You’re logged out.',
  social: (p) => `Signed in with ${p}.`,
};

export const UPLOAD_RULES = {
  types: ['application/pdf', 'image/jpeg', 'image/png'],
  extensions: ['pdf', 'jpg', 'jpeg', 'png'],
  maxBytes: 10 * 1024 * 1024,
  hint: 'PDF, JPG or PNG · up to 10 MB',
  errors: {
    type: 'That file type isn’t supported. Please use a PDF, JPG or PNG.',
    size: 'That file is over 10 MB. Try a smaller PDF, or take a photo instead.',
    unreadable: 'We couldn’t read this file. It looks blurry or cut off. Try a clearer photo or the PDF.',
    failed: 'Upload failed. Your connection dropped. Your file wasn’t sent. Try again.',
  },
};
