// Types shared by the 3D engine and the React side. Kept free of any three.js import so the page's
// main bundle can use them without pulling in the lazily-loaded 3D chunk.

/**
 * How quickly scroll-driven motion catches up with the scroll position: per-second rates for an
 * exponential follow, `k = 1 - exp(-rate * dt)`. The 3D stage eases its camera/window with it
 * (stage.ts) and the HTML overlays ease the showcase's `--t` with it (Showcase.tsx), so the hero
 * copy and the window glide with the same inertia instead of one lagging the scrollbar and the
 * other snapping to it.
 */
export const VIEW_DAMPING = { normal: 4.2, reduced: 12 }

/** A page of the mock app (mirrors the desktop app's sidebar routes + the achievement overlay). */
export type PageId =
  | 'games'
  | 'idling'
  | 'favorites'
  | 'freeGames'
  | 'cardFarming'
  | 'achievementUnlocker'
  | 'autoIdle'
  | 'inventory'
  | 'achievementManager'

/**
 * Where the camera looks: `focus` is a point in the mock's 1440x900 UI space, `zoom` 1 frames the
 * whole window inside the current Frame, and `rx`/`ry` tilt the window in degrees (-rx leans the
 * top edge away from the viewer, +ry swings the right edge away).
 */
export interface Pose {
  focus: [number, number]
  zoom: number
  rx: number
  ry: number
}

/** Where (in stage-container px) the whole window sits at zoom 1. */
export interface Frame {
  x: number
  y: number
  w: number
  h: number
}

export interface DemoStats {
  cardsDropped: number
  cardsCaught: number
  achievementsUnlocked: number
  gamesIdling: number
  itemsListed: number
}
