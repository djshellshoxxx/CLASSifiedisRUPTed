# F16.S01.M02 — Secrets handling

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S01](../SPEC.md). **Process IDs:** PS-127-01…PS-127-10. **Code:** `packages/security/src/authz/secrets`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Secrets handling for relay processes and the build pipeline. Relay secrets that this module's manifest owns (relay data key, audit pepper, push VAPID private key, SMTP credentials) are read only from RELAY_SECRET_* environment variables or files with strict permissions, held in a Secret wrapper that cannot be logged or serialized, compared in constant time, and stored as hashes where a token must be verified. The relay signing key is owned by F15.S02.M01, which keeps it in its own key file; this module supplies only the Secret wrapper and the file checks that F15.S02.M01 applies to that file. There are no server-held user secrets: user keys live only in the user's vault (F16.S02.M01). Keys that wrap stored data keep their old version until every object is re-wrapped. The CI pipeline scans every change and the full history for committed secrets.

## Responsibilities

- Provide loadSecret(name) reading RELAY_SECRET_<NAME> from the environment or RELAY_SECRET_<NAME>_FILE from a file, with file permission and size checks, and checkSecretFile(path) for key files owned by other modules (the F15.S02.M01 relay key file).
- Provide the Secret wrapper whose string, JSON, inspect and error forms always render as [REDACTED] and whose raw value is reachable only through reveal() at the use site.
- Provide constant-time comparison (equalConstantTime) and token hashing (SHA-256 of a 256-bit random token) for relay access tokens.
- Provide log and error redaction - a deny-list of key names and a pattern scanner applied before any log line is emitted.
- Provide the secret-scanning CI step - pattern rules plus entropy rules, run on each pull request diff and weekly on full history, failing the build on a match.

## Not responsible for

- User device keys and vault encryption (F16.S02.M01).
- The relay signing key, its key file, rotation and revocation certificates (F15.S02.M01), which uses checkSecretFile and the Secret wrapper from this module.
- Key registry and revocation (F16.S02.M02) and signature formats (F16.S02.M03).
- Hosting provider secret stores or hardware security modules; the module reads what the process environment provides.
- Future: pluggable secret backends (HashiCorp Vault, cloud KMS) behind the same loadSecret interface; HSM-backed relay keys.

## User stories

- As a relay operator, I configure secrets by environment or mounted files and the relay refuses to start if a required secret is missing or a secret file is world-readable.
- As a developer, my pull request fails if it contains something that looks like a key or token, with a message naming the rule and file but not echoing the value.
- As a relay operator, I can rotate the relay data key and see which wrapped objects remain on the old key, and the relay never lets me remove the old key while objects still depend on it.

## Edge cases

- Both RELAY_SECRET_X and RELAY_SECRET_X_FILE are set; startup fails with SECURITY_SECRET_AMBIGUOUS rather than picking one.
- Secret file has mode 0644 or is a symlink to another path; startup fails with SECURITY_SECRET_PERMISSIONS and names the file path but not its content.
- A secret appears in a stack trace via string interpolation; the Secret wrapper renders [REDACTED] and the redaction scanner removes any 43-character base64url or 64-character hex run labelled by a deny-listed key.
- A comparison secret (SMTP password, audit pepper) is rotated while requests are in flight; a reload signal (SIGHUP) swaps in the new value for new requests and the old value is valid for a configurable overlap of at most 300 seconds.
- CI scanner false positive on a test vector; the rule allows an allow-list entry only through a reviewed file listing path and hash, never by inline comment.
- Secret committed historically; weekly full-history scan fails the pipeline, and the runbook F16.S03.M03 for key compromise requires rotation, not history rewrite alone.
- The operator removes the old data key version while 1 200 objects are still wrapped by it; startup refuses with SECURITY_SECRET_MISSING naming the key version and the count of objects that depend on it.

## UX and accessibility

- Relay startup summary: table of required secrets with source (env, file) and status loaded or missing, without values; data-key versions with the number of objects still wrapped by each.
- CI scan report: rule ID, file path, line number, redacted match fingerprint (first 4 characters of a hash), suggested action.

**States:** loaded; missing; permission-error; ambiguous; rotating; rewrap-pending

**Accessibility:** CI and startup reports are plain text with one finding per line so screen readers and terminals handle them.; Status is conveyed by words (loaded, missing) rather than color.; The operator documentation pages follow the WCAG 2.2 AA requirements of F14.

Headless tooling. Operator-visible surfaces are the relay startup log (secret names and source, never values), the /readyz detail for secret loading status, the data-key rotation progress report, and the CI report listing rule ID, file and line.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-OBS-001, CTR-PRV-001, CTR-CAP-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-127-01 | [Domain schema](domain_schema.md) | 3 |
| PS-127-02 | [Validation rules](validation_rules.md) | 3 |
| PS-127-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-127-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-127-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-127-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-127-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-127-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-127-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-127-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/security/src/authz/secrets/index.ts`.

## Acceptance criteria

- All tests T01–T13 pass in CI.
- No secret value appears in any log, error, metric, export or backup artifact (property and integration tests).
- The CI scan blocks a pull request that adds a secret-like value and passes the corpus of negative samples, and no data-key version still wrapping objects can be removed without the relay refusing to start.
