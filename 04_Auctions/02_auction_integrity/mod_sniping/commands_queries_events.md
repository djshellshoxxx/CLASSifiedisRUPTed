# PS-038-04 — Commands, queries and events: Anti-sniping soft close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M02 Anti-sniping soft close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/sniping` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-038-04.R01** The host relay exposes auctions.extension.apply as an internal command called from the bid transaction; it is not callable by vaults.
- **PS-038-04.R02** Anyone can read the extension history through a public query; vaults derive auctions.auction.extended locally when the host-signed extension arrives in a receipt.
- **PS-038-04.R03** The module consumes the auction closed event to stop applying extensions and nothing else.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.extension.apply` | auctions.extension.apply | [relay internal, called inside the bid transaction under the auction lease] { auctionId, triggerBidSeq, triggerKind, hostTime } | { extended: boolean, seq?, newEndsAt?, extensionsLeft } | NOT_FOUND, CONFLICT_STATE, CONFLICT_REVISION | auctions.auction.extended | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `auctions.extension.list` | auctions.extension.read_public | { auctionId } (relay query or vault cache of host-signed extensions) | { items: Extension[] ordered by seq, extensionsLeft, rulesVersion } | NOT_FOUND |
| `auctions.extension.preview` | auctions.extension.read_public | { auctionId, hostTime? } | { inFinalWindow: boolean, remainingMs, wouldExtendTo?: timestamp, extensionsLeft } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `auctions.auction.extended` | P0 | { auctionId, seq, triggerBidSeq, previousEndsAt, newEndsAt, extensionsLeft, hostTime } |

### Events consumed

| Type | Effect |
|---|---|
| `auctions.auction.closed` | stop applying extensions and mark the history final in the vault cache |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_EXTENSION_NOT_QUALIFIED | 409 | no | the entry does not qualify for an extension; internal, not shown to bidders |
| AUCTIONS_EXTENSION_LIMIT | 409 | no | 30 extensions have been used; internal, not shown to bidders |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
host bid transaction at hostTime 2026-11-12T09:58:30.100Z, currentEndsAt 2026-11-12T10:00:00.000Z, extensionCount 0
auctions.extension.apply { "auctionId": "0192f400-0002-…", "triggerBidSeq": 42, "triggerKind": "manual", "hostTime": "2026-11-12T09:58:30.100Z" }
-> { "extended": true, "seq": 1, "newEndsAt": "2026-11-12T10:02:00.000Z", "extensionsLeft": 29 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-038-09.T07 | integration | PS-038-02.R03, PS-038-06.R03, PS-038-04.R01 | two bids 50 ms apart inside the window | two sequential extensions; second counts from the moved end; unique seq holds |
| TEST-PS-038-09.T08 | contract | PS-038-04.R02, PS-038-04.R03, PS-038-09.R02, PS-038-09.R03 | apply, list, preview, event and statement | payloads and signature validate; vault rejects statement with wrong host key or wrong previous end |

## Dependencies

Module depends on: F04.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
