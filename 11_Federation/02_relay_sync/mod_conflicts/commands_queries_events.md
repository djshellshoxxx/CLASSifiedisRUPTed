# PS-086-04 — Commands, queries and events: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-04.R01** The module exposes detect, resolve and read operations plus the synchronous is_frozen check; detect is an internal vault or relay command and resolve is a review action.
- **PS-086-04.R02** Each command emits its events in the same local transaction as the state change.
- **PS-086-04.R03** The module consumes account move, identity document and peer suspension events to recompute the author's listed relays and review windows, and deletion events to pseudonymize evidence.
- **PS-086-04.R04** Domain modules that act on commitments (F01.S04.M01 offers, F02 proposals, F01.S03.M01 reservations, F08.S02.M02 consent, F09 deals, F11.S03.M03 moves) consume federation.conflict.detected and resolved and call is_frozen before acting; these are N-note obligations recorded for their owners.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `federation.conflict.detect` | federation.conflict.detect | [vault-local or relay-local command, called by F11.S01.M02 inside the receive transaction or the revocation re-marking transaction and by F11.S03.M03 for moves] { kind, author, chainKey?, seq?, subjectRef?, candidates: Envelope[2..5] (Envelope[1] for key_compromise), statementClass } | { conflictId, status: open, freezeScope, authorQuarantined: boolean } | FED_SIGNATURE_INVALID, VALIDATION_FAILED, CONFLICT_STATE, FEDERATION_CONFLICT_AUTHOR_LIMIT | federation.conflict.detected | yes (Idempotency-Key) |
| `federation.conflict.resolve` | federation.conflict.resolve | [vault-local command in the vault; relay command under relay policy for public_projection only] { conflictId, expectedRevision, decision: keep\|drop_all\|superseded, keptCid?, supersededByCid?, note? ≤ 280 } | { conflictId, revision, status } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FEDERATION_CONFLICT_INVALID_RESOLUTION, FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE, FORBIDDEN | federation.conflict.resolved | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `federation.conflict.list` | federation.conflict.read | { status?: open\|all, statementClass?, cursor?, limit ≤ 50 } | { items: ConflictRecord[], nextCursor? } |  |
| `federation.conflict.get` | federation.conflict.read | { conflictId } | { conflict: ConflictRecord, diff: FieldDiff[] } | NOT_FOUND |
| `federation.conflict.is_frozen` | federation.conflict.check | [in-process synchronous vault query] { subjectRef } | { frozen: boolean, conflictIds: uuidv7[] } | DEPENDENCY_UNAVAILABLE |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `federation.conflict.detected` | P2 | { conflictId, kind, statementClass, author, chainKey?, seq?, subjectRef?, candidates: [{cid, receivedFromRelay?}], freezeScope, authorQuarantined } — IDs only |
| `federation.conflict.resolved` | P2 | { conflictId, decision, statementClass, candidateCids, keptCid?, supersededByCid?, freezeScope, decidedBy } — IDs only |

### Events consumed

| Type | Effect |
|---|---|
| `federation.account.moved` | recompute the author's listed relays from the verified move and portable document for open public_projection conflicts of that author before auto-resolution |
| `identity.portable_doc.published` | origin received: refresh the listed relays of the author used by origin-wins for open public_projection conflicts |
| `federation.peer.suspended` | extend the 7-day review window of public_projection conflicts whose candidates came from that peer by 7 days |
| `privacy.deletion.completed` | pseudonymize the deleted principal's DID in retained ConflictRecords kept as RET-EVIDENCE and delete open commitment records of that principal's own vault (N6) |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_CONFLICT_INVALID_RESOLUTION | 422 | no | decision does not match the candidates or lacks a verified superseding statement |
| FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE | 409 | no | commitments accept only drop_all or a renegotiated statement signed by every required signer |
| FEDERATION_CONFLICT_AUTHOR_LIMIT | 429 | no | the author has 20 open conflicts; its further envelopes are quarantined at author level |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
federation.conflict.detect { kind: "fork_seq", author: "did:key:z6Mk...", chainKey: { signerKey: "did:key:z6MkDev...", stream: "pub" }, seq: 7, statementClass: "public_projection", candidates: [env1, env2] }
-> { conflictId: "0192f3b0-...", status: "open", freezeScope: [], authorQuarantined: false }   emits federation.conflict.detected
federation.conflict.resolve { conflictId: "0192f3b0-...", expectedRevision: 1, decision: "keep", keptCid: "sha256-Qm..." }
-> { conflictId: "0192f3b0-...", revision: 2, status: "resolved" }   emits federation.conflict.resolved
federation.conflict.is_frozen { subjectRef: "consent:bazaar_offer:0192f3c1-..." } -> { frozen: true, conflictIds: ["0192f3b4-..."] }
federation.conflict.resolve { conflictId: "0192f3b4-...", expectedRevision: 1, decision: "keep", keptCid: "sha256-C1..." } -> error FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T04 | integration | PS-086-03.R02, PS-086-04.R03 | public conflict untouched for 7 days with E7a from listed relay R and E7b from unlisted U; second case with neither from a listed relay | auto_resolved origin_wins keeps E7a; second case resolves drop_all; events emitted |
| TEST-PS-086-09.T06 | integration | PS-086-03.R03, PS-086-04.R01 | author publishes E8 with ext.supersedes naming both cids | conflict superseded with supersededByCid; resolved event emitted |
| TEST-PS-086-09.T07 | contract | PS-086-04.R01, PS-086-04.R02, PS-086-09.R02 | detect, resolve and is_frozen | outputs and events validate against registry schemas; resolved carries candidateCids, statementClass and freezeScope |
| TEST-PS-086-09.T08 | integration | PS-086-04.R03 | account moved event and a new portable document for the author while a public conflict is open | listed relays recomputed before the 7-day decision |
| TEST-PS-086-09.T12 | chaos | PS-086-06.R03, PS-086-04.R04 | kill process between conflict write and event; consumer unavailable for 90 s; domain module tries to act during that window | freeze and candidate quarantine committed with the detection; the domain action is refused through is_frozen; event delivered after restart; UI warning shown above 60 s lag |
| TEST-PS-086-09.T19 | unit | PS-086-01.R04, PS-086-04.R04 | each registry predicate: consents on one subject with different digests, overlapping reservations to different holders, two deal obligation digests, two moves with different toRelay, plus non-conflicting pairs | detect is called exactly for the conflicting pairs and freezeScope names the subject |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
