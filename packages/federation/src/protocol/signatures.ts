/**
 * F11.S01.M03 signatures: every federated record carries the author's Ed25519 signature over the record
 * (context `federated-record`) and the origin relay's countersignature (context `relay-countersign`) that
 * binds the record hash, the author signature and the relay id. Transport batches are signed by the sending
 * relay (context `federation-batch`). A valid signature evidences who asserted the record, not that it is true.
 */
import type { SignedEnvelope, SigningKeyPair } from '@classrup/security';
import { contentHash, publicKeyFromKeyId, signDetached, signEnvelope, verifyDetached, verifyEnvelope } from '@classrup/security';
import type { FederatedEnvelope, FederatedRecord, FederationBatch, MigrationProof } from '../types';

export const RECORD_CONTEXT = 'federated-record';
export const RELAY_CONTEXT = 'relay-countersign';
export const BATCH_CONTEXT = 'federation-batch';
export const MIGRATION_CONTEXT = 'account-migration';
export const BLOCKLIST_CONTEXT = 'federation-blocklist';

/** Author side (runs on the client). */
export const signRecord = (keys: SigningKeyPair, record: FederatedRecord): FederatedEnvelope => ({
  record,
  authorSig: signDetached(keys.secretKey, RECORD_CONTEXT, record),
});

const countersignPayload = (record: FederatedRecord, authorSig: string) => ({ recordHash: contentHash(record), authorSig, relayId: record.originRelay });

export function countersign(relayKeys: SigningKeyPair, relayKeyId: string, envelope: FederatedEnvelope): FederatedEnvelope {
  const { record, authorSig } = envelope;
  return { record, authorSig, relayKeyId, relaySig: signDetached(relayKeys.secretKey, RELAY_CONTEXT, countersignPayload(record, authorSig)) };
}

export function verifyMigrationProof(proof: MigrationProof): boolean {
  try {
    const { statement } = proof;
    if (statement.oldKeyId === statement.newKeyId) return false;
    return (
      verifyDetached(publicKeyFromKeyId(statement.oldKeyId), MIGRATION_CONTEXT, statement, proof.oldSig) &&
      verifyDetached(publicKeyFromKeyId(statement.newKeyId), MIGRATION_CONTEXT, statement, proof.newSig)
    );
  } catch {
    return false;
  }
}

/**
 * Tombstones issued by a relay on account migration cannot be signed by the author's device at that moment;
 * they carry the migration proof, whose old-key signature is then the authorship evidence.
 */
function migratedTombstoneProof(record: FederatedRecord): MigrationProof | undefined {
  if (record.type !== 'tombstone' || record.payload.reason !== 'migrated') return undefined;
  return record.payload.migration as MigrationProof | undefined;
}

export function verifyAuthor(envelope: FederatedEnvelope): boolean {
  const { record } = envelope;
  const proof = migratedTombstoneProof(record);
  if (proof) {
    return proof.statement.oldKeyId === record.authorKeyId && proof.statement.fromRelay === record.originRelay && proof.oldSig === envelope.authorSig && verifyMigrationProof(proof);
  }
  try {
    return verifyDetached(publicKeyFromKeyId(record.authorKeyId), RECORD_CONTEXT, record, envelope.authorSig);
  } catch {
    return false;
  }
}

/** The countersignature must come from the key pinned for the origin relay. */
export function verifyCountersign(envelope: FederatedEnvelope, pinnedRelayKeyId: string): boolean {
  if (envelope.relayKeyId !== pinnedRelayKeyId || envelope.relaySig === undefined) return false;
  try {
    return verifyDetached(publicKeyFromKeyId(pinnedRelayKeyId), RELAY_CONTEXT, countersignPayload(envelope.record, envelope.authorSig), envelope.relaySig);
  } catch {
    return false;
  }
}

export const signBatch = (relayKeys: SigningKeyPair, batch: FederationBatch): SignedEnvelope<FederationBatch> => signEnvelope(relayKeys, BATCH_CONTEXT, batch);

export const verifyBatch = (signed: SignedEnvelope<FederationBatch>, pinnedRelayKeyId: string): boolean => verifyEnvelope(signed, BATCH_CONTEXT, pinnedRelayKeyId);
