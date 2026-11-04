# PS-130-07 — Privacy, retention and abuse: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-07.R01** Envelopes contain only the payload the signer chose to sign and key IDs; signing contexts and verification results never include secrets or P4 values.
- **PS-130-07.R02** Retention follows the embedding record (consents and receipts are RET-EVIDENCE) and the library stores nothing itself.
- **PS-130-07.R03** Replay, cross-protocol and substitution attacks are addressed by domain separation, revision binding and strict verification.

## Specification

**Data classification**
- Envelope: inherits the privacy class of the embedding record (P0 to P2).
- Verification results: ephemeral, not stored by the library.

**Retention**
- The library stores nothing; embedding records retain envelopes for their own class (RET-EVIDENCE for consents and receipts).
- Test vectors and context registry are versioned in the repository.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Cross-context replay (a login signature reused as a consent) | context string is part of the signed bytes and the verifier requires the expected context |
| T02 | Replay of a consent for a different revision or entity | payload binds entityType, entityId, revision and contentHash; verify checks against expected values |
| T03 | Signature malleability or small-order key tricks | strict RFC 8032 verification with canonical S and small-order checks; known-answer tests include malleable vectors |
| T04 | Canonicalization ambiguity to smuggle fields | verifier recomputes JCS, rejects duplicate keys, floats and lone surrogates, and compares to transmitted bytes |
| T05 | Backdated signedAt to evade revocation | signedAt is a claim; revocation uses the verifier's receipt time and the registry's effective-from rules |
| T06 | Over-reading a signature as proof of delivery or identity | UI honesty note; docs state that signatures prove key-holder assertion only |

**Abuse controls**
- Payload size limit 64 KiB and verification limited to 50 per request on a relay (F12.S03.M03 class verify) to bound CPU cost.
- Unknown contexts are rejected before any hashing.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T07 | abuse | PS-130-05.R03, PS-130-07.R01, PS-130-07.R03 | attempt to call signJcs from non-federation module; unknown context; raw key bytes passed | not exported; rejected; API refuses raw key bytes |
| TEST-PS-130-09.T09 | integration | PS-130-06.R01, PS-130-07.R02 | sign same payload twice; verify embedded envelopes in a stored consent | identical envelope bytes; library writes nothing |
| TEST-PS-130-09.T10 | unit | PS-130-07.R03, PS-130-04.R03 | honesty text present in signature detail panel; UI string audit | note present in all locales; no wording claims delivery or handover |

## Dependencies

Module depends on: F16.S02.M02, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
