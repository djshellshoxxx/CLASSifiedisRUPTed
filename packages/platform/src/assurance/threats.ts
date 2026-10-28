/**
 * F16.S03.M01 STRIDE threat register for ClassRup as typed data.
 * `controls` are repo-relative paths that implement the mitigation (validated for shape in tests and for
 * existence by the release gate); `planned` names work that does not exist yet, so the register never
 * claims a control that is not in the tree. Status `mitigated` requires at least one control.
 */

export type Stride = 'spoofing' | 'tampering' | 'repudiation' | 'information_disclosure' | 'denial_of_service' | 'elevation_of_privilege';
export type ThreatAsset = 'accounts_keys' | 'locations' | 'messages' | 'trade_graph' | 'payment_evidence' | 'relay';
export type ThreatStatus = 'mitigated' | 'partial' | 'open' | 'accepted';
export type Score = 1 | 2 | 3 | 4 | 5;

export interface Threat {
  /** Stable reference, `T-001`. */
  readonly ref: string;
  readonly asset: ThreatAsset;
  readonly stride: Stride;
  readonly title: string;
  readonly scenario: string;
  readonly likelihood: Score;
  readonly impact: Score;
  readonly mitigation: string;
  readonly controls: readonly string[];
  readonly planned: readonly string[];
  readonly status: ThreatStatus;
}

export const THREAT_ASSETS: readonly ThreatAsset[] = ['accounts_keys', 'locations', 'messages', 'trade_graph', 'payment_evidence', 'relay'];
export const STRIDE_CATEGORIES: readonly Stride[] = [
  'spoofing',
  'tampering',
  'repudiation',
  'information_disclosure',
  'denial_of_service',
  'elevation_of_privilege',
];

export const THREAT_REF_RE = /^T-\d{3}$/;
export const CONTROL_PATH_RE = /^(?:(?:packages|apps|tools|\.github)\/[A-Za-z0-9_./-]+|pnpm-lock\.yaml)$/;

type Draft = Omit<Threat, 'ref' | 'planned'> & { planned?: readonly string[] };

const K = 'packages/kernel/src';
const S = 'packages/security/src';
const P = 'packages/platform/src';

