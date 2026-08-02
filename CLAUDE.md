# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`react-spring-modal-sheet` — an accessible, gesture-driven bottom sheet for React 16.14–19. The repo is two things at once:

- **The library** (`src/`) — published to npm; `files` is only `dist` + `defaults.json`.
- **A Next.js docs/demo site** (`pages/`, `docs/`, `public/`) — deployed to Vercel, never published. `docs/` holds demo-only components; `pages/fixtures/*` are the live examples linked from the README.

## Commands

```bash
npm run dev            # Next.js docs site on :3000 (the only way to exercise the sheet)
npm run lint           # eslint (flat config, --max-warnings 0) + tsc --noEmit; run before committing
npm run build          # next build (docs site)
npm run build:dist     # library build: postcss -> tsup (cjs + esm + d.ts)
npm test               # NOT a test suite — runs build:dist then next build
```

There is no test framework and no test files. `npm test` is a build smoke check. Verify behavior changes by hand in `npm run dev` against `pages/fixtures/*` (simple, scrollable, sticky, aside, experiments). Because the drag/spring behavior is subjective and untested, prefer driving a real browser over reasoning about it.

Append `?debug` to any dev-mode URL to enable the Stately inspector (see `debugging` in [src/utils.ts](src/utils.ts)).

## Architecture

### Two-layer component

[src/index.tsx](src/index.tsx) is a thin mount gate: it renders `null` until `open` goes true, mounts into a local `Portal` (a `<div data-rsbs-portal>` appended to `<body>`), and keeps the sheet mounted after `open` flips false until the CLOSE spring finishes. It also owns `lastSnapRef` and `initialStateRef` — the only state that must survive across mounts.

The portal node **must** be a direct child of `<body>`: `useAriaHider` walks `body > *` and skips the sheet's own parent when setting `aria-hidden` on the rest of the page.

[src/BottomSheet.tsx](src/BottomSheet.tsx) is the engine and is designed on the assumption that **it always mounts closed-then-opens and is unmounted after closing**. Never "fix" it to stay mounted while closed; the clean-mount invariant is what keeps gesture/animation state free of race conditions.

### The state machine is split across two files

[src/machines/overlay.ts](src/machines/overlay.ts) defines the *structure* — states, transitions, and which actor runs in each step (`renderVisuallyHidden` → `activate` → `openSmoothly`, etc.). The actor/action implementations in that file are **placeholders** so the machine can be visualized on its own. The real ones are injected via `overlayMachine.provide({ actors, actions })` in `BottomSheet.tsx`. Changing choreography means editing the machine; changing what a step *does* means editing the implementation in `BottomSheet.tsx`.

The machine's states are also the public CSS/DOM contract: `publicStates` in `BottomSheet.tsx` is written to `data-rsbs-state`.

The `smoothly` open path is deliberately three steps — render at the target position with `opacity: 0`, then activate focus trap / scroll lock / aria hider (which can trigger soft keyboards and `scrollIntoView` on iOS/Android), then animate up. Collapsing these steps reintroduces the mobile viewport bugs documented in the machine's comments.

xstate v5 notes that matter here:
- Events are objects: `send({ type: 'SNAP', payload: {...} })`, never `send('SNAP', ...)`.
- Actors that need context (`onSnapStart`, `onSnapEnd`, `snapSmoothly`) get it through `invoke.input`, evaluated *after* the state's `entry` actions run — which is how `snapping.start`'s `assign` populates `context.snapSource` before the actor reads it.
- `useMachine` reads the machine once, so `.provide()` is wrapped in `useMemo` with stable deps.
- Targetless transitions (`ignore`) are how a child state consumes an event to stop the root `CLOSE` handler firing — the v5 equivalent of v4's `CLOSE: undefined`.

### Animation never re-renders React

`useSpring` holds five values (`y`, `ready`, `maxHeight`, `minSnap`, `maxSnap`) and returns `[springs, api]`. [src/hooks/useSpringInterpolations.tsx](src/hooks/useSpringInterpolations.tsx) turns them into CSS custom properties (`--rsbs-overlay-h`, `--rsbs-overlay-translate-y`, `--rsbs-backdrop-opacity`, …) spread onto `[data-rsbs-root]`'s style. [src/style.css](src/style.css) consumes only those variables and `data-rsbs-*` attributes — it contains no hard-coded animation values. Consequently:

- Layout/visual changes usually belong in `style.css`, not in JS.
- Any new CSS custom property must also be added to [defaults.json](defaults.json), which downstream users load through `postcss-custom-properties-fallback`. The two files drifting apart silently breaks consumers with custom CSS.
- `ref.current.height` reads `heightRef`, updated outside the render cycle — this is why the README says the value isn't React state.
- This works because react-spring applies `--*` props via `setProperty` and exempts them from `px` suffixing. Don't assume that of other animation libraries.

