import { describe, it, expect } from 'vitest';
import { extractFacebookError } from './facebook-error.utils';

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
