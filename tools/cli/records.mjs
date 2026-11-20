import { promises as fs, constants } from 'node:fs';
import { MAX_ENVELOPE_BYTES, verifyEnvelope } from '../../packages/federation/src/index.ts';
import { validatePublicListingStatement } from '../../packages/discovery/src/index.ts';

export const RECORD_SCHEMA_VERSION = 1;
export const RECORD_LIMITS = Object.freeze({ bytes: MAX_ENVELOPE_BYTES });
const ERRORS = Object.freeze({
  USAGE: [2, 'Use record verify --file FILE [--json]. Only an explicit local file is supported.'],
  FILE_INVALID: [2, 'Input must be a regular file, not a symbolic link, directory or device.'],
  FILE_TOO_LARGE: [2, 'Input exceeds the 1048576-byte public record limit.'],
  FILE_UNREADABLE: [3, 'Unable to read the selected local file.'],
  INVALID_JSON: [2, 'Input must contain one valid UTF-8 JSON record.'],
  INVALID_RECORD: [2, 'Public record verification failed. Check the signed file, author, payload and expiry.'],
});

class RecordFailure extends Error {
  constructor(code) { super(ERRORS[code][1]); this.code = code; }
}

function options(args) {
  if (args[0] !== 'verify') throw new RecordFailure('USAGE');
  const parsed = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--json' && parsed.json === undefined) parsed.json = true;
    else if (args[i] === '--file' && parsed.file === undefined && args[i + 1] && !args[i + 1].startsWith('--')) parsed.file = args[++i];
    else throw new RecordFailure('USAGE');
  }
  if (!parsed.file || parsed.file === '-' || parsed.file.length > 4096 || /[\p{Cc}]/u.test(parsed.file)
    || /^[a-z][a-z0-9+.-]*:\/\//i.test(parsed.file) || /^[\\/]{2}/.test(parsed.file)) throw new RecordFailure('USAGE');
  return parsed;
}

/** Read through one opened descriptor, with a real byte cap even if the file grows after stat.
 * O_NONBLOCK also prevents a file-to-FIFO race from hanging open on platforms that support it. */
export async function readPublicRecordWithSize(file) {
  let handle;
  try {
    const selected = await fs.lstat(file);
    if (!selected.isFile()) throw new RecordFailure('FILE_INVALID');
    handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== selected.dev || opened.ino !== selected.ino) throw new RecordFailure('FILE_INVALID');
    if (opened.size > MAX_ENVELOPE_BYTES) throw new RecordFailure('FILE_TOO_LARGE');
    const buffer = Buffer.alloc(MAX_ENVELOPE_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length > MAX_ENVELOPE_BYTES) throw new RecordFailure('FILE_TOO_LARGE');
    try { return { record: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, length))), bytes: length }; }
    catch { throw new RecordFailure('INVALID_JSON'); }
  } catch (error) {
    if (error instanceof RecordFailure) throw error;
    throw new RecordFailure('FILE_UNREADABLE');
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
}

export async function readPublicRecord(file) {
  return (await readPublicRecordWithSize(file)).record;
}

export async function verifyPublicRecord(input, now = Date.now()) {
  // Do not inspect an untrusted type/payload before the strict envelope verifier detaches it.
  const envelope = await verifyEnvelope(input, { now });
  const checked = validatePublicListingStatement(envelope, now);
  if (!checked.ok) throw new RecordFailure('INVALID_RECORD');
  const { data, isTombstone } = checked.value;
  return {
    schemaVersion: RECORD_SCHEMA_VERSION, command: 'record.verify', ok: true,
    record: {
      type: envelope.type, cid: envelope.cid, author: envelope.author,
      listingId: data.listingId, revision: data.revision, createdAt: envelope.createdAt,
      sequence: envelope.seq, previousCid: envelope.prev,
    },
    verification: {
      checkedAt: new Date(now).toISOString(), signature: 'valid', contentHash: 'valid',
      payload: 'valid', authorBinding: 'valid', expiry: isTombstone ? 'not-applicable' : 'unexpired',
      chain: 'unchecked', history: 'unchecked', revocation: 'unchecked',
      currentOwnership: 'not-established', trust: 'not-established', admission: 'not-performed',
    },
  };
}

export async function runRecordCommand(args) {
  try {
    const parsed = options(args);
    const input = await readPublicRecord(parsed.file);
    let result;
    try { result = await verifyPublicRecord(input); }
    catch { throw new RecordFailure('INVALID_RECORD'); }
    return { exitCode: 0, result };
  } catch (error) {
    const code = error instanceof RecordFailure ? error.code : 'FILE_UNREADABLE';
    const [exitCode, message] = ERRORS[code];
    return { exitCode, result: { schemaVersion: RECORD_SCHEMA_VERSION, command: 'record.verify', ok: false, error: { code, message } } };
  }
}

export function formatRecordResult(result, json) {
  if (json) return JSON.stringify(result);
  if (!result.ok) return `ClassRup: ${result.error.code}: ${result.error.message}`;
  const { record, verification } = result;
  return [
    'Verified public signed record.',
    `Type: ${record.type}`, `CID: ${record.cid}`, `Author: ${record.author}`,
    `Listing: ${record.listingId}`, `Revision: ${record.revision}`, `Checked: ${verification.checkedAt}`,
    `Signature, content hash, payload and author binding: valid. Expiry: ${verification.expiry}.`,
    'Chain, retained history and revocation: unchecked.',
    'Current ownership and trust: not established. Vault admission: not performed.',
  ].join('\n');
}
