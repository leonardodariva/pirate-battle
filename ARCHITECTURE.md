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
snapshot (`forward`, `turnLeft`, and `turnRight`). It also queues the edge of a
`Space`, `Q`, or `E` press until one simulation step consumes it. This prevents
a held key from becoming a new shot on every fixed update. Input does not mutate
game state.
This makes simultaneous input possible and lets future touch controls produce
the same snapshot without changing movement logic. Key state is cleared on
window blur and all listeners are removed when gameplay unmounts.

## Current collision boundary

The player is clamped to the arena using a configured circular boundary radius.
This is intentionally conservative and predictable. Island collision and more
specific collision shapes can be introduced later where needed.

## Island collision

The first island is assembled from a `3 x 3` group of official 64-pixel tiles.
Its logical collision area is an inset rectangle so the irregular transparent
edge does not feel like an invisible wall. Player collision uses a circle versus
rectangle test and rejects movement into the island while preserving rotation.
The configured position leaves enough navigable water between the island and
all four arena boundaries for the player's collision circle.

The player uses a conservative radius for arena boundaries. Island contact uses
three smaller circles along the ship's rotated forward axis, approximating its
long, narrow hull as a capsule without requiring polygon collision. Rotation is
accepted only when the rotated collision circles remain outside the island.

Movement resolves the horizontal and vertical axes separately, so a blocked
component stops while the other can continue and slide the ship along the
obstacle. This avoids diagonal contact locking all movement.

Projectiles use the same helper with a smaller configured radius and are removed
when they touch the island. At the current fixed step and projectile speeds this
discrete test is sufficient; swept collision would be needed for much faster or
smaller projectiles.

## Front cannon and projectiles

The simulation owns projectile position, direction, speed, damage, remaining
lifetime, and owner. A front-cannon request only creates a projectile when its
configured cooldown is ready. Projectiles move during fixed simulation updates
and are removed when their lifetime expires or they leave the logical arena.

PixiJS keeps a sprite map keyed by projectile id. Rendering creates and removes
sprites to mirror the simulation, but it does not decide when a shot is allowed
or how it moves. The projectile uses the official `cannon_ball.png` asset.

Left and right broadsides have independent cooldowns. Each creates three
projectiles from evenly spaced points along the ship, all traveling parallel to
the selected side. The spacing and weapon balance remain centralized in game
configuration.

## Chaser enemy

The first deterministic enemy is a Chaser rendered with the official
`ship_2.png` asset. `EnemySystem` owns its pure simulation rule: calculate the
desired heading with `atan2`, normalize the shortest angular difference, limit
turning by configured radians per second, and then move forward using the fixed
timestep. PixiJS mirrors enemies by stable id and does not implement AI rules.

The Chaser uses its configured collision circle against each island's inset
rectangle. Horizontal and vertical movement are resolved separately, matching
the player's predictable sliding behavior and preventing enemies from crossing
land.

Before choosing its heading, the Chaser checks whether the straight segment to
the player intersects an island expanded by the enemy radius. If blocked, it
builds a small deterministic set of one- and two-corner routes around that
rectangle, rejects routes whose segments cross land, and follows the shortest
valid route. Once the direct segment is clear, it resumes pursuing the player.
This is deliberately simpler than A*: it fits the current sparse arena but is
not intended for complex maps with many tightly packed obstacles.

## Spawn system

`SpawnSystem` is a pure rule layer that decides when and where a new enemy is
created. A match starts with a Chaser, and after the configured interval it
creates a Shooter. This guarantees that both required enemy behaviours appear
in a normal match. Later spawns follow the repeatable sequence Chaser, Chaser,
Shooter; it provides a two-to-one weighting without unseeded random values,
which keeps tests and bug reports reproducible.

Every candidate comes from a configured list around the arena and is accepted
only if its collision circle is inside the arena, outside island collision
bounds, and at least the configured distance from the player. The state stores
the spawn timer, the number of enemies already spawned, and the next stable id.
It lives in `GameState`, rather than PixiJS, so rendering cannot create an
invalid enemy. A future seeded random selection can replace the candidate order
if a larger arena needs more variety.

## Shooter enemy

The deterministic Shooter uses the official red `ship_3.png` asset. Outside
its configured attack range it uses the same island-aware navigation as the
Chaser. Inside range, it stops translating, rotates toward the player, and
fires only when the angular error is within a configured tolerance and its
fixed-timestep cooldown is ready.

An island blocking the direct segment prevents firing even when the player is
numerically within range, so the Shooter first navigates to regain line of
sight. Enemy shots use the shared projectile state with `owner: "enemy"` and
are removed on their first collision with the player's capsule. A shot emitted
by a Shooter defeated during the same simulation update is discarded.

The first Shooter is currently deterministic for development and gameplay
validation. Periodic spawn selection remains the next milestone.

## Chaser contact damage

`CombatSystem` checks the Chaser circle against the three circles approximating
the player's hull. On contact it applies configured damage and removes the
Chaser in the same simulation update, guaranteeing that contact damage happens
once. The score is preserved because a Chaser that dies by collision awards no
point.

Player projectiles are removed on their first enemy hit. Damage is applied to a
copied enemy state, and an enemy whose health reaches zero is removed and awards
one point. Projectile resolution runs before Chaser contact resolution in the
same fixed update, so a lethal shot can prevent contact damage.

PixiJS draws health bars above the player and enemies from simulation health.
The bars use the official frame and fill assets, with a mask clipping the atlas-
documented fill rectangle to the current health ratio. They never decide damage
or entity removal. Player death and match completion remain later milestones.

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

Test mode installs a `window.__GAME_TEST__` bridge. Playwright uses real keyboard
events and production rules; the bridge returns state copies and can place a
known player or Chaser for deterministic collision and combat setup. It does
not invoke movement, damage, collision, or force outcomes. Cleanup removes the
bridge with the rest of the game runtime. Vite eliminates it from normal
production builds.
