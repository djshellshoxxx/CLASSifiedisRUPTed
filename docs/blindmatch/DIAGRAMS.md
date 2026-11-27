# BlindMatch diagrams

Diagrams 1–7 preserve the published future architecture. They do not imply that
confidential providers, cross-party consent, persistent jobs, inbox delivery,
relay access or a BlindMatch worker are implemented. The bounded current local
path is shown first; its F19 modules remain `FUTURE` and the main launch gate
stays false pending qualification. Mermaid is rendered by GitHub.

## Current local implementation boundary

```mermaid
flowchart TD
  V["Unlocked owner vault"] --> I["Private intent: draft / active / paused"]
  V --> D["Retained public discovery records"]
  D --> A["Bounded signature and snapshot verification"]
  I --> M["Explicit local match"]
  A --> M
  M --> R["Ephemeral public references"]
  X["Cancel / lock / disable"] --> C["Revoke view and discard late results"]
  C -->|"Clears"| R
  E["Owner erasure"] --> N["Intent row absent; no deletion history"]
  E --> C
```

The adapter receives only a fixed limit and abort signal. It never receives
private criteria and performs no network request. Snapshot verification does not
establish continuing global freshness, trade consent or availability. Restore
returns intent content as draft; no job or result is retained or resumed. The
view is being composed behind an inactive production gate and remains subject to
native, mobile and accessibility acceptance.

## 1. Future composition and trust boundaries

```mermaid
flowchart TB
  subgraph U["User device — unlocked local vault"]
    LB["LocalBazaar: listings / offers"]
    LM["LocalMutiny: barter / cycles"]
    PI["Private inventory + wanted lists"]
    AU["Scoped consent + disclosure controls"]
    BM["BlindMatch orchestration / cancellable worker"]
    IN["Local inbox + authorized match cards"]
    LB --> BM
    LM --> BM
    PI --> BM
    AU --> BM
    BM --> IN
  end
  subgraph E["Optional external trust boundaries"]
    R["User-selected relay: public data / encrypted delivery"]
    P["Qualified confidential computation provider"]
    K["Provider key authority / verification assumptions"]
    P --- K
  end
  BM -->|"Public signed records only"| R
  BM -->|"Authorized protocol inputs only"| P
  P -->|"Minimal result + bound evidence"| BM
  IN -->|"Explicit new consent"| T["Canonical trade proposal / existing domain"]
  T --> S["Optional separately authorized settlement"]
```

The relay/provider, worker, inbox and proposal paths above are future domain
composition, not part of the current local loader/session. Local matching needs
neither a relay nor a chain. Confidential providers are optional and must not be
given plaintext private profiles in confidential mode. A suggestion can become a
proposal only through a separately authorized existing-domain operation.

## 2. Bilateral confidential price match

```mermaid
sequenceDiagram
  participant A as Seller vault
  participant P as Reviewed confidential protocol
  participant B as Buyer vault
  A->>A: Enter minimum 750 CAD (private)
  B->>B: Enter maximum 900 CAD (private)
  A->>P: Scoped authorized protocol input
  B->>P: Scoped authorized protocol input
  P->>P: Evaluate valid currency and overlap
  P-->>A: Authorized compatible outcome
  P-->>B: Authorized compatible outcome
  A->>A: Verify evidence and current scope
  B->>B: Verify evidence and current scope
  Note over A,B: Neither limit or score is released by default
  A->>B: Separate authorized introduction / negotiation
  B->>A: Explicit acceptance of proposed terms
  Note over A,B: No automatic sale, price or transfer
```

The protocol implementation and key model are not selected. The same example with a maximum below 750 yields an ineligible outcome, not the seller's minimum.

## 3. Four-party cyclic barter

```mermaid
flowchart LR
  A["A: gives laptop / wants bicycle"]
  B["B: gives bicycle / wants guitar"]
  C["C: gives guitar / wants camera"]
  D["D: gives camera / wants laptop"]
  A -->|"Laptop"| D
  D -->|"Camera"| C
  C -->|"Guitar"| B
  B -->|"Bicycle"| A
```

These item names are illustrative. A qualified confidential match reveals only permitted outputs; each participant receives their authorized proposed leg and consent information. Full-cycle disclosure must be expressly authorized where needed for meaningful consent.

