# PS-118-02 — Validation rules: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-02.R01** Configuration is validated strictly at startup against a typed schema with defaults and ranges; unknown RELAY_* variables are warned about, invalid ones abort startup.
- **PS-118-02.R02** Every HTTP request is bounded by size and time limits for its route class before it reaches the command bus or the media store.
- **PS-118-02.R03** Violations map to stable codes; configuration failures use exit code 78 (EX_CONFIG).
- **PS-118-02.R04** Identity changes are checked for revision, rate and signing authority before any statement is signed, and the media route serves only public unencrypted blobs.
- **PS-118-02.R05** The relay key file is checked with F16.S01.M02 checkSecretFile before it is read and the seed is held only in the Secret wrapper, and the secrets owned by F16.S01.M02 use RELAY_SECRET_<NAME> or RELAY_SECRET_<NAME>_FILE and are never read, printed or validated by this module's configuration loader.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | process.versions.node ≥ 22.18.0 and node:sqlite loads | PLATFORM_RELAY_RUNTIME_UNSUPPORTED |
| V02 | RELAY_DATA_DIR and RELAY_DB_PATH are set and writable | PLATFORM_RELAY_CONFIG_INVALID |
| V03 | RELAY_PUBLIC_URL is an https origin (http allowed only when RELAY_ENV=development) | PLATFORM_RELAY_CONFIG_INVALID |
| V04 | RELAY_ALLOWED_ORIGINS is a comma list of https origins of allowed PWA hosts, no wildcard, ≤ 20 entries | PLATFORM_RELAY_CONFIG_INVALID |
| V05 | RELAY_PORT 1..65535, RELAY_JSON_BODY_LIMIT_BYTES 1024..262144 (default 262144), RELAY_MEDIA_BODY_LIMIT_BYTES 65536..5308416 (default 5308416), RELAY_DRAIN_MS 1000..30000, RELAY_OUTBOX_BATCH 1..500 | PLATFORM_RELAY_CONFIG_INVALID |
| V06 | request body ≤ the limit of its route class: JSON routes (/api/v1/*, /fed/v1/*, /mailbox/v1/*) RELAY_JSON_BODY_LIMIT_BYTES; PUT /media/v1/* RELAY_MEDIA_BODY_LIMIT_BYTES and the decoded blob ≤ the tenant maxUploadBytes from TenantPort (≤ 5242880, N9) | PAYLOAD_TOO_LARGE |
| V07 | relay is not draining when the request is accepted | PLATFORM_RELAY_DRAINING |
| V08 | key file present when RelayIdentity exists, and its public key equals the stored active key | PLATFORM_RELAY_IDENTITY_MISSING |
| V09 | dispatcher lease acquired (holder = instance uuid, TTL 30 s) | PLATFORM_RELAY_DUPLICATE_INSTANCE |
| V10 | rotate and revoke carry expectedRevision equal to the stored revision of the key they change | CONFLICT_REVISION |
| V11 | rotate: no rotation completed in the last 86400000 ms; revoke and the --new-identity compromise path are exempt | RATE_LIMITED |
| V12 | GET /media/v1/sha256-<base64url> serves a blob only when its privacy is P0 and encrypted is false; any other blob answers exactly like a missing one | NOT_FOUND |
| V13 | an access log line carries only a registered route template (for example /api/v1/cmd/:name, /mailbox/v1/:id, /media/v1/:ref), never a raw path, path parameter, query string, mailbox id or listing id, and no IP prefix on mailbox routes; the CI log lint fails otherwise | VALIDATION_FAILED |
| V14 | the key file (and a pending successor key file) passes F16.S01.M02 checkSecretFile - mode 0400 or 0600, owner is the process user, not a symlink, at most 4096 bytes - before it is read | SECURITY_SECRET_PERMISSIONS |
| V15 | the configuration loader ignores RELAY_SECRET_<NAME> and RELAY_SECRET_<NAME>_FILE variables (reserved for F16.S01.M02 loadSecret): they are neither warned about as unknown nor printed, and no RELAY_* variable other than these holds a secret value | PLATFORM_RELAY_CONFIG_INVALID |
| V16 | the route table and the bundle of a production build (RELAY_ENV production or staging, entry apps/relay/src/main.ts) contain no test-only route or hook such as a clock or seed endpoint; only apps/relay/src/e2e.ts registers them, in process | PLATFORM_RELAY_CONFIG_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T02 | unit | PS-118-02.R01, PS-118-02.R02 | each config rule V01-V05 violated in turn plus an unknown RELAY_* variable | exit code 78, names listed, values absent from output; unknown variable only warned |
| TEST-PS-118-09.T03 | integration | PS-118-02.R02, PS-118-02.R03 | send a 300 KiB JSON body, a 6 MiB media upload, a 4.5 MiB media upload above the tenant limit, slow headers, a request during drain | PAYLOAD_TOO_LARGE for the first three before the bus, connection closed after 10 s headers timeout, PLATFORM_RELAY_DRAINING with Retry-After 5 |
| TEST-PS-118-09.T20 | abuse | PS-118-03.R03, PS-118-01.R03, PS-118-02.R04 | CLI revoke of the stolen active key 1 h after a rotation, using the pre-signed certificate; vault holds receipts by that key stored before and after revokedAt | revocation accepted without prior-key authorization and without RATE_LIMITED; relay refuses to serve until --new-identity; receipts stored before revokedAt still verify, later ones are rejected |
| TEST-PS-118-09.T22 | contract | PS-118-04.R06, PS-118-02.R04 | GET /media/v1 for a P0 blob from an allowlisted and a foreign origin, for an encrypted blob and for a missing blob | P0 blob served with Cache-Control public, max-age=31536000, immutable, ETag, nosniff, CORP cross-origin, ACAO only for the allowlisted origin, Vary Origin, no Set-Cookie and no no-store; encrypted and missing both 404 |
| TEST-PS-118-09.T24 | integration | PS-118-06.R01, PS-118-04.R02, PS-118-02.R04 | rotate replayed with the same Idempotency-Key and body, with the same key and a different body, with a stale expectedRevision, and a second rotation 2 h later | original response replayed; IDEMPOTENCY_KEY_REUSED; CONFLICT_REVISION; RATE_LIMITED |
| TEST-PS-118-09.T27 | abuse | PS-118-09.R04, PS-118-02.R01 | build and start the production relay, probe clock and seed routes and list the route table; scan the bundle; then start apps/relay/src/e2e.ts in process and advance its FakeClock | 404 on both probes, no test route or hook in the table or bundle (V16); the e2e handle moves receipt time in process only, with no HTTP route for it |
| TEST-PS-118-09.T28 | integration | PS-118-02.R05, PS-118-01.R01 | key file 0644, symlink, foreign owner, then 0400; RELAY_SECRET_DATA_KEY_FILE set; inspect startup output, logs and util.inspect of the loaded key | SECURITY_SECRET_PERMISSIONS for the first three and no seed read; 0400 starts; RELAY_SECRET_* neither warned nor printed; the key renders [REDACTED] |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, F16.S01.M01, F16.S01.M02, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
