# Decisions

## D05 — Approved bounded private autosave (2026-10-09)

- Context: The user explicitly approved local persistence, current-run resume and deletion. This supersedes the storage prohibition in D02 and page-memory statements in D03/D04 for these two documented keys only.
- Options: memory-only; unrestricted snapshots; bounded versioned command logs validated by deterministic replay.
- Decision: save schema 1 / campaign 2, key echo-vault-save-v1, maximum 131072 UTF-16 code units (256 KiB). Store one current run and up to 15 best plus 15 independent winning proofs, each at most three 60-command echoes and a 60-command current loop, at most 7440 replay commands. Reconstruct every echo via actual legal prior runs. Reject unknown versions, malformed input, terminal trailing commands, unsealable echoes, duplicate/invalid achievement records and out-of-bound fields. Do not load coordinates or points. No old durable format exists to migrate. All updates are synchronous after gameplay mutations, including hints/undo/retry/selection; no timer is persisted. Restored runs pause; session undo history is not persisted. Resume is explicit; starting another run replaces the current one.
- Rationale: deterministic recovery with finite work and no remote identity; real private bests remain separate from independent completion. Hint use persists across rewind/retry/undo. Storage failure leaves gameplay usable with a visible notice. Corrupt records remain untouched until new gameplay or explicit deletion. Records remain until user clear/browser eviction; no timestamp-based retention or tracking.
- Affected: architecture.md, requirements.md, README.md, dist/src/save.js, storage.js, app.js, tools/check.mjs, test/save.test.js.
- Review: test doubles verify denial/quota-style exceptions and record isolation; parent must verify real reload/clear/storage denial in browser. Same-origin scripts/user edits can alter local storage; this is not an authentication or competitive score boundary.

## D06 — Minimal gallery summary (2026-10-09)

- Context: The approved cross-app contract uses web-lab-progress-v1. Only this repository may be edited.
- Options: expose run payloads; count visits/assisted demos; report distinct actual durable independent achievements.
- Decision: injected adapter with 8192-character limit and the 15-repo whitelist: data-mirage, echo-vault, light-route, logic-foundry, neon-tactics, orbit-courier, packet-journey, parcel-panic, pixel-kitchen, pocket-city, route-race, sense-lab, swarm-garden, think-forge, traffic-lab. Validate version 1, apps object, exact completed/total/updatedAt fields, integers 0 <= completed <= total <= 1000, canonical ISO timestamp. Own total is 15. Report only on hint-free campaign completion after the private write succeeds, recomputing the distinct count from all durable proofs. Intro is guided and excluded. Initial view/resume/hint/example/selection do not publish entries. Unchanged counts preserve updatedAt. Read-modify-write preserves every other validated entry. Clear deletes only own entry, never shared storage wholesale. Unknown/malformed shared data is left untouched and reported as unavailable.
- Rationale: gallery badges can read one minimal aggregate without inspecting actions, identity or private proof payloads. Best-effort cross-tab writes are repairable from private evidence; no fabricated completion dates.
- Affected: dist/src/progress.js, storage.js, app.js, test/save.test.js, tools/check.mjs, architecture.md, README.md.
- Review: parent verifies identical whitelist/contract across apps and actual gallery integration. No other repository/backend is modified or provisioned.

## D07 — Versioned temporal relay campaign and entry controls (2026-10-09)

- Context: Final puzzles should require changing echo positions rather than permanent pressure latches. Preserve the existing campaign and provide immediate playable onboarding/mobile controls.
- Options: overwrite v1 solutions; merely raise charge times; append v2 relay levels with executable schedules.
- Decision: retain v1 IDs 1–12; add intro and IDs 13–15. The intro has no campaign record. Relay phases monitor only echoes: every listed ON plate occupied, every OFF plate empty, consecutive hold inside an inclusive beat interval. Required 2/2/3 echo teams activate the phases; incomplete teams can record but cannot exit. Phase completion is ordered, capped at five, doors require all phases plus usual charge, exit requires all doors/cores and a final inclusive time window. Missed deadlines fail and cannot be sealed. Level 13 requires A release/revisit; 14 also requires B release/revisit plus cores; 15 chains A/B/C, returns A then B, and retains a live laser. Offline legal movement witnesses prove each solution and negative timing/hold/missing-echo conditions.
- Rationale: staged recordings must cooperate over time; simultaneous permanent latches cannot solve the new levels. No hidden score/state injection, examples, leaderboard or backend. All controls use the same model commands. First visit starts a small guided playable map; advanced entry and unrestricted selector remain available. Fit/zoom controls and mobile sticky input dock expose the same rules in compact space.
- Affected: dist/src/levels.js, model.js, app.js, render.js, index.html, styles.css, tools/witnesses.mjs, test/model.test.js, test/relay.test.js, docs/verification.md.
- Review: model solvability is proven locally, not a human challenge/fun rating. Parent owns browser E2E, accessibility/layout inspection, screenshots and publication. Prior browser evidence below concerns v1 only.

## D03 — 유한 게임 규칙과 재현 가능한 캠페인

