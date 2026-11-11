// stripImage / verifyImageClean pipeline: analyze, optional caller-supplied downscale, rebuild, verify.
import { appError, err, ok, type AppError, type Result } from '@classrup/kernel';
import { metadataErrors } from './errors.ts';
import { analyzeImage, MAX_INPUT_BYTES, MAX_SIDE_PX, type Finding, type ImageMime } from './formats.ts';

export const DEFAULT_MAX_SIDE = 4096;

export interface CleanImage {
  readonly bytes: Uint8Array;
  readonly mime: ImageMime;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
  /** EXIF orientation (1..8) found in the source before it was dropped; absent when none or after a downscale. */
  readonly orientation?: number;
}

export interface DownscaleInput {
  readonly bytes: Uint8Array;
  readonly mime: ImageMime;
  readonly width: number;
  readonly height: number;
  readonly orientation?: number;
}

/** Codec port: re-encodes an over-sized image so its longest side is at most maxSide. Its output is parsed and verified again. */
export type Downscale = (input: DownscaleInput, maxSide: number) => Promise<Uint8Array>;

export interface StripOptions {
  /** Longest allowed side after processing, 16..16384, default 4096. */
  readonly maxSide?: number;
  /** Input size cap, at most 10 MiB (default). */
  readonly maxBytes?: number;
  /** Required to accept images between maxSide and 16384 px; without it such images are refused. */
  readonly downscale?: Downscale;
}

export interface VerifyResult {
  readonly clean: boolean;
  readonly findings: readonly Finding[];
}

function reasonError(reason: 'unsupported' | 'too_large' | 'animated' | 'malformed'): AppError {
  return metadataErrors.make(reason === 'too_large' ? 'PRIVACY_METADATA_IMAGE_TOO_LARGE' : 'PRIVACY_METADATA_IMAGE_UNSUPPORTED', { params: { reason } });
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>);
  let out = '';
  for (const b of new Uint8Array(digest)) out += b.toString(16).padStart(2, '0');
  return out;
}

/**
 * Removes every metadata structure from a JPEG, PNG or WebP by rebuilding the container from a whitelist of
 * structural segments. The result is verified before it is returned; any failure returns an error and no bytes.
 */
export async function stripImage(bytes: Uint8Array, opts: StripOptions = {}): Promise<Result<CleanImage, AppError>> {
  const maxSide = opts.maxSide ?? DEFAULT_MAX_SIDE;
  const maxBytes = opts.maxBytes ?? MAX_INPUT_BYTES;
  if (!Number.isInteger(maxSide) || maxSide < 16 || maxSide > MAX_SIDE_PX || !Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_INPUT_BYTES) return err(appError('VALIDATION_FAILED'));
  const first = analyzeImage(bytes, maxBytes);
  if (!first.ok) return err(reasonError(first.reason));
  let current = first;
  let orientation = first.orientation;
  if (Math.max(first.width, first.height) > maxSide) {
    if (!opts.downscale) return err(metadataErrors.make('PRIVACY_METADATA_IMAGE_TOO_LARGE', { params: { reason: 'downscale_required' } }));
    let scaled: Uint8Array;
    try {
      scaled = await opts.downscale({ bytes: first.output, mime: first.mime, width: first.width, height: first.height, ...(orientation === undefined ? {} : { orientation }) }, maxSide);
    } catch {
      return err(metadataErrors.make('PRIVACY_METADATA_IMAGE_UNSUPPORTED', { params: { reason: 'downscale_failed' } }));
    }
    const second = analyzeImage(scaled, maxBytes);
    if (!second.ok) return err(reasonError(second.reason));
    if (Math.max(second.width, second.height) > maxSide) return err(metadataErrors.make('PRIVACY_METADATA_IMAGE_TOO_LARGE', { params: { reason: 'downscale_insufficient' } }));
    current = second;
    orientation = undefined;
  }
  const verified = analyzeImage(current.output, maxBytes);
  if (!verified.ok || verified.findings.length > 0 || verified.width !== current.width || verified.height !== current.height) return err(metadataErrors.make('PRIVACY_METADATA_GPS_PRESENT'));
  const sha256 = await sha256Hex(current.output);
  return ok({ bytes: current.output, mime: current.mime, width: current.width, height: current.height, sha256, ...(orientation === undefined ? {} : { orientation }) });
}

/** Reports every residual metadata structure; an undecodable, animated or oversized input is never clean. */
export function verifyImageClean(bytes: Uint8Array): VerifyResult {
  const a = analyzeImage(bytes);
  if (!a.ok) return { clean: false, findings: [{ kind: 'unknown_segment', where: a.reason }] };
  return { clean: a.findings.length === 0, findings: a.findings };
}
