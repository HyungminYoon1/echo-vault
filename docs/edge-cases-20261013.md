# echo-vault — systematic edge-case audit / 2026-10-13

새 LOCAL 감사이며 이전 유지보수/CI/공개 이력과 분리한다. 기준 HEAD `068544316910644145f31abbf6d93a23a015549d`, 최초 clean main 확인. Named echo-vault/neon-tactics/parcel-panic/light-route는 모두 변경 전에 inventory했다. 이 보고서는 echo-vault 범위다. 다른서비스/gallery/rankingserver NOT_INSPECTED/NOT_MODIFIED.

## 실행 결과

- `npm test`: 54/54 PASS, fail/skipped0. 기존48+신규6. 신규5개는 unchanged-baseline PASS coverage additions이며 RED_GREEN 아님.
- `node --test test/edge.test.js`: BEFORE 5PASS/1FAIL; AFTER 6/6PASS.
- `npm run check` 및 `git diff --check` PASS. 편집 텍스트만 UTF-8 without BOM/CRLF 정규화.
- `node tools/edge-browser.mjs http://127.0.0.1:51096/`: actual isolated Chrome/loopback primary+negative flows PASS. 동일 `--probe-ime` command BEFORE FAIL→AFTER PASS.
- 기존 .github/workflows/pages.yml의 npm test가 신규 Node tests를 실행한다. Browser harness는 현 CI 미실행/manual. REMOTE_CI/LIVE NOT_RUN.
- 재실행: `npm run dev -- 0`의 출력 URL을 harness에 전달. 기존 ../output/playwright/implement-20261012/node_modules/playwright/index.mjs(Playwright1.61.1) 사용; 다른설치는 PLAYWRIGHT_MODULE로 absolute module file 지정. Chrome C:/Program Files/Google/Chrome/Application/chrome.exe, headless/muted/ephemeral context. 개인browser profile에 접근하지 않음.
- 완료 후 owns-only preview process만 종료하며 부모59540 integration server 유지. No commit/push/deploy/delegation.

## 신규 실행 테스트

E번호는 문서참조다. 모두 test/edge.test.js; `node --test test/edge.test.js` 또는 `npm test`로 실행.

| ID | 실제 test name | baseline → after |
| --- | --- | --- |
| E1 | `edge: imported command primitives and nonfinite hints reject atomically` | PASS→PASS(new coverage) |
| E2 | `edge: save text exact ceiling accepts whitespace; one beyond rejects` | PASS→PASS(new coverage) |
| E3 | `edge: sealed echo and restored paths are detached across repeated loops` | PASS→PASS(new coverage) |
| E4 | `edge: late commands after win or timeout preserve all state and score` | PASS→PASS(new coverage) |
| E5 | `edge: corrupt or oversized private load preserves raw bytes and other app` | PASS→PASS(new coverage) |
| E6 | `edge: private write must confirm readback before claiming durability` | FAIL→PASS(readback fix) |

## Feature / boundary matrix

다음 표시한 Node tests(`npm test`) 및 B=tools/edge-browser.mjs의 실제 check 범위만 VERIFIED/PASS다. 기존 tests의 file prefix는 test/의 해당 *.test.js. 새 case가 없는 경계는 existing으로 명시한다.

