/**
 * F10.S02.M01 threat register: each threat names the assets and adversaries it concerns, the
 * mitigation, the code that implements it and an honest residual risk. A test verifies every
 * code reference exists, so the register cannot silently drift from the implementation.
 */
import { ADVERSARIES, ASSETS } from './model';

export type Level = 'low' | 'medium' | 'high';
export type ThreatCategory = 'location' | 'identity' | 'graph' | 'sybil' | 'metadata' | 'content' | 'account' | 'federation' | 'data_rights';
export type ThreatStatus = 'mitigated' | 'partially_mitigated' | 'accepted';

export interface CodeRef {
  /** Repo-relative path. */
  readonly path: string;
  readonly symbol: string;
}

export interface Threat {
  readonly id: string;
  readonly title: string;
  readonly category: ThreatCategory;
  readonly assets: readonly string[];
  readonly adversaries: readonly string[];
  readonly likelihood: Level;
  readonly impact: Level;
  readonly mitigation: string;
  readonly controls: readonly CodeRef[];
  readonly residualRisk: Level;
  readonly status: ThreatStatus;
}

const geo: CodeRef = { path: 'packages/kernel/src/geo.ts', symbol: 'assertPublicCell' };
const metadata = (symbol: string): CodeRef => ({ path: 'packages/privacy/src/boundaries/metadata.ts', symbol });

