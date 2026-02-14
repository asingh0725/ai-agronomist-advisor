/**
 * Client-safe product types — mirrors @prisma/client ProductType
 * so we don't pull the entire Prisma client into the browser bundle.
 */
export type ProductType =
  | "FERTILIZER"
  | "AMENDMENT"
  | "PESTICIDE"
  | "HERBICIDE"
  | "FUNGICIDE"
  | "INSECTICIDE"
  | "SEED_TREATMENT"
  | "BIOLOGICAL"
  | "OTHER";

export const PRODUCT_TYPES: ProductType[] = [
  "FERTILIZER",
  "AMENDMENT",
  "PESTICIDE",
  "HERBICIDE",
  "FUNGICIDE",
  "INSECTICIDE",
  "SEED_TREATMENT",
  "BIOLOGICAL",
  "OTHER",
];
