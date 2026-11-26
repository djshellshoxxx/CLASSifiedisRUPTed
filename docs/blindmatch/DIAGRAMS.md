# BlindMatch diagrams

These diagrams describe the proposed architecture, not currently implemented runtime. Mermaid is rendered by GitHub; textual explanations accompany each diagram.

## 1. Composition and trust boundaries

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

Local matching needs neither a relay nor a chain. Confidential providers are optional and must not be given plaintext private profiles in confidential mode. A suggestion can only become a proposal through an explicit existing-domain operation.

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

## 5. Job lifecycle

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

Late callbacks after terminal state or changed revisions are rejected. Reconciliation never grants consent or repeats an uncertain external side effect automatically.

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
  A --> C["Consent, identity, vault prerequisites"]
  B --> D["Local matching / UX / recovery"]
  C --> D
  D --> E["Bilateral provider qualification"]
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
