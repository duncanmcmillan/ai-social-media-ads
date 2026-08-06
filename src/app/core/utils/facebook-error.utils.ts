/**
 * @fileoverview Utilities for extracting human-readable messages from Facebook API errors.
 */

/** Shape of a Facebook Graph API error response body. */
interface FacebookApiError {
  /** Facebook-assigned error code. */
  code: number;
  /** Human-readable message. */
  message: string;
  /** Machine-readable error type. */
  type: string;
  /** Additional error context. */
  error_subcode?: number;
  /** Trace identifier for Facebook support. */
  fbtrace_id?: string;
}

/** Wraps a Facebook Graph API error response. */
interface FacebookErrorResponse {
  error: FacebookApiError;
}

/**
 * Extracts a user-friendly error message from any thrown value.
 *
 * Handles:
 * - `{ error: { message } }` — Facebook Graph API error response
 * - `Error` instances
 * - Plain strings
 * - Anything else (falls back to the provided fallback message)
 *
 * @param err - The caught value.
 * @param fallback - Message to use when no specific message can be extracted.
 * @returns A human-readable error string.
 */
export function extractFacebookError(err: unknown, fallback: string): string {
  if (err == null) return fallback;

  // Facebook Graph API error payload
  const maybeApiError = err as Partial<FacebookErrorResponse>;
  if (maybeApiError.error?.message) {
    return maybeApiError.error.message;
  }

  // Standard Error object
  if (err instanceof Error) return err.message;

  // Plain string
  if (typeof err === 'string') return err;

  return fallback;
}