const DRAFTS: readonly Draft[] = [
  {
    asset: 'accounts_keys', stride: 'spoofing', title: 'Stolen session token replayed against the API',
    scenario: 'An attacker captures a bearer token or a signed request and resends it.',
    likelihood: 3, impact: 4,
    mitigation: 'Requests are signed over method, path, body hash, timestamp, nonce and session; nonces are accepted once inside a skew window.',
    controls: [`${S}/requests.ts`, `${S}/replay.ts`], status: 'mitigated',
  },
  {
    asset: 'accounts_keys', stride: 'spoofing', title: 'Sybil accounts inflate reputation and steer trades',
    scenario: 'One person creates many pseudonyms to fake trust, shill bids or complete a fake cycle.',
    likelihood: 4, impact: 3,
    mitigation: 'Risk assessment and rate limits gate sensitive actions; trust evidence is weighted by independent counterparties; new accounts have low limits.',
    controls: [`${K}/ports.ts`, 'packages/moderation', 'packages/identity'], status: 'partial',
  },
  {
    asset: 'accounts_keys', stride: 'information_disclosure', title: 'Device secret key exfiltrated from the browser',
    scenario: 'Malware or a malicious extension reads key material or recovery codes from storage.',
    likelihood: 3, impact: 5,
    mitigation: 'Secrets are wrapped in a non-printing type and redacted from logs; recovery codes are shown once; keys are rotatable.',
    controls: [`${S}/secrets.ts`, `${K}/ports.ts`],
    planned: ['apps/pwa: non-extractable WebCrypto keys where the platform allows'], status: 'partial',
  },
  {
    asset: 'accounts_keys', stride: 'elevation_of_privilege', title: 'Missing authorization or cross-tenant access',
    scenario: 'A member calls an admin operation or reads another tenant data by guessing ids.',
    likelihood: 3, impact: 5,
    mitigation: 'Deny-by-default policy rules, tenant isolation checked before any rule, role and ownership predicates, every operation authorizes.',
    controls: [`${S}/authz.ts`, `${P}/policies.ts`], status: 'mitigated',
  },
  {
    asset: 'accounts_keys', stride: 'spoofing', title: 'Account takeover through recovery abuse',
    scenario: 'An attacker social-engineers or brute-forces the recovery path to bind their own device key.',
    likelihood: 3, impact: 5,
    mitigation: 'Recovery codes are high entropy, stored hashed and rate limited; key changes notify existing devices and are delayed.',
    controls: ['packages/identity', `${S}/hash.ts`], status: 'partial',
  },
  {
    asset: 'accounts_keys', stride: 'repudiation', title: 'Administrator denies a configuration change',
    scenario: 'An operator changes a flag, tenant or kill switch and later disputes it.',
    likelihood: 2, impact: 3,
    mitigation: 'Every administrative command appends an event with actor, correlation id and revision to the append-only log.',
    controls: [`${P}/config/operations.ts`, `${K}/runtime.ts`, `${K}/store.ts`], status: 'mitigated',
  },
  {
    asset: 'accounts_keys', stride: 'information_disclosure', title: 'Relay or operator signing key compromise',
    scenario: 'The relay signing key or backup key leaks, letting an attacker forge signed records or backups.',
    likelihood: 2, impact: 5,
    mitigation: 'Key compromise runbook and playbook (freeze, rotate, revoke, notify peers); signed manifests make old-key backups detectable.',
    controls: [`${P}/ops/runbooks.ts`, `${P}/assurance/playbooks.ts`, `${S}/signatures.ts`], status: 'partial',
  },
  {
    asset: 'locations', stride: 'information_disclosure', title: 'Home address leaks through public listings or search',
    scenario: 'A listing, search result, event or federation payload carries an exact address or coordinates.',
    likelihood: 3, impact: 5,
    mitigation: 'Public payloads carry only a geohash cell of at most 5 characters; the cell validator rejects finer cells; log redaction removes lat/lng/address.',
    controls: [`${K}/geo.ts`, `${K}/privacy.ts`, 'packages/discovery', 'packages/bazaar'], status: 'partial',
  },
  {
    asset: 'locations', stride: 'information_disclosure', title: 'Precise location inferred from many coarse queries',
    scenario: 'An attacker probes neighbouring cells and sorts by distance to narrow a seller down to a street.',
    likelihood: 3, impact: 4,
    mitigation: 'Results never expose distance finer than the cell, ranking uses cell adjacency only, and probing is rate limited.',
    controls: ['packages/discovery', `${K}/ports.ts`], status: 'partial',
  },
  {
    asset: 'locations', stride: 'information_disclosure', title: 'Exact location shown to the wrong counterparty',
    scenario: 'A meetup point is disclosed to a blocked or unrelated account.',
    likelihood: 2, impact: 5,
    mitigation: 'Exact location is disclosed only by explicit user action to named participants and is encrypted for them.',
    controls: ['packages/comms', `${S}/encryption.ts`], status: 'partial',
  },
  {
    asset: 'locations', stride: 'information_disclosure', title: 'Location metadata inside uploaded images',
    scenario: 'A photo attachment carries GPS EXIF data revealing the home address.',
    likelihood: 4, impact: 4,
    mitigation: 'Attachments must be stripped of metadata before encryption and upload.',
    controls: [], planned: ['apps/pwa: strip EXIF client side before upload'], status: 'open',
  },
  {
    asset: 'locations', stride: 'information_disclosure', title: 'Network metadata reveals physical location',
    scenario: 'The relay or a federation peer correlates IP addresses with accounts.',
    likelihood: 3, impact: 3,
    mitigation: 'Accepted residual risk: the product promises pseudonyms, not anonymity against network metadata; IPs are not stored in records or events.',
    controls: [`${K}/events.ts`], status: 'accepted',
  },
  {
    asset: 'messages', stride: 'information_disclosure', title: 'Relay operator reads message bodies',
    scenario: 'A curious or compromised operator inspects stored threads.',
    likelihood: 3, impact: 5,
    mitigation: 'Bodies are end-to-end encrypted with X25519 and XChaCha20-Poly1305; the relay stores ciphertext and routing metadata only.',
    controls: [`${S}/encryption.ts`, 'packages/comms'], status: 'mitigated',
  },
  {
    asset: 'messages', stride: 'tampering', title: 'Message tampering or injection by the relay',
    scenario: 'The relay alters or reorders ciphertext or moves a message into another thread.',
    likelihood: 2, impact: 4,
    mitigation: 'Authenticated encryption binds ciphertext to a thread through associated data; envelopes are signed by the sender.',
    controls: [`${S}/encryption.ts`, `${S}/signatures.ts`], status: 'mitigated',
  },
  {
    asset: 'messages', stride: 'information_disclosure', title: 'Message content leaks through logs, errors or events',
    scenario: 'A handler logs a body or puts text into an error detail or event payload.',
    likelihood: 3, impact: 4,
    mitigation: 'Logger redacts the body, plaintext, address and contact fields; error details and event payloads are limited to ids and public data.',
    controls: [`${K}/ports.ts`, `${K}/errors.ts`, `${P}/ops/logger.ts`], status: 'mitigated',
  },
  {
    asset: 'messages', stride: 'denial_of_service', title: 'Message flooding and harassment',
    scenario: 'An account floods a target with messages or offers.',
    likelihood: 4, impact: 3,
    mitigation: 'Per-actor rate limits, block checks before delivery, reports and enforcement actions.',
    controls: [`${K}/ports.ts`, 'packages/moderation', 'packages/comms'], status: 'partial',
  },
  {
    asset: 'messages', stride: 'repudiation', title: 'Participant denies sending an offer or message',
    scenario: 'A user disowns a proposal after the counterparty acted on it.',
    likelihood: 3, impact: 3,
    mitigation: 'Signed envelopes evidence the assertion by the key holder; they do not prove delivery or that the asserted fact is true.',
    controls: [`${S}/signatures.ts`], status: 'partial',
  },
  {
    asset: 'trade_graph', stride: 'information_disclosure', title: 'Trade graph deanonymization',
    scenario: 'Cycle proposals and trade patterns let an observer link pseudonyms to real people.',
    likelihood: 3, impact: 4,
    mitigation: 'Participants see only data needed for their own consent; public DTOs hide counterparties; pseudonyms are user selected.',
    controls: ['packages/mutiny', `${K}/privacy.ts`], status: 'partial',
  },
  {
    asset: 'trade_graph', stride: 'tampering', title: 'Cycle manipulation with fake listings or dropout griefing',
    scenario: 'An attacker injects a listing to form a cycle, then withdraws to waste others reservations.',
    likelihood: 3, impact: 3,
    mitigation: 'Ownership and compatibility checks, unanimous consent, deadlines, locks; dropout invalidates the cycle and never reroutes assets.',
    controls: ['packages/mutiny'], status: 'partial',
  },
  {
    asset: 'trade_graph', stride: 'denial_of_service', title: 'Cycle search explosion from a crafted graph',
    scenario: 'Many mutual wants make cycle enumeration exponential.',
    likelihood: 3, impact: 3,
    mitigation: 'Enumeration is bounded by maximum length, maximum results and a time budget (ADR-0003).',
    controls: ['packages/mutiny'], status: 'partial',
  },
  {
    asset: 'trade_graph', stride: 'tampering', title: 'Double allocation of one item across trades',
    scenario: 'Two concurrent flows reserve the same listing.',
    likelihood: 3, impact: 4,
    mitigation: 'Reservations through the inventory port and optimistic concurrency on record versions.',
    controls: [`${K}/contracts.ts`, `${K}/runtime.ts`, `${K}/store.ts`], status: 'mitigated',
  },
  {
    asset: 'trade_graph', stride: 'spoofing', title: 'Shill bidding and auction collusion',
    scenario: 'Related accounts bid up an auction or manipulate its close.',
    likelihood: 3, impact: 3,
    mitigation: 'Integrity flags on correlated bidding, bid retraction rules and moderation review.',
    controls: ['packages/auctions', 'packages/moderation'], status: 'partial',
  },
  {
    asset: 'payment_evidence', stride: 'spoofing', title: 'Fake payment proof',
    scenario: 'A buyer submits a fabricated receipt or transaction hash.',
    likelihood: 4, impact: 4,
    mitigation: 'Payments are claims until independently confirmed or verified; only confirmed, verified or final states count as paid; no fake success.',
    controls: [`${K}/contracts.ts`, 'packages/commerce'], status: 'partial',
  },
  {
    asset: 'payment_evidence', stride: 'tampering', title: 'Evidence altered or deleted after a dispute',
    scenario: 'A party or operator edits or removes settlement evidence.',
    likelihood: 2, impact: 5,
    mitigation: 'Evidence is append-only in the event log and content-hashed; legal hold blocks deletion; backups are signed.',
    controls: [`${K}/store.ts`, `${S}/hash.ts`, `${P}/ops/backups.ts`], status: 'mitigated',
  },
  {
    asset: 'payment_evidence', stride: 'tampering', title: 'Chain reorganization after confirmation',
    scenario: 'A crypto payment looks confirmed and is later reverted.',
    likelihood: 2, impact: 4,
    mitigation: 'Finality policy with a reorged status; goods are released only on final state for crypto.',
    controls: [`${K}/contracts.ts`, 'packages/commerce'], status: 'partial',
  },
  {
    asset: 'payment_evidence', stride: 'repudiation', title: 'Cash handover denied',
    scenario: 'Buyer or seller disputes that cash changed hands.',
    likelihood: 3, impact: 3,
    mitigation: 'Accepted residual risk: cash is self-attested with optional bilateral receipts; the platform holds no funds and does not arbitrate cash.',
    controls: ['packages/commerce'], status: 'accepted',
  },
  {
    asset: 'payment_evidence', stride: 'tampering', title: 'FX quote manipulation or stale rate',
    scenario: 'A party exploits an outdated rate to shift value in a cross-currency trade.',
    likelihood: 3, impact: 3,
    mitigation: 'Quotes are pinned with source, time and expiry; rounding policy is explicit; amounts are integer minor units.',
    controls: [`${K}/money.ts`, `${K}/contracts.ts`], status: 'mitigated',
  },
  {
    asset: 'payment_evidence', stride: 'tampering', title: 'Command replay duplicates a payment claim',
    scenario: 'A retried or replayed request creates a second claim or trade.',
    likelihood: 4, impact: 4,
    mitigation: 'Every command runs through the idempotency pipeline: same key and request replays the stored response; same key with another request is rejected.',
    controls: [`${K}/runtime.ts`, `${S}/replay.ts`, `${P}/pwa/offline.ts`], status: 'mitigated',
  },
  {
    asset: 'relay', stride: 'elevation_of_privilege', title: 'Relay compromise through host takeover',
    scenario: 'An attacker gains code execution on the relay and reads or forges server-side state.',
    likelihood: 2, impact: 5,
    mitigation: 'E2E encryption limits exposure to metadata; signed records and backups expose forgery; response playbook covers containment and key rotation.',
    controls: [`${P}/assurance/playbooks.ts`, `${P}/ops/runbooks.ts`, `${S}/encryption.ts`], planned: ['apps/relay: process sandboxing and secret isolation'], status: 'partial',
  },
  {
    asset: 'relay', stride: 'information_disclosure', title: 'Federation metadata leakage',
    scenario: 'Peers learn who lists what, when and where beyond what the user chose to publish.',
    likelihood: 3, impact: 4,
    mitigation: 'Federation is opt-in per record and off by default; payloads are the public projection only, never private fields or exact location.',
    controls: [`${P}/config/catalog.ts`, 'packages/federation', `${K}/privacy.ts`], status: 'partial',
  },
  {
    asset: 'relay', stride: 'spoofing', title: 'Malicious peer forges or replays federated records',
    scenario: 'A peer relay injects records claiming to come from another origin.',
    likelihood: 3, impact: 4,
    mitigation: 'Signed versioned envelopes with provenance, replay protection, peer trust levels, tombstones and blocklists (ADR-0004).',
    controls: ['packages/federation', `${S}/signatures.ts`, `${S}/replay.ts`], status: 'partial',
  },
  {
    asset: 'accounts_keys', stride: 'tampering', title: 'XSS in the PWA steals keys or acts as the user',
    scenario: 'Injected markup or script runs in the app origin and reads storage.',
    likelihood: 3, impact: 5,
    mitigation: 'User text is normalized and control characters rejected at the boundary; the client escapes output and ships a strict CSP.',
    controls: [`${K}/schema.ts`], planned: ['apps/pwa: strict Content-Security-Policy, no innerHTML, Trusted Types'], status: 'partial',
  },
  {
    asset: 'relay', stride: 'tampering', title: 'Supply chain compromise',
    scenario: 'A malicious dependency version or tampered build artifact reaches production.',
    likelihood: 2, impact: 5,
    mitigation: 'Exact pinned versions, committed lockfile, audited crypto libraries, CI gate for package boundaries and no Node built-ins in browser code.',
    controls: ['pnpm-lock.yaml', '.github/workflows/ci.yml', 'tools/check-boundaries.mjs'], planned: ['CI: dependency audit and signed release artifacts'], status: 'partial',
  },
  {
    asset: 'relay', stride: 'denial_of_service', title: 'Request flood or oversized payloads against the API',
    scenario: 'Clients saturate the relay with requests or huge bodies.',
    likelihood: 4, impact: 3,
    mitigation: 'Body size limit, per-actor and per-address rate limits, bounded searches, health-based load shedding.',
    controls: ['apps/relay/src/http/app.ts', `${K}/ports.ts`, `${P}/ops/health.ts`], status: 'partial',
  },
  {
    asset: 'accounts_keys', stride: 'information_disclosure', title: 'Stale private data in the service worker cache or offline queue',
    scenario: 'A shared device keeps cached API responses or unsent private changes after logout.',
    likelihood: 3, impact: 4,
    mitigation: 'Private API traffic is never persisted; logout purges non-static caches and clears the offline queue.',
    controls: [`${P}/pwa/cache.ts`, `${P}/pwa/offline.ts`], planned: ['apps/pwa: encrypt IndexedDB queue at rest'], status: 'partial',
  },
  {
    asset: 'payment_evidence', stride: 'tampering', title: 'Backup tampering or substitution',
    scenario: 'An attacker swaps or edits a backup so a restore installs forged state.',
    likelihood: 2, impact: 5,
    mitigation: 'Manifests are Ed25519-signed by the operator key and carry per-collection and event hashes; restore verifies all of them first.',
    controls: [`${P}/ops/backups.ts`, `${S}/signatures.ts`], status: 'mitigated',
  },
  {
    asset: 'relay', stride: 'elevation_of_privilege', title: 'Feature flag misuse enables unfinished or disabled modules',
    scenario: 'A flag error or tenant override re-enables a module that was killed for safety.',
    likelihood: 2, impact: 4,
    mitigation: 'Unknown flags are off, kill switches override every tenant override, dependencies must be enabled, the admin flag cannot be disabled.',
    controls: [`${P}/config/flags.ts`], status: 'mitigated',
  },
];

