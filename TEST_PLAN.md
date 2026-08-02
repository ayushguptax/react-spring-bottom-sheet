# Manual test plan — dependency modernization

Covers the migration on branch `chore/dependency-modernization`. Ordered by risk: the
things most likely to be broken are first. If you only have 15 minutes, do **P0**.

```bash
npm install     # must succeed with NO --legacy-peer-deps
npm run dev     # http://localhost:3000
```

**Testing on a phone.** The LAN address `next dev` prints works as-is. Reaching the dev
server through a tunnel or custom hostname does not — Next 16 blocks cross-origin dev
resources (HMR), so the page loads but never hydrates. Pass the host at startup:

```bash
NEXT_DEV_ORIGINS=my-tunnel.example.com npm run dev
```

Note the demos on `/` are lazy — each phone frame shows a **"Load example"** button and only
mounts its iframe once tapped. To test the sheet directly, go straight to a `/fixtures/*` route.

## What automated checks already cover

Don't spend manual time re-verifying these:

| Checked | How |
| --- | --- |
| State machine choreography | 22 scenarios replayed through the v4 and v5 machines — identical traces + final states |
| Published CSS | `dist/style.css` selector sets verified identical to the pre-migration build |
| Open/close/dismiss/focus-trap/aria-hider/scroll-lock, snap-on-drag | 26 Playwright assertions, desktop Chromium, all fixtures |
| Types, lint, both builds | `npm run lint`, `npm test` |

What automation could **not** cover, and is what this plan is for: **real touch input, iOS/Android
browser quirks, animation feel, and screen readers.**

---

## P0 — Highest risk

### 1. Drag feel on a real touch device
`@use-gesture` v10 changed `velocity` from a scalar to a per-axis vector, and switched to
Pointer Events. The numbers were mapped over, but *feel* can't be diff'd.

On a **real iPhone and a real Android phone** (not devtools emulation), open
`/fixtures/scrollable`:

- [ ] Slow drag on the header tracks your finger 1:1, no lag or jump on first movement
- [ ] Fast flick up snaps to the top snap point; fast flick down snaps to the lower one
- [ ] A gentle flick and a hard flick feel *different* (velocity is being honoured, not clamped to a constant)
- [ ] Drag past the top snap point → rubberband resistance, then settles back
- [ ] Drag below the bottom snap point on a dismissable sheet → rubberbands, then dismisses if you go far enough
- [ ] Release mid-drag without moving (a tap on the header) does **not** snap anywhere
- [ ] No accidental text selection or long-press callout while dragging

### 2. Scroll-lock and overscroll on iOS Safari
`body-scroll-lock` → `body-scroll-lock-upgrade`. iOS is where this library earns its keep.

On **iOS Safari**, `/fixtures/scrollable`:

- [ ] With the sheet open, dragging the header does **not** scroll the page behind it
- [ ] Scrolling the sheet content to the bottom and continuing to drag does not rubberband the whole page
- [ ] Scrolling content to the very top and pulling further down does not trigger Safari's page overscroll
- [ ] The Safari toolbar hiding/showing while dragging doesn't leave the sheet at the wrong height
- [ ] Close the sheet → page scroll position is exactly where it was before opening, and the page scrolls normally again

### 3. Sheet opening while the soft keyboard appears
This is what the three-step `visuallyHidden → activate → open` sequence exists for; the xstate
rewrite touched that sequence.

`/fixtures/experiments` (or any fixture with an input), on **Android Chrome** and **iOS Safari**:

- [ ] Open a sheet that autofocuses a text input → keyboard appears, sheet is correctly positioned above it, no flash of the sheet at the wrong position
- [ ] Sheet does not end up half off-screen after the keyboard opens
- [ ] Dismiss the keyboard → sheet resizes smoothly, doesn't jump

### 4. `expandOnContentDrag`
The only place a drag handler is bound to a scrolling element. Pointer Events + `touch-action`
interact badly here and this path has the least automated coverage.

`/fixtures/experiments`, find the expand-on-content-drag example:

- [ ] Dragging the **content** (not the header) upward expands the sheet
- [ ] Once fully expanded, dragging content scrolls it instead of moving the sheet
- [ ] Scrolled down in content, dragging down scrolls content up first, then starts moving the sheet only at scrollTop 0
- [ ] No stuck state where neither the sheet nor the content moves

---

## P1 — Should work, worth confirming

### 5. Every fixture, desktop + mobile

| Route | Check |
| --- | --- |
| `/fixtures/simple` | Opens on load; Esc, backdrop tap, and swipe-down all dismiss |
| `/fixtures/scrollable` | Opens by default, is **not** dismissable (no backdrop tap close), snap points work |
| `/fixtures/sticky` | Header and footer stay pinned while content scrolls; both are draggable |
| `/fixtures/aside` | `blocking={false}` — you can still scroll and click the page behind it |
| `/fixtures/experiments` | Nothing throws; all examples respond |
| `/` | Hero phone animation plays (this uses react-spring directly and was migrated too) |

- [ ] All of the above
- [ ] Browser console is clean on every route (no errors *or* warnings)

### 6. Window resize / orientation
`ResizeObserver` ponyfill was dropped for the native API.

- [ ] Resize the desktop window with the sheet open → height re-snaps sensibly
- [ ] Rotate a phone portrait ↔ landscape → sheet re-snaps, doesn't overflow the viewport
- [ ] `/fixtures/scrollable`: scroll to the bottom of the content, then resize — sheet adjusts without scrolling back up first

