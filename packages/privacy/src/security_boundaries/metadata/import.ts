import { stripImage, type CleanImage, type StripOptions } from './image.ts';

export type ImportDecision =
  | { readonly status: 'accepted'; readonly image: CleanImage }
  | { readonly status: 'quarantined'; readonly code: string };

/**
 * Import path for images from older exports or other vaults: every image is stripped and verified,
 * failures are quarantined with the documented error code and no bytes are accepted.
 */
export async function sanitizeImportedImage(bytes: Uint8Array, opts: StripOptions = {}): Promise<ImportDecision> {
  const r = await stripImage(bytes, opts);
  return r.ok ? { status: 'accepted', image: r.value } : { status: 'quarantined', code: r.error.code };
}
