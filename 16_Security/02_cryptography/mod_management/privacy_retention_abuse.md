# PS-129-07 — Privacy, retention and abuse: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-07.R01** Public keys, status and revocations are P1 or P0 once published and contain no personal data beyond public DIDs, and the revocation list reveals only key hashes, DIDs of published identity documents, document references, reasons and times.
- **PS-129-07.R02** KeyRecords are retained under RET-EVIDENCE (2 years after the last status change or verification that used them), and the permanent revoked-key set (key hash, revokedAt, revocationStatementCid) is kept as long as the store exists, recorded as an exception to CTR-PRV-001 because it holds no personal data and stops key resurrection.
- **PS-129-07.R03** Abuse (false revocations, registry flooding, revocation suppression, list replay, rollback of revocation, agreement-key substitution) is limited by F07 signer rules, limits, signed monotonic list heads from at least two sources and the permanent revoked-key set.

## Specification

**Data classification**
- KeyRecord: P1 public key material and status.
- Revoked-key set and list heads: P0 public hashes, sequence numbers and times.
- Local notes on counterparty keys: P3 in the vault only.

**Retention**
- KeyRecord: RET-EVIDENCE (2 years after the last status change or verification that used it), then purged.
- Revoked-key set: permanent while the store exists (CTR-PRV-001 exception; key hash, revokedAt and statement cid only, as F07.S02.M01 keeps revokedKeyHashes).
- Revocation list heads: the newest per relay is kept; older heads are kept 30 days for replay comparison.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Attacker with a stolen linked device key revokes the victim's other keys | F07 rules apply - such revocations are pending for 7 days, a counter-revocation makes them contested, and only the DID root key or recovery kit decides |
| T02 | Revocation suppression by a malicious relay | revocations travel inside root-signed identity documents any relay or peer can carry; vaults poll the own relay and the counterparty's listed relays and require two independent sources for fresh on high-stakes checks |
| T03 | Backdated compromise date to invalidate old consents | effectiveFrom clamped to 30 days before the earliest evidence (never the signedAt claim), and affected consents are labelled rather than silently invalidated |
| T04 | Registry flooding with junk keys | user keys only from root-signed identity documents with at most 10 active keys; relay-owned keys only by relay_operators; relay rate limits via F12.S03.M03 class key.register fail-closed |
| T05 | Rollback of a revocation (key resurrection), including after the KeyRecord is purged | revoked status is permanent and the revoked-key set is never deleted; no command can set active again |
| T06 | Stale knowledge treated as safe offline | freshness class from list head issuedAt shown on every verification result; high-stakes actions require fresh from two sources or an explicit user acknowledgement |
| T07 | Freeze attack - a relay replays an older valid list head | listSeq must increase and issuedAt must not go back; a regression is recorded as a replay and never refreshes freshness |
| T08 | Relay substitutes an agreement key | agreement keys are never registered; senders derive them from listed Ed25519 device keys (F16.S02.M01) |
| T09 | Holder of a stolen device key signs an account_deleted revocation whose finalCids list statements it forged | finalCids only waive the revocation check for statements whose signature by that key verifies, are capped at 120, and are ignored once the account root key revokes the key for compromise |

**Abuse controls**
- Relay-owned key registration limited to 20 per day per relay and revocation recording to 50 per day per source via F12.S03.M03.
- Relay refuses statements larger than 8 KiB and list pages larger than 500 entries.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T09 | abuse | PS-129-07.R03, PS-129-02.R01 | 11th active device key in a document; 21st relay-owned key; 51st revocation from one source in a day; oversized statement; X25519 agreement key presented by a relay for a device | SECURITY_KEY_LIMIT; SECURITY_KEY_LIMIT; RATE_LIMITED; PAYLOAD_TOO_LARGE; SECURITY_KEY_UNAUTHORIZED with nothing stored |
| TEST-PS-129-09.T12 | abuse | PS-129-07.R03, PS-129-02.R03 | relay X replays an older signed list head with lower listSeq; high-stakes get_status with only relay X confirming | SECURITY_REVOCATION_LIST_STALE recorded, freshness stays at the stored head; freshnessClass stale until relay Y confirms |
| TEST-PS-129-09.T17 | unit | PS-129-07.R01 | content scan of a published revocation list | only key hashes, DIDs, document references, reasons and times; no IPs, handles, labels or notes |
| TEST-PS-129-09.T18 | integration | PS-129-07.R02 | purge a revoked KeyRecord after RET-EVIDENCE, then present the same key again | KeyRecord gone; revoked-key set entry kept; CONFLICT_STATE |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
