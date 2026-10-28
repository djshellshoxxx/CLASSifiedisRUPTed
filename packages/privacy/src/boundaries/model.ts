/**
 * F10.S02.M02 privacy model: what we protect (assets), from whom (adversaries), where trust
 * changes (boundaries) and who may see which disclosure class (matrix). Typed data, so tests and
 * the operator UI read the same source of truth as the code that enforces it.
 */
import type { DisclosureClass } from '@classrup/kernel';

export type ViewerRelation = 'public' | 'participant' | 'self' | 'operator';

export const VIEWER_RELATIONS: readonly ViewerRelation[] = ['public', 'participant', 'self', 'operator'];
export const DISCLOSURE_CLASSES: readonly DisclosureClass[] = ['public', 'participants', 'private', 'secret'];

/**
 * Least-privilege matrix. `secret` data never leaves the device or secret store, so no relation sees it.
 * Operators see what participants see; private data needs the owner (or legal process outside the product).
 */
const MATRIX: Readonly<Record<DisclosureClass, readonly ViewerRelation[]>> = {
  public: ['public', 'participant', 'self', 'operator'],
  participants: ['participant', 'self', 'operator'],
  private: ['self'],
  secret: [],
};

export const canDisclose = (cls: DisclosureClass, relation: ViewerRelation): boolean => MATRIX[cls].includes(relation);

export interface Asset {
  readonly id: string;
  readonly name: string;
  readonly disclosure: DisclosureClass;
  readonly ownerArea: string;
  readonly description: string;
}

export interface Adversary {
  readonly id: string;
  readonly name: string;
  readonly capabilities: readonly string[];
  readonly limits: readonly string[];
}

export interface TrustBoundary {
  readonly id: string;
  readonly name: string;
  readonly trusted: boolean;
  readonly enforces: readonly string[];
}

export const ASSETS: readonly Asset[] = Object.freeze([
  { id: 'A-PSEUDONYM', name: 'Pseudonym and public profile', disclosure: 'public', ownerArea: 'identity', description: 'User-chosen name, display fields the user marked public.' },
  { id: 'A-REGION', name: 'Coarse region cell', disclosure: 'participants', ownerArea: 'identity', description: 'Geohash of length <= 5 (~5 km). The finest location ever stored in public records.' },
  { id: 'A-EXACT-LOCATION', name: 'Exact address and coordinates', disclosure: 'private', ownerArea: 'comms', description: 'Disclosed only by explicit user action to named participants of one trade.' },
  { id: 'A-DEVICE-KEYS', name: 'Device private keys', disclosure: 'secret', ownerArea: 'client', description: 'Ed25519/X25519 secrets; generated and kept on the device, never sent to a relay.' },
  { id: 'A-SESSION', name: 'Session bearer tokens', disclosure: 'secret', ownerArea: 'identity', description: 'Random tokens; the relay stores only a hash.' },
  { id: 'A-RECOVERY', name: 'Recovery codes', disclosure: 'secret', ownerArea: 'identity', description: 'Shown once; only hashes are stored.' },
  { id: 'A-MESSAGES', name: 'Private message content', disclosure: 'participants', ownerArea: 'comms', description: 'End-to-end encrypted; relays see ciphertext and routing metadata.' },
  { id: 'A-TRADE-EVIDENCE', name: 'Trade and settlement evidence', disclosure: 'participants', ownerArea: 'commerce', description: 'Append-only claims and receipts, retained per policy.' },
  { id: 'A-REPUTATION', name: 'Feedback and reputation', disclosure: 'public', ownerArea: 'identity', description: 'Ratings between verified counterparties, aggregated publicly.' },
  { id: 'A-NETWORK-METADATA', name: 'IP addresses and timing', disclosure: 'private', ownerArea: 'platform', description: 'Observed by the relay operator; stored truncated and coarsened.' },
  { id: 'A-CONSENT', name: 'Consent and deletion records', disclosure: 'private', ownerArea: 'privacy', description: 'What the person agreed to and requested, kept as accountability evidence.' },
  { id: 'A-EXPORT', name: 'Data export bundles', disclosure: 'private', ownerArea: 'privacy', description: 'Complete copy of a person\'s data; available to the owner for seven days.' },
]);

export const ADVERSARIES: readonly Adversary[] = Object.freeze([
  { id: 'ADV-CURIOUS-USER', name: 'Curious or stalking user', capabilities: ['many accounts', 'repeated public queries', 'public profile scraping'], limits: ['no relay access'] },
  { id: 'ADV-COUNTERPARTY', name: 'Malicious counterparty', capabilities: ['sees data shared in a trade', 'can screenshot and leak', 'can leave false feedback'], limits: ['only sees what was disclosed to participants'] },
  { id: 'ADV-SYBIL', name: 'Sybil operator', capabilities: ['creates many pseudonyms', 'self-dealing across them', 'farms reputation'], limits: ['must complete real interactions to rate'] },
  { id: 'ADV-RELAY-OPERATOR', name: 'Curious relay operator', capabilities: ['reads the database', 'sees IPs and timing', 'sees routing metadata'], limits: ['cannot read E2E content or device secrets'] },
  { id: 'ADV-NETWORK', name: 'Network observer', capabilities: ['sees traffic volume and endpoints'], limits: ['cannot read TLS content; no anonymity guarantee against it'] },
  { id: 'ADV-PEER-RELAY', name: 'Malicious federated peer', capabilities: ['sends forged or replayed records', 'harvests federated content'], limits: ['receives only explicitly opted-in, signed records'] },
  { id: 'ADV-DATA-THIEF', name: 'Database thief', capabilities: ['obtains a copy of stored records'], limits: ['hashes and ciphertext only for secrets'] },
  { id: 'ADV-HOST', name: 'Compromised static PWA host', capabilities: ['serves malicious client code'], limits: ['cannot enforce or bypass relay authorization'] },
]);

export const TRUST_BOUNDARIES: readonly TrustBoundary[] = Object.freeze([
  { id: 'B-CLIENT', name: 'PWA client and static host', trusted: false, enforces: ['nothing: all input is validated again by the relay'] },
  { id: 'B-RELAY', name: 'Relay / backend', trusted: true, enforces: ['authentication', 'authorization', 'validation', 'rate limits', 'persistence', 'retention'] },
  { id: 'B-PEER', name: 'Federated peer relays', trusted: false, enforces: ['signed envelopes', 'explicit opt-in', 'blocklists'] },
  { id: 'B-PAYMENT', name: 'External wallets, chains, payment providers', trusted: false, enforces: ['independent confirmation before any claim counts as settled'] },
  { id: 'B-NETWORK', name: 'Network', trusted: false, enforces: ['TLS only'] },
]);

export interface ModelDescription {
  readonly assets: readonly Asset[];
  readonly adversaries: readonly Adversary[];
  readonly boundaries: readonly TrustBoundary[];
  readonly matrix: Readonly<Record<DisclosureClass, readonly ViewerRelation[]>>;
}

export const describeModel = (): ModelDescription => ({ assets: ASSETS, adversaries: ADVERSARIES, boundaries: TRUST_BOUNDARIES, matrix: MATRIX });
