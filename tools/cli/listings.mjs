import { createHash } from 'node:crypto';
import { createBus, createMemoryStorage, createRegistry, createUuidV7Generator, isUuidV7 } from '../../packages/kernel/src/index.ts';
import { publicKeyFromDid } from '../../packages/security/src/index.ts';
import { verifyEnvelope } from '../../packages/federation/src/index.ts';
import { discoveryDefinitions, validatePublicListingStatement } from '../../packages/discovery/src/index.ts';
import { readPublicRecordWithSize } from './records.mjs';

export const LISTING_SCHEMA_VERSION = 1;
export const LISTING_LIMITS = Object.freeze({ files: 128, bytes: 16 * 1024 * 1024, page: 100, defaultPage: 20 });
const ERRORS = Object.freeze({
  USAGE: [2, 'Use listing list/show or search with explicit --file FILE inputs and documented options. See --help.'],
  FILE_INVALID: [2, 'Input must be a regular file, not a symbolic link, directory or device.'],
  FILE_TOO_LARGE: [2, 'Input exceeds the 1048576-byte public record limit.'],
  FILE_UNREADABLE: [3, 'Unable to read a selected local file.'],
  INVALID_JSON: [2, 'Input must contain one valid UTF-8 JSON record.'],
  INVALID_RECORD: [2, 'Public record verification failed. Check the signed file, author, payload and expiry.'],
  INPUT_LIMIT: [2, 'Select at most 128 public files with at most 16777216 bytes in total.'],
  HISTORY_CONFLICT: [2, 'Selected records contain conflicting listing revisions or a withdrawal with an inconsistent target.'],
  SNAPSHOT_CHANGED: [2, 'The selected records or query differ from the requested snapshot. Restart pagination.'],
  NOT_FOUND: [4, 'No current listing for the selected owner and listing ID exists in the supplied public files.'],
  QUERY_FAILED: [3, 'The public listing view could not be evaluated. No persistent state was changed.'],
});
const READ_ERRORS = new Set(['FILE_INVALID', 'FILE_TOO_LARGE', 'FILE_UNREADABLE', 'INVALID_JSON']);
class ListingFailure extends Error {
  constructor(code) { super(ERRORS[code][1]); this.code = code; }
}
const fail = code => { throw new ListingFailure(code); };
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const safeFile = file => file && file !== '-' && file.length <= 4096 && !/[\p{Cc}]/u.test(file)
  && !/^[a-z][a-z0-9+.-]*:\/\//i.test(file) && !/^[\\/]{2}/.test(file);

/** Error envelopes never include an unchecked command or argument supplied by the caller. */
export function publicListingCommandName(family, args) {
  return family === 'search' ? 'search' : args[0] === 'list' ? 'listing.list' : args[0] === 'show' ? 'listing.show' : 'listing';
}

