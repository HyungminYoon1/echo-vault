# ECHO VAULT — 시간의 금고 architecture

## Authority and scope

Independent browser-only static GitHub Pages game at /echo-vault/. Only dist is public site output. Preserve all other repositories; no existing game code is merged. No runtime dependencies, backend, database, login, API, tracking or paid infrastructure.

## Separation

- dist/src/model.js: pure deterministic state/rules/scoring, validated bounded commands, no DOM, clock, browser globals, network or storage.
- dist/src/levels.js: authored campaign/scenario data and pure validated transforms; not UI. Solutions belong in test fixtures, not silent score manipulation.
- dist/src/save.js: pure, versioned input-log codec and replay validation; derives private records and independent completion from actual wins. No browser/storage/clock access.
- dist/src/storage.js: sole browser storage accessor; reads/writes/removes only echo-vault-save-v1 and catches unavailable/quota/corrupt data failures.
- dist/src/progress.js: injected storage boundary for the allowlisted web-lab-progress-v1 completion summary; never exposes private run data.
- dist/src/app.js: DOM/input orchestration, lifecycle, keyboard/touch adapters, explicit pause/retry and rendering scheduling. Rendering may be split into render.js; rules never move into rendering.
- dist/index.html and styles.css: Korean semantic shell, HUD/menus, responsive/reduced-motion presentation.
- test/: Node model/rule tests and campaign witnesses; not a substitute for actual browser play.
- tools/: loopback-only preview and read-only public checks, never deployed.
- .github/workflows/pages.yml: pinned verify-before-publish, dist-only artifact, deploy-scoped permissions.

## Bounds and privacy

The user-approved D05/D06 persistence boundary supersedes the original page-memory-only release. One private device-local save holds the current run, up to three echo input logs, and best/independent winning proofs for 15 campaign levels. Save schema v1 / campaign v2, at most 131072 UTF-16 code units (256 KiB), 60 commands per loop, three echo loops plus one current loop per proof, at most 31 proofs/7440 replayed commands. Coordinates, phase counters and scores are reconstructed through the pure model, never loaded as authoritative state. Unknown versions, malformed/oversized data and illegal replay are rejected without deleting them. There was no durable v1 campaign payload to migrate. Undo history stays in memory (64); resume always pauses. New gameplay replaces the one current save. Browser eviction/user deletion may remove it; this is not cross-device or tamper-resistant storage.

The separate web-lab-progress-v1 JSON object is at most 8192 characters and 15 allowlisted repo IDs, with only completed, total and a current ISO updatedAt per app. This game reports distinct hint-free durable campaign wins (0..15); the guided intro is excluded. Reporting occurs only on independent campaign completion after the private save succeeds, with the count recomputed from all durable proofs. Initial views, resume, hints, selection and failed saves do not publish summary entries; unchanged counts retain their timestamp. Clearing removes this game's private key and only apps["echo-vault"] from a valid summary. Invalid shared payloads are left intact, and partial clear/write failure is surfaced. A local read-modify-write is best effort across tabs; private proofs remain the source of truth.

No cookies, other persistence, service worker, identity, public leaderboard, network API, tracking, user files, external fonts/assets/scripts or autoplay. CSP connect-src none remains enforced; same-origin Pages storage is not an isolation boundary between applications. Host logs are outside this app. No dynamic code evaluation.

Use fixed bounded game ticks/turns and validated action enumerations. Undo/replay/history, entities, campaign choices and simulation work must have explicit finite ceilings recorded in decisions. Same scenario plus action sequence reproduces actual state. Page hide freezes scheduling and clears held input, returning does not silently resume. Reset cancels prior work. No synthetic delay or mocked victory represents real browser gameplay.

Campaign v1 levels 1–12 retain geometry and win predicates. Campaign v2 adds a guided intro excluded from records and levels 13–15: up to five ordered timed relay phases, echo-only aggregate plate occupancy/release, 2–3 consecutive matching beats inside inclusive windows, required echo teams, ordered cores and an exit window. Relay evaluation begins only once the required recordings exist; it runs after movement/charge updates and before hazard/core/exit checks. Doors require charge and every relay phase complete. Missing a phase deadline or final exit deadline ends the run and cannot be sealed. Old occupancy/door/score rules remain for v1. Witnesses are offline, executable commands; the app never imports them.

## Visual direction

Midnight infiltration world, brass architecture, cyan/amber/violet translucent echoes, lit door apertures, patrol cones, temporal trails and a meaningful 15-second timeline. Canvas or SVG world should dominate the viewport, not generic admin cards.

Original code-native Canvas/SVG/CSS art. First entry opens a separate playable intro with a direct link to stage 13 and an unrestricted stage picker. The board defaults to a full-map fit, with an explicit enlarged, internally scrollable view and actor-follow horizontal scrolling. Compact controls follow the board on mobile and stick to the viewport bottom when reachable. Text state, relay timing/occupancy requirements, keyboard paths, focus visibility and reduced motion remain. Browser fit/touch QA is the parent integrator's responsibility.

## Delivery and encoding

Node.js 22+, no install required. Existing pinned GitHub Pages pattern; owner is HyungminYoon1. User authorized publication after verification. Commit/push/remote creation are parent integration responsibilities after code/browser/privacy checks. UTF-8 without BOM, CRLF text; binary images are explicitly marked. No .env/credentials/private identity in public files.
