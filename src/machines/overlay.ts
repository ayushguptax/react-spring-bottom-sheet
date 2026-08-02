import { assign, fromPromise, setup } from 'xstate'

// This is the root machine, composing all the other machines and is the brain of the bottom sheet

export type OverlayContext = {
  initialState: 'OPEN' | 'CLOSED'
  y?: number
  velocity?: number
  snapSource?: 'dragging' | 'custom' | string
}

export type OverlayEvent =
  | { type: 'OPEN' }
  | {
      type: 'SNAP'
      payload: {
        y: number
        velocity: number
        source: 'dragging' | 'custom' | string
      }
    }
  | { type: 'CLOSE' }
  | { type: 'DRAG' }
  | { type: 'RESIZE' }

export type OverlayInput = { initialState: 'OPEN' | 'CLOSED' }

/** Input handed to the actors that animate to a snap point. */
export type SnapInput = { y: number; velocity: number }
/** Input handed to the actors that report which snap source is in play. */
export type SourceInput = { source: 'dragging' | 'custom' | string }

function sleep(ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Consumes the event so the root `CLOSE` handler doesn't fire. A targetless
// transition still counts as handling the event, which is the v5 equivalent of
// v4's `CLOSE: undefined`.
const ignore = { actions: [] } as const

const cancelOpen = {
  CLOSE: { target: '#overlay.closing', actions: 'onOpenCancel' },
} as const
const openToDrag = {
  DRAG: { target: '#overlay.dragging', actions: 'onOpenEnd' },
} as const
const openToResize = {
  RESIZE: { target: '#overlay.resizing', actions: 'onOpenEnd' },
} as const

// Paste the machine into https://stately.ai/viz to make sense of what's going on in here ;)
//
// The actor and action implementations below are placeholders so the machine can
// be visualized on its own. The real ones are injected with `.provide()` in
// BottomSheet.tsx — change choreography here, change behaviour there.
export const overlayMachine = setup({
  types: {
    context: {} as OverlayContext,
    events: {} as OverlayEvent,
    input: {} as OverlayInput,
  },
  actors: {
    onOpenStart: fromPromise(async () => {
      await sleep()
    }),
    onSnapStart: fromPromise(async (_: { input: SourceInput }) => {
      await sleep()
    }),
    onCloseStart: fromPromise(async () => {
      await sleep()
    }),
    onResizeStart: fromPromise(async () => {
      await sleep()
    }),
    onOpenEnd: fromPromise(async () => {
      await sleep()
    }),
    onSnapEnd: fromPromise(async (_: { input: SourceInput }) => {
      await sleep()
    }),
    onCloseEnd: fromPromise(async () => {
      await sleep()
    }),
    onResizeEnd: fromPromise(async () => {
      await sleep()
    }),
    // Renders the overlay in the open state but with opacity 0. Doing this solves two problems:
    // on Android focusing an input element will trigger the softkeyboard to show up, which will change the viewport height
    // on iOS the focus event will break the view by triggering a scrollIntoView event if focus happens while the overlay is below the viewport and body got overflow:hidden
    // by rendering things with opacity 0 we ensure keyboards and scrollIntoView all happen in a way that match up with what the sheet will look like.
    // we can then move it to the opening position below the viewport, and animate it into view without worrying about height changes or scrolling overflow:hidden events
    renderVisuallyHidden: fromPromise(async () => {
      await sleep()
    }),
    // Activates focus traps, scroll locks and more, this will sometimes trigger soft keyboards and scrollIntoView
    activate: fromPromise(async () => {
      await sleep()
    }),
    deactivate: fromPromise(async () => {
      await sleep()
    }),
    openSmoothly: fromPromise(async () => {
      await sleep()
    }),
    openImmediately: fromPromise(async () => {
      await sleep()
    }),
    snapSmoothly: fromPromise(async (_: { input: SnapInput }) => {
      await sleep()
    }),
    resizeSmoothly: fromPromise(async () => {
      await sleep()
    }),
    closeSmoothly: fromPromise(async () => {
      await sleep()
    }),
  },
  actions: {
    onOpenCancel: () => {},
    onSnapCancel: () => {},
    onResizeCancel: () => {},
    onCloseCancel: () => {},
    onOpenEnd: () => {},
    onSnapEnd: () => {},
    onResizeEnd: () => {},
  },
  guards: {
    initiallyOpen: ({ context }) => context.initialState === 'OPEN',
    initiallyClosed: ({ context }) => context.initialState === 'CLOSED',
  },
}).createMachine({
  id: 'overlay',
  initial: 'closed',
  context: ({ input }) => ({ initialState: input.initialState }),
  states: {
    // the overlay usually starts in the closed position
    closed: { on: { OPEN: 'opening', CLOSE: ignore } },
    opening: {
      initial: 'start',
      states: {
        // Used to fire off the springStart event
        start: {
          invoke: {
            src: 'onOpenStart',
            onDone: 'transition',
          },
        },
        // Decide how to transition to the open state based on what the initialState is
        transition: {
          always: [
            { target: 'immediately', guard: 'initiallyOpen' },
            { target: 'smoothly', guard: 'initiallyClosed' },
          ],
        },
        // Fast enter animation, sheet is open by default
        immediately: {
          initial: 'open',
          states: {
            open: {
              invoke: { src: 'openImmediately', onDone: 'activating' },
            },
            activating: {
              invoke: { src: 'activate', onDone: '#overlay.opening.end' },
              on: { ...openToDrag, ...openToResize },
            },
          },
        },
        smoothly: {
          initial: 'visuallyHidden',
          states: {
            visuallyHidden: {
              invoke: { src: 'renderVisuallyHidden', onDone: 'activating' },
            },
            activating: {
              invoke: { src: 'activate', onDone: 'open' },
            },
            // Animates from the bottom
            open: {
              invoke: { src: 'openSmoothly', onDone: '#overlay.opening.end' },
              on: { ...openToDrag, ...openToResize },
            },
          },
        },
        // Used to fire off the springEnd event
        end: {
          invoke: { src: 'onOpenEnd', onDone: 'done' },
          on: { CLOSE: '#overlay.closing', DRAG: '#overlay.dragging' },
        },
        // And finally we're ready to transition to open
        done: {
          type: 'final',
        },
      },
      on: { ...cancelOpen },
      onDone: 'open',
    },
    open: {
      on: { DRAG: '#overlay.dragging', SNAP: 'snapping', RESIZE: 'resizing' },
    },
    // dragging responds to user gestures, which may interrupt the opening state, closing state or snapping
    // when interrupting an opening event, it fires onSpringEnd(OPEN) before onSpringStart(DRAG)
    // when interrupting a closing event, it fires onSpringCancel(CLOSE) before onSpringStart(DRAG)
    // when interrupting a dragging event, it fires onSpringCancel(SNAP) before onSpringStart(DRAG)
    dragging: {
      on: { SNAP: 'snapping' },
    },
    // snapping happens whenever transitioning to a new snap point, often after dragging
    snapping: {
      initial: 'start',
      states: {
        start: {
          entry: assign(({ event }) => {
            if (event.type !== 'SNAP') return {} // only handle SNAP events
            return {
              y: event.payload.y,
              velocity: event.payload.velocity,
              snapSource: event.payload.source ?? 'custom',
            }
          }),
          invoke: {
            src: 'onSnapStart',
            input: ({ context }) => ({ source: context.snapSource }),
            onDone: 'snappingSmoothly',
          },
        },
        snappingSmoothly: {
          invoke: {
            src: 'snapSmoothly',
            input: ({ context }) => ({
              y: context.y,
              velocity: context.velocity,
            }),
            onDone: 'end',
          },
        },
        end: {
          invoke: {
            src: 'onSnapEnd',
            input: ({ context }) => ({ source: context.snapSource }),
            onDone: 'done',
          },
          on: {
            RESIZE: '#overlay.resizing',
            SNAP: '#overlay.snapping',
            CLOSE: '#overlay.closing',
            DRAG: '#overlay.dragging',
          },
        },
        done: { type: 'final' },
      },
      on: {
        SNAP: { target: 'snapping', actions: 'onSnapEnd' },
        RESIZE: { target: '#overlay.resizing', actions: 'onSnapCancel' },
        DRAG: { target: '#overlay.dragging', actions: 'onSnapCancel' },
        CLOSE: { target: '#overlay.closing', actions: 'onSnapCancel' },
      },
      onDone: 'open',
    },
    resizing: {
      initial: 'start',
      states: {
        start: {
          invoke: {
            src: 'onResizeStart',
            onDone: 'resizingSmoothly',
          },
        },
        resizingSmoothly: {
          invoke: { src: 'resizeSmoothly', onDone: 'end' },
        },
        end: {
          invoke: { src: 'onResizeEnd', onDone: 'done' },
          on: {
            SNAP: '#overlay.snapping',
            CLOSE: '#overlay.closing',
            DRAG: '#overlay.dragging',
          },
        },
        done: { type: 'final' },
      },
      on: {
        RESIZE: { target: 'resizing', actions: 'onResizeEnd' },
        SNAP: { target: 'snapping', actions: 'onResizeCancel' },
        DRAG: { target: '#overlay.dragging', actions: 'onResizeCancel' },
        CLOSE: { target: '#overlay.closing', actions: 'onResizeCancel' },
      },
      onDone: 'open',
    },
    closing: {
      initial: 'start',
      states: {
        start: {
          invoke: {
            src: 'onCloseStart',
            onDone: 'deactivating',
          },
          on: { OPEN: { target: '#overlay.open', actions: 'onCloseCancel' } },
        },
        deactivating: {
          invoke: { src: 'deactivate', onDone: 'closingSmoothly' },
        },
        closingSmoothly: {
          invoke: { src: 'closeSmoothly', onDone: 'end' },
        },
        end: {
          invoke: { src: 'onCloseEnd', onDone: 'done' },
          on: {
            OPEN: { target: '#overlay.opening', actions: 'onCloseCancel' },
          },
        },
        done: { type: 'final' },
      },
      on: {
        CLOSE: ignore,
        OPEN: { target: '#overlay.opening', actions: 'onCloseCancel' },
      },
      onDone: 'closed',
    },
  },
  on: {
    CLOSE: '#overlay.closing',
  },
})
