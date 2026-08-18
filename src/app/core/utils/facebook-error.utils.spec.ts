import { describe, it, expect } from 'vitest';
import { extractFacebookError, parseFacebookError } from './facebook-error.utils';

describe('extractFacebookError', () => {
  it('returns the fallback for null', () => {
    expect(extractFacebookError(null, 'Fallback message')).toBe('Fallback message');
  });

  it('returns the fallback for undefined', () => {
    expect(extractFacebookError(undefined, 'Fallback message')).toBe('Fallback message');
  });

  it('extracts the message from a Facebook Graph API error payload', () => {
    const err = {
      error: {
        message: 'Invalid OAuth access token.',
        type: 'OAuthException',
        code: 190,
        fbtrace_id: 'abc123',
      },
    };
    expect(extractFacebookError(err, 'Fallback')).toBe('Invalid OAuth access token.');
  });

  it('extracts the message from a standard Error instance', () => {
    expect(extractFacebookError(new Error('Network timeout'), 'Fallback')).toBe('Network timeout');
  });

  it('returns a plain string as-is', () => {
    expect(extractFacebookError('Something went wrong', 'Fallback')).toBe('Something went wrong');
  });

  it('returns the fallback for an object without a recognised error shape', () => {
    expect(extractFacebookError({ code: 500 }, 'Fallback')).toBe('Fallback');
  });

  it('returns the fallback for a number', () => {
    expect(extractFacebookError(42, 'Fallback')).toBe('Fallback');
  });

  it('returns the fallback when the Facebook error object has no message field', () => {
    const err = { error: { code: 100 } };
    expect(extractFacebookError(err, 'Fallback')).toBe('Fallback');
  });
});

describe('parseFacebookError', () => {
  // ── Null / undefined ────────────────────────────────────────────────────

  it('returns fallback message and null codes for null', () => {
    const result = parseFacebookError(null, 'Fallback');
    expect(result.message).toBe('Fallback');
    expect(result.code).toBeNull();
    expect(result.subcode).toBeNull();
    expect(result.isAuthError).toBe(false);
    expect(result.isPermissionError).toBe(false);
  });

  it('returns fallback message and null codes for undefined', () => {
    const result = parseFacebookError(undefined, 'Fallback');
    expect(result.message).toBe('Fallback');
    expect(result.code).toBeNull();
  });

  // ── Direct Facebook API error shape ─────────────────────────────────────
  // Shape: { error: { code, message, type, error_subcode? } }

  it('extracts message and code from a direct Facebook API error object', () => {
    const err = { error: { message: 'Invalid token', type: 'OAuthException', code: 190 } };
    const result = parseFacebookError(err, 'Fallback');
    expect(result.message).toBe('Invalid token');
    expect(result.code).toBe(190);
  });

  it('extracts error_subcode when present', () => {
    const err = { error: { message: 'Rate limited', type: 'OAuthException', code: 4, error_subcode: 1367015 } };
    const result = parseFacebookError(err, 'Fallback');
    expect(result.subcode).toBe(1367015);
  });

  it('sets subcode to null when error_subcode is absent', () => {
    const err = { error: { message: 'Bad param', type: 'GraphMethodException', code: 100 } };
    expect(parseFacebookError(err, 'Fallback').subcode).toBeNull();
  });

  // ── Angular HttpErrorResponse shape ─────────────────────────────────────
  // Shape: { error: { error: { code, message, type } } }  (body nested in HTTP wrapper)

  it('extracts message from an Angular HttpErrorResponse body', () => {
    const err = { error: { error: { message: 'Permission denied', type: 'OAuthException', code: 10 } } };
    const result = parseFacebookError(err, 'Fallback');
    expect(result.message).toBe('Permission denied');
    expect(result.code).toBe(10);
  });

  it('prefers the HttpErrorResponse shape over a plain string error property', () => {
    const err = { error: { error: { message: 'Token expired', type: 'OAuthException', code: 190 } } };
    expect(parseFacebookError(err, 'Fallback').message).toBe('Token expired');
  });

  // ── isAuthError flag (codes 190, 102) ───────────────────────────────────

  it('sets isAuthError=true for code 190 (invalid token)', () => {
    const err = { error: { message: 'Invalid OAuth 2.0 Access Token', type: 'OAuthException', code: 190 } };
    expect(parseFacebookError(err, 'Fallback').isAuthError).toBe(true);
  });

  it('sets isAuthError=true for code 102 (session invalidated)', () => {
    const err = { error: { message: 'Session has been invalidated', type: 'OAuthException', code: 102 } };
    expect(parseFacebookError(err, 'Fallback').isAuthError).toBe(true);
  });

  it('sets isAuthError=true for code 190 in HttpErrorResponse shape', () => {
    const err = { error: { error: { message: 'Expired token', type: 'OAuthException', code: 190 } } };
    expect(parseFacebookError(err, 'Fallback').isAuthError).toBe(true);
  });

  it('sets isAuthError=false for an unrelated error code', () => {
    const err = { error: { message: 'Bad param', type: 'GraphMethodException', code: 100 } };
    expect(parseFacebookError(err, 'Fallback').isAuthError).toBe(false);
  });

  // ── isPermissionError flag (codes 10, 200) ───────────────────────────────

  it('sets isPermissionError=true for code 10 (permission denied)', () => {
    const err = { error: { message: 'Application does not have permission', type: 'OAuthException', code: 10 } };
    expect(parseFacebookError(err, 'Fallback').isPermissionError).toBe(true);
  });

  it('sets isPermissionError=true for code 200 (permissions error)', () => {
    const err = { error: { message: 'User not authorised', type: 'OAuthException', code: 200 } };
    expect(parseFacebookError(err, 'Fallback').isPermissionError).toBe(true);
  });

  it('sets isPermissionError=false for an unrelated error code', () => {
    const err = { error: { message: 'Unknown', type: 'OAuthException', code: 1 } };
    expect(parseFacebookError(err, 'Fallback').isPermissionError).toBe(false);
  });

  it('does not set both isAuthError and isPermissionError for the same code', () => {
    const err = { error: { message: 'Invalid token', type: 'OAuthException', code: 190 } };
    const result = parseFacebookError(err, 'Fallback');
    expect(result.isAuthError).toBe(true);
    expect(result.isPermissionError).toBe(false);
  });

  // ── Error instance and plain string ─────────────────────────────────────

  it('extracts message from a standard Error instance with no code', () => {
    const result = parseFacebookError(new Error('Network failure'), 'Fallback');
    expect(result.message).toBe('Network failure');
    expect(result.code).toBeNull();
    expect(result.isAuthError).toBe(false);
    expect(result.isPermissionError).toBe(false);
  });

  it('returns a plain string as message with no code', () => {
    const result = parseFacebookError('Something went wrong', 'Fallback');
    expect(result.message).toBe('Something went wrong');
    expect(result.code).toBeNull();
  });

  // ── Unrecognised shape ───────────────────────────────────────────────────

  it('returns fallback for an unrecognised object shape', () => {
    expect(parseFacebookError({ code: 500 }, 'Fallback').message).toBe('Fallback');
  });

  it('returns fallback for a number', () => {
    expect(parseFacebookError(42, 'Fallback').message).toBe('Fallback');
  });
});
