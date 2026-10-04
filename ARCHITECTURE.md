# Architecture

## Current boundary

React owns navigation and semantic interface elements. PixiJS owns the arena
canvas and all objects rendered inside it. Per-frame simulation state will not
be stored in React.

The menu, Options, and Controls guide are regular React screens. The Controls
guide documents the same keyboard and touch mappings used by the input adapters
and uses the provided Jungle Gaming control icons. Keeping instructions outside
the PixiJS canvas preserves semantic headings, lists, keyboard navigation, and
responsive layout without coupling documentation UI to the simulation.

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

## Match lifecycle and React HUD

`GameState` owns the match status, elapsed active time, remaining time, and end
reason. The configured 120-second session ends with `timeout`; reaching zero
health ends it with `player_destroyed`. Once ended, the update function returns
the same frozen state, and the PixiJS ticker no longer advances the `GameLoop`.
This stops movement, attacks, damage, cooldowns, scoring, and spawning at their
source instead of relying on a visual overlay to block the player.

PixiJS publishes a small UI snapshot to React every 250 milliseconds and
immediately when match status changes. React uses that snapshot for the semantic
health, score, and time HUD and the result dialog. The continuous entity state
remains outside React, avoiding 60 React renders per second. `Play again`
remounts `GameCanvas`, so the normal lifecycle cleanup destroys the old runtime
before a fresh match is created.

## Options, persistence, and match snapshots

The editable options are limited to session duration (60–180 seconds) and enemy
spawn interval (1–20 seconds). Pure validation lives beside the typed game
configuration, while JSON serialization and defensive parsing live in the
storage layer. Missing, malformed, incorrectly shaped, or out-of-range stored
data falls back to documented defaults rather than breaking application startup.

Selecting Play creates a new `GameConfig` snapshot containing the current
options and passes that object to `GameCanvas`. The simulation, test bridge, and
all systems use this snapshot instead of reading local storage or mutable React
state. Therefore, changing persisted options cannot alter a match already in
progress; Play Again creates a new snapshot from the latest options.

## Ranking and match-history data flow

The Ranking screen owns only local pagination UI. TanStack Query owns remote
loading, error, cache, retry, and background-fetch state under the key
`["ranking", configKey, page]`. Its query function delegates HTTP work to the
central Axios client instead of calling Axios from React components. The query
signal is passed to Axios so navigation or a newer query can cancel obsolete
requests.

`configKey` is a deterministic, versioned representation of the settings that
affect match comparability. The current form is
`v1:duration=<seconds>:spawn=<seconds>`. The MSW ranking handler filters records
by that key, orders them by descending score with deterministic tie breakers,
and returns a typed paginated response.

Match History follows the same boundary under the key
`["history", playerId, page]`, but filters by the locally persisted player
identity and orders completed matches from newest to oldest. Each history row
contains the score, effective duration, end reason, completion date, and the
configuration snapshot used by that match. The browser creates the player
identity once with `crypto.randomUUID()` and reuses it after refresh.

## Match registration and idempotency

Play creates one `matchId` with `crypto.randomUUID()`. When the simulation first
reports an ended state, React creates an immutable `MatchRecord` from that id,
the player identity, final score and duration, end reason, completion date, and
the match configuration snapshot. A TanStack Query mutation sends the record
through the central Axios client to `POST /api/matches` and invalidates both
Ranking and Match History after confirmation.

The mock store persists confirmed records in local storage. Registration checks
`matchId` before inserting: the first request returns `201` and a retry returns
the original record with `200`, leaving only one stored match. This is the
idempotency foundation required for safe retries.

When Axios reports a failed POST, the mutation stores the same immutable record
in a separate pending queue. That queue is loaded during application startup,
does not block Play, survives refresh, and exposes Retry on both the result and
main-menu screens. Confirmation removes only the matching `matchId`, then
invalidates Ranking and Match History. A minimal persisted `post-network-error`
mock scenario exists to verify this path; the complete scenario selector and
additional query scenarios remain deferred.

The `post-timeout-after-commit` scenario deliberately writes the record before
delaying its response beyond the Axios timeout. The client therefore queues the
apparently failed record. Retrying under a healthy connection sends the same
`matchId`; the idempotent store returns the already committed record and the
pending copy is removed without creating a duplicate.

MSW starts before React mounts and uses the generated worker from `public/`, so
the same REST boundary is present in development, Playwright, preview, and the
eventual static deployment. A small HTML bootstrap status remains visible while
the worker initializes. This milestone implements the normal ranking and history scenarios;
scenario selection, persisted mock records, failures, and variable latency are
intentionally deferred.

## Pause lifecycle

Pause is represented by `GameState.status === "paused"`, not by a visual-only
overlay. `updateGameState` accepts updates only while running, and the PixiJS
ticker stops advancing the fixed-step accumulator while paused. Consequently,
time, movement, projectiles, cooldowns, enemy AI, damage, score, and spawning
all freeze together.

`Escape` requests a manual toggle through `KeyboardInput`. Window blur and a
hidden document request an automatic pause, but focus and visibility recovery
never resume the game. Resuming requires `Escape` or the React Continue button.
Both transitions reset the loop accumulator and clear held and queued input,
preventing a long frame, stuck movement key, or delayed cannon shot after the
pause. Runtime listeners are removed with the PixiJS scene lifecycle.

## Coordinate system and resize

The simulation uses a fixed logical arena of `1280 x 720` units. The PixiJS
world container is scaled uniformly and centered inside the available canvas.
Window size and device pixel density can therefore change without changing
positions, speeds, boundaries, or other gameplay rules. Unused space is
letterboxed instead of stretching or cropping the arena.

## Input

`InputState` owns the current input snapshot while input adapters only translate
their events into actions. `KeyboardInput` maps keyboard events and the React
touch controls map Pointer Events to the same actions. Each press carries a
source id, so a keyboard key and a touch pointer can hold the same action without
one source accidentally releasing the other.

Movement and rotation remain active while held. `Space`, `Q`, `E`, and their
touch equivalents queue only the edge of a press until one simulation step
consumes it. This prevents a held button from becoming a new shot on every fixed
update. Multiple pointer ids allow movement and firing with different fingers at
the same time. Input never mutates game state directly; it only produces the
snapshot consumed by `updateGameState`.

The mobile movement control is a proportional virtual joystick with a central
dead zone. Drag distance becomes a `0..1` movement amount and the stick angle
becomes the desired ship heading, so every direction—including downward—is
available. The simulation rotates toward that heading at the configured ship
rotation speed instead of snapping instantly. Forward speed is reduced while
the ship faces away from the requested heading, preventing it from initially
travelling in the wrong direction during a 180-degree turn. The three weapon
buttons use the official Jungle Gaming control assets. Browser callouts, text
selection, scrolling, and the context menu are disabled only inside the touch
control area so a sustained press behaves like a game controller instead of a
webpage gesture.

Held and queued input is cleared on window blur, pause, and runtime teardown.
Keyboard listeners are removed and active touch access is disconnected when the
gameplay component unmounts.

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
bounds, far enough from the player, and not too close to another active enemy.
The state stores the spawn timer, the number of enemies already spawned, and
the next stable id.
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
