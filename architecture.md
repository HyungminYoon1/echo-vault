# ECHO VAULT — 시간의 금고 architecture

## Authority and scope

Independent browser-only static GitHub Pages game at /echo-vault/. Only dist is public site output. Preserve all other repositories; no existing game code is merged. No runtime dependencies, backend, database, login, API, tracking or paid infrastructure.

## Separation

- dist/src/model.js: pure deterministic state/rules/scoring, validated bounded commands, no DOM, clock, browser globals, network or storage.
- dist/src/levels.js: authored campaign/scenario data and pure validated transforms; not UI. Solutions belong in test fixtures, not silent score manipulation.
- dist/src/app.js: DOM/input orchestration, lifecycle, keyboard/touch adapters, explicit pause/retry and rendering scheduling. Rendering may be split into render.js; rules never move into rendering.
- dist/index.html and styles.css: Korean semantic shell, HUD/menus, responsive/reduced-motion presentation.
- test/: Node model/rule tests and campaign witnesses; not a substitute for actual browser play.
- tools/: loopback-only preview and read-only public checks, never deployed.
- .github/workflows/pages.yml: pinned verify-before-publish, dist-only artifact, deploy-scoped permissions.

## Bounds and privacy

All gameplay/progress/settings live only in page memory for this release. No cookies, localStorage, service-worker cache, identity or global leaderboard. No user files, private data, external fonts/assets/scripts or audio autoplay. Optional sound is off until user action and must stop on hide/navigation. CSP connect-src none; host-level logs remain outside this app. No dynamic code evaluation.

Use fixed bounded game ticks/turns and validated action enumerations. Undo/replay/history, entities, campaign choices and simulation work must have explicit finite ceilings recorded in decisions. Same scenario plus action sequence reproduces actual state. Page hide freezes scheduling and clears held input, returning does not silently resume. Reset cancels prior work. No synthetic delay or mocked victory represents real browser gameplay.

## Visual direction

Midnight infiltration world, brass architecture, cyan/amber/violet translucent echoes, lit door apertures, patrol cones, temporal trails and a meaningful 15-second timeline. Canvas or SVG world should dominate the viewport, not generic admin cards.

Original code-native Canvas/SVG/CSS art rather than copied commercial assets. Desktop battlefield is dominant and starts visible; compact real game HUD and contextual controls. 320/390px must remain usable, with a scrollable board where necessary rather than tiny illegible controls. Keyboard paths, text state, focus visibility, non-color-only objective indicators, and reduced-motion support.

## Delivery and encoding

Node.js 22+, no install required. Existing pinned GitHub Pages pattern; owner is HyungminYoon1. User authorized publication after verification. Commit/push/remote creation are parent integration responsibilities after code/browser/privacy checks. UTF-8 without BOM, CRLF text; binary images are explicitly marked. No .env/credentials/private identity in public files.