`api.start()` returns **one promise per spring**, so `asyncSet` wraps it in `Promise.all`. Awaiting the bare array resolves immediately and lets the machine run ahead of the animation.

### Snap points and the readiness gate

[src/hooks/useSnapPoints.tsx](src/hooks/useSnapPoints.tsx) measures header, footer, and content with the native `ResizeObserver` and the viewport with a rAF-throttled `window.onresize`, then runs the user's `snapPoints` callback through `processSnapPoints` (round → clamp to `maxHeight` → dedupe → derive min/max). `resizeSourceRef` records *why* a measurement changed (`'window' | 'maxheightprop' | 'element'`) and is what populates `event.source` on RESIZE spring events.

Nothing may animate before measurements exist: [src/hooks/useReady.tsx](src/hooks/useReady.tsx) is a registration map (`maxHeight`, `contentHeight`) and `ready` gates the OPEN/CLOSE dispatch, the resize observers, and the "plugin" hooks.

### Refs mirror state on purpose

`maxHeightRef`, `minSnapRef`, `maxSnapRef`, `findSnapRef`, `defaultSnapRef`, `canDragRef`, `onSpringStartRef` and friends are kept in sync by a `useLayoutEffect`. Machine actors and the drag handler run outside React's render loop and must read current values without re-subscribing — reading the state variables directly there is a real bug, not a style preference. The same pattern lets consumers pass inline callbacks without `useCallback`.

`eslint-plugin-react-hooks` v7's `refs` and `set-state-in-effect` rules are disabled in [eslint.config.mjs](eslint.config.mjs) precisely because they fire on this design. Revisit if this ever adopts the React Compiler.

### "Plugins" and gestures

`useScrollLock` (body-scroll-lock-upgrade), `useFocusTrap` (focus-trap), and `useAriaHider` are activated together in the machine's `activate` actor and torn down in `deactivate`, plus an unmount-time cleanup effect as a backstop. Drag handling is a single `useDrag` handler bound to the backdrop (`closeOnTap: true`), header, footer, and — only when `expandOnContentDrag` — the scroll area (`isContentDragging: true`), with rubberbanding and dismiss-on-fling logic inline in `handleDrag`.

`@use-gesture` v10 reports `velocity` as a **`Vector2` of absolute per-axis values**, unlike v8's scalar speed; `handleDrag` destructures `velocity: [, vy]`. `direction` is `Math.sign(delta)` in screen coordinates, so `direction > 0` means dragging down (the d.ts comment claiming otherwise is wrong).

## Build pipeline

Two PostCSS configs, deliberately:
- [postcss.config.js](postcss.config.js) — docs site only: Tailwind v4, `postcss-import-svg` (for `svg-load()` in `docs/StickyNugget.module.css`), autoprefixer.
- [config/postcss/postcss.config.js](config/postcss/postcss.config.js) — the published `dist/style.css`: `postcss-custom-properties-fallback` + `postcss-preset-env`, fed from `defaults.json`.

They are separate because `postcss-preset-env` is pinned at v6 (2019) and would mangle Tailwind v4's modern output. Note that preset-env v6 predates `:is()` and cannot lower it, so `src/style.css` writes those selectors out in full rather than relying on any selector transform.

The library bundles with [tsup](tsup.config.ts) using [tsconfig.build.json](tsconfig.build.json), which overrides the base config's `target: es5` and `jsx: react-jsx` (both wrong for the published bundle). It replaced microbundle, which depended on `next/babel` via a `.babelrc` to strip TypeScript — that broke on Next 16 and forced Next off Turbopack.

Dev-only `console.*` calls in `src/` are guarded by `process.env.NODE_ENV !== 'production'` so esbuild dead-code-eliminates them; there is no longer a Babel plugin doing it.

## Conventions

- Prettier: no semicolons, single quotes. Husky + lint-staged run eslint --fix and prettier on commit. Prettier is deliberately still on v2 — v3 changes `trailingComma` to `all` and would reformat the whole repo.
- `tsconfig.json` is `strict: false` and is **managed by Next** (it rewrites `moduleResolution`, `jsx`, `incremental` on build). Put library-build settings in `tsconfig.build.json`, not here.
- Public API surface is `src/types.ts` (`Props`, `RefHandles`, `SpringEvent`) re-exported from `src/index.tsx` as `BottomSheetProps` / `BottomSheetRef`. Prop changes need matching README updates — the README is the API reference.
- Versioning is manual (`npm version` + `prepublishOnly` → `build:dist`); there is no release automation.
- The library is MIT and derives from earlier work by Cody Olsen — [LICENSE](LICENSE) carries both copyright lines and must keep doing so.
