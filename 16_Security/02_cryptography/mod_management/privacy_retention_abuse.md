# PS-129-07 — Privacy, retention and abuse: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-07.R01** Public keys, status and revocations are P1 or P0 once published, contain no personal data, and the revocation list reveals only key IDs, reasons and times.
- **PS-129-07.R02** Records are retained under RET-EVIDENCE because old signatures are judged against historical status, and revoked keys are kept indefinitely as revoked records without private material.
- **PS-129-07.R03** Abuse (false revocations, registry flooding, revocation suppression, rollback of revocation) is limited by signer authority checks, limits and monotonic revocation.

## Specification

**Data classification**
- KeyRecord: P1 public key material and status.
- Local notes on counterparty keys: P3 in the vault only.

**Retention**
- Key records: RET-EVIDENCE (2 years after last related activity), revoked records kept as tombstone-like entries for 5 years for dispute evidence.
- Pending revocations without a matching key: 180 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Attacker with a stolen key revokes the victim's other keys | such revocations require the signer to be active in the principal chain and are flagged for recovery-key confirmation within 7 days; recovery-key revocations always win |
| T02 | Revocation suppression by a malicious relay | vaults poll more than one source, record the source and age of knowledge, and show freshness; revocation statements are signed by the key owner so any relay or peer can carry them |
| T03 | Backdated compromise date to invalidate old consents | effectiveFrom limited to 30 days before receipt, and affected consents are labelled rather than silently invalidated |
| T04 | Registry flooding with junk keys | 10 active device keys per principal, relay rate limits via F12.S03.M03 class key.register fail-closed, signed self-registration only |
| T05 | Rollback of a revocation (key resurrection) | revoked status is permanent in the state machine and in the unique index; no command can set active again |
| T06 | Stale knowledge treated as safe offline | freshness class shown on every verification result; high-stakes actions require fresh or an explicit user acknowledgement |

**Abuse controls**
- Registration limited to 20 per day per principal and revocation to 50 per day via F12.S03.M03.
- Relay refuses statements larger than 8 KiB.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T08 | abuse | PS-129-05.R01, PS-129-05.R02, PS-129-05.R03, PS-129-07.R01 | stolen K3 revokes K1 and K2; unauthorized signer revokes; recovery key revokes K3 | flagged pending confirmation; SECURITY_KEY_UNAUTHORIZED; recovery revocation wins |
| TEST-PS-129-09.T09 | abuse | PS-129-07.R03, PS-129-02.R01 | 11th device key; 21st registration in a day; 51st revocation | SECURITY_KEY_LIMIT, RATE_LIMITED, RATE_LIMITED; oversized statement rejected |
| TEST-PS-129-09.T11 | integration | PS-129-07.R02, PS-129-07.R03 | backdated effectiveFrom 31 days; consent received in the 20-day window | rejected for 31 days; accepted for 20 days with 'signed during claimed compromise' label |
| TEST-PS-129-09.T12 | integration | PS-129-02.R03, PS-129-07.R01 | peer relay unreachable for 8 days | freshness class unknown; high-stakes verify returns the warning |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
