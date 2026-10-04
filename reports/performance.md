# Performance smoke profile

## Environment

- Date: 2026-10-04
- Hardware: MacBook Pro (MacBookPro17,1), Apple M1, 8 cores, 8 GB RAM
- Browser: headless Chromium 153.0.8010.12
- Viewport: 1280 × 720
- Build: optimized Vite build with the test observation bridge enabled
- Configuration: 120-second match, enemy spawn every 5 seconds

## Frame sample

A ten-second `requestAnimationFrame` sample was captured after the PixiJS arena
and initial enemy had loaded.

| Metric | Result |
| --- | ---: |
| Frames sampled | 596 |
| Sample duration | 10.009 s |
| Average frame rate | 59.55 FPS |
| P95 frame interval | 16.80 ms |
| Entities at sample end | 3 |
| Enemies | 2 |
| Projectiles | 0 |

The smoke sample meets the 60 FPS target within normal timer and headless-browser
variation. It is a low-load sample and should not be interpreted as a complete
three-minute stress profile.

## Lifecycle sample

Five consecutive Play → Leave match cycles were executed in one browser page.
Garbage collection was requested after each leave to make the observations more
comparable.

| Cycle | Canvas in game | Canvas after leave | Heap before leave | Heap after GC |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 1 | 0 | 7.98 MB | 6.50 MB |
| 2 | 1 | 0 | 7.37 MB | 6.67 MB |
| 3 | 1 | 0 | 7.55 MB | 6.88 MB |
| 4 | 1 | 0 | 7.69 MB | 6.98 MB |
| 5 | 1 | 0 | 7.82 MB | 7.10 MB |

Every cycle removed the canvas and recreated exactly one canvas on the next
start. Heap after forced collection increased by approximately 0.60 MB across
the short run. This small increase can include browser, module, texture, and MSW
caches; the sample does not prove a leak, but a longer DevTools allocation
profile would be required before claiming memory stability.

## Limitations and follow-up

- The required three-minute entity-heavy profile was not completed.
- Headless Chromium timing does not represent all mobile GPUs.
- The test bridge adds a small amount of code to this measurement build.
- A future profile should continuously fire weapons, retain the configured
  maximum enemy population, collect P95 over three minutes, and compare heap
  snapshots by retained PixiJS object type.
