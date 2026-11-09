export const fields: string[];
export function normalizeText(value: unknown): string;
export function normalizeId(value: unknown): string;
export function normalizeMetadata(input: Record<string, unknown>): Record<string, string>;
export function metadataHash(input: Record<string, unknown>): string;
export function validateMetadata(input: Record<string, unknown>): Record<string, string>;
