/**
 * Security utilities for input sanitization and validation.
 */

/**
 * Sanitizes a string input to prevent basic injection attacks and clean up data.
 * While Supabase uses parameterized queries (preventing SQL injection),
 * this helper ensures that special characters used in PostgREST filters
 * are escaped or removed to prevent 'Filter Injection'.
 * 
 * @param input The raw string input from a user
 * @returns A sanitized version of the string
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return "";
  
  // 1. Trim whitespace
  let sanitized = input.trim();
  
  // 2. Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");
  
  // 3. For PostgREST .or() or .filter() syntax, commas and parentheses are special.
  // If we are using this in a search, we might want to escape or remove them.
  // We'll remove characters that could be used to break out of a filter string.
  sanitized = sanitized.replace(/[(),]/g, "");

  return sanitized;
}

/**
 * Validates if a string is a safe UUID (common for IDs in our system).
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
