# F12.S01.M02 — Moderation evidence

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S01](../SPEC.md). **Process IDs:** PS-093-01…PS-093-10. **Code:** `packages/moderation/src/reporting/evidence`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Captures an immutable, hashed snapshot of content as a vault or relay held it at report time, so that moderation, appeals and legal holds judge what was actually shown even if the author later edits or deletes it. The snapshot embeds the author's signed envelope (CTR-FED-001) and its content id, so it is evidence of what the author's key signed and of what this store held; it is not proof of real-world identity or of delivery. Public content is captured in full; private (P2) content such as an end-to-end message is captured as metadata only unless the reporter approves a redacted participant disclosure. Bodies and copied private media are stored as encrypted evidence blobs with their own keys and reference counts, public media is referenced by content address, and every read is written to an append-only access log. The same code runs in the reporter's vault and on a relay that received a report.

## Responsibilities

- Own the EvidenceSnapshot and EvidenceAccess records in the store that captured them (vault or relay), never synced between stores except inside a report or case bundle.
- Canonicalize content (RFC 8785 JCS), compute SHA-256, and keep the author's signed envelope bytes with the snapshot; verify hash and author signature on demand and before every export.
- Store bodies and copied P2 media in encrypted evidence blobs (XChaCha20-Poly1305, one random 256-bit key per blob) with reference counts, so purge is cryptographic shredding once no active snapshot references a blob; reference P0 media by blob:sha256 (N9).
- Produce the metadata-only capture for P2 targets and the redacted participant-disclosure preview (rules redact/1) that the reporter must approve before plaintext leaves the vault.
- Record every read in an append-only access log (who, why, when) and expose it to the store owner and operators, and a redacted view to the content author.
- Honour relay legal holds (re-checked through privacy.legal_hold.check) and retention (RET-EVIDENCE) through the RetentionPurgePort registered with F10.S01.M02.

## Not responsible for

- Deciding whether content violates policy (F12.S02.M01 and F12.S02.M03).
- Reports, report statements and reporter protection (F12.S01.M01).
- Retention sweeps and legal hold approval (F10.S01.M02); this module registers its purge port and re-checks holds.
- Public media storage and metadata stripping (F15.S02.M03 MediaBlob, F10.S02.M03).
- Dispute evidence uploaded by deal parties (F09.S02.M02).
- Future: third-party timestamping (RFC 3161) of snapshot hashes; zero-knowledge disclosure of end-to-end messages.

## User stories

- As a moderator of a relay, I open a case and see exactly what the reporter's signed copy looked like, with a hash badge and author-signature badge.
- As a member whose content was actioned by a relay, I can view the snapshot of my own content that the decision relied on, when I appeal.
- As a relay operator, I can see who accessed a snapshot and why, and export that log for an audit.
- As a member reporting a private message, I see a redacted preview of exactly what would be disclosed and decide whether to send it.

## Edge cases

- Content is edited right after being reported; the snapshot keeps the earlier signed revision and a later capture of the new revision is a separate record linked by targetId.
- The target is an end-to-end encrypted message; by default the snapshot holds only metadata (content id, sender key, sender signature); a disclosure of the plaintext needs an approved redacted preview, and an unsigned message can only be a labelled 'reporter claim' that carries less weight.
- A reported message disclosure removed nothing in its redact/1 preview; the snapshot keeps the message key K with the disclosed text, and verification recomputes the signed key commitment and decrypts the signed ciphertext to the same text; a K that fails either check is refused with MODERATION_EVIDENCE_COMMITMENT_MISMATCH.
- A listing has 10 photos of 5 MiB each; its public photos are referenced by blob:sha256 without copying, so the listing stays reportable.
- Snapshot body exceeds 256 KiB or has more than 10 media items; capture truncates nothing and returns PAYLOAD_TOO_LARGE so a report is never filed on partial evidence.
- Stored body no longer matches its hash (corruption or tampering); verification fails, the integrity flag becomes failed, a local or operator alert fires, decisions citing it are flagged, and the snapshot is still shredded at retention end.
- Author signature does not verify (forged or altered copy); capture is refused with MODERATION_EVIDENCE_SIGNATURE_INVALID so nobody is accused on an unsigned copy.
- Legal hold placed on the author's records on a relay; the purge port skips the snapshot until privacy.legal_hold.check reports no hold.
- Two captures of identical content; each gets its own snapshot record and both reference one evidence blob whose reference count is 2.

## UX and accessibility

- Snapshot viewer: read-only rendering of captured content, hash value (first 12 hex characters with copy action), captured-at, target revision, integrity status, author-signature status, disclosure label (public, metadata only, participant disclosure, reporter claim).
- Disclosure preview (reporter vault): redacted copy with each redaction highlighted and counted by rule, 'Approve and send this copy' and 'Send metadata only' buttons, and the note that the person may infer who reported.
- Access log table (store owner and relay operator): accessor pseudonym, role, purpose, timestamp, export action; the content author sees purpose, role and time only.

**States:** loading; hash-matches; integrity-failed; purged; forbidden; metadata-only; disclosure-preview

**Accessibility:** Hash, signature and disclosure badges convey status by text and icon, not by color alone.; Media thumbnails carry alt text from the captured alt field or the label 'image without description'.; Viewer and preview content are reachable by keyboard and announce load result and redaction count in an aria-live polite region.

Headless service with three views: the moderator case screen embeds a snapshot viewer (sanitized text, media thumbnails, hash badge 'hash matches' or 'integrity failed', author-signature badge, disclosure label, capture time labelled with the store clock), the subject's appeal screen shows the same viewer without reporter data, and the reporter's disclosure preview shows the redacted copy before approval.

## Owned data

- `EvidenceSnapshot` (classrup.moderation.evidencesnapshot/v1, P2, RET-EVIDENCE)
- `EvidenceAccess` (classrup.moderation.evidenceaccess/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `moderation.evidence.capture`, `moderation.evidence.ingest_bundle`, `moderation.evidence.verify`, `moderation.evidence.prepare_disclosure`, `moderation.evidence.approve_disclosure`
- Queries: `moderation.evidence.read`, `moderation.evidence.read_own`, `moderation.evidence.list_access`
- Emits: `moderation.evidence.captured`
- Consumes: `privacy.legal_hold.placed`, `privacy.legal_hold.released`, `privacy.deletion.completed`

## Dependencies

F15.S02.M03, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-093-01 | [Domain schema](domain_schema.md) | 5 |
| PS-093-02 | [Validation rules](validation_rules.md) | 5 |
| PS-093-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-093-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-093-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-093-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-093-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 6 |
| PS-093-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-093-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-093-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/reporting/evidence/index.ts`.

## Acceptance criteria

- All tests T01–T23 pass in CI.
- Every read, verify, export and purge of a snapshot produces exactly one access row (property and abuse tests).
- A modified snapshot body, media or author signature is always detected by verification, and no P2 plaintext reaches a relay without an approved disclosure.
