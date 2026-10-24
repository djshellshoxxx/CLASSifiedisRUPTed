# PS-103-09 — contract and acceptance oracles

**Status:** SPECIFIED — REVIEW PENDING. **Requirement family:** PS-103-09 (R01–R03). **Owner:** [module](SPEC.md). **Implementation/tests:** none; IDs below are future mappings, not existing artifacts.

## PS-103-09.R01 — behavior contract

Given an unlocked local vault, an approved preference decision and one valid allowlisted local event, the consumer creates at most one generic in-app notice in that vault. The notice view states only the local event meaning. Explicit read/delete actions modify only the local projection. No remote notification, remote receipt, consent, settlement, handoff, cross-device sync or closed-browser execution is inferred.

## PS-103-09.R02 — required future scenarios and oracles

| Fixture / future ID | Planned test path | Scenario | Oracle |
|---|---|---|
| `FIX-INAPP-ALLOWLIST` / `TEST-PS-103-09-A` | `tests/contracts/f13_inapp/test_local_notice_contract.py` | Each of four allowed events, then duplicate delivery | One matching generic catalog key per source event; no remote call; same notice ID on replay. |
| `FIX-INAPP-UNKNOWN-EVENT` / `TEST-PS-103-09-B` | `tests/contracts/f13_inapp/test_local_notice_contract.py` | Unknown/alias/versioned future event | No notice and no dynamic text; unsupported event is locally suppressed/quarantined. |
| `FIX-INAPP-PREFERENCE-STATES` / `TEST-PS-103-09-C` | `tests/contracts/f13_inapp/test_local_notice_contract.py` | Preference disabled, quiet, unavailable, malformed combinations | Only the declared decision union is accepted; disabled inbox plus enabled/quiet banner rejects; quiet stores only if inbox enabled and no live banner; unavailable does not advance cursor. |
| `FIX-INAPP-READ-DELETE-CAS` / `TEST-PS-103-09-D` | `tests/contracts/f13_inapp/test_local_notice_contract.py` | Mark read, duplicate command, confirmed unread delete, CAS revision, deleted-scope replay | Same active command/same bytes returns its receipt; active changed bytes gives `IDEMPOTENCY_MISMATCH`; deleted scope with any bytes gives `OBJECT_DELETED`; unconfirmed unread delete fails; confirmed delete succeeds at MAX_SAFE_INTEGER CAS revision and stores the max final revision. |
| `FIX-INAPP-CAP-CLOCK` / `TEST-PS-103-09-E` | `tests/contracts/f13_inapp/test_local_notice_contract.py` | Locked vault, no protected store, quota, full inbox, uncertain clock | No acknowledged durable write; session-only label or typed unavailable/cap state; unread rows remain; age purge pauses on uncertain clock. |
| `FIX-INAPP-PRIVACY-CANARIES` / `TEST-PS-103-09-F` | `tests/contracts/f13_inapp/test_local_notice_contract.py` | Sensitive payload canaries, XSS, import and cross-vault attempts | No private value rendered, stored, logged, exported or sent; unauthorized lookup reveals no existence. |
| `FIX-INAPP-SEQUENCE-CURSOR` / `TEST-PS-103-09-G` | `tests/contracts/f13_inapp/test_local_notice_contract.py` | Restart, restore mismatch, two tabs, sequence/cursor boundary, exhausted sequence/revision, terminal delete at maximum revision | No duplicate notice; atomic row/marker/counter; pages follow local sequence/high-watermark; typed exhaustion errors never wrap; terminal delete still succeeds at maximum CAS revision; conflicts quarantine; no blind replay. |
| `FIX-INAPP-ACCESSIBILITY` / `TEST-PS-103-09-H` | `tests/contracts/f13_inapp/test_local_notice_contract.py` | Screen reader, keyboard, RTL, zoom, reduced motion | Local state is understandable without color, sound, animation or inaccessible timed dismissal. |
| `FIX-INAPP-PERFORMANCE-1000` / `TEST-PS-103-09-I` | `tests/contracts/f13_inapp/test_local_notice_contract.py` | 1,000 notices / local timing workload | Measure only on declared device/browser/data profile against proposed budgets; record results separately. |

The registry's suite mapping is `TEST-PS-103-09`; the fixture cases below it are planning labels. The paths and fixture names above are planned and do not currently exist. They bind each future oracle to a reviewable test location for specification GO; they are not claims of an existing test file, CI run, build, implementation, approval, or passing result. F17 owns test harness, fixtures and release evidence.

## PS-103-09.R03 — release gate

For specification GO, review this planned test path, fixture set and oracle mapping alongside each requirement; no implementation, test execution, build or runtime product evidence is required at that stage. Product acceptance after implementation requires actual test path/results, build identity and reviewer, and remains a later gate. Review F15 event/store and F13.S02 preference contracts together; failure must remain fail-closed. No product test has been run.

Additional review regression oracles: a bounded bulk delete affects only the explicit selected read IDs/revisions, aborts all on stale/unread input, excludes a concurrently newly read item, and any repeated deleted batch command returns OBJECT_DELETED. Rejected source position E1 followed by valid E2 reaches E2 after restart without skipping it; policy-unavailable E1 stays pending. At MAX_SAFE_INTEGER, stale CAS fails first, matching already-read succeeds without increment, matching unread-to-read fails with REVISION_EXHAUSTED, and matching terminal delete still erases the row.