- Context: 높은 난도와 실제 실패/성공이 있는 게임이며 무작위 데이터가 불가능한 문제를 만들면 안 됩니다.
- Options: 검증되지 않은 무작위 배치; 무한 시간/처리; 유한한 저작 캠페인과 실제 해답 검증.
- Decision: 0.25초 고정 박자, 반복당 최대 60, 잔상 3×61 위치, 취소 64 상태, 캠페인/최고 기록 12개. 실시간 프레임당 최대 4박자까지 처리하고 긴 지연은 버립니다. 문 진입은 박자 시작의 잠금 상태를 사용하고, 이동·잔상 재생 이후 점유/충전을 갱신합니다. 떠난 압력판의 충전은 즉시 0입니다. 현재 기체의 레이저/코어 순서/출구를 판정한 뒤 60박자 제한을 적용합니다. 시간 종료 경로는 잔상으로 보관할 수 있지만 레이저/순서 실패는 보관할 수 없습니다.
- Rationale: 시간과 자원 제약이 실질적으로 작동하면서 같은 문제/행동으로 재현할 수 있습니다. 규칙과 UI를 분리하고 모든 저작 캠페인의 해답을 실제 모델로 실행합니다.
- Affected: dist/src/model.js, levels.js, app.js, test/model.test.js, tools/witnesses.mjs.
- Review: 20 model tests: 12개 캠페인 실제 규칙 해답, 충전/닫힌 문/벽/코어 순서/레이저/60박자 경계/기록/재시도/점수와 입력 검증. 난도 명칭과 모델 해답은 사람의 재미/난도 측정을 대신하지 않습니다.

## D04 — 읽을 수 있는 미리보기와 조작/복구

- Context: 어려운 퍼즐의 실패 원인을 읽고 같은 조건으로 다시 시도할 수 있어야 합니다.
- Options: 즉시 실패와 입력 재시도만 제공; 화면만 그린 가상 결과; 실제 상태 예고와 제한된 취소/리셋.
- Decision: WASD/방향키 이동, Space 대기, P 실시간 시작/정지, R 기록 후 되감기, Z 한 박자 취소. 방향 패드로 같은 명령을 실행할 수 있습니다. 점수는 성공 점수 = max(0, 3000 − 박자×20 − 잔상×150 − 힌트×300). 기록은 현 페이지 메모리만 사용합니다. 작은 화면은 내부 보드 스크롤로 판독 크기를 유지하고 결과는 화면 안에 표시합니다. 페이지 숨김/초점 이동 시 시간 예약 또는 효과 프레임을 취소하며 자동 재개하지 않습니다.
- Rationale: 사용자가 결과를 추적할 수 있고 재생 속도/렌더링은 규칙과 점수를 바꾸지 않습니다.
- Affected: dist/index.html, styles.css, app.js, render.js, README.md.
- Review: 1/7/12의 일반 키보드 이동·기록 버튼으로 실제 탈출 및 2490/1810/1770점 일치를 확인했습니다. 방향 패드, 한 박자 취소, 힌트 감점의 기록/재시도 유지와 실시간 정지 후 시계 동결을 확인했습니다. 실제 모바일 하드웨어와 사람의 체감 평가는 미검증입니다.

## D01 — 독립 정적 게임과 검증 후 공개

- Context: 사용자가 제안한 세 게임의 구현, 높은 난도/재미/실제 게임 디자인과 검증 후 바로 공개를 승인했습니다.
- Options: 기존 서비스에 병합; 서버/프레임워크 도입; 독립 browser-only 정적 저장소.
- Decision: 이 게임만 독립 저장소에서 구현하고 기존 Node22/pinned Pages 패턴으로 dist만 공개합니다. 규칙/시나리오/UI/렌더링을 분리하며 원격 생성/커밋/배포는 부모 작업에서 검증 후 수행합니다.
- Rationale: 기존 릴리스와 개인정보 경계를 보존하고 설치·유료 서버 없이 실제 게임을 실행합니다.
- Affected: architecture.md, requirements.md, dist, test, tools, .github/workflows.
- Review: 게임 모델/캠페인 해답, 실제 브라우저 조작, 공개 파일/CI를 독립적으로 확인합니다.

## D02 — 페이지 메모리와 원본 코드 기반 아트

- Context: 방문자 정보가 필요하지 않은 단일 플레이 게임이며 사용자가 개인적인 공개를 원하지 않습니다.
- Options: 계정/영구 점수/외부 자산; 현재 세션 상태와 직접 그린 SVG/Canvas/CSS.
- Decision: 계정·쿠키·방문자 영구 저장·전체 순위·분석·API를 넣지 않고 원본 코드 기반 아트와 현재 세션 상태만 사용합니다. 호스팅 로그는 앱 처리와 별개입니다.
- Rationale: 추가 개인정보/비용/라이선스 경계를 도입하지 않습니다.
- Affected: dist/src/app.js, rendering, CSP, README.md.
- Review: 영구 저장/오디오/서버를 도입하려면 별도 결정과 승인이 필요합니다. 게임의 유한 처리/반복/되돌리기 상한은 구현 후 추가 기록합니다.