### 7. Content that changes height
- [ ] `/fixtures/simple`: hit the "expand" control inside the sheet → sheet grows smoothly to fit
- [ ] Collapse it again → sheet shrinks

### 8. Keyboard + screen reader
`focus-trap` v6 → v8. v7 changed how `tabbable` decides an element is focusable, and this
library activates the trap while the sheet is at `opacity: 0`.

- [ ] Open sheet → focus lands on the first interactive element inside
- [ ] Tab cycles **only** within the sheet, never reaching page content behind it
- [ ] Shift+Tab from the first element wraps to the last
- [ ] Esc closes (dismissable sheets)
- [ ] Close → focus returns to the element that opened the sheet
- [ ] `/fixtures/aside` (non-blocking): Tab **does** leave the sheet — that's correct here
- [ ] VoiceOver (iOS/macOS) or TalkBack: with a blocking sheet open, swiping does not read page content behind it; closing restores it

### 9. Reduced motion
- [ ] Enable OS "Reduce motion" → sheet opens/closes/snaps instantly, no spring animation
- [ ] Turn it off → animations return

---

## P2 — Lower risk, quick to confirm

### 9b. Sheet has a solid background (regression fixed 2026-08-02)
`src/style.css` never defines `--rsbs-bg` / `--rsbs-handle-bg`; the values come from
`defaults.json`, injected as `var(--rsbs-bg, #fff)` fallbacks by
`postcss-custom-properties-fallback`. Splitting the PostCSS configs briefly dropped that
plugin from the docs chain, which made the sheet render **fully transparent** on the docs
site. Fixed, but it is an easy one to reintroduce:

- [ ] Sheet body is solid white, not see-through against the backdrop
- [ ] The grey drag-handle pill is visible at the top of the header
- [ ] Same on a fixture opened directly *and* inside a phone frame on `/`

### 10. Visual regressions from the CSS changes
Two browserslist bumps dropped `-ms-`/`-moz-` prefixes and the static fallbacks for browsers
without CSS-variable support. The selector sets were verified identical, but eyeball it:

- [ ] Rounded top corners present, and they flatten when the sheet reaches full height
- [ ] Drag handle pill renders on the header
- [ ] Backdrop dims the page and fades in/out with the sheet
- [ ] Content fades in as the sheet rises (not just a hard cut)
- [ ] No white gap at the very bottom of the screen when fully expanded (the "antigap")
- [ ] Safe-area insets respected on a notched iPhone (content not under the home indicator)

### 11. Docs site chrome (Tailwind 3 → 4 migration)
Cosmetic only — the docs site is not published.

- [ ] Home page fonts render (Montserrat headings, Source Sans body), not fallback serif
- [ ] Brand colours look right (dark maroon `hero`, pink `hero-lighter`)
- [ ] Greys look blue-tinted (slate), not neutral
- [ ] Footer's skewed dark band renders
- [ ] Phone-frame illustration around each example renders
- [ ] Focus rings visible when tabbing links/buttons
- [ ] "Open example" and "Close example" links navigate (these were rewritten for the new `next/link` API)

### 12. Debug tooling
- [ ] `http://localhost:3000/fixtures/simple?debug` opens the Stately inspector and shows state transitions

### 13. Consumer install sanity
The point of the whole exercise:

```bash
npm run build:dist
npm pack
# in a scratch React 19 app:
npm install /path/to/react-spring-modal-sheet-4.0.0.tgz
```

- [ ] Installs into a **React 19** app with no `ERESOLVE` and no `--legacy-peer-deps`
- [ ] `import { BottomSheet } from 'react-spring-modal-sheet'` works
- [ ] `import 'react-spring-modal-sheet/dist/style.css'` works
- [ ] TypeScript: `BottomSheetRef` / `BottomSheetProps` resolve, `ref.current.snapTo(...)` type-checks
- [ ] Works in a **Vite** app (ESM) and a **Next** app (CJS + ESM)

---

## Known deliberate changes

Not bugs — confirm you're happy with each:

1. **Browserslist raised** to Chrome 64 / Safari 14.1 / iOS 14.5 / Firefox 69 / Edge 79.
   Driven by native `ResizeObserver` (Safari 13.1+) and esbuild's refusal to lower destructuring
   below Safari 14.1. Previously claimed Chrome 49 / Safari 9.1 — which the library could not
   actually have worked on.
2. **`dist/index.modern.js` is no longer produced.** microbundle emitted it; no `package.json`
   field ever referenced it. `main`, `module`, `jsnext:main`, `types` are all still satisfied.
   Add an `exports` map if you want it back.
3. **`dist/index.d.mts` is new** (tsup emits types per format). Harmless.
4. **Published CSS is smaller** — legacy vendor prefixes and pre-custom-property fallbacks dropped.
5. **`semantic-release` removed** from devDependencies. It was unused; this project versions manually.
6. **Prettier stays on v2.** v3 would reformat every file and bury the real diff.

## Follow-ups not done here

- No test suite still exists. The Playwright smoke test I used lives outside the repo; worth
  adopting it as `e2e/` if you want a regression net.
- `postcss-preset-env` is still v6 (2019). Upgrading is a separate job: v8 removed `importFrom`,
  which the `defaults.json` fallback generation depends on.
- `husky` 6 and `lint-staged` 10 are old but working; both have had major rewrites.
