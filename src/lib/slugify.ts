// src/lib/slugify.ts

/**
 * Convert an arbitrary string into a URL-safe slug.
 * - lowercases
 * - trims
 * - removes quotes
 * - replaces non-alphanumeric runs with "-"
 * - strips leading/trailing "-"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
