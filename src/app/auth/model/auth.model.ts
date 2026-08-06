/**
 * @fileoverview Auth feature data models.
 */

/** Stored Facebook OAuth token payload. */
export interface FacebookTokens {
  /** The user access token for Graph API calls. */
  accessToken: string;
  /** Token type, typically 'bearer'. */
  tokenType: string;
  /** Unix timestamp (ms) at which the token expires, or null for non-expiring tokens. */
  expiresAt: number | null;
}

/** Stored Facebook App configuration (secrets never exposed to renderer). */
export interface FacebookConfig {
  /** The Facebook App ID. */
  appId: string;
  /** The Ad Account ID (e.g. act_1234567890). */
  adAccountId: string;
}
