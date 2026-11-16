import { boundedString, defineRepo, money, timestamp, uuidv7, z, type SignedEnvelope } from '@classrup/kernel';

const text = (min: number, max: number) => boundedString({ min, max }).refine(v => v === v.normalize('NFC') && !/[\p{Cc}\p{Cf}]/u.test(v));
export const fields = {
  title: text(3, 120), description: boundedString({ max: 5000 }), categoryId: uuidv7(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor', 'for_parts']).optional(),
  tags: z.array(text(2, 30)).max(10).default([]), locale: z.string().min(2).max(35).default('en'),
  regionCell: z.string().regex(/^[0123456789bcdefghjkmnpqrstuvwxyz]{4,5}$/).optional(),
  barterOptIn: z.boolean().default(false), value: money({ sign: 'nonNegative' }).optional(),
  privateNotes: boundedString({ max: 2000 }).default(''),
};
export const listingSchema = z.strictObject({ ...fields, ownerId: z.string(), kind: z.enum(['sell', 'wanted', 'giveaway']),
  status: z.enum(['draft', 'published', 'unpublished', 'archived']), onHand: z.int().min(0).max(1),
  publicationCid: z.string().optional(), expiresAt: timestamp().optional(),
});
export type Listing = z.output<typeof listingSchema>;
export const listingRepo = defineRepo({ type: 'bazaar.listing', schema: listingSchema, indexes: { owner: d => d.ownerId, status: d => d.status } });
export const publicationRepo = defineRepo({ type: 'bazaar.publication', schema: z.strictObject({ envelope: z.custom<SignedEnvelope>(v => typeof v === 'object' && v !== null), listingId: z.string() }), indexes: { listing: d => d.listingId } });
const holdSchema = z.strictObject({ listingId: z.string(), ownerId: z.string(), subjectId: z.string(), revisionHash: z.string(), expiresAt: timestamp(), state: z.enum(['active', 'released']) });
export const inventoryHoldRepo = defineRepo({ type: 'bazaar.inventory_hold', schema: holdSchema, indexes: { listing: d => d.listingId, state: d => d.state, expiry: d => d.expiresAt, subject: d => d.subjectId } });
