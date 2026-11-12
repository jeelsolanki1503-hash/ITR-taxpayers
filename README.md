# ITR · Taxpayer flow (hi-fi prototype)

A live, clickable prototype of the **taxpayer side of ITR**: create an account, verify, link your CA, upload the documents your CA asks for, submit, fix what gets flagged, and track it all from Home, Checklist, History and Settings.

It is built from the Figma file *ITR · Taxpayers flow*:

- **Content and layout** come from the pages *Taxpayer Mobile Flow v2* and *Taxpayer Desktop Flow v2* (102 mobile frames and 102 desktop frames, including every edge state, toast, sheet and modal).
- **Every visual** comes from the *Design System* page (v1.0) and follows the *Hi-fi Screens* samples: the canvas gradient, 80 % white glass cards, the dark highlight card, Inter + Roboto Mono, the 13 text styles, 12 spacing steps, 5 radii, the 44-icon set, status pills, banners, toasts, sheets and dialogs.

Vanilla HTML, CSS and ES modules. No framework, no build step, no runtime dependencies beyond Google Fonts.

---

## Run it locally

Any static file server works. From this folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

> Opening `index.html` straight from the file system will not work, because browsers block ES modules on `file://`.

## Deploy to GitHub Pages

1. Push this folder's contents to the `main` branch of a repository (keep `.nojekyll` and `404.html`).
2. In the repository, open **Settings → Pages**, pick **Deploy from a branch**, then `main` and `/ (root)` (or `/docs` if you put the files there).
3. Open `https://<user>.github.io/<repo>/`.

All paths are relative, file names are lower-case, routing uses the URL hash, and `404.html` is a copy of `index.html`, so it also works under a user site (`https://<user>.github.io/`).

---

## How to demo it

The prototype starts with a **2-second splash** (the logo builds itself) and lands on **Welcome**. There are two journeys, exactly as the Figma notes describe.

### Journey 1 · Create account (Anita, a new taxpayer)

| Step | What to do | What happens |
| --- | --- | --- |
| Create account | Fill name, email, 10-digit mobile | Field errors appear in plain words if anything is off. `ritika.nair@gmail.com` shows the *email already exists* state. |
| Verify mobile | Type any 6 digits | An "SMS" toast shows a code, but **any 6-digit code works**. `000000` shows the *wrong code* state. |
| Tell us about you | Pick your income sources and reminder channels | Picking nothing shows the error. **Deepak builds the checklist from what you pick** (Salary + Rental gives the 6 documents in the wireframes). |
| Verify identity | *Fetch via DigiLocker* → *Allow* for Aadhaar and PAN | Continue unlocks when both are verified. Skipping is allowed. |
| Filing history | Wait | Skeleton loading, then two earlier returns. If you skipped PAN, you get *No earlier filings*. |
| Link your CA | Enter **DEEPAK-4821** (a "WhatsApp" toast shows it) | Any other code shows *code not found*. Or skip to see the *no CA* states. |
| Data and privacy | Tick the box → *Get started* | — |
| Home | Wait about **6 s** | Deepak sends the checklist (toast + Home updates live). |
| Checklist | Upload each document | *Choose file* opens a real file picker (or drag and drop on desktop). *Take photo* uses the camera on phones and simulates a capture on desktop. *Fetch from your bank instead* asks for consent once, then fetches. Each upload is checked for about 2 s, then shows what was read from the file. |
| Review and submit | *Submit to Deepak* → *Send to Deepak* | Confirmation screen. |
| Flag | Wait about **7 s** | Deepak flags *Rent received details*. Home shows *1 document needs fixing*. |
| Fix | *Fix now* → *Upload the corrected document* → *Resend to Deepak* | Home shows *Sent again*. After about **7 s** Deepak marks the file complete. |

### Journey 2 · Log in (Ritika, a returning taxpayer)

