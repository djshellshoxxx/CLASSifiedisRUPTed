# F10.S01.M02 — Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S01](../SPEC.md). **Process IDs:** PS-079-01…PS-079-10. **Code:** `packages/privacy/src/data_controls/retention`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Enforces the retention classes of CTR-PRV-001 (ephemeral 24 h, short 30 days, standard, evidence 2 years, audit 1 year, and the expiry-bounded signal class that keeps a record until its own expiresAt, at most 365 days, then a counts-only rollup for 365 days, PRV-8) by scheduled sweeps that purge expired records through the RetentionPurgePort that this module defines and every data-owning module implements, discovered through the kernel port registry. A sweep runs in the user's vault for the user's own records and on each relay for the data that relay holds, under that relay's published policy and optional jurisdiction override. The vault sweep guards against a device clock that jumps forward by asking the user to confirm before purging. A legal hold is a relay-side action: two different relay operators whose DIDs are not linked must request and approve it, at least one of them a relay admin (CTR-PRV-001), and it keeps relay-held sealed data from being purged. A hold can never reach into a user's vault or force a user to keep data.

## Responsibilities

- Own RetentionPolicy rows per scope (vault or relay) and class with bounded durations and a recorded source (default, jurisdiction, user or relay operator).
- Define the RetentionPurgePort contract and run retention sweeps in batches through the ports each module registers, emitting privacy.retention.purged with counts only.
- Own LegalHold on relays with two-person approval in which requester and approver differ, are not linked by key linkage (N11) and include at least one relay admin, a 72 h approval deadline, a 180-day review and a two-person release with its own 72 h deadline.
- Exclude held subjects from sweeps and from relay-side purges triggered by federation.tombstone.applied or by a verified deletion statement applied through privacy.deletion.relay_apply (F10.S01.M04), keeping them sealed (no public serving) until release.
- Provide a dry-run preview of what a sweep would purge and a record of every run, and guard vault sweeps against forward clock jumps with a persisted high-water clock.
- Enforce RET-SIGNAL (CTR-PRV-001 PRV-8) - purge each signal record at its expiresAt and never later than 365 days after creation, after its module folded it into a counts-only rollup, and purge the rollup 365 days later.
- Discover RetentionPurgePort registrations through the kernel port registry at vault and relay composition (inverted registration), so modules that cannot list this module in depends_on without closing a cycle, such as F15.S01.M01 and F15.S04.M03, register their kinds without a depends_on edge.
- Carry the held subject (subjectKind and subjectRef) in privacy.legal_hold.placed and privacy.legal_hold.released so relay-side holders of that subject react without scanning every record.
- Refresh jurisdiction rows by ProfileRef {publisherId, code} from governance.jurisdiction_profile.activated in the vault (scope vault) and on the relay (scope relay), falling back to the bundled generic profile for a missing or unknown ref, and apply a Looser value only to records created at or after its looserFrom.
- Accept RetentionPurgePort kinds with a fixed anchor offset and a class cap, and kinds registered only at relay composition, such as governance.transparency_counter of F18.S02.M02 (RET-AUDIT, publishedAt + 90 days).

## Not responsible for

- Account and data deletion flows, grace period and crypto-shred (F10.S01.M04); its relay command asks this module whether a relay-held subject is under hold and calls the relay purge path.
- Export (F10.S01.M03) and consent (F10.S01.M01).
- Jurisdiction profile content, selection, upgrade confirmation and the Stricter or Looser merge table (F18.S01.M01), which this module reads by ProfileRef through governance.jurisdiction_profile.resolve and get.
- Key-linkage data (F07 identity, N11), read through a KeyLinkagePort supplied by the relay composition.
- Future: automated legal-request intake, notice templates for affected users, and hold reporting to regulators; MVP leaves these to relay operators.

## User stories

- As a user, I see how long each kind of my data is kept in my vault and what was purged last night, and I can shorten some classes within allowed bounds.
- As a relay operator, I publish my retention policy and my relay purges expired data on schedule with a run record.
- As a relay operator under a lawful request, I and a relay admin approve a hold on specific relay-held data, and the hold is reviewed every 180 days.
- As a user, I am told that a relay's legal hold can keep relay-held copies but cannot touch my vault.
- As a user whose device clock was changed, I am asked before my evidence or standard records are purged early.

## Edge cases