function options(family, args) {
  const command = publicListingCommandName(family, args);
  if (command === 'listing' || !['listing', 'search'].includes(family)) fail('USAGE');
  const tokens = family === 'search' ? args : args.slice(1);
  const flags = new Set(['--json', ...(command === 'listing.show' ? [] : ['--include-unavailable']), ...(family === 'search' ? ['--barter-only'] : [])]);
  const values = new Set(['--file', ...(command === 'listing.show' ? ['--id', '--owner'] : ['--limit', '--offset', '--snapshot']),
    ...(family === 'search' ? ['--query', '--region', '--category', '--kind', '--condition', '--currency', '--min-price', '--max-price'] : [])]);
  const parsed = { files: [] };
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (flags.has(token) && parsed[token] === undefined) parsed[token] = true;
    else if (values.has(token) && tokens[i + 1] !== undefined && (tokens[i + 1] !== '' || token === '--query')
      && !tokens[i + 1].startsWith('--') && (token === '--file' || parsed[token] === undefined)) {
      const value = tokens[++i];
      if (token === '--file') {
        if (!safeFile(value)) fail('USAGE');
        if (parsed.files.length === LISTING_LIMITS.files) fail('INPUT_LIMIT');
        parsed.files.push(value);
      } else parsed[token] = value;
    } else fail('USAGE');
  }
  if (parsed.files.length === 0) fail('USAGE');
  if (command === 'listing.show') {
    if (!isUuidV7(parsed['--id']) || !parsed['--owner'] || parsed['--owner'].length > 128) fail('USAGE');
    try { publicKeyFromDid(parsed['--owner']); } catch { fail('USAGE'); }
  }
  const integer = (key, fallback, minimum, maximum) => {
    const value = parsed[key];
    if (value === undefined) return fallback;
    if (!/^(0|[1-9][0-9]{0,3})$/.test(value) || Number(value) < minimum || Number(value) > maximum) fail('USAGE');
    return Number(value);
  };
  const limit = integer('--limit', LISTING_LIMITS.defaultPage, 1, LISTING_LIMITS.page);
  const offset = integer('--offset', 0, 0, LISTING_LIMITS.files);
  if (parsed['--snapshot'] && !/^sha256-[a-f0-9]{64}$/.test(parsed['--snapshot'])) fail('USAGE');
  if ((parsed['--min-price'] !== undefined || parsed['--max-price'] !== undefined) && !parsed['--currency']) fail('USAGE');
  const searchOptions = { sort: 'retained' };
  for (const [flag, field] of [['--category', 'categoryId'], ['--kind', 'kind'], ['--condition', 'condition']]) {
    if (parsed[flag] !== undefined) searchOptions[field] = parsed[flag];
  }
  if (parsed['--currency']) searchOptions.price = { currency: parsed['--currency'],
    ...(parsed['--min-price'] !== undefined ? { min: parsed['--min-price'] } : {}),
    ...(parsed['--max-price'] !== undefined ? { max: parsed['--max-price'] } : {}) };
  const query = { query: parsed['--query'] ?? '', options: searchOptions,
    barterOnly: parsed['--barter-only'] ?? false, includeUnavailable: command === 'listing.show' || (parsed['--include-unavailable'] ?? false),
    ...(parsed['--region'] ? { regionCell: parsed['--region'] } : {}) };
  // Validate through the actual shared query schema before reading any selected path.
  let checked;
  try { checked = discoveryDefinitions({ verifyEnvelope }).search.input.safeParse(query); }
  catch { fail('USAGE'); }
  if (!checked.success) fail('USAGE');
  return { command, files: parsed.files, query: checked.data, limit, offset, snapshot: parsed['--snapshot'],
    ...(command === 'listing.show' ? { owner: parsed['--owner'], id: parsed['--id'] } : {}) };
}

function publicView(item) {
  // The shared strict payload schema permits public fields only. Never return raw ext,
  // envelopes, filesystem names, transport state or local observation timestamps.
  const envelope = item.envelopes[0];
  return { cid: item.cid, author: item.ownerId, createdAt: envelope.createdAt,
    sequence: envelope.seq, previousCid: envelope.prev, listing: item.projection };
}

/** Replay explicit public files through the PWA's own retain/search handlers, in memory only. */
async function queryFiles(parsed, now) {
  let bytes = 0;
  const unique = new Map();
  for (const file of parsed.files) {
    let input;
    try {
      const read = await readPublicRecordWithSize(file);
      bytes += read.bytes;
      if (bytes > LISTING_LIMITS.bytes) fail('INPUT_LIMIT');
      input = read.record;
    } catch (error) {
      if (error instanceof ListingFailure) throw error;
      fail(READ_ERRORS.has(error?.code) ? error.code : 'FILE_UNREADABLE');
    }
    let envelope;
    try { envelope = await verifyEnvelope(input, { now }); }
    catch { fail('INVALID_RECORD'); }
    if (!validatePublicListingStatement(envelope, now).ok) fail('INVALID_RECORD');
    unique.set(envelope.cid, envelope);
  }
  // File order must not decide which public revision wins. Histories are per owner
  // and listing; a same-revision fork fails the whole query rather than being hidden.
  const ordered = [...unique.values()].sort((a, b) => compare(a.author, b.author)
    || compare(a.payload.listingId, b.payload.listingId) || a.payload.revision - b.payload.revision || compare(a.cid, b.cid));
  const snapshot = `sha256-${createHash('sha256').update(JSON.stringify({ command: parsed.command,
    cids: [...unique.keys()].sort(), query: parsed.query, owner: parsed.owner, id: parsed.id })).digest('hex')}`;
  if (parsed.snapshot && parsed.snapshot !== snapshot) fail('SNAPSHOT_CHANGED');
  const clock = { now: () => now, iso: () => new Date(now).toISOString() };
  const ids = createUuidV7Generator({ now: clock.now });
  const storage = createMemoryStorage();
  try {
    const definitions = discoveryDefinitions({ verifyEnvelope: input => verifyEnvelope(input, { now }) });
    const registry = createRegistry().add(...definitions.all);
    const bus = createBus({ registry, storage, clock, ids, origin: 'cli:public-files',
      authz: { authorize: (_actor, capability) => ['discovery.listing.retain', 'discovery.listing.search'].includes(capability)
        ? { allow: true } : { allow: false, code: 'FORBIDDEN' } } });
    // This system actor identifies a temporary computation, not an identity, vault
    // owner or delegated authority. Only two public-view handlers are registered.
    const context = { actor: { kind: 'system', id: 'cli-public-files', roles: [] }, tenantId: ids.next() };
    for (const envelope of ordered) {
      const retained = await bus.dispatch(context, 'discovery.listing.retain', { envelope }, { idempotencyKey: ids.next() });
      if (!retained.ok) fail(retained.error.code === 'CONFLICT_REVISION' ? 'HISTORY_CONFLICT' : 'QUERY_FAILED');
      if (retained.value.value.state === 'conflicted') fail('HISTORY_CONFLICT');
    }
    const searched = await bus.query(context, 'discovery.listing.search', parsed.query);
    if (!searched.ok) fail('QUERY_FAILED');
    const items = searched.value.value.items.sort((a, b) => compare(a.ownerId, b.ownerId) || compare(a.listingId, b.listingId));
    const source = { kind: 'explicit-public-files', filesRead: parsed.files.length, uniqueRecords: ordered.length, snapshot };
    const verification = { checkedAt: clock.iso(), signature: 'valid', contentHash: 'valid', payload: 'valid',
      authorBinding: 'valid', expiry: 'unexpired', history: 'selected-files-only', chain: 'unchecked', revocation: 'unchecked',
      currentOwnership: 'not-established', trust: 'not-established', persistence: 'none' };
    if (parsed.command === 'listing.show') {
      const item = items.find(item => item.ownerId === parsed.owner && item.listingId === parsed.id);
      if (!item) fail('NOT_FOUND');
      return { source, verification, item: publicView(item) };
    }
    const page = items.slice(parsed.offset, parsed.offset + parsed.limit);
    const next = parsed.offset + page.length;
    return { source, verification, items: page.map(publicView),
      pagination: { offset: parsed.offset, limit: parsed.limit, total: items.length, nextOffset: next < items.length ? next : null },
      excludedSubjects: searched.value.value.staleOrExcluded };
  } finally { await storage.close(); }
}

