# PS-140-05 — Authorization and capabilities: Offline testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M03 Offline testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/offline` · **Contracts:** [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-140-05.R01** Offline tests use real authorization: a queued statement signed by a key revoked while offline is refused or quarantined by the receiving vault (F11.S01.M02), and the sender's entry shows the reported rejection as Needs attention with its reason; quarantine is the receiver's status, not an outbox state.
- **PS-140-05.R02** On vault lock (F07.S01.M02) and principal switch, the suite asserts: in-memory keys are dropped; the vault in IndexedDB stays encrypted and unreadable until unlock; OutboxEntry rows are kept but not sent; relay access tokens are dropped; the principal's image partition is unbound (CLEAR_USER_CACHES reason lock or principal switch, F15.S01.M02); a second principal on the device gets a separate vault; and only an explicit Erase vault (F10.S01.M04 deletion flow) after an export prompt may delete IndexedDB data.
- **PS-140-05.R03** No test uses an elevated relay role (operator, moderator); test principals are locally created identities.

## Specification

_None._

No runtime capabilities of its own: this module runs only in developer shells and CI jobs. Under ADR-0016 (CTR-CAP-001 CAP-8) the tests exercise two layers: vault policy (local principal mutates only its records; incoming signed statements accepted only from a key authorized for the role, else quarantined) and relay policy (relay-signed requests or relay access tokens). Tests never ship in the PWA or relay bundles.

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-140-09.T07 | e2e | PS-140-05.R01, PS-140-05.R03 | revoke signing key while offline then reconnect | receiver refuses or quarantines the statement; the sender's entry shows Needs attention with the reported reason; no elevated role used |
| TEST-PS-140-09.T08 | e2e | PS-140-05.R02, PS-140-07.R02 | P1 locks the vault with 3 queued entries and a relay access token; P2 unlocks its own vault; P1 unlocks again; finally P1 runs Erase vault | on lock in-memory keys are dropped, IndexedDB records stay encrypted and unreadable, the 3 entries are kept and not sent, relay access tokens are dropped and CLEAR_USER_CACHES reason lock unbinds the image partition; P2 sees only its separate vault; after unlock all records and the 3 entries are intact and sending resumes; IndexedDB data is deleted only by Erase vault after the export prompt |

## Dependencies

Module depends on: CTR-IDM-001, CTR-ERR-001, CTR-UX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M04, F15.S01.M01, F15.S01.M02, F15.S02.M03, F07.S01.M02, F10.S01.M04, F11.S01.M02, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
