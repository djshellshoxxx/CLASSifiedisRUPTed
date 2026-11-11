# F12.S01.M02 — Moderation evidence

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S01](../SPEC.md). **Process IDs:** PS-093-01…PS-093-10. **Code:** `packages/moderation/src/reporting/evidence`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Captures an immutable, hashed snapshot of content as a vault or relay held it at report time, so that moderation, appeals and legal holds judge what was actually shown even if the author later edits or deletes it. The snapshot embeds the author's signed envelope (CTR-FED-001) and its content id, so it is evidence of what the author's key signed and of what this store held; it is not proof of real-world identity or of delivery. Bodies are encrypted with per-object keys and hashed with SHA-256, and every read is written to an append-only access log. The same code runs in the reporter's vault and on a relay that received a report.

## Responsibilities

- Own the EvidenceSnapshot and EvidenceAccess records in the store that captured them (vault or relay), never synced between stores except inside a report or case bundle.
- Canonicalize content (RFC 8785 JCS), compute SHA-256, and keep the author's signed envelope bytes with the snapshot; verify hash and author signature on demand and before every export.
- Encrypt snapshot bodies with a per-snapshot random 256-bit key (XChaCha20-Poly1305) so deletion at retention end is cryptographic shredding.
- Record every read in an append-only access log (who, why, when) and expose it to the store owner, and to the content author for snapshots of their own content held by a relay.
- Honour legal holds and retention (RET-EVIDENCE) for snapshot bodies.

## Not responsible for

- Deciding whether content violates policy (F12.S02.M01 and F12.S02.M03).
- Reports and reporter protection (F12.S01.M01).
- Retention sweeps and legal hold approval (F10.S01.M02); this module reacts to their events.
- Dispute evidence uploaded by deal parties (F09.S02.M02).
- Future: third-party timestamping (RFC 3161) of snapshot hashes; zero-knowledge disclosure of end-to-end messages.

## User stories

- As a moderator of a relay, I open a case and see exactly what the reporter's signed copy looked like, with a verified hash and author-signature badge.
- As a member whose content was actioned by a relay, I can view the snapshot of my own content that the decision relied on, when I appeal.
- As a relay operator, I can see who accessed a snapshot and why, and export that log for an audit.

## Edge cases

- Content is edited right after being reported; the snapshot keeps the earlier signed revision and a later capture of the new revision is a separate record linked by targetId.
- The target is an end-to-end encrypted message; the reporter's vault holds the plaintext, so the snapshot records it as a reporter disclosure with the sender's signature if the message was signed; without a sender signature it is labelled 'reporter claim' and carries less weight.
- Snapshot body exceeds 256 KiB or has more than 5 media items; capture truncates nothing and returns PAYLOAD_TOO_LARGE so a report is never filed on partial evidence.
- Stored body no longer matches its hash (corruption or tampering); verification fails, the snapshot is marked integrity_failed, a local or operator alert fires, and decisions citing it are flagged.
- Author signature does not verify (forged or altered copy); capture is refused with MODERATION_EVIDENCE_SIGNATURE_INVALID so nobody is accused on an unsigned copy.
- Legal hold placed on the author's records; retention purge skips the snapshot until the hold is released.
- Two captures of identical content in the same minute; each gets its own snapshot record that shares contentHash, and the body is stored once.

## UX and accessibility

- Snapshot viewer: read-only rendering of captured content, hash value (first 12 hex characters with copy action), captured-at, target revision, verification status, author-signature status.
- Access log table (store owner and relay operator only): accessor pseudonym, purpose, timestamp, export action.

**States:** loading; verified; integrity-failed; purged; forbidden

**Accessibility:** Hash and signature badges convey status by text and icon, not by color alone.; Media thumbnails carry alt text from the captured alt field or the label 'image without description'.; Viewer content is reachable by keyboard and announces load result in an aria-live polite region.

Headless service with two views: the moderator case screen embeds a snapshot viewer (sanitized text, media thumbnails, hash badge 'verified' or 'integrity failed', author-signature badge, capture time labelled with the store clock), and the subject's appeal screen shows the same viewer without reporter data.

## Owned data

- `EvidenceSnapshot` (classrup.moderation.evidencesnapshot/v1, P3, RET-EVIDENCE)
- `EvidenceAccess` (classrup.moderation.evidenceaccess/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `moderation.evidence.capture`, `moderation.evidence.verify`
- Queries: `moderation.evidence.read`, `moderation.evidence.read_own`, `moderation.evidence.list_access`
- Emits: `moderation.evidence.captured`
- Consumes: `privacy.legal_hold.placed`, `privacy.legal_hold.released`, `privacy.retention.purged`

## Dependencies

F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-093-01 | [Domain schema](domain_schema.md) | 3 |
| PS-093-02 | [Validation rules](validation_rules.md) | 3 |
| PS-093-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-093-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-093-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-093-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-093-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-093-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-093-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-093-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/reporting/evidence/index.ts`.

## Acceptance criteria

- All tests T01–T14 pass in CI.
- Every read of a snapshot body produces exactly one access row (property and abuse tests).
- A modified snapshot body, media or author signature is always detected by verification.