export async function runPublicListingCommand(family, args, now = Date.now()) {
  const command = publicListingCommandName(family, args);
  try {
    const parsed = options(family, args);
    const view = await queryFiles(parsed, now);
    return { exitCode: 0, result: { schemaVersion: LISTING_SCHEMA_VERSION, command, ok: true, ...view } };
  } catch (error) {
    const code = error instanceof ListingFailure ? error.code : 'QUERY_FAILED';
    const [exitCode, message] = ERRORS[code];
    return { exitCode, result: { schemaVersion: LISTING_SCHEMA_VERSION, command, ok: false, error: { code, message } } };
  }
}

// JSON already escapes Cc characters. Escape formatting and line separators too,
// preserving the exact strings for JSON readers without allowing terminal spoofing.
const jsonText = value => JSON.stringify(value).replace(/[\p{Cf}\p{Zl}\p{Zp}]/gu,
  character => character.split('').map(unit => `\\u${unit.charCodeAt(0).toString(16).padStart(4, '0')}`).join(''));
export function formatPublicListingResult(result, json) {
  if (json) return jsonText(result);
  if (!result.ok) return `ClassRup: ${result.error.code}: ${result.error.message}`;
  const lines = ['Public listing view from selected files only.'];
  for (const item of result.item ? [result.item] : result.items) {
    const p = item.listing;
    lines.push(`Listing: ${p.listingId}`, `Owner: ${p.ownerId}`, `Title: ${jsonText(p.title)}`,
      `Kind: ${p.kind}; revision: ${p.revision}; availability: ${p.availability}`, `CID: ${item.cid}`);
    if (result.item) lines.push(`Description: ${jsonText(p.description)}`, `Category: ${p.categoryId}`,
      `Coarse region: ${p.regionCell}`, `Tags: ${jsonText(p.tags)}`, `Expires: ${p.expiresAt}`,
      `Value: ${p.value ? `${p.value.amount} ${p.value.currency} minor units` : 'not declared'}`);
  }
  if (result.pagination) lines.push(`Returned: ${result.items.length}; matching: ${result.pagination.total}; excluded subjects: ${result.excludedSubjects}.`,
    `Offset: ${result.pagination.offset}; next offset: ${result.pagination.nextOffset ?? 'none'}.`);
  lines.push(`Snapshot: ${result.source.snapshot}`, `Checked: ${result.verification.checkedAt}`,
    'Signatures, content hashes, public payloads, author bindings and listing expiry: valid.',
    'History: selected files only. Chain and revocation: unchecked.',
    'Current ownership, unseen revisions and trust: not established. Persistent writes: none.');
  return lines.join('\n');
}
