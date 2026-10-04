# Pirate Battle

A browser-based 2D top-down naval shooter created for the Jungle Gaming
Frontend Game Developer challenge. Sail around an island, fire three weapon
types, fight Chaser and Shooter enemies, and submit completed matches to a
fully mocked REST API.

The original challenge specification is available in the
[Jungle Gaming repository](https://github.com/junglegaming/game-developer-challenge).

## Stack

- React 19 for menus, forms, HUD, dialogs, and accessible game information.
- TypeScript in strict mode for simulation, contracts, and application code.
- PixiJS 8 for the arena, ships, projectiles, island, and health bars.
- TanStack Query for remote cache, mutations, invalidation, and retries.
- Axios as the centralized HTTP client.
- MSW as the browser REST backend.
- Vitest for pure game and data rules.
- Playwright for desktop and mobile end-to-end flows.

## Requirements and setup

- Node.js 22 or newer.
- npm 10 or newer.

```bash
npm ci
npm run dev
```

Open the local address printed by Vite. No environment variables or external
backend are required.

## Commands

```bash
npm run dev          # development server
npm run build        # strict TypeScript check and production build
npm run preview      # preview the production build
npm run lint         # static analysis
npm run typecheck    # TypeScript validation
npm run test:unit    # pure logic tests
npm run test:e2e     # Playwright desktop and mobile tests
npm run test:e2e:ui  # interactive Playwright runner
```

The HTML Playwright report is written to `reports/playwright/`.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move and steer | `W`/`↑`, `A`/`D`, `←`/`→` | Directional joystick |
| Front cannon | `Space` | Center weapon button |
| Left broadside | `Q` | Left weapon button |
| Right broadside | `E` | Right weapon button |
| Pause or resume | `Esc` | Pause/Continue button |

Mobile gameplay targets landscape orientation. The joystick direction becomes
the desired ship heading, while its distance from the center controls forward
power. Movement and a weapon can be held by separate pointers.

## Gameplay configuration

Options are persisted locally and copied into an immutable snapshot when Play
is selected:

- Match duration: 60–180 seconds; default 120.
- Enemy spawn interval: 1–20 seconds; default 5.

Changing Options never changes a match already in progress. The first spawned
enemy is a Chaser and the second is a Shooter; later spawns use deterministic
weighted selection. The configured active-enemy limit protects gameplay and
rendering from unbounded growth.

## Match registration

Every match receives one `crypto.randomUUID()` identifier. A completed match is
sent to `POST /api/matches`. The mock backend stores it locally and treats
`matchId` as an idempotency key: retries return the original record instead of
creating a duplicate.

Failed submissions are saved in a separate pending queue. They survive refresh,
do not block Play, and can be retried from the result screen or main menu.
Successful registration invalidates both Ranking and Match History queries.

## Mock network scenarios

Open **Options → Mock network scenario**:

| Scenario | Behavior |
| --- | --- |
| Normal | Successful API requests with a short deterministic delay |
| Match registration network error | POST fails before the server stores it |
| Match timeout after server commit | Server stores the match, but responds after the Axios timeout |

For the timeout-after-commit demonstration:

1. Select the scenario and save Options.
2. Complete a match and wait for `Pending retry`.
3. Return to Options and select Normal.
4. Retry the pending result.
5. The original server record is returned and no duplicate is created.

**Reset mock data** removes confirmed mock matches, pending submissions, and the
selected network scenario. Gameplay options and player identity are preserved.

## Testing strategy

Unit tests target pure rules: fixed timestep, movement, rotation, collision,
combat, projectile lifetime, cooldowns, spawning, enemy behavior, config keys,
sorting, pagination, persistence, and idempotency.

Playwright uses the real game rules and inputs. A test-only `window.__GAME_TEST__`
bridge observes state and controls deterministic setup, but does not fake combat
or collision outcomes. Critical coverage includes lifecycle cleanup, weapons,
islands, Chaser/Shooter behavior, pause, results, mobile multi-touch, Ranking,
History, pending retries, and timeout-after-commit idempotency.

## Architecture

The continuously changing simulation is plain TypeScript and never lives in
React state. PixiJS renders simulation snapshots; React receives a throttled
semantic summary for the HUD and dialogs. Input adapters translate keyboard and
Pointer Events into the same input state.

The Pixi ticker feeds a fixed-step accumulator at 60 simulation updates per
second. Logical arena coordinates remain `1280 × 720` while rendering scales and
letterboxes to the available canvas. See [ARCHITECTURE.md](ARCHITECTURE.md) for
the detailed lifecycle, collision, persistence, and API decisions.

## Deployment

Build command:

```bash
npm run build
```

Publish directory:

```text
dist
```

The project is suitable for Vercel, Netlify, or Cloudflare Pages. Configure SPA
fallbacks to serve `index.html` on direct navigation. `mockServiceWorker.js` is
included in `public/` and therefore runs in the published build.

## Known limitations

- Only the two most important registration-failure scenarios are user-selectable;
  empty/error/variable-latency query scenarios are not exposed in the UI.
- Visual effects and sound are intentionally limited in favor of gameplay rules.
- The initial JavaScript bundle produces Vite's 500 kB warning; gzip output is
  around 200 kB and future work could lazy-load PixiJS and secondary screens.
- Performance evidence is a short smoke profile rather than a full three-minute
  session on multiple mobile devices.
- Mock backend data is browser-local and is intentionally not shared across
  devices or browsers.

## Project status

The gameplay loop, responsive desktop/mobile controls, match lifecycle,
Ranking, History, idempotent registration, pending recovery, unit tests, and E2E
tests are implemented. Public deployment details should be added here after the
repository and hosting project are created.
