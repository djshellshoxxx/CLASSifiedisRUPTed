# PS-038-04 — Commands, queries and events: Anti-sniping soft close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M02 Anti-sniping soft close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/sniping` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-038-04.R01** The host relay exposes auctions.extension.apply as an internal command called from the bid transaction; it is not callable by vaults.
- **PS-038-04.R02** Anyone can read the extension history through a public query; vaults derive auctions.auction.extended locally when the host-signed extension arrives, embedded in the bid receipt (F04.S01.M02 extension field) or fetched from the history, and ingested with auctions.extension.receive.
- **PS-038-04.R03** The module consumes the auction closed event to stop applying extensions and nothing else on the host.
- **PS-038-04.R04** classrup.auctions.extension/v1 is registered with F11.S01.M01 with signer role host key named in the terms (N2), and the host calls notify.notification.dispatch for a content-free push to the seller and to bidders with pushOptIn on each extension, collapsed per auction (N17).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `auctions.extension.apply` | auctions.extension.apply | [relay internal, called inside the bid transaction under the auction lease] { auctionId, triggerBidSeq, triggerKind, hasVisibleAmount, hostTime, fenceToken } | { extended: boolean, seq?, newEndsAt?, extensionsLeft, extension?: statement classrup.auctions.extension/v1 } | NOT_FOUND, CONFLICT_STATE, CONFLICT_REVISION, PRECONDITION_FAILED | auctions.auction.extended | yes (Idempotency-Key) |
| `auctions.extension.receive` | auctions.extension.receive | [vault-local ingestion of a host-signed extension envelope from a bid receipt or the history] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, currentEndsAt } | AUCTIONS_EXTENSION_INVALID, UNSUPPORTED_SCHEMA_VERSION, NOT_FOUND | auctions.auction.extended | yes (Idempotency-Key) |

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
| `privacy.deletion.completed` | delete the cached extension histories held for the erased principal's auctions; extensions carry no DIDs, so nothing is pseudonymized |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| AUCTIONS_EXTENSION_NOT_QUALIFIED | 409 | no | the entry does not qualify for an extension; internal, not shown to bidders |
| AUCTIONS_EXTENSION_LIMIT | 409 | no | 30 extensions have been used; internal, not shown to bidders |
| AUCTIONS_EXTENSION_INVALID | 422 | no | an extension failed the signature, rules version, sequence or previous-end check in a vault; quarantined |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement classrup.auctions.extension/v1 (host key) {auctionId, termsCid, seq, triggerBidSeq, previousEndsAt, newEndsAt, hostTime, rulesVersion}. Execution sites: apply runs inside the host bid transaction; receive, list (from cache) and preview run in vaults.

### Example

```
host bid transaction at hostTime 2026-11-12T09:58:30.100Z, currentEndsAt 2026-11-12T10:00:00.000Z, extensionCount 0
auctions.extension.apply { "auctionId": "0192f400-0002-…", "triggerBidSeq": 42, "triggerKind": "manual", "hasVisibleAmount": true, "hostTime": "2026-11-12T09:58:30.100Z", "fenceToken": 812 }
-> { "extended": true, "seq": 1, "newEndsAt": "2026-11-12T10:02:00.000Z", "extensionsLeft": 29 }
bid receipt carries the extension; bidder vault: auctions.extension.receive -> rulesVersion softclose-v1 equals the terms -> auctions.auction.extended
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-038-09.T07 | integration | PS-038-02.R03, PS-038-06.R03, PS-038-04.R01 | first bid with 30 ms remaining and a second 50 ms later; first bid with 60 000 ms remaining and a second 50 ms later | two extensions, the second at 119 980 ms remaining counted from the moved end; one extension, the second bid at 179 950 ms remaining does not extend; unique seq holds |
| TEST-PS-038-09.T08 | contract | PS-038-04.R02, PS-038-04.R03, PS-038-09.R02, PS-038-09.R03, PS-038-02.R04 | apply, receive, list, preview, event and statement; auction terms and host acceptance; receipt of an extending bid | payloads and signatures validate; terms carry softCloseRulesVersion softclose-v1 and host_acceptance echoes it; the receipt carries the extension; the vault rejects a wrong host key, a wrong previous end or another rulesVersion with AUCTIONS_EXTENSION_INVALID |
| TEST-PS-038-09.T19 | integration | PS-038-04.R04 | extension of an auction where B1 and the seller set pushOptIn; registry lookup | dispatch called once per recipient with template key and reference only, collapsed per auction; registry role is the host key |

## Dependencies

Module depends on: F04.S01.M01, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