| Feature / boundary | 실제 test / command mapping | cases / result |
| --- | --- | --- |
| Commands / types / empty / nonfinite | E1; model: wall and closed door cannot be walked through but consume a real beat | VERIFIED/PASS: Imported null/number/bool/array/object/empty/prototype commands and nonfinite/type/fraction hints reject atomically. Blocked movement consumes a beat. |
| Loop / echo / terminal bounds | E2/E3/E4; model: no-record attempt cannot exit and exact 60-beat timeout is sealable | VERIFIED/PASS: 0/59/60/61 commands; 0..3 echoes/fourth rejected; detached paths; won/timeout repeated late input leaves score/state identical. |
| Relay / order / hazard / oracle | relay: relay 13 witness independently meets each timed occupancy and exit predicate (14/15 too); all relay phases can finish early but exit still requires the exact window | VERIFIED/PASS: Independent echo occupancy/window oracle, latch/revisit/missing-team/core-order/laser/deadline negatives; UI13 actual2260. |
| Corrupt import / records | E1/E2/E5; save: save rejects duplicate, mismatched and assisted independent achievement proofs | VERIFIED/PASS: Exact131072 chars/+1, malformed JSON/version/forged fields/trailing terminal commands; stored bad bytes and sibling private key preserved. |
| Storage / isolation / quota | E6; save: private adapter handles missing, corrupt and denied storage without clearing other keys | VERIFIED/PASS: Null/stale/read-denied readback failure; exact success round-trip. Browser quota fixture still permits1beat. Own-key clear preserves other keys. |
| Undo / retry / remove / restore / clear | model: echo replay is exact, holds last position and restart does not advance clock; B: undo does not erase hint, resume terminal is visible, cancel clear preserves run | VERIFIED/PASS: Hint provenance preserved; terminal resume; deletion cancel; width1440/390/320 pad+undo returns0beat. New64-history eviction sequence NOT_RUN. |
| Score / determinism / campaign | model: campaign N has actual legal multi-loop solution; win score is finite, assisted is differentiated and describe contains real current state | VERIFIED/PASS: All15 model witnesses; original v1 hash; distinct durable independent wins only; no real-time score. Browser intro2730 then13:2260. |
| Keyboard / IME / focus | B: IME composition must preserve private run; IME composition must preserve focus; --probe-ime | NEW RED_GREEN: isComposing/legacy229에서 state/focus 보존. 합성 KeyboardEvent fixture; real OS IME 후보창 NOT_RUN. 일반키보드 입력은 actual primary flow. |
| Desktop / mobile | B: document fits 1440/390/320 + width별 pad/keyboard/undo/cancel checks | VERIFIED 1440×1000/390×900/320×900 actual UI input·3screenshots 열어서 visual QA. Physical touch/다른browser/screen reader NOT_RUN. |
| Storage failure / corrupted reload | B: corrupt import retains raw; corrupt load does not delete sibling; quota is visible; gameplay continues | NEW fixture: malformed localStorage/Storage.setItem QuotaExceededError. 물리적으로quota를채운시험아님; oversize는Node. |
| Repeat / rapid / late | 위terminal/undo/capture cases | VERIFIED 표시한 연속·거절·종료·restart. New auto-repeat/rapid double-click/pointercancel/two-tab exhaustive race NOT_RUN. |
| Async failures / races | N/A 외부transport없음 | 외부transport N/A. 새 visibility/pagehide/reset-late scheduler fixture NOT_RUN. |

## Failing test first / minimal fixes

1. Production 변경 전 `node --test test/edge.test.js` 실행. 실제 assertion: `unconfirmed private write must fail / true !== false`. setItem만으로durable성공을보고했다. storage.js에서 own private key 동일 raw readback만 추가. null/stale/throwingread는false, input/기록보존; NEONsharedprogress도미발행. SAME test PASS. Payload/rules/schema/retention unchanged. Readback은cross-tab transaction/disk durability 보증이 아니다.
2. 키보드 handler 변경 전 `node tools/edge-browser.mjs http://127.0.0.1:51096/ --probe-ime` 실행. 실제실패: `IME composition must preserve private run` (ECHO up기록이echo로되감김 / NEON end input추가 / PARCEL sorter dir0→1). app.js 첫줄isComposing/keyCode229 guard추가. SAME probe PASS; scoring/replay rules unchanged.

Ignored evidence: `output/playwright/edge-20261013/node-before.txt`, `ime-before.json`(실제실패), `ime-result.json`(같은probe PASS), `browser-result.json`(전체flow PASS). 테스트harness 초반 hidden-control timeout은 닫힌campaign/접힌details를열지않은 QA 준비오류; 실제 모달/summary click으로고쳤고 assertion을약화하지않았다. Production bug로집계안함.

