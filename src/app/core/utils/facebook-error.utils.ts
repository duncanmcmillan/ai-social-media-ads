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
 * Structured representation of a parsed Facebook API error.
 * Use `parseFacebookError` to produce this from any caught value.
 */
export interface ParsedFacebookError {
  /** Human-readable error message. */
  message: string;
  /** Facebook error code, or null if unavailable. */
  code: number | null;
  /** Facebook error subcode, or null if unavailable. */
  subcode: number | null;
  /**
   * True when the error indicates the access token is invalid, expired, or revoked.
   * Callers should sign the user out and prompt re-authentication.
   * Facebook error codes: 190 (invalid token), 102 (session invalidated).
   */
  isAuthError: boolean;
  /**
   * True when the error indicates a missing or insufficient permission.
   * Facebook error codes: 10 (permission denied), 200 (permissions error).
   */
  isPermissionError: boolean;
}

/** Facebook error codes that indicate the access token is invalid or expired. */
const AUTH_ERROR_CODES = new Set([190, 102]);

/** Facebook error codes that indicate a missing or insufficient permission. */
const PERMISSION_ERROR_CODES = new Set([10, 200]);

/**
 * Extracts a `FacebookApiError` from any caught value, handling both direct
 * Facebook error objects and Angular `HttpErrorResponse` wrappers.
 */
function extractApiError(err: unknown): FacebookApiError | null {
  if (err == null) return null;

  // Angular HttpErrorResponse: body is at err.error; Facebook error is at err.error.error
  const maybeHttp = err as { error?: { error?: FacebookApiError } };
  if (maybeHttp.error?.error?.message) return maybeHttp.error.error;

  // Direct Facebook API error response: { error: { message, code } }
  const maybeApiError = err as Partial<FacebookErrorResponse>;
  if (maybeApiError.error?.message) return maybeApiError.error as FacebookApiError;

  return null;
}

/**
 * Parses a caught value into a structured Facebook error object.
 * Handles Facebook Graph API error shapes, Angular `HttpErrorResponse` bodies,
 * standard `Error` instances, and plain strings.
 *
 * @param err - The caught value.
 * @param fallback - Message to use when no specific message can be extracted.
 * @returns A structured error object with code classification.
 */
export function parseFacebookError(err: unknown, fallback: string): ParsedFacebookError {
  const apiError = extractApiError(err);
  if (apiError) {
    const code = apiError.code ?? null;
    return {
      message: apiError.message,
      code,
      subcode: apiError.error_subcode ?? null,
      isAuthError: code != null && AUTH_ERROR_CODES.has(code),
      isPermissionError: code != null && PERMISSION_ERROR_CODES.has(code),
    };
  }

  if (err instanceof Error) {
    return { message: err.message, code: null, subcode: null, isAuthError: false, isPermissionError: false };
  }

  if (typeof err === 'string') {
    return { message: err, code: null, subcode: null, isAuthError: false, isPermissionError: false };
  }

  return { message: fallback, code: null, subcode: null, isAuthError: false, isPermissionError: false };
}

/**
 * Extracts a user-friendly error message from any thrown value.
 *
 * Handles:
 * - `{ error: { message } }` — Facebook Graph API error response
 * - Angular `HttpErrorResponse` with a Facebook error body
 * - `Error` instances
 * - Plain strings
 * - Anything else (falls back to the provided fallback message)
 *
 * @param err - The caught value.
 * @param fallback - Message to use when no specific message can be extracted.
 * @returns A human-readable error string.
 */
export function extractFacebookError(err: unknown, fallback: string): string {
  return parseFacebookError(err, fallback).message;
}
