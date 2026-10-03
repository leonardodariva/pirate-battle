# Architecture

## Current boundary

React owns navigation and semantic interface elements. PixiJS owns the arena
canvas and all objects rendered inside it. Per-frame simulation state will not
be stored in React.

`GameCanvas` creates a PixiJS `Application` when mounted and destroys it when
unmounted. Its disposal guard handles React Strict Mode's development lifecycle
without leaving a second canvas or renderer active.

## Simulation and fixed timestep

`GameLoop` receives the variable time reported by the PixiJS ticker, stores it
in an accumulator, and advances the simulation in fixed `1 / 60` second steps.
Movement speed is therefore expressed in logical units per second rather than
pixels per frame. A frame delta cap avoids a long update spiral after a stall.

The current player update is a deterministic TypeScript function: the same
state, input, delta, and configuration produce the same next state. PixiJS reads
the resulting state but does not define movement rules.

## Coordinate system and resize

The simulation uses a fixed logical arena of `1280 x 720` units. The PixiJS
world container is scaled uniformly and centered inside the available canvas.
Window size and device pixel density can therefore change without changing
positions, speeds, boundaries, or other gameplay rules. Unused space is
letterboxed instead of stretching or cropping the arena.

## Input

`KeyboardInput` stores currently pressed gameplay keys and exposes a small input
snapshot (`forward`, `turnLeft`, and `turnRight`). It does not mutate game state.
This makes simultaneous input possible and lets future touch controls produce
the same snapshot without changing movement logic. Key state is cleared on
window blur and all listeners are removed when gameplay unmounts.

## Current collision boundary

The player is clamped to the arena using a configured circular boundary radius.
This is intentionally conservative and predictable. Island collision and more
specific collision shapes belong to a later milestone.

## Asset strategy

The official challenge assets remain in the repository-level `assets/` folder.
The first scene loads `tile_73.png` for the repeating water surface and
`ship_5.png` for the player through PixiJS `Assets`. This cache avoids fetching
the same textures when the scene mounts again. React exposes loading progress,
failure, and retry while PixiJS owns the rendered textures.

Individual PNGs keep this first two-texture milestone easy to follow. The UI
atlas will become preferable when a later milestone needs many HUD and control
textures.

## Unit testing

Vitest covers the framework-independent rules: fixed-step accumulation, long
frame protection, forward movement, rotation, simultaneous commands, arena
boundaries, and conflicting turn input. PixiJS internals are not unit tested.

Vitest is restricted to `src/**/*.test.ts`; Playwright owns the separate
`tests/e2e/**/*.spec.ts` suite. This prevents one test runner from trying to
execute the other runner's files.

## End-to-end testing

Playwright starts Vite in `test` mode and drives a real Chromium browser. The
initial suite covers match start, asset completion, a single PixiJS canvas,
keyboard movement and rotation, arena boundaries, resize stability, and clean
scene recreation.

Test mode installs a read-only `window.__GAME_TEST__` bridge. Playwright still
uses real keyboard events and the production movement rules; the bridge only
returns a copy of the resulting logical state so assertions do not depend on
fragile pixel comparisons. Cleanup removes the bridge with the rest of the game
runtime. Vite eliminates it from normal production builds.
