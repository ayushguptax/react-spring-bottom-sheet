<p align="center">
  <img
    src="https://raw.githubusercontent.com/ayushguptax/react-spring-bottom-sheet/main/public/readme.svg"
    alt="React Spring Bottom Sheet — Accessible, Delightful, and Performant"
    width="820"
  />
</p>

<p align="center">
  <strong>Accessible, delightful, and performant bottom sheet for React.</strong><br />
  Built on <a href="https://github.com/pmndrs/react-spring">@react-spring/web</a> and <a href="https://github.com/pmndrs/use-gesture">@use-gesture/react</a>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-spring-modal-sheet"><img alt="npm version" src="https://img.shields.io/npm/v/react-spring-modal-sheet.svg?style=flat-square" /></a>
  <a href="https://npm-stat.com/charts.html?package=react-spring-modal-sheet"><img alt="npm downloads" src="https://img.shields.io/npm/dm/react-spring-modal-sheet.svg?style=flat-square" /></a>
  <a href="https://unpkg.com/react-spring-modal-sheet/dist/"><img alt="gzip size" src="https://img.badgesize.io/https://unpkg.com/react-spring-modal-sheet/dist/index.es.js?compression=gzip&label=gzip&style=flat-square" /></a>
  <a href="https://unpkg.com/react-spring-modal-sheet/dist/"><img alt="minified size" src="https://img.badgesize.io/https://unpkg.com/react-spring-modal-sheet/dist/index.es.js?label=size&style=flat-square" /></a>
  <img alt="module formats" src="https://img.shields.io/badge/modules-cjs%20%7C%20esm-green.svg?style=flat-square" />
  <img alt="react versions" src="https://img.shields.io/badge/react-16.14%20%7C%2017%20%7C%2018%20%7C%2019-149eca.svg?style=flat-square" />
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/npm/l/react-spring-modal-sheet.svg?style=flat-square" /></a>
</p>

---

> [!NOTE]
> This package was previously published as `@percivel/react-spring-bottom-sheet`. Development
> continues here under the unscoped name. The old package is deprecated and frozen at `3.4.5` —
> it keeps installing and working, but receives no further updates.
>
> The component API is unchanged, so migrating is a rename of your imports:
>
> ```diff
> -import { BottomSheet } from '@percivel/react-spring-bottom-sheet'
> -import '@percivel/react-spring-bottom-sheet/dist/style.css'
> +import { BottomSheet } from 'react-spring-modal-sheet'
> +import 'react-spring-modal-sheet/dist/style.css'
> ```

**`4.0.0` is a full dependency modernization.** Every runtime dependency was on a deprecated or
unmaintained major; all of them were replaced or upgraded. The headline result is that the package
**installs cleanly against React 19 with no `--legacy-peer-deps`**, and the bundle got smaller
(7.0 kB → 6.0 kB gzipped) along the way.

<details>
<summary><strong>What changed under the hood</strong></summary>

| Was                            | Now                            |
| ------------------------------ | ------------------------------ |
| `react-spring` 8               | `@react-spring/web` 10         |
| `react-use-gesture` 9          | `@use-gesture/react` 10        |
| `xstate` 4 + `@xstate/react` 1 | `xstate` 5 + `@xstate/react` 6 |
| `body-scroll-lock`             | `body-scroll-lock-upgrade`     |
| `focus-trap` 6                 | `focus-trap` 8                 |
| `@reach/portal`                | a local portal component       |
| `resize-observer-polyfill`     | native `ResizeObserver`        |
| `microbundle`                  | `tsup`                         |

`@xstate/react` 1 peer-capped React at 17, which is what forced the `--legacy-peer-deps` install
on React 18 and 19.

Two breaking changes come out of this, both at the build level rather than in your code:

- **The supported browser floor moved up** to Chrome 64, Safari 14.1, iOS 14.5, Firefox 69 and
  Edge 79. Native `ResizeObserver` sets the real floor; the previously advertised Chrome 49 /
  Safari 9.1 range could not actually have worked.
- **`dist/index.modern.js` is no longer emitted.** `microbundle` produced it, but no
  `package.json` field ever referenced it. `main`, `module`, `jsnext:main` and `types` are all
  still satisfied, and `dist/index.d.mts` is new.

