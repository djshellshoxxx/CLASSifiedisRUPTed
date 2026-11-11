# PS-089-02 — Validation rules: Federation blocklists

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M02 Federation blocklists](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/blocklists` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-089-02.R01** Rule input is validated strictly against the schema and value formats per type.
- **PS-089-02.R02** Imports are bounded and signature-checked before any entry is shown for review.
- **PS-089-02.R03** Every violation maps to one stable error code with a localized message key.
- **PS-089-02.R04** Statements that propagate deletion or moves (classrup.federation.tombstone/v1, move/v1 and move_cancel/v1) bypass author and cid rules, while peer rules still apply to them.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | ruleType peer has a relay id format; author is did:key Ed25519; cid starts with sha256- and decodes to 32 bytes; content_hash is sha256-<base64url> (payload hash) or blob:sha256-<base64url> (N9 MediaBlob id), each decoding to 32 bytes | VALIDATION_FAILED |
| V02 | no non-removed rule with the same type and value exists | FEDERATION_BLOCK_DUPLICATE |
| V03 | peer rule value is not the local relay id | FEDERATION_BLOCK_SELF |
| V04 | imported list statement signature verifies (F11.S01.M03) and entries ≤ 10000 | FEDERATION_BLOCKLIST_TOO_LARGE |
| V05 | tenant has fewer than 100000 non-removed rules | FEDERATION_BLOCK_LIMIT |
| V06 | note ≤ 280 code points plain text | VALIDATION_FAILED |
| V07 | imported rules are approved only by an explicit review command naming each rule id | FORBIDDEN |
| V08 | evaluate input names the statement type; tombstone, move and move_cancel types are evaluated against peer rules only | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-089-09.T02 | unit | PS-089-02.R01, PS-089-02.R03 | each rule V01–V08 violated | documented code and no rule changed |
| TEST-PS-089-09.T03 | integration | PS-089-03.R02, PS-089-02.R02 | import list L then approve one of 3 entries | 3 created -> pending_review, 1 active, 2 removed by reject; none active before review |
| TEST-PS-089-09.T12 | abuse | PS-089-07.R03, PS-089-02.R02 | import list with 10001 entries, from unknown publisher, 6th import in a day | FEDERATION_BLOCKLIST_TOO_LARGE, import allowed to review only, RATE_LIMITED |
| TEST-PS-089-09.T17 | unit | PS-089-01.R04, PS-089-02.R01 | content_hash rules in sha256- and blob:sha256- form; envelope whose payload hash is H1 and that references blob B1; malformed blob value | both forms validate and match the contentHashes computed by F11.S01.M02; the malformed value VALIDATION_FAILED |
| TEST-PS-089-09.T18 | integration | PS-089-02.R04 | reject author and cid rules on Bad plus a reject peer rule on P; tombstone, move and move_cancel from Bad via peer B and via peer P | via B evaluate returns allow with bypassed true; via P refused by the peer rule |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F07.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
