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

/** Facebook user profile — from GET /me?fields=id,name,picture. */
export interface FacebookUser {
  /** Facebook user ID. */
  id: string;
  /** Display name. */
  name: string;
  /** Profile picture URL. */
  pictureUrl?: string;
}

/**
 * Facebook Ad Account status codes.
 * @see https://developers.facebook.com/docs/marketing-api/reference/ad-account/
 */
export enum AdAccountStatus {
  Active         = 1,
  Disabled       = 2,
  Unsettled      = 3,
  PendingReview  = 7,
  InGracePeriod  = 9,
  PendingClosure = 100,
  Closed         = 101,
}

/**
 * A single Facebook Ad Account.
 * API: GET /me/adaccounts?fields=id,name,currency,timezone_name,account_status,business
 */
export interface FacebookAdAccount {
  /** Full account ID including prefix, e.g. "act_123456789". */
  id: string;
  /** Display name of the account. */
  name: string;
  /** ISO 4217 currency code, e.g. "GBP". */
  currency: string;
  /** IANA timezone name, e.g. "Europe/London". */
  timezoneName: string;
  /** Account health status. */
  accountStatus: AdAccountStatus;
  /** Parent Business Manager name, if available. */
  businessName?: string;
}

// ── TikTok — stub for future implementation ────────────────────────────────

/** TikTok OAuth token payload (stub — not yet implemented). */
export interface TikTokTokens {
  accessToken: string;
  refreshToken: string;
  /** Unix timestamp (ms) at which the token expires. */
  expiresAt: number | null;
}

/** TikTok app configuration (stub — not yet implemented). */
export interface TikTokConfig {
  /** TikTok App ID. */
  appId: string;
  /** TikTok Advertiser ID. */
  advertiserId: string;
}
