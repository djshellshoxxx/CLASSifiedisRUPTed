/** Persisted record shapes of the comms area. All records are JSON-safe and frozen by the store. */
import type { Versioned } from '@classrup/kernel';
import type { MultiRecipientCiphertext } from '@classrup/security';

export const SUBJECT_TYPES = ['listing', 'offer', 'trade', 'cycle', 'booking', 'rental', 'auction'] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

export interface ThreadSubject {
  readonly type: SubjectType;
  readonly id: string;
}

export interface Thread extends Versioned {
  readonly tenantId: string;
  readonly createdBy: string;
  readonly subject?: ThreadSubject;
  /** Messages sent after this is set expire after this many ms. */
  readonly disappearingTtlMs?: number;
  readonly createdAt: number;
}

export type ParticipantStatus = 'invited' | 'active' | 'declined' | 'left';

/** Routing metadata: the participant list is the only thing the relay knows about a conversation. */
export interface Participant extends Versioned {
  /** `<threadId>:<accountId>` */
  readonly tenantId: string;
  readonly threadId: string;
  readonly accountId: string;
  readonly status: ParticipantStatus;
  readonly invitedBy: string;
  readonly archived: boolean;
  readonly muted: boolean;
  /** Opt-in: when false (default) other participants never see this participant's read position. */
  readonly readReceipts: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ThreadCounter extends Versioned {
  readonly threadId: string;
  readonly last: number;
}

export interface Message extends Versioned {
  readonly tenantId: string;
  readonly threadId: string;
  /** Per-thread, monotonic, gapless. */
  readonly sequence: number;
  readonly senderId: string;
  readonly ciphertext: MultiRecipientCiphertext;
  /** accountId -> box key ids the content key was sealed to at send time. */
  readonly recipients: Readonly<Record<string, readonly string[]>>;
  readonly attachmentIds: readonly string[];
  readonly receivedAt: number;
  readonly expiresAt?: number;
  readonly deletedFor: readonly string[];
}

export interface ReadMark extends Versioned {
  readonly tenantId: string;
  readonly threadId: string;
  readonly accountId: string;
  readonly upToSequence: number;
  readonly at: number;
}

export type AttachmentStatus = 'pending' | 'attached';

export interface Attachment extends Versioned {
  readonly tenantId: string;
  readonly threadId: string;
  readonly uploaderId: string;
  /** sha256 of the encrypted blob. The blob's content key lives only inside message ciphertext. */
  readonly contentHash: string;
  readonly sizeBytes: number;
  readonly mime: string;
  readonly status: AttachmentStatus;
  readonly messageId?: string;
  readonly createdAt: number;
}

export type CardRefType = 'offer' | 'proposal' | 'cycle';
export type CardStatus = 'current' | 'superseded';

/** Negotiation card: pointer to a canonical record owned by bazaar/mutiny, never a copy of its terms. */
export interface Card extends Versioned {
  readonly tenantId: string;
  readonly threadId: string;
  readonly postedBy: string;
  readonly refType: CardRefType;
  readonly refId: string;
  readonly revisionHash: string;
  /** Relay-visible: clients must keep this neutral (no addresses, contact details). */
  readonly summary: string;
  readonly status: CardStatus;
  readonly afterSequence: number;
  readonly createdAt: number;
}

export type ConsentDecision = 'accept' | 'decline' | 'revoke';

export interface ConsentStatement {
  readonly accountId: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly revisionHash: string;
  readonly decision: ConsentDecision;
  readonly at: number;
}

export interface ConsentRecord extends Versioned {
  readonly tenantId: string;
  readonly statement: ConsentStatement;
  readonly signerKeyId: string;
  readonly signature: string;
  readonly recordedAt: number;
}

export const SAFE_SPOT_KINDS = ['police_station_lobby', 'library', 'cafe', 'community_center', 'shopping_mall', 'bank_lobby', 'other_public'] as const;
export type SafeSpotKind = (typeof SAFE_SPOT_KINDS)[number];

export interface SafeSpot extends Versioned {
  readonly tenantId: string;
  readonly name: string;
  readonly kind: SafeSpotKind;
  /** Public geohash cell, length <= 5. No street address or coordinates are stored. */
  readonly regionCell: string;
  readonly status: 'active' | 'retired';
  readonly createdBy: string;
  readonly createdAt: number;
}

export type MeetupState = 'proposed' | 'confirmed' | 'cancelled' | 'expired' | 'completed' | 'no_show';

export type MeetupPlace =
  | { readonly kind: 'safe_spot'; readonly safeSpotId: string }
  | {
      readonly kind: 'private';
      /** Place description encrypted to the meetup participants; the relay never sees it. */
      readonly sealed: MultiRecipientCiphertext;
      readonly recipients: Readonly<Record<string, readonly string[]>>;
    };

export interface MeetupWindow {
  readonly startsAt: number;
  readonly endsAt: number;
}

export interface Meetup extends Versioned {
  readonly tenantId: string;
  readonly threadId: string;
  readonly participantIds: readonly string[];
  readonly proposerId: string;
  readonly state: MeetupState;
  /** Increments on every material change (counter/reschedule); consent restarts for each revision. */
  readonly revision: number;
  readonly revisedBy: string;
  readonly window: MeetupWindow;
  readonly place: MeetupPlace;
  readonly acceptedBy: readonly string[];
  /** accountId -> time of an "I'm here" claim. A claim, not proof of presence. */
  readonly arrivals: Readonly<Record<string, number>>;
  readonly cancelReason?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface NoShowClaim extends Versioned {
  readonly tenantId: string;
  readonly meetupId: string;
  readonly reporterId: string;
  readonly accusedId: string;
  readonly at: number;
  /** True when the accused had checked in: the claims conflict and neither is verified. */
  readonly contradictedByCheckIn: boolean;
}

export type HandoffStatus = 'pending' | 'confirmed' | 'locked';

/** Keyed by meetup id. Holds only a salted hash of the receiver's 6-digit code. */
export interface Handoff extends Versioned {
  readonly tenantId: string;
  readonly meetupId: string;
  readonly meetupRevision: number;
  readonly receiverId: string;
  readonly codeHash: string;
  readonly expiresAt: number;
  readonly failedAttempts: number;
  readonly status: HandoffStatus;
  readonly confirmedBy?: string;
  readonly confirmedAt?: number;
}

export interface SafetyShare extends Versioned {
  readonly tenantId: string;
  readonly meetupId: string;
  readonly createdBy: string;
  readonly expiresAt: number;
  readonly revoked: boolean;
  readonly createdAt: number;
}
