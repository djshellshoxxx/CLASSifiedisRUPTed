import { isBlobRef } from '@classrup/kernel';
import { unseal } from '@classrup/identity';
import { MAX_ENVELOPE_BYTES, verifyEnvelope } from '@classrup/federation';
import { verifySealedAttachmentManifest } from './attachment-manifest.ts';

export const ZERO_REF_TRANSITION_TYPE = 'classrup.vault.attachment_zero_ref_transition/v1';
const CID = /^sha256-[0-9a-f]{64}$/;
const decoder = new TextDecoder('utf-8', { fatal: true });

export interface AttachmentZeroRefTransition {
  readonly principal: string;
  readonly type: string;
  readonly id: string;
  readonly ref: string;
  readonly priorRevision: number;
  readonly priorDataCid: string;
  readonly currentRevision: number;
  readonly currentDataCid: string;
}

function key(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256
    && !/[\u0000-\u001f\u007f]/u.test(value);
}

/**
 * Authenticate a separately versioned owner assertion and its earlier signed
 * manifest evidence. This verifies the asserted single-revision transition,
 * NOT the current destination state, record incarnation or replay history.
 * Never use the return value alone to detach holders, delete bytes or shred keys.
 */
export async function verifySealedAttachmentZeroRefTransition(
  priorManifest: unknown, sealedTransition: unknown, passphrase: string, expectedPrincipal: string,
): Promise<AttachmentZeroRefTransition> {
  const prior = await verifySealedAttachmentManifest(priorManifest, passphrase, expectedPrincipal);
  const plaintext = await unseal(sealedTransition, passphrase);
  try {
    if (plaintext.byteLength > MAX_ENVELOPE_BYTES) throw new Error('Attachment transition too large');
    const envelope = await verifyEnvelope(JSON.parse(decoder.decode(plaintext)) as unknown, {
      expectedType: ZERO_REF_TRANSITION_TYPE, expectedAuthor: expectedPrincipal,
    });
    const payload = envelope.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)
      || Object.keys(payload).sort().join(',') !== 'currentDataCid,currentRevision,id,priorDataCid,priorRevision,principal,ref,type'
      || envelope.seq !== 1 || envelope.prev !== null || Object.keys(envelope.ext).length !== 0) {
      throw new Error('Invalid attachment transition structure');
    }
    const row = payload as Record<string, unknown>;
    const { principal, type, id, ref, priorRevision, priorDataCid, currentRevision, currentDataCid } = row;
    if (principal !== expectedPrincipal || !key(type) || !key(id) || !isBlobRef(ref)
      || typeof priorRevision !== 'number' || !Number.isSafeInteger(priorRevision) || priorRevision < 1
      || typeof currentRevision !== 'number' || !Number.isSafeInteger(currentRevision)
      || currentRevision !== priorRevision + 1
      || typeof priorDataCid !== 'string' || !CID.test(priorDataCid)
      || typeof currentDataCid !== 'string' || !CID.test(currentDataCid) || currentDataCid === priorDataCid) {
      throw new Error('Invalid attachment transition fields');
    }
    const parent = prior.parents.find(candidate => candidate.type === type && candidate.id === id);
    if (!parent || parent.revision !== priorRevision || parent.dataCid !== priorDataCid || !parent.refs.includes(ref)) {
      throw new Error('Attachment transition prior evidence mismatch');
    }
    return Object.freeze({ principal: expectedPrincipal, type, id, ref, priorRevision, priorDataCid,
      currentRevision, currentDataCid });
  } finally { plaintext.fill(0); }
}