Log in with **any email** and a password of **6 or more characters** (shorter passwords show the *email and password don't match* state). *Continue with Google / Apple* also signs in as Ritika.

Ritika has 5 documents: 2 auto-fetched, an FD certificate to upload, a **Form 16 that Deepak flagged**, and a **foreign investment proof that is new this year**. Fix and upload them, then review and send.

### Things to try anywhere

- **Report something new** (Home): investment, income or expenditure, with validation and Indian-grouped rupee amounts (₹12,34,567).
- **History**: open a past filing and download its acknowledgement.
- **Settings**: edit profile, unlink and relink the CA (the journey pauses and resumes), connect or revoke bank accounts, toggle notifications, download or delete all data, log out (your progress is kept per email and restored when you log back in).
- **Edge states**: drop a `.docx` (wrong type), a file over 10 MB (too large) or an empty file (unreadable). Go offline in DevTools to see *upload failed* and *DigiLocker couldn't connect*.
- **Reset the demo**: Settings → Data storage & access → Delete all my data, or clear the site's local storage.

---

## Logo and splash

- **Mark**: a filed document with a teal tick on the canvas gradient (navy to teal), so it reads as "done, filed" and belongs to the design system's palette. Files: `assets/logo.svg`, `favicon.svg`; inline builder in `js/icons.js`.
- **Splash (2 s)**: the tile scales in, the document lands, the tick draws itself, a ring pulses out, then the *ITR* wordmark and tagline rise in before the splash hands over to the app. Click or press a key to skip. With *reduce motion* on, it shows a still logo for under a second.
- The logo stays in the product as the stakeholder mark: sidebar and tablet rail, mobile headers, Welcome and Log in.

---

## What's built

**Onboarding**: Welcome · Create account (default, errors, email exists) · Verify mobile (code, empty, wrong code, resend) · Log in (errors, wrong password, forgot password) · Tell us about you (nothing picked) · Verify identity (DigiLocker sheet, failed) · Filing history (fetching, found, none) · Link your CA (empty, not found, linking, linked) · Data and privacy (agreed).

**Home**: waiting for checklist · checklist received · in review · needs fixing · back in review · all received · no CA linked · returning · returning, submitted.

**Checklist**: waiting for CA · active · in review · needs fixing · being checked · all received · no CA linked · returning · returning, in review.

**Review and submit** (new and returning) · **Sent to CA** · **Document flagged**.

**Report something new**: investment, income, expenditure (empty, typed, errors).

**History**: returning, new user, empty, plus the past filing sheet.

**Settings**: main list, profile and details, linked CA (and none), linked accounts (and none), data storage and access, notification preferences.

**Sheets and modals**: upload (choose, wrong type, too large, unreadable, failed, uploading, check details) · your file · file sent · resend (uploading, check details) · connect accounts (from checklist and settings) · DigiLocker · past filing · unlink CA · revoke access · delete data.

**All 14 toasts** from the wireframes, plus feedback toasts for uploads, verification, linking and sign-in.

## Design decisions worth knowing

- **Layout and content are the wireframes'.** Where the design system has a rule the mid-fi wireframes break, the design system wins, the same way the Hi-fi Screens samples do it:
  - Field labels sit **above** fields, not inside them, and errors are a red border, an icon and a sentence.
  - Text never sits on the gradient. Page titles go in the header (mobile) or the glass top bar (desktop), and sections are glass cards.
  - Status is always a pill with an icon and a word. Flagged documents use *Warning*, not red.
  - Destructive confirmations use the red *Danger* button; *Cancel* stays the safe choice.
  - Toasts stay at least 6 s and pause on hover or focus; error toasts stay until closed.
  - Buttons that need something first (*Continue* on Verify identity, *Get started*, *Submit to Deepak*) keep the primary look rather than greying out. Pressing one early does not advance; it shows what is missing in red. This follows the design system's "keep it enabled and explain the error".
- **Mobile** (below 768 px): solid header, glass cards, solid footer for the main action, bottom tab bar, bottom sheets.
- **Tablet** (768–1023 px, not designed in v1): derived as an icon-and-word rail beside the mobile card layout.
- **Desktop** (1024 px and up): floating glass sidebar, glass top bar, horizontal stepper, three report tiles, centred dialogs. Content stops growing at 1200 px; whitespace grows instead.
- If the person turns transparency off, glass cards become the solid `#F1F5F7` fallback.

## Not built yet

| Item | Why |
| --- | --- |
| Dark theme | The design system schedules dark mode for v1.2, so there are no approved dark tokens to follow. |
| Notifications centre | Not in the wireframes. The bell shows the latest update as a toast and clears its dot. |
| Real backend, OCR and email/SMS | Simulated: the CA's actions run on timers and "what we read from this file" uses sample values. |
| Hindi and other languages | Design system v1.3. |

---

## File layout

```
index.html            app shell, splash, regions for toasts and announcements
404.html              byte-for-byte copy of index.html
.nojekyll
favicon.svg
assets/logo.svg
css/reset.css         reset + reduced-motion guard
css/variables.css     every design-system token (colour, type, space, radius, effects, sizes, motion)
css/base.css          body, canvas, the 13 text styles, focus ring
css/layout.css        app shell: header, footer, tab bar, sidebar/rail, auth card, breakpoints
css/components.css    buttons, fields, OTP, option cards, chips, toggles, pills, progress, stepper,
                      cards, rows, action cards, banners, dropzone, file chip, toasts, sheet/dialog
css/screens.css       splash, welcome, home, checklist, review/sent, settings specifics
css/animations.css    keyframes + route transitions
js/icons.js           the 44 design-system icons + the logo
js/data.js            all dummy data and copy
js/store.js           localStorage state with in-memory fallback, pub/sub, persona seeds
js/components.js      DOM builders for every reusable piece
js/layout.js          sidebar and tab bar from one nav tree
js/router.js          hash router, screen stack, slide and fade transitions, live re-render
js/screens.js         every screen and sheet
js/app.js             routes, guards, simulated CA events, splash, boot
```

## Assets handoff

The prototype ships with only the logo. Drop real assets in with these paths; no screen code needs to change.

| Where in the UI | Path | Format | Target size |
| --- | --- | --- | --- |
| App logo | `assets/logo.svg` | SVG | 128 × 128 |
| Favicon | `favicon.svg` | SVG | 512 × 512 |
| iOS touch icon | `apple-touch-icon.png` | PNG | 180 × 180 |
| Social preview | `assets/og.png` | PNG / JPG | 1200 × 630 |
| CA avatar photo (optional) | `assets/photos/ca-deepak.jpg` | JPG / WebP | 112 × 112 |
| Empty-state illustrations (optional) | `assets/illustrations/<id>.svg` | SVG | fluid |

## Responsive QA

Checked in Chromium by script on 54 screen states (every onboarding screen, each stage of Home and Checklist for both personas, all Settings pages, Report, Review, Sent, Document flagged). Each state is checked for: nothing past the viewport edge, nothing spilling out of its card or footer, no overlapping blocks, no text directly on the gradient, no text under 12 px, field text at 16 px, and footers aligned to their content column. Buttons, rows, switches and checkboxes are at least 44 px; the exceptions are inline text links and the 36 px desktop chips the design system specifies.

| Width | Layout | Horizontal scroll | Targets ≥ 44 px | Result |
| --- | --- | --- | --- | --- |
| 320 | Mobile, tab bar | None | Yes | Pass |
| 375 | Mobile, tab bar | None | Yes | Pass |
| 480 | Mobile, tab bar | None | Yes | Pass |
| 768 | Tablet rail + cards | None | Yes | Pass |
| 1024 | Desktop sidebar | None | Yes | Pass |
| 1280 | Desktop sidebar | None | Yes | Pass |
| 1440 | Desktop sidebar | None | Yes | Pass |
| 1920 | Desktop, capped and centred | None | Yes | Pass |

Both full journeys (new user and returning user) were also run through the real UI at 375 px and 1440 px with no console errors, and the screens were compared by eye against the mobile and desktop wireframes. WebKit/Firefox and Lighthouse runs were not available on the machine this was built on, so run those before hand-over.