## Actual browser flow / screenshots

입문 실제6박자2730→hint locked→결과 닫기/reload/resume 종료 결과→retry/hint/undo→실제 두 잔상 기록과13번2260 완료→늦은 이동 거절. 캡처는 이후 같은 잔상 retry/pad/undo, 0박자·최고2260.

Negativeflows: 삭제/목표취소 또는한도실패 + corruptreload + quota injection. NEON/PARCEL의503은endpoint interception이며 실제server장애증거아님. 게임state/score/victory injection없음. Witness/plan을 Node에서읽고 실제UI 입력을안내한다.
Reusable QA: tools/ui-regression.cjs를읽고실제로호출. Captures `output/playwright/edge-20261013/view-1440.png`, `view-390.png`, `view-320.png`.
Visible UI change: 정상 layout/CSS변경없음. 새preview refresh 불필요; failure-input QA증거는위capture와명령으로재현.

## Source inventory / review coverage

- Named echo-vault repo PARTIAL: 전체path inventory 후 task-related파일선택. Inventory를full-file review로주장하지않음.
- VERIFIED authoritative: architecture.md > requirements.md > README.md(api-spec없음); docs/decisions.md, package.json, .gitattributes, .gitignore, .github/workflows/pages.yml. Repo AGENTS없음; 사용자AGENTS준수.
- VERIFIED relevant source/tests/tools: model.js, save.js, storage.js, progress.js, app.js, levels.js; all test/*.test.js; tools/witnesses.mjs, ui-regression.cjs, check.mjs, serve.mjs.
- PARTIAL auxiliary/history: index.html 일부 잘린 출력 이후 관련 controls 선택 검토. render.js/전체CSS의 전수 source 독서는 제외; browser captures와 public-file gate 검증. docs/verification.md는latest 관련내용/통합지침 selected review;이전LIVE이력전수재검사안함.
- NOT_INSPECTED: .gitobjects/node_modules전수/credentials/.env(열지않음)/unrelatedrepos/gallery/rankingserver. Task/secret범위와unchanged auxiliary files라서선택제외.
- Root existing Playwright package.json 존재/version확인. 새runtime dependency없음. 아래 tracked baseline inventory;ignored QA/node_modules제외.

```text
dist/src/app.js
dist/src/storage.js
.gitattributes
.github/workflows/pages.yml
.gitignore
README.md
architecture.md
dist/favicon.svg
dist/index.html
dist/src/app.js
dist/src/levels.js
dist/src/model.js
dist/src/progress.js
dist/src/render.js
dist/src/save.js
dist/src/storage.js
dist/styles.css
docs/decisions.md
docs/provenance.md
docs/verification.md
package.json
requirements.md
test/model.test.js
test/relay.test.js
test/save.test.js
tools/check.mjs
tools/serve.mjs
tools/ui-regression.cjs
tools/witnesses.mjs
```

## Remaining untested / N/A / integration

Public ranking/identity/transport: N/A (기능 없음/connect-src none). New visibility/pagehide/reset-late scheduler race: NOT_RUN. File-upload import: N/A (local command-log codec only).

모든seed/캠페인을 개별browser완료한것아님. 모델witnesses는저작계약/표본의실행검증이다. RealOSIME/physicaldevices/allviewport+zoom+device/screenreaders/multi-tabwrite+clear/realbrowser eviction/allasyncinterleavings/WorkerCPU/humanfun+difficulty/remoteCI/LIVE/deploy NOT_RUN. Scoped-key isolation은same-origin browser security isolation증명이아님.
Changed files: dist/src/app.js, dist/src/storage.js, new test/edge.test.js, new tools/edge-browser.mjs, new docs/edge-cases-20261013.md, docs/verification.md(newtop), docs/decisions.md(D09). 기존 legitimate tests/user records/rules/versions/maps/retention/storage schema 보존. Parent integrates/releases.