- A record kind has no registered purge port; the sweep skips it, records skipped_unregistered in the run and the CI check fails the build for new record kinds without a port.
- The same operator tries to request and approve a hold; refused with PRIVACY_HOLD_SELF_APPROVAL and the failed attempt is audited.
- Two operators without the admin role try to place a hold; the approval is refused with FORBIDDEN because CTR-PRV-001 requires an admin in the pair.
- The approver's DID is linked to the requester's DID by an F07 same-owner attestation or a rotation chain; refused with PRIVACY_HOLD_SELF_APPROVAL.
- A requested hold is not approved within 72 h, or its requester loses the operator role; it lapses and nothing is held.
- A release request is not answered by a second operator within 72 h; the hold returns to active and the operators are reminded.
- A record under hold is also tombstoned by its author; the relay stops serving it publicly but keeps the sealed copy until release, then purges within 24 h.
- A jurisdiction override sets evidence retention to 5 years; the sweep uses 1825 days for that scope and logs the source.
- A sweep is interrupted halfway; it resumes from the last committed batch cursor and never double-counts.
- The device clock is set back; the sweep never purges records whose anchor time is in the future of the local clock and does not move the high-water clock back.
- The device clock jumps forward by 3 days, by the user or by malware, or runs more than 24 h ahead of the latest relay-signed receipt time; the sweep runs as a dry run and purges RET-SHORT, RET-STANDARD and RET-EVIDENCE records only after the user confirms the preview.
- A RET-SIGNAL record carries an expiresAt 400 days after its createdAt; the sweep treats createdAt plus 365 days as its end, folds it into the counts-only rollup and purges it at that cap, and the CI conformance check fails the schema that allowed the longer expiry.
- A legal hold on an author is placed on a relay; privacy.legal_hold.placed names subjectKind author and the author's did as subjectRef, and the relay's evidence holder flags exactly that author's snapshots instead of re-checking every record.
- A selected profile's new version shortens evidenceDays from 1825 to 730; governance.jurisdiction_profile.activated with change upgrade_pending leaves every row unchanged, and only after the owner confirms (change upgraded) does the EVIDENCE row become 730 days with priorDurationDays 1825, so records created before looserFrom are still kept 1825 days.
- A publisher backdates effectiveFrom by a year to reach existing records; looserFrom is the later of effectiveFrom and the local time the version came into use in this scope, so no record created before the owner's confirmation or the relay upload loses retention.
- A retention row or a relay tenant names a ProfileRef that this scope does not know, or none at all; the refresh resolves the bundled generic profile and writes the CTR-PRV-001 defaults with fallback recorded, while a malformed code such as "EU DE" is refused with VALIDATION_FAILED.
- A resolved profile sets evidenceDays 180 or auditDays 90, which are inside the F18.S01.M01 ranges but below this module's class bounds; the refresh clamps them to 365 and 180 days and logs the clamp.
- TransparencyCounter rows of a period whose report is not yet published have no publishedAt; they are never purged by the 90-day offset and are purged only when their createdField passes the effective RET-AUDIT duration of the relay scope.

## UX and accessibility

- Vault data retention screen: table of classes with duration, source (for jurisdiction rows the profile name, ProfileRef and version, and a pending Looser upgrade when one waits for confirmation) and next sweep time; edit control for classes the user may shorten; last run summary with counts; clock-jump dialog showing the dry-run preview with Confirm purge and Not now.
- Relay operator console: policy editor with bounds, run history, and Legal holds list with Request, Approve, Reject and Release request actions (release decisions approve or decline), showing requester, approver, their roles and the review due date.

**States:** loading; default-policy; overridden; sweeping; clock-jump-confirm; hold-requested; hold-active; hold-release-requested; error

**Accessibility:** Durations are text with units (days) and forms use labelled inputs with bounds in helper text.; Hold status is shown as text plus icon with a polite live region on change.; Approve and Reject buttons are at least 44 px high with names including the hold reference.

## Owned data

- `RetentionPolicy` (classrup.privacy.retention_policy/v1, P3, RET-AUDIT)
- `LegalHold` (classrup.privacy.legal_hold/v1, P3, RET-AUDIT)

## Interfaces

- Commands: `privacy.retention_policy.set`, `privacy.retention.run`, `privacy.legal_hold.request`, `privacy.legal_hold.approve`, `privacy.legal_hold.reject`, `privacy.legal_hold.release_request`, `privacy.legal_hold.release_approve`
- Queries: `privacy.retention_policy.list`, `privacy.legal_hold.check`, `privacy.legal_hold.list`
- Emits: `privacy.retention.purged`, `privacy.legal_hold.placed`, `privacy.legal_hold.released`
- Consumes: `security.role.revoked`, `platform.tenant.configured`, `governance.jurisdiction_profile.activated`, `federation.tombstone.applied`

## Dependencies

F18.S01.M01, F16.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-079-01 | [Domain schema](domain_schema.md) | 6 |
| PS-079-02 | [Validation rules](validation_rules.md) | 7 |
| PS-079-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-079-04 | [Commands, queries and events](commands_queries_events.md) | 9 |
| PS-079-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-079-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-079-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-079-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-079-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-079-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/privacy/src/data_controls/retention/index.ts`.

## Acceptance criteria

- All tests T01 to T28 pass in CI.
- No hold can be activated or released by one person alone, by two linked DIDs, or by a pair without an admin.
- Active holds are never violated by any sweep or tombstone handler, and holds never alter a vault.
- Every record kind has a registered purge port or the build fails.
- A forward clock jump never purges RET-SHORT, RET-STANDARD or RET-EVIDENCE records without user confirmation.
