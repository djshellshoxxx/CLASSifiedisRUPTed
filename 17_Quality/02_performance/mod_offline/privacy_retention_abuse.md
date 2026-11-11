# PS-140-07 — Privacy, retention and abuse: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-07.R01** Cached and queued data are synthetic; outbox entries for relay destinations contain only ciphertext for P2 and no P3 field, and an enqueue of plaintext P2 or of P3 is refused (F15.S01.M01, CTR-PRV-001 PRV-5), proven by a planted-leak test.
- **PS-140-07.R02** Vault lock and principal switch keep the previous principal's vault encrypted and its outbox entries kept but neither shown nor sent; a locked vault's records are unreadable without unlock, unlocking restores them intact with zero entries lost, and only Erase vault after an export prompt deletes them.
- **PS-140-07.R03** Browser traces from offline tests redact Authorization headers.

## Specification

**Data classification**
- Synthetic outbox entries and cached public listings (P0/P1).
- No real credentials; test tokens are random and short-lived.

**Retention**
- Reports 14 days as CI artifacts; browser contexts are discarded after each test.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay-authenticated response or vault data exposed to the next principal on a shared device | network-only routes for relay-authenticated requests; per-principal image partitions unbound on lock and principal switch; locked vault unreadable without unlock; tests assert all three |
| T02 | Resend applies a statement twice, for example a payment claim recorded twice | exactly-once assertions by cid and Idempotency-Key across resets |
| T03 | Queued command with stale authority executes after privilege revocation | replay re-checks authorization; test expects FORBIDDEN |
| T04 | A sign-out style wipe destroys the user's only copy of records and queued signed statements | lock and principal switch never delete; only Erase vault after an export prompt deletes vault data; V07 fails a planted wipe on lock |

**Abuse controls**
- Quota-filling attempts: the test fills storage to 95 percent and expects a visible error rather than silent drop.
- Outbox size is limited to 200 entries and 5 MiB of payload per principal (or the lower local limit); the next enqueue is refused with PLATFORM_OUTBOX_FULL and a visible message.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T08 | e2e | PS-140-05.R02, PS-140-07.R02 | P1 locks the vault with 3 queued entries and a relay access token; P2 unlocks its own vault; P1 unlocks again; finally P1 runs Erase vault | on lock in-memory keys are dropped, IndexedDB records stay encrypted and unreadable, the 3 entries are kept and not sent, relay access tokens are dropped and CLEAR_USER_CACHES reason lock unbinds the image partition; P2 sees only its separate vault; after unlock all records and the 3 entries are intact and sending resumes; IndexedDB data is deleted only by Erase vault after the export prompt |
| TEST-PS-140-09.T18 | abuse | PS-140-07.R01 | planted leak - enqueue a plaintext P2 offer and a P3 address field for a relay destination, and plant a bypass of the enqueue check | both enqueues refused by F15.S01.M01; stored relay-destination entries contain only ciphertext; the bypass fails with QUALITY_OFFLINE_PLAINTEXT_QUEUED |
| TEST-PS-140-09.T19 | abuse | PS-140-07.R03 | scan every browser trace and HAR from the offline browser run | no Authorization header value and no relay access token present |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02, F15.S02.M03, F07.S01.M02, F10.S01.M04, F11.S01.M02, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
