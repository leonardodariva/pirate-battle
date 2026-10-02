# Architecture

## Current boundary

React owns navigation and semantic interface elements. PixiJS owns the arena
canvas and all objects rendered inside it. Per-frame simulation state will not
be stored in React.

`GameCanvas` creates a PixiJS `Application` when mounted and destroys it when
unmounted. Its disposal guard handles React Strict Mode's development lifecycle
without leaving a second canvas or renderer active.

The scene currently has no simulation loop. A fixed-timestep loop will be added
with player movement in the next milestone.

## Asset strategy

The official challenge assets remain in the repository-level `assets/` folder.
The first scene loads `tile_73.png` for the repeating water surface and
`ship_5.png` for the player through PixiJS `Assets`. This cache avoids fetching
the same textures when the scene mounts again. React exposes loading progress,
failure, and retry while PixiJS owns the rendered textures.

Individual PNGs keep this first two-texture milestone easy to follow. The UI
atlas will become preferable when a later milestone needs many HUD and control
textures.