If you import `defaults.json` in your PostCSS config, update that path to the new package name too.

</details>

---

## ✨ Highlights

- **♿️ Accessible by default** — ARIA dialog semantics, focus trapping, and `aria-hidden` on the rest of the page.
- **🪄 Interruptible animations** — open, close, drag and snap can all interrupt each other mid-flight.
- **🎨 Styled entirely from CSS** — every animated value is a CSS custom property, so you can restyle without touching JS.
- **🪜 Flexible snap points** — computed from your content, the viewport, or anything you like.
- **📱 Built for touch** — momentum-aware dragging, rubberbanding, and iOS scroll-locking.
- **🤯 Minimal re-renders** — animation runs outside React's render cycle.
- **⌨️ TypeScript first** — types ship with the package.

<details>
<summary>📚 <strong>Table of contents</strong></summary>

- [📦 Installation](#-installation)
- [🚀 Usage](#-usage)
  - [TypeScript](#typescript)
- [🎛 Props](#-props)
- [📣 Events](#-events)
- [🎯 Ref](#-ref)
- [🎨 Styling](#-styling)
- [🧪 Demos](#-demos)
- [🙏 Credits](#-credits)
- [📄 License](#-license)

</details>

---

## 📦 Installation

```sh
npm i react-spring-modal-sheet
```

Works with React 16.14, 17, 18 and 19.

---

## 🚀 Usage

```jsx
import { useState } from 'react'
import { BottomSheet } from 'react-spring-modal-sheet'
import 'react-spring-modal-sheet/dist/style.css'

export default function Example() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <BottomSheet open={open} onDismiss={() => setOpen(false)}>
        My awesome content here
      </BottomSheet>
    </>
  )
}
```

> [!IMPORTANT]
> The sheet renders **nothing at all** while `open` is `false`, so your children unmount on
> close. Make sure they behave correctly with that. Keeping a closed sheet in the DOM would
> let keyboard and screen reader users interact with it by accident, which the ARIA
> implementation is specifically designed to prevent.

### TypeScript

Types are baked in. Use `BottomSheetRef` when reaching for the imperative API:

```tsx
import { useRef } from 'react'
import { BottomSheet, type BottomSheetRef } from 'react-spring-modal-sheet'

export default function Example() {
  const sheetRef = useRef<BottomSheetRef>(null)

  return (
    <BottomSheet open ref={sheetRef}>
      <button
        onClick={() => sheetRef.current?.snapTo(({ maxHeight }) => maxHeight)}
      >
        Expand to full height
      </button>
    </BottomSheet>
  )
}
```

---

## 🎛 Props

Any prop not listed here — `className`, `style`, and so on — is spread onto the underlying
`<animated.div>`, which you can target with `[data-rsbs-root]`.

| Prop                    | Type                            | Default                   | Description                                                                                              |
| ----------------------- | ------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `open` **required**     | `boolean`                       | —                         | Controlled open state. Nothing renders while `false`.                                                    |
| `children` **required** | `ReactNode`                     | —                         | Sheet content. Needs at least 1px of height to open.                                                     |
| `onDismiss`             | `() => void`                    | —                         | User asked to close: `esc`, backdrop tap, or swipe down.                                                 |
| `snapPoints`            | `(state) => number \| number[]` | `minHeight`               | Valid heights for the sheet. Must be pure.                                                               |
| `defaultSnap`           | `number \| (state) => number`   | smallest snap point       | Position to open at.                                                                                     |
| `header`                | `ReactNode`                     | —                         | Sticky, draggable header. Same value type as `children`.                                                 |
| `footer`                | `ReactNode`                     | —                         | Sticky, draggable footer. Same value type as `children`.                                                 |
| `sibling`               | `ReactNode`                     | —                         | Rendered inside `[data-rsbs-root]` but outside the overlay.                                              |
| `initialFocusRef`       | `React.Ref \| false`            | first interactive element | What receives focus on open. `false` disables it.                                                        |
| `blocking`              | `boolean`                       | `true`                    | Focus trap + `aria-hidden` on the rest of the page.                                                      |
| `scrollLocking`         | `boolean`                       | `true`                    | Locks body scroll while open.                                                                            |
| `reserveScrollBarGap`   | `boolean`                       | value of `blocking`       | Reserve the scrollbar's width while locked, avoiding layout shift.                                       |
| `expandOnContentDrag`   | `boolean`                       | `false`                   | Let dragging the content expand the sheet. By default only the header, footer and overlay are draggable. |
| `maxHeight`             | `number`                        | `window.innerHeight`      | Override the viewport height used for snap points.                                                       |
| `skipInitialTransition` | `boolean`                       | `false`                   | Render the initial `open` state without animating in.                                                    |

<details>
<summary><strong><code>snapPoints</code></strong> — the state object</summary>

Called often, so keep it pure. Return one number or an array.

| Key            | Meaning                                                                              |
| -------------- | ------------------------------------------------------------------------------------ |
| `headerHeight` | Measured height of `header`.                                                         |
| `footerHeight` | Measured height of `footer`, if provided.                                            |
| `height`       | Current height of the sheet.                                                         |
| `minHeight`    | Smallest height that avoids a scrollbar. Equals `maxHeight` when there isn't room.   |
| `maxHeight`    | Largest available height — `window.innerHeight` / `100vh` unless `maxHeight` is set. |

```jsx
<BottomSheet
  // Let the user pick between "just tall enough" and fullscreen
  snapPoints={({ minHeight, maxHeight }) => [minHeight, maxHeight]}
/>
```

</details>

<details>
<summary><strong><code>defaultSnap</code></strong> — remembering the last position</summary>

Receives everything `snapPoints` does, plus `snapPoints` and `lastSnap`.

```jsx
<BottomSheet
  // First snap point follows the content, second is 60vh
  snapPoints={({ minHeight, maxHeight }) => [minHeight, maxHeight / 0.6]}
  // Open at the largest, unless the user already chose one
  defaultSnap={({ lastSnap, snapPoints }) =>
    lastSnap ?? Math.max(...snapPoints)
  }
/>
```

</details>

<details>
<summary><strong><code>sibling</code></strong> — rendering above the sheet</summary>

Renders as a child of `[data-rsbs-root]` but as a sibling to `[data-rsbs-backdrop]` and
`[data-rsbs-overlay]`. Use it for `position: fixed` elements that need to sit on top of the
backdrop and stay interactive in blocking mode, while still having access to the animation state.

</details>

<details>
<summary><strong><code>scrollLocking</code></strong> — and how to opt out per element</summary>

iOS Safari and some other mobile browsers prefer scrolling the page over letting you handle
touch interactions, which makes dragging feel broken when `document.body` scrolls. That's why
this is on by default.

It can be too aggressive around drag-and-drop widgets — `<input type="range" />`, mapbox-gl,
and friends. Wrap those in a container carrying `[data-body-scroll-lock-ignore]` to exempt them:

```jsx
<BottomSheet open>
  <div data-body-scroll-lock-ignore>
    <input type="range" />
  </div>
</BottomSheet>
```

</details>

---

## 📣 Events

Every handler receives a `SpringEvent`. `type` is always present; some types add a `source`.

| Prop             | Fires on                       | Notes                                                     |
| ---------------- | ------------------------------ | --------------------------------------------------------- |
| `onSpringStart`  | `OPEN` `RESIZE` `SNAP` `CLOSE` | Return a promise to delay the transition.                 |
| `onSpringCancel` | `OPEN` `CLOSE` `SNAP` `RESIZE` | A transition was interrupted and redirected.              |
| `onSpringEnd`    | `OPEN` `RESIZE` `SNAP` `CLOSE` | Also awaits promises — useful for cleanup before unmount. |

| Event type | Payload                                                | Meaning                                                                         |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `OPEN`     | —                                                      | Opening transition.                                                             |
| `CLOSE`    | —                                                      | Closing transition.                                                             |
| `SNAP`     | `{ source: 'dragging' \| 'custom' \| string }`         | Moving to a snap point. `'dragging'` after a gesture, `'custom'` from `snapTo`. |
| `RESIZE`   | `{ source: 'window' \| 'maxheightprop' \| 'element' }` | Viewport resized, `maxHeight` changed, or header/footer/content resized.        |

<details>
<summary><strong>Delaying the open transition</strong> (loading data first)</summary>

Return a promise — or use an `async` function — and the sheet waits before animating in.

```jsx
function Example() {
  const [data, setData] = useState([])

  return (
    <BottomSheet
      onSpringStart={async (event) => {
        if (event.type === 'OPEN') {
          // the bottom sheet gently waits
          const data = await fetch(/* . . . */)
          setData(data)
          // and now we can proceed
        }
      }}
    >
      {data.map(/* . . . */)}
    </BottomSheet>
  )
}
```

</details>

<details>
<summary><strong>When <code>onSpringCancel</code> fires</strong></summary>

**On `OPEN`** — the open state can be interrupted and redirected without waiting for the
transition to finish, because that's what makes it feel fluid. That happens when:

- the user swipes the sheet below the fold, triggering `onDismiss`
- the user hits `esc`, triggering `onDismiss`
- the parent sets `open` to `false` mid-animation
- a `RESIZE` happens — for example an Android soft keyboard changing the viewport height

**On `CLOSE`** — fires if the user reopens before the close finishes. It also fires when the
sheet is unmounted without time to animate out, after it has rolled back `body-scroll-lock`,
`focus-trap` and the rest.

> [!WARNING]
> A `CLOSE` cancel can arrive **after** your component unmounts. Guard any `setState` in that
> handler with your own mounted check.

</details>

<details>
<summary><strong><code>onSpringEnd</code> on <code>CLOSE</code></strong> — the last safe moment</summary>

The `yin` to `onSpringStart`'s `yang`, with the same characteristics including `async`/Promise
support for delaying a transition. On `CLOSE` it hands you the step right after the sheet has
cleaned up after itself and right before it unmounts — the place to do any work that has to
happen while it is still mounted.

</details>

<details>
<summary><strong>Reacting to a specific snap source</strong></summary>

```jsx
<BottomSheet
  onSpringStart={(event) => {
    if (event.type === 'SNAP' && event.source === 'dragging') {
      console.log('Starting a spring animation to user selected snap point')
    }
  }}
/>
```

`snapTo` can tag itself with a custom `source` so you can tell your own transitions apart:

```jsx
function Example() {
  const sheetRef = useRef(null)

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={({ minHeight, maxHeight }) => [minHeight, maxHeight]}
      onSpringEnd={(event) => {
        if (event.type === 'SNAP' && event.source === 'snap-to-bottom') {
          console.log(
            'Just finished an imperative transition to the bottom snap point'
          )
        }
      }}
    >
      <button
        onClick={() => sheetRef.current.snapTo(0, { source: 'snap-to-bottom' })}
      >
        Snap to bottom
      </button>
    </BottomSheet>
  )
}
```

</details>

---

## 🎯 Ref

| Member   | Type                                   | Description                                             |
| -------- | -------------------------------------- | ------------------------------------------------------- |
| `snapTo` | `(numberOrCallback, options?) => void` | Animate to a snap point.                                |
| `height` | `number`                               | Current height. Updated outside the React render cycle. |

<details>
<summary><strong><code>snapTo</code></strong> — usage and options</summary>

Same signature as `defaultSnap`. Pass a pixel height and the nearest snap point wins:

```js
ref.current.snapTo(200)
```

Or compute one:

```js
ref.current.snapTo(
  ({
    // Showing all the available props
    headerHeight,
    footerHeight,
    height,
    minHeight,
    maxHeight,
    snapPoints,
    lastSnap,
  }) => Math.max(...snapPoints)
)
```

An optional second argument overrides `event.source` and the spring `velocity`:

```js
ref.current.snapTo(({ snapPoints }) => Math.min(...snapPoints), {
  // Each property is optional, here showing their default values
  source: 'custom',
  velocity: 1,
})
```

</details>

<details>
<summary><strong><code>height</code></strong> — reading the live position</summary>

```jsx
export default function Example() {
  const sheetRef = useRef(null)

  return (
    <BottomSheet
      ref={sheetRef}
      onSpringStart={() => {
        console.log('Transition from:', sheetRef.current.height)
        requestAnimationFrame(() =>
          console.log('Transition to:', sheetRef.current.height)
        )
      }}
      onSpringEnd={() =>
        console.log('Finished transition to:', sheetRef.current.height)
      }
    />
  )
}
```

</details>

---

## 🎨 Styling

Every animated value is a CSS custom property, so the whole look is controllable from CSS alone.

| Variable                 | Default                      | Controls          |
| ------------------------ | ---------------------------- | ----------------- |
| `--rsbs-backdrop-bg`     | `rgba(0, 0, 0, 0.6)`         | Backdrop colour   |
| `--rsbs-bg`              | `#fff`                       | Sheet background  |
| `--rsbs-handle-bg`       | `hsla(0, 0%, 0%, 0.14)`      | Drag handle pill  |
| `--rsbs-max-w`           | `auto`                       | Max sheet width   |
| `--rsbs-ml`              | `env(safe-area-inset-left)`  | Left margin       |
| `--rsbs-mr`              | `env(safe-area-inset-right)` | Right margin      |
| `--rsbs-overlay-rounded` | `16px`                       | Top corner radius |

```css
:root {
  --rsbs-backdrop-bg: rgba(15, 23, 42, 0.7);
  --rsbs-bg: #fff;
  --rsbs-overlay-rounded: 24px;
}
```

The DOM is addressable too — `[data-rsbs-root]`, `[data-rsbs-backdrop]`, `[data-rsbs-overlay]`,
`[data-rsbs-header]`, `[data-rsbs-scroll]`, `[data-rsbs-content]`, `[data-rsbs-footer]` — plus
`[data-rsbs-state]`, which is one of `closed` `opening` `open` `closing` `dragging` `snapping`
`resizing`.

> [!NOTE]
> The sheet mounts into a `<div data-rsbs-portal>` appended to the end of `<body>`, not where
> you render it. Write global selectors rather than scoped ones.

<details>
<summary><strong>Replacing the stylesheet entirely</strong></summary>

Copy [style.css](/src/style.css) into your project and add this to `postcss.config.js`
(`npm i postcss-custom-properties-fallback`) so the default values stay available:

```js
module.exports = {
  plugins: {
    // Ensures the default variables are available
    'postcss-custom-properties-fallback': {
      importFrom: require.resolve('react-spring-modal-sheet/defaults.json'),
    },
  },
}
```

</details>

---

## 🧪 Demos

```sh
npm run dev   # http://localhost:3000
```

| Demo                                                             | Shows                                                                                                                                                                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Basic](/pages/fixtures/simple.tsx#L44-L48)                      | The minimum: `open`, `onDismiss`, and a single snap point at `minHeight`.                                                                                                                                |
| [Snap points & overflow](/pages/fixtures/scrollable.tsx#L86-L97) | Multiple snap points, open by default, not dismissable. Try resizing the window, or scrolling to the bottom and dragging.                                                                                |
| [Sticky header & footer](/pages/fixtures/sticky.tsx#L41-L61)     | `header` and `footer` — sticky _and_ draggable.                                                                                                                                                          |
| [Non-blocking](/pages/fixtures/aside.tsx#L41-L53)                | `blocking={false}`, so the page behind stays usable. Trades away the accessibility behaviours — focus locking and `aria-hidden` — that stop a screen reader or keyboard user wandering out of the sheet. |

> [!TIP]
> Test drag behaviour on a physical device. Desktop pointer emulation does not reproduce
> momentum, rubberbanding, or iOS scroll-locking faithfully.

---

## 🙏 Credits

- Play icon on frame overlays: [font-awesome](https://fontawesome.com/icons/play-circle?style=regular)
- Phone frame in the logo: [Mono Devices 1.0](https://www.figma.com/community/file/896042888090872154/Mono-Devices-1.0)
- iPhone frame wrapping the examples: [iOS 14 UI Kit for Figma](<https://www.figma.com/community/file/858143367356468985/(Variants)-iOS-%26-iPadOS-14-UI-Kit-for-Figma>)

## 📄 License

[MIT](LICENSE)
