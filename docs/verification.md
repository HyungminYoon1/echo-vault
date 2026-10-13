# Verification record

## 2026-10-13 — 종료 입력·잔상 시간표·설계 과제 / LOCAL

- UI 변경: YES. 실제 잔상별 압력판 점유 구간, 13/14/15 설계 과제, 결과 닫기. 완료/실패 뒤 힌트 차단. 캠페인 배치·승리 조건·점수·저장 키/형식 유지.
- BUG BEFORE: tools/ui-regression.cjs의 입문 실제 완료 후 hint.isDisabled 검사가 실패했다. 수정 후 동일 입력 통과. 공개 앱의 상태·점수·저장 승리를 주입하지 않았다. UI 회귀 파일은 loopback 페이지를 먼저 연 뒤 Playwright CLI run-code --filename tools/ui-regression.cjs로 실행한다.
- LOCAL: npm test 48/48 PASS, fail/skipped 0 (103396.4202ms). 기존 47개 유지 + 실제 기록의 양 끝 포함 점유/해제/최종 유지 검증1개. 모든15 캠페인과 입문 해답, 기존 SHA256 회귀·시간 실패·저장/요약 시험 포함. npm run check PASS(10 public files), git diff --check PASS.
- BROWSER: 격리 Playwright 세션, loopback, 1440×1000/390×900/320×900. 13번 실제 두 잔상, 9박자 복원, 22박자/2260점 완료; 결과 닫기→취소→재완료 결과 표시. A 영구 유지의 11박자 동기화 실패→결과 닫기→취소→같은 잔상 재시도. 320px 화면 버튼으로 입문6박자/2730점 완료. 관측한 document overflow/pageerror/원격 요청0.
- 캡처: ignored output/qa-20261013/desktop.png(13번9박자·시간표), mobile-390.png(동기화 실패), mobile-320.png(실제 입문 완료). 실제 이미지를 열어 시간표·버튼·결과 배치를 확인했다.
- 선택자: .practice-notes summary, [data-practice-level], #echo-schedule, #result-close, #hint, #resume, #undo, [data-move].
- 변경 파일: dist/index.html, dist/styles.css, dist/src/app.js/model.js, test/relay.test.js, tools/ui-regression.cjs, README.md, docs/decisions.md/verification.md/provenance.md.
- 소스 범위: 저장소 PARTIAL(전체 목록 후 관련 선택). architecture/requirements/README/decisions VERIFIED; api-spec/AGENTS 없음. 변경 파일·모델/캠페인/저장 코덱·직접 관련 시험과 witness VERIFIED. 변경 없는 아트·배포 workflow와 모든 CSS 규칙의 새 전수 심사는 하지 않았다.
- NOT_RUN: 물리 터치 기기·다른 브라우저·보조기술, 전체 캠페인 개별 브라우저 완주, 새 저장 거부/다중탭 UI, 사람의 난도 평가, 원격 CI/LIVE. 저장 예외는 기존 Node double 시험이다. 커밋/푸시/배포/갤러리 편집/다른 에이전트/외부 점수 제출0. 설명 근거: provenance.md.

## 2026-10-09 — V2 local implementation handoff

Source scope: VERIFIED — architecture.md, requirements.md, README.md, docs/decisions.md, docs/verification.md; all dist sources/assets, tests, witness/check/preview tools, package.json, .gitattributes/.gitignore and Pages workflow. api-spec.md and repository/parent AGENTS.md were not present; user-provided AGENTS instructions applied. Initial git status was clean. Sibling directory names were inventoried only to match the 15-app summary whitelist; no sibling content was reviewed or modified.