export const THREATS: readonly Threat[] = Object.freeze(
  DRAFTS.map((d, n) => Object.freeze({ ...d, ref: `T-${String(n + 1).padStart(3, '0')}`, planned: d.planned ?? [] })),
);

export const riskScore = (t: Pick<Threat, 'likelihood' | 'impact'>): number => t.likelihood * t.impact;

export interface ThreatSummary {
  readonly total: number;
  readonly byStatus: Readonly<Record<ThreatStatus, number>>;
  readonly byAsset: Readonly<Record<ThreatAsset, number>>;
  readonly byStride: Readonly<Record<Stride, number>>;
  /** Highest-scoring threats that are not fully mitigated or accepted, worst first. */
  readonly topOpenRisks: readonly string[];
}

const tally = <K extends string>(keys: readonly K[], values: readonly K[]): Record<K, number> =>
  Object.fromEntries(keys.map((k) => [k, values.filter((v) => v === k).length])) as Record<K, number>;

export function summarizeThreats(threats: readonly Threat[], statusOf: (t: Threat) => ThreatStatus = (t) => t.status, top = 5): ThreatSummary {
  const open = threats
    .filter((t) => ['open', 'partial'].includes(statusOf(t)))
    .sort((a, b) => riskScore(b) - riskScore(a) || (a.ref < b.ref ? -1 : 1));
  return {
    total: threats.length,
    byStatus: tally(['mitigated', 'partial', 'open', 'accepted'], threats.map(statusOf)),
    byAsset: tally(THREAT_ASSETS, threats.map((t) => t.asset)),
    byStride: tally(STRIDE_CATEGORIES, threats.map((t) => t.stride)),
    topOpenRisks: open.slice(0, top).map((t) => t.ref),
  };
}
