# PS-130-07 — Privacy, retention and abuse: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-07.R01** Envelopes contain only the payload or payload hash the signer chose to sign and key IDs; contexts and verification results never include secrets or P4 values.
- **PS-130-07.R02** Retention follows the embedding record (consents and receipts are RET-EVIDENCE) and the library stores nothing itself.
- **PS-130-07.R03** Replay, cross-protocol and substitution attacks are addressed by domain separation, the prefix inventory, revision binding, header-covered payload hashes and strict verification.

## Specification

**Data classification**
- Envelope: inherits the privacy class of the embedding record (P0 to P2).
- Verification results: ephemeral, not stored by the library.

**Retention**
- The library stores nothing; embedding records retain envelopes for their own class (RET-EVIDENCE for consents and receipts).
- Test vectors and the inventory are versioned in the repository.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Cross-protocol replay (a login, device-link or federation signature reused as a consent) | every format begins with different bytes, the context is inside the signed header, the verifier requires the expected context, and the inventory check forbids prefix-ambiguous entries |
| T02 | Replay of a consent for a different revision, subject or action | payload binds subjectType, subjectRef, subjectRevision, subjectRevisionHash and statementKey; verify checks them against expected values and returns accepted false on mismatch |
| T03 | Signature malleability or small-order key tricks | strict RFC 8032 verification with canonical S and small-order checks in F11.S01.M03; known-answer tests include malleable vectors |
| T04 | Canonicalization ambiguity to smuggle fields | verifier recomputes JCS through F11.S01.M03, rejects duplicate keys, floats and lone surrogates, and compares to transmitted bytes |
| T05 | Backdated or altered signedAt, version or algorithm to evade revocation or downgrade | v, alg and signedAt are inside the signed header; signedAt is still a claim and revocation uses the verifier's first-seen time |
| T06 | Over-reading a signature as proof of delivery or identity | UI honesty note; docs state that signatures prove key-holder assertion only |
| T07 | Substituting the payload of a hash-only envelope | payloadHash is signed and verify recomputes it from the supplied payload |

**Abuse controls**
- Payload size limit 64 KiB and verification limited to 50 per request on a relay (F12.S03.M03 class verify) to bound CPU cost.
- Unknown contexts are rejected before any hashing.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T03 | property | PS-130-01.R02, PS-130-07.R03 | random payloads signed under context A and verified under B; single mutations of v, kid, alg, signedAt or payloadHash | always accepted false with SECURITY_CONTEXT_MISMATCH; every header mutation fails the signature |
| TEST-PS-130-09.T09 | integration | PS-130-06.R01, PS-130-07.R02 | sign the same payload twice; verify embedded envelopes in a stored consent | identical envelope bytes; library writes nothing |
| TEST-PS-130-09.T10 | unit | PS-130-07.R01, PS-130-05.R03 | honesty text in the signature detail panel; UI string audit; inventory loaded from the frozen code table | note present in all locales; no wording claims delivery or handover; the inventory cannot be changed at runtime |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