- LOCAL_TEST: PASS — final `npm test`: 47 tests, 47 pass, 0 fail, 0 skipped. Original 12 scenarios are deep-equal to HEAD data (also protected by a SHA256 regression assertion). All 15 campaign witnesses and the intro replay through ordinary advance/sealEcho calls. Added independent timed-occupancy assertions and negatives for permanent latch, missed revisit, missing team, current-player substitution, nonconsecutive hold, wrong core order, laser collision, late and early exit.
- LOCAL_STORAGE_TEST_DOUBLE: exact replay of current/terminal/mid-relay runs; hint/best/independent progress reconstruction; unknown versions, oversized payloads, illegal/trailing commands, fabricated fields, duplicate/assisted proofs; denied storage and own-only clearing; allowlist/size/numbers/date/schema checks and preservation of other apps' summaries. These are Node tests with injected storage doubles, not real browser storage evidence.
- LOCAL_CHECK: PASS — `npm run check`, 10 public files; `git diff --check`. Privacy gate retains network/other-persistence restrictions and allows only the documented storage adapter and minimal summary boundary (D05/D06). Static DOM-id matching is not browser E2E. All 19 edited/new text files were normalized to UTF-8 without BOM / CRLF.
- BROWSER_LOCAL_V2 / MOBILE_V2 / SCREENSHOTS_V2: NOT_RUN by this implementation agent; assigned to parent integration.
- REMOTE_CI / LIVE_V2: NOT_RUN. No commit/push/account access/provisioning; no subagents.
- Prior browser evidence in the historical section below applies to V1 only. No current browser/layout/human-difficulty claim is inferred from it.

Changed paths (19, all inside this repository):

- Rules/art: `dist/src/levels.js`, `dist/src/model.js`, `dist/src/render.js`.
- UI: `dist/src/app.js`, `dist/index.html`, `dist/styles.css`.
- New persistence boundaries: `dist/src/save.js`, `dist/src/storage.js`, `dist/src/progress.js`.
- Tests/tools: `test/model.test.js`, new `test/relay.test.js`, new `test/save.test.js`, `tools/witnesses.mjs`, `tools/check.mjs`.
- Documents: `architecture.md`, `requirements.md`, `README.md`, `docs/decisions.md`, `docs/verification.md`.

### Browser capture handoff: use actual controls

Run `npm run dev -- 0` and open the printed loopback address. Use desktop 1440×1000, 390×900 and 320×900. Start in the separate intro; select any level via 금고 선택 or stage 13 via 시간 회로 13 →. Keep real time paused for witnesses. Click the canvas before keyboard input. Each key press/release moves one beat; do not use a held/repeated key. The `·` below means Space or the 대기 button; recording is the R key or 기록·되감기 button. Do not inject state, scores, localStorage achievements, clocks or solved screenshots.

| Scenario | Recording / current actions | Expected model result |
| --- | --- | --- |
| Intro echo | ↑×2, then record | One echo, tick 0 |
| Intro exit | →, ↑, →×4 | Win at beat 6, 2730 points; excluded from gallery |
| 13 echo A | ↑×2, →×2, ·, ↓, ·×6, ↑; record | A held at 4–5, released 6–12, revisited 13 |
| 13 echo B | ·×4, ↓×2, →×2; record | B arrives at 8 |
| 13 current | →×8, ·×10, →×4 | Win at beat 22, 2260 points |
| 14 echo A | Same as 13 A; record | A returns at 13 |
| 14 echo B | ·×4, ↓×2, →×2, ·×9, ↑, ·×5, ↓; record | B releases at 18, returns at 24 |
| 14 current | →×6, ↑×2, ↓×4, ↑×2, →×2, ·×14, →×4 | Win at beat 34, 2020 points |
| 15 echo A | ↑×2, →×2, ·, ↓, ·×11, ↑; record | A returns at 18 |
| 15 echo B | ·×4, ↓×2, →×2, ·×2, ↑, ·×14, ↓; record | B releases at 11, returns at 26 |
| 15 echo C | ·×6, →×6; record | C arrives at 12 |
| 15 current | →×6, ↑×2, ↓×4, ↑×2, →, ·×19, →×5 | Win at beat 39, 1770 points |

For a meaningful in-progress capture, run stage 13's two recordings, then →×8 and · once. Beat 9 shows two completed relay phases, released A, held B, two visible echoes and the next synchronized window. Capture the board plus relay list (on mobile, the list is below the compact dock). Refresh at this point: choose 이어하기, verify beat 9/echoes/phase remain unchanged, wait to verify no automatic ticking, then ·×9 and →×4 to finish. Refresh again and verify personal best and 1/15 independent completion persist.