export const THREATS: readonly Threat[] = Object.freeze([
  {
    id: 'T-GEO-01',
    title: 'Geolocation triangulation from repeated coarse queries',
    category: 'location',
    assets: ['A-REGION', 'A-EXACT-LOCATION'],
    adversaries: ['ADV-CURIOUS-USER', 'ADV-COUNTERPARTY'],
    likelihood: 'medium',
    impact: 'high',
    mitigation:
      'Public payloads carry only a geohash cell of length <= 5 (~5 km); distances and exact coordinates are never returned, so intersecting queries cannot narrow below the cell. Features search by neighbouring cells and must not return distances.',
    controls: [geo, { path: 'packages/kernel/src/geo.ts', symbol: 'coarsenCell' }, metadata('assertNoSensitiveKeys')],
    residualRisk: 'medium',
    status: 'partially_mitigated',
  },
  {
    id: 'T-GEO-02',
    title: 'Exact address leaks into public listing, search, event or federation payloads',
    category: 'location',
    assets: ['A-EXACT-LOCATION'],
    adversaries: ['ADV-CURIOUS-USER', 'ADV-RELAY-OPERATOR', 'ADV-PEER-RELAY'],
    likelihood: 'medium',
    impact: 'high',
    mitigation: 'Public DTO and event builders are checked with assertNoSensitiveKeys in tests; the logger redacts address and coordinate keys; exact location is disclosed only to named participants.',
    controls: [metadata('assertNoSensitiveKeys'), { path: 'packages/kernel/src/ports.ts', symbol: 'REDACTED_KEYS' }],
    residualRisk: 'low',
    status: 'mitigated',
  },
  {
    id: 'T-GRAPH-01',
    title: 'Graph deanonymisation through feedback and trade relationships',
    category: 'graph',
    assets: ['A-REPUTATION', 'A-PSEUDONYM', 'A-TRADE-EVIDENCE'],
    adversaries: ['ADV-CURIOUS-USER', 'ADV-COUNTERPARTY'],
    likelihood: 'medium',
    impact: 'medium',
    mitigation: 'No social-graph or follower API. Feedback lists show only the rater pseudonym, subject type and rating; subject ids and trade partners are not exposed. Participants-only fields are filtered per viewer.',
    controls: [{ path: 'packages/identity/src/trust/reputation.ts', symbol: 'createReputationService' }, metadata('filterByDisclosure')],
    residualRisk: 'medium',
    status: 'partially_mitigated',
  },
  {
    id: 'T-SYBIL-01',
    title: 'Sybil accounts farm reputation or evade blocks',
    category: 'sybil',
    assets: ['A-REPUTATION'],
    adversaries: ['ADV-SYBIL'],
    likelihood: 'high',
    impact: 'medium',
    mitigation:
      'Feedback requires a completed interaction verified by the owning feature (default deny), one rating per subject, a Bayesian prior that dampens thin records, 14-day edit window, and rate limits on login challenges and recovery attempts.',
    controls: [
      { path: 'packages/identity/src/trust/reputation.ts', symbol: 'bayesianScore' },
      { path: 'packages/identity/src/ports.ts', symbol: 'InteractionVerifier' },
    ],
    residualRisk: 'medium',
    status: 'partially_mitigated',
  },
  {
    id: 'T-META-01',
    title: 'Metadata leakage through precise timestamps and IP addresses',
    category: 'metadata',
    assets: ['A-NETWORK-METADATA'],
    adversaries: ['ADV-RELAY-OPERATOR', 'ADV-DATA-THIEF'],
    likelihood: 'high',
    impact: 'medium',
    mitigation: 'Store IPs truncated to /24 (IPv4) or /48 (IPv6) and coarsen timestamps used for analytics or abuse signals to minute/hour/day/week.',
    controls: [metadata('truncateIp'), metadata('coarsenTimestamp')],
    residualRisk: 'medium',
    status: 'partially_mitigated',
  },
  {
    id: 'T-META-02',
    title: 'Network observer correlates users by traffic',
    category: 'metadata',
    assets: ['A-NETWORK-METADATA'],
    adversaries: ['ADV-NETWORK'],
    likelihood: 'medium',
    impact: 'medium',
    mitigation: 'Out of scope: the product makes no anonymity guarantee against network metadata (PROJECT_SPEC). Users are told pseudonyms are not anonymity.',
    controls: [{ path: 'packages/security/src/encryption.ts', symbol: 'encryptForRecipients' }],
    residualRisk: 'high',
    status: 'accepted',
  },
  {
    id: 'T-CONTENT-01',
    title: 'Relay operator or thief reads private messages',
    category: 'content',
    assets: ['A-MESSAGES'],
    adversaries: ['ADV-RELAY-OPERATOR', 'ADV-DATA-THIEF'],
    likelihood: 'medium',
    impact: 'high',
    mitigation: 'Messages are encrypted on the device with X25519 + XChaCha20-Poly1305; relays store ciphertext and routing metadata only.',
    controls: [{ path: 'packages/security/src/encryption.ts', symbol: 'encryptForRecipients' }],
    residualRisk: 'low',
    status: 'mitigated',
  },
  {
    id: 'T-ACCT-01',
    title: 'Session token theft or database leak yields working sessions',
    category: 'account',
    assets: ['A-SESSION'],
    adversaries: ['ADV-DATA-THIEF', 'ADV-HOST'],
    likelihood: 'medium',
    impact: 'high',
    mitigation: 'Tokens are 256-bit random values stored only as hashes, bound to a device key, with 7-day sliding idle and 30-day absolute expiry; users can list and revoke sessions.',
    controls: [{ path: 'packages/identity/src/accounts/sessions.ts', symbol: 'createSessionService' }],
    residualRisk: 'medium',
    status: 'partially_mitigated',
  },
  {
    id: 'T-ACCT-02',
    title: 'Recovery code guessing or theft leads to takeover',
    category: 'account',
    assets: ['A-RECOVERY', 'A-DEVICE-KEYS'],
    adversaries: ['ADV-CURIOUS-USER', 'ADV-DATA-THIEF'],
    likelihood: 'low',
    impact: 'high',
    mitigation: '80-bit single-use codes stored as hashes, per-account rate limiting, proof of possession for the new key, and revocation of all old keys and sessions on use.',
    controls: [{ path: 'packages/identity/src/accounts/recovery.ts', symbol: 'createRecoveryService' }],
    residualRisk: 'low',
    status: 'mitigated',
  },
  {
    id: 'T-ACCT-03',
    title: 'Impersonation with look-alike pseudonyms',
    category: 'identity',
    assets: ['A-PSEUDONYM'],
    adversaries: ['ADV-CURIOUS-USER', 'ADV-SYBIL'],
    likelihood: 'medium',
    impact: 'medium',
    mitigation: 'NFKC normalisation, case-folded uniqueness, reserved words, and rejection of Latin/Cyrillic/Greek script mixing.',
    controls: [{ path: 'packages/identity/src/accounts/naming.ts', symbol: 'normalizePseudonym' }],
    residualRisk: 'medium',
    status: 'partially_mitigated',
  },
  {
    id: 'T-ACCT-04',
    title: 'Replay of signed requests or login responses',
    category: 'account',
    assets: ['A-SESSION', 'A-DEVICE-KEYS'],
    adversaries: ['ADV-NETWORK', 'ADV-PEER-RELAY'],
    likelihood: 'medium',
    impact: 'medium',
    mitigation: 'Single-use 5-minute login challenges, domain-separated signature contexts, nonce/timestamp replay guard for signed requests, key-epoch binding for key changes.',
    controls: [
      { path: 'packages/security/src/replay.ts', symbol: 'ReplayGuard' },
      { path: 'packages/security/src/signatures.ts', symbol: 'signingMessage' },
    ],
    residualRisk: 'low',
    status: 'mitigated',
  },
  {
    id: 'T-FED-01',
    title: 'Private data or forged records cross a federation boundary',
    category: 'federation',
    assets: ['A-PSEUDONYM', 'A-REGION'],
    adversaries: ['ADV-PEER-RELAY'],
    likelihood: 'medium',
    impact: 'high',
    mitigation: 'Only explicitly opted-in public records leave the relay, as signed versioned envelopes with provenance; consent for federation is a recorded purpose.',
    controls: [{ path: 'packages/security/src/signatures.ts', symbol: 'signEnvelope' }, { path: 'packages/privacy/src/consent/consent.ts', symbol: 'createConsentService' }],
    residualRisk: 'medium',
    status: 'partially_mitigated',
  },
  {
    id: 'T-RIGHTS-01',
    title: 'Deletion leaves personal data behind or destroys evidence under legal hold',
    category: 'data_rights',
    assets: ['A-CONSENT', 'A-TRADE-EVIDENCE'],
    adversaries: ['ADV-DATA-THIEF'],
    likelihood: 'medium',
    impact: 'high',
    mitigation: 'Every feature registers an eraser; the report lists what was erased and retained with reasons; legal holds block erasure; failed erasures are retried.',
    controls: [{ path: 'packages/privacy/src/data/delete.ts', symbol: 'createDeletionService' }, { path: 'packages/privacy/src/retention/retention.ts', symbol: 'createRetentionService' }],
    residualRisk: 'low',
    status: 'mitigated',
  },
  {
    id: 'T-RIGHTS-02',
    title: 'Export bundle is incomplete or exposed to someone else',
    category: 'data_rights',
    assets: ['A-EXPORT'],
    adversaries: ['ADV-CURIOUS-USER', 'ADV-DATA-THIEF'],
    likelihood: 'low',
    impact: 'high',
    mitigation: 'Only the owner can request or download; section hashes in the manifest prove completeness; any failing exporter fails the export; bundles expire after seven days.',
    controls: [{ path: 'packages/privacy/src/data/export.ts', symbol: 'createExportService' }],
    residualRisk: 'low',
    status: 'mitigated',
  },
  {
    id: 'T-RIGHTS-03',
    title: 'Optional processing runs without consent',
    category: 'data_rights',
    assets: ['A-CONSENT', 'A-NETWORK-METADATA'],
    adversaries: ['ADV-RELAY-OPERATOR'],
    likelihood: 'medium',
    impact: 'medium',
    mitigation: 'Features check hasConsent(account, purpose) before analytics, marketing, federation, precise location and email notifications; withdrawal takes effect immediately.',
    controls: [{ path: 'packages/privacy/src/consent/consent.ts', symbol: 'createConsentService' }],
    residualRisk: 'low',
    status: 'mitigated',
  },
]);

/** Cross-checks references so the register stays internally consistent. Returns problems found. */
export function validateThreatRegister(threats: readonly Threat[] = THREATS): string[] {
  const assetIds = new Set(ASSETS.map((a) => a.id));
  const adversaryIds = new Set(ADVERSARIES.map((a) => a.id));
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const t of threats) {
    if (ids.has(t.id)) problems.push(`${t.id}: duplicate id`);
    ids.add(t.id);
    for (const a of t.assets) if (!assetIds.has(a)) problems.push(`${t.id}: unknown asset ${a}`);
    for (const a of t.adversaries) if (!adversaryIds.has(a)) problems.push(`${t.id}: unknown adversary ${a}`);
    if (t.controls.length === 0) problems.push(`${t.id}: no controls`);
  }
  return problems;
}
