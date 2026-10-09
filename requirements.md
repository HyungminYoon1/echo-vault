# ECHO VAULT — 시간의 금고 requirements

The user selected this game and requested substantial challenge, fun and real-game presentation. These are implementation targets, not claims of completed features.

- Record a short timeline of movement/wait/interact actions, then rewind so prior echoes replay while the present player attempts the exit. At least three usable echo slots with visible identity/color/timeline status.
- Preserve the original 12 authored puzzles. Add a separate playable onboarding and versioned advanced puzzles requiring plate release/revisit and synchronized time windows. Permit direct advanced-stage access and unrestricted selection.
- Combine linked pressure plates, doors that close, ordered objectives, synchronized holds, patrols/visibility or timed hazards, and constraints on loops/time. Actual timeline events must drive mechanics; do not create a decorative replay.
- Model order of door/plate updates, actor movement, detection and exit explicitly. Pausing and timeline inspection may not secretly advance a run.
- Every level needs an executable solution witness in tests, replayed through the real model. Include real negative tests (missing echo, wrong timing/order, detection, time/echo budget exhaustion) and at least a selected independence test of winning predicates.
- Offer keyboard/WASD, accessible on-screen controls for touch, visible action descriptions, clear record/rewind/play/pause/reset, concepts-only hints, and at least one bounded undo/retry route.
- Visuals must be a detailed original game world: wall depth, floors, door mechanisms, player/echo silhouettes, meaningful patrol/hazard indications and motion. Avoid repeating the same rectangular board with only titles changed.
- Challenge codes/daily condition variations are allowed only if validated as solvable and deterministically reproduced; never randomize critical geometry into impossible levels. A bounded visual-only seed is not a new gameplay challenge.
- Win/fail feedback, score breakdown, campaign progression and replay need to use actual state. Reference solutions, if offered, must be explicit practice rather than unassisted scored success.

## Acceptance

- Complete playable campaign with honest finite difficulty and validated solvability, not a decorative prototype or lab controls with pretend game results.
- Pure rules and UI remain separate. Test normal/negative/boundary/replay/undo/lifecycle cases, then actual browser input at desktop/390/320 with no document overflow/console failures.
- Document exact mechanics, witnesses, bounds, test types, local browser evidence and any NOT_RUN. A human difficulty/fun rating cannot be asserted from model tests alone.
- Original code and code-native art; no external content/license dependence. No global rankings/server/cloud persistence; reuse static Pages.
- Approved local extension: bounded versioned autosave of current run/echoes/progress/bests, explicit paused resume and own-record clear, graceful storage failure. Keep deterministic rules and replay validation separate from storage/UI.
- Approved gallery contract: web-lab-progress-v1 contains only allowlisted device-local completion counts and update timestamps. Count actual durable independent wins, exclude intro/hints, and clear only this app's summary.