On both mobile widths, verify the fitted board has no document overflow, tap all directions/wait, enlarge and pan the board, then 전체 보기. Confirm the dock is reachable, the actor follows in enlarged view and dialogs/results fit. On stage 13, truncate A after its initial hold and record B: the second relay window must fail by beat 11. This demonstrates an actual failed attempt beside the successful witness.

Inspect only known local keys in the browser; the summary should contain exactly `echo-vault: {completed:1,total:15,updatedAt:<actual ISO>}` after independent stage 13 completion. Intro and a hinted first completion must not increase it. Verify records clear after 기록 삭제 → 삭제 and reload, preserving any existing other-app entries. Test real browser storage denial and report it separately from Node doubles. Summary/other-app contents are not needed in screenshots.

### Remaining limitations

One current save per browser origin/profile; simultaneous tabs may overwrite current progress or race a shared-summary read-modify-write. Unchanged aggregate counts do not rewrite their timestamp. Browser eviction is outside app control. The private record is replay-valid local evidence, not a tamper-resistant public score. Undo history is intentionally not restored. Storage versions fail closed; no earlier persistent release required migration. Human difficulty/fun and physical mobile behavior remain unmeasured.

## 2026-10-09 — LOCAL implementation acceptance (pre-publication snapshot)

- LOCAL_TEST: PASS. 20 model tests: 12개 캠페인 실제 규칙 해답, 충전/닫힌 문/벽/코어 순서/레이저/60박자 경계/기록/재시도/점수와 입력 검증.
- BROWSER_LOCAL: PASS for selected flows. 1/7/12의 일반 키보드 이동·기록 버튼으로 실제 탈출 및 2490/1810/1770점 일치를 확인했습니다. 방향 패드, 한 박자 취소, 힌트 감점의 기록/재시도 유지와 실시간 정지 후 시계 동결을 확인했습니다.
- Viewports: desktop 1440×1000; 390×900 and 320×900 responsive controls/menus/no document overflow. Scroll is internal to the board; no tiny-board substitute.
- Main gameplay used ordinary UI/keyboard/palette/Canvas actions, not injected game state, a mocked win or a changed model clock. Model witnesses are offline tools, not imported by the public game.
- Public file checker: PASS. 7 public files; syntax/import/assets/privacy/pure-rule/CSP/UTF8-without-BOM/CRLF gate. Local screenshots are not proof of current public deployment.
- REMOTE_CI: NOT_RUN at this pre-publication snapshot.
- LIVE: NOT_RUN at this pre-publication snapshot.
- Subsequent remote CI, commit and actual public file verification: [WEB LAB latest deployment record](https://github.com/HyungminYoon1/web-lab/blob/main/docs/verification.md).

## Inspection scope

Follow-up local QA: 320px에서 실제 1번 캠페인 성공과 결과 카드 전체의 화면 내 표시를 확인했습니다. 금고/물류의 이 headless 환경은 탭 전환에도 document.hidden=false였으므로 실제 visibility 전환은 NOT_OBSERVED이며, 합성 blur event에 의한 핸들러 중단·포커스 복귀 후 자동 재개 없음만 따로 확인했습니다.

VERIFIED: this repository's architecture/requirements/README/decisions, all implemented rules/campaign/UI/rendering, test cases, witness tooling, dist assets, local preview/check tools and Pages workflow.
PARTIAL: actual browser walkthroughs selected 1/7/12; the remaining campaign levels were validated by executable model witnesses, not all individually completed in the browser.
NOT_RUN: physical mobile device, every browser/platform, independent human difficulty/fun calibration and global ranking/backend (not implemented).

## Bounds and distinct evidence

0.25초 고정 박자, 반복당 최대 60, 잔상 3×61 위치, 취소 64 상태, 캠페인/최고 기록 12개. 실시간 프레임당 최대 4박자까지 처리하고 긴 지연은 버립니다.

Model preview equivalence tests share the actual command function; independent boundary fixtures separately assert collision, ordering, timing, occupancy or failure expectations. Synthetic rule fixtures are not labelled browser gameplay or public results. No secret or environment values are printed.
