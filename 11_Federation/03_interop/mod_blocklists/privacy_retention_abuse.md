# PS-089-07 — Privacy, retention and abuse: Federation blocklists

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M02 Federation blocklists](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/blocklists` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-089-07.R01** A person's block list is P3 and never leaves the vault except when the person publishes a selected list deliberately.
- **PS-089-07.R02** Rejections caused by block rules return one generic code so senders cannot probe which rules exist.
- **PS-089-07.R03** Imported lists are advisory and bounded; they can never silence a person on a relay without that relay's operator review.

## Specification

**Data classification**
- BlockRule: P3 (value, reason, note).
- Published blocklist statement: P0 once the owner publishes it.

**Retention**
- RET-STANDARD until the owner removes the rule; removed rules are purged after 30 days; pending imports after 30 days unreviewed.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Poisoned shared blocklist silences legitimate users | no automatic application; per-entry review; cap 10000 entries; publisher shown; imported rules expire after 180 days |
| T02 | Probing the block list by sending candidate authors or cids | generic FEDERATION_NOT_ACCEPTED and constant-time-class evaluation; evaluate not externally callable |
| T03 | Block list leaks who a person avoids | list is P3, never in federation payloads, export only to the owner; publish is explicit and shows entries before signing |
| T04 | Rule used to censor via a coordinated list | no global takedown exists; each vault and relay decides; reasons recorded; operator changes audited |
| T05 | Resource exhaustion with a huge list or many rules | 10000 per import, 100000 per tenant, O(1) hash lookup, exact match only |

**Abuse controls**
- At most 5 list imports per day per tenant.
- Review of more than 500 rules in one command is refused with VALIDATION_FAILED.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-089-09.T11 | abuse | PS-089-07.R01, PS-089-07.R02 | send blocked and unknown authors to the inbox and compare responses | identical FEDERATION_NOT_ACCEPTED or accepted shape; evaluate not reachable from outside |
| TEST-PS-089-09.T12 | abuse | PS-089-07.R03, PS-089-07.R02 | import list with 10001 entries, from unknown publisher, 6th import in a day | FEDERATION_BLOCKLIST_TOO_LARGE, import allowed to review only, RATE_LIMITED |

## Dependencies

Module depends on: F11.S01.M03, F07.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
