import { describe, expect, it } from 'vitest';
import { copyAttachmentBatchMember } from '../../packages/vault/src/attachment-manifest.ts';

describe('bounded attachment member snapshots', () => {
  it('copies exactly the view, without aliasing its backing buffer', () => {
    const backing = Uint8Array.of(1, 2, 3, 4);
    const copy = copyAttachmentBatchMember(backing.subarray(1, 3), 2, 'size mismatch');
    expect(copy).toEqual(Uint8Array.of(2, 3));
    copy.fill(0);
    expect(backing).toEqual(Uint8Array.of(1, 2, 3, 4));
    expect(copyAttachmentBatchMember(new Uint8Array(0), 0, 'size mismatch')).toHaveLength(0);
  });

  it('checks actual byte length rather than an own shadowing property', () => {
    const source = Uint8Array.of(1, 2, 3);
    Object.defineProperty(source, 'byteLength', { value: 2 });
    expect(() => copyAttachmentBatchMember(source, 2, 'size mismatch')).toThrow('size mismatch');
    expect(copyAttachmentBatchMember(source, 3, 'size mismatch')).toEqual(Uint8Array.of(1, 2, 3));
    expect(() => copyAttachmentBatchMember(source, 4, 'size mismatch')).toThrow('size mismatch');
  });
});