```mermaid
flowchart TD
  I["Authorized candidate inputs"] --> E["Evaluate hard constraints / compatible edges"]
  E --> C["Bounded distinct-owner / distinct-asset cycle search"]
  C --> V{"All legs valid and current?"}
  V -->|No| X["Discard or defer; no disclosure"]
  V -->|Yes| S["Minimal suggestion to permitted participants"]
  S --> A{"All participants accept introduction and terms?"}
  A -->|No / timeout| F["Invalidate or renegotiate"]
  A -->|Yes| R["Canonical proposal / local reservation checks"]
  R --> H["Explicit handover and receipt workflow"]
  R -->|Conflict / dropout| F
```

## 4. Progressive disclosure

```mermaid
flowchart TD
  P["Private intent: owner only"] --> O["Scoped opt-in to matching"]
  O --> M{"Verified match?"}
  M -->|No| N["No peer profile revealed"]
  M -->|Yes| C["Minimal match card"]
  C --> G{"Mutual introduction consent?"}
  G -->|No| X["Decline / expire"]
  G -->|Yes| L["Only approved introduction fields"]
  L --> T{"Separate consent to concrete trade terms?"}
  T -->|No| X
  T -->|Yes| Q["Canonical proposal and explicit execution workflow"]
  O -->|Revoke| X
  C -->|Revoke| X
  L -->|Revoke before proposal| X
```

Revocation stops future processing and disclosure to the extent enforceable; it does not recall information already received.

## 5. Future remote-job lifecycle

```mermaid
stateDiagram-v2
  [*] --> Queued
  Queued --> Running: Valid current authorization
  Queued --> Cancelled: Revoke / lock
  Queued --> Expired: Deadline
  Running --> VerifiedResult: Valid bound evidence
  Running --> Failed: Invalid evidence / known failure
  Running --> Unknown: Interrupted outcome
  Running --> Cancelled: Cancel / lock / scope change
  Running --> Expired: Deadline
  Unknown --> VerifiedResult: Reconcile with current scope
  Unknown --> Failed: Known failure
  Unknown --> Expired: Deadline
  Unknown --> Cancelled: Revoke / lock
  VerifiedResult --> [*]
  Failed --> [*]
  Expired --> [*]
  Cancelled --> [*]
```

Late callbacks after terminal state or changed revisions are rejected.
Reconciliation never grants consent or repeats an uncertain external side effect
automatically. This diagram does not authorize persistent local jobs, replay
hashes or identifying deletion history. A future external-side-effect recovery
design must first reconcile replay/revocation requirements with owner erasure.
The current local session retains only one ephemeral abort controller.

## 6. Provider decision and failure containment

```mermaid
flowchart TD
  J["Start requested matching job"] --> M{"Selected privacy mode"}
  M -->|Local| L["Local deterministic engine"]
  M -->|Confidential| P{"Qualified provider available and authorized?"}
  P -->|No| U["Unavailable / pending; no plaintext fallback"]
  P -->|Yes| E["Reviewed bounded confidential computation"]
  E --> V{"Result evidence valid and scope current?"}
  V -->|No| F["Reject / unknown / cancel"]
  V -->|Yes| R["Minimal authorized result"]
  L --> R
  R --> C["Explicit user decision"]
  U --> B["Ordinary local classifieds / barter remain usable"]
  F --> B
```

## 7. Feature dependency and delivery order

```mermaid
flowchart TD
  A["P1: ownership / specification / threat model"] --> B["Private intent and encrypted codecs"]
  A --> C["Current owner session and vault guards"]
  B --> D["Local matching / UX / recovery"]
  C --> D
  D --> O["Cross-party consent and disclosure qualification"]
  O --> E["Bilateral provider qualification"]
  E --> F["Private price overlap"]
  E --> G["Confidential barter edges"]
  F --> H["Mixed cash / barter constraints"]
  G --> I["Bounded confidential 3–4 party cycles"]
  H --> I
  I --> J["Optional advanced FHE / N-party research"]
  D --> K["Optional credential / service / rental adapters"]
  J --> L["Separate settlement / monetization approval"]
  K --> L
```

The first local path requires the unlocked owner session and explicit local
opt-in, but it performs no cross-party disclosure. Future introduction/provider
paths require their own consent, identity and erasure-compatible recovery
contracts. LocalBazaar and LocalMutiny remain subsequent product releases; their
existing foundations can be reused without activating those future products.
