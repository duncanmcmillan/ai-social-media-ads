/**
 * @fileoverview Facebook Conversions API (CAPI) service.
 * Sends server-side conversion events to Meta for ad attribution,
 * delivery optimisation, and offline measurement.
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * **Hashing requirement** — User data fields marked as "hash required" (em, ph, fn, ln,
 * ge, db, ct, st, zp, country, external_id) MUST be SHA-256 hashed by the caller
 * before passing them to this service. Use lowercase hex encoding with no salt.
 * Fields marked "do not hash" (client_ip_address, client_user_agent, fbc, fbp, etc.)
 * must be passed in plain text.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../../auth';

/** Base URL for the Facebook Graph API. */
const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Origin of the conversion event.
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event#action-source
 */
export type ActionSource =
  | 'website'
  | 'app'
  | 'physical_store'
  | 'chat'
  | 'crm'
  | 'email'
  | 'other'
  | 'phone_call'
  | 'system_generated';

/**
 * Standard Meta Pixel event names supported by the Conversions API.
 * Custom event names (plain strings) are also accepted.
 * @see https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export type StandardEventName =
  | 'AddPaymentInfo'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'InitiateCheckout'
  | 'Lead'
  | 'Purchase'
  | 'Schedule'
  | 'Search'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'
  | 'ViewContent';

/**
 * Customer information used for event matching.
 * Fields listed as "hash required" must be SHA-256 hashed (lowercase hex) before sending.
 * Pass multiple values as an array when available (e.g. multiple email addresses).
 */
export interface UserData {
  // ── Hash required (SHA-256, lowercase hex) ──────────────────────────────────
  /** Hashed email address(es). */
  em?: string[];
  /** Hashed phone number(s) in E.164 format before hashing. */
  ph?: string[];
  /** Hashed first name(s) (lowercase). */
  fn?: string[];
  /** Hashed last name(s) (lowercase). */
  ln?: string[];
  /** Hashed gender: 'm' or 'f' before hashing. */
  ge?: string[];
  /** Hashed date of birth in YYYYMMDD format before hashing. */
  db?: string[];
  /** Hashed city (lowercase, no spaces). */
  ct?: string[];
  /** Hashed state/province (lowercase 2-letter ISO code). */
  st?: string[];
  /** Hashed zip/postal code (lowercase, no spaces). */
  zp?: string[];
  /** Hashed country (lowercase ISO 3166-1 alpha-2). */
  country?: string[];
  /** Hashed external customer ID(s) from your CRM. */
  external_id?: string[];

  // ── Do not hash ─────────────────────────────────────────────────────────────
  /** Client IP address (IPv4 or IPv6). */
  client_ip_address?: string;
  /** Client browser user-agent string. */
  client_user_agent?: string;
  /** Facebook click ID from the `_fbc` cookie or URL `fbclid` parameter. */
  fbc?: string;
  /** Facebook browser ID from the `_fbp` cookie. */
  fbp?: string;
  /** Subscription ID for the user in your system. */
  subscription_id?: string;
  /** Facebook Login ID (if the user logged in with Facebook). */
  fb_login_id?: string;
  /** Lead ID from a Facebook Lead Ad. */
  lead_id?: string;
  /** Facebook Page ID associated with the event. */
  page_id?: string;
  /** App-scoped user ID (for app events only). */
  anon_id?: string;
  /** Mobile advertising ID — IDFA (iOS) or AAID (Android). */
  madid?: string;
}

/**
 * Business-specific data about the conversion event.
 * Required for Purchase events: value and currency.
 */
export interface CustomData {
  /** Monetary value of the conversion event in the given currency. */
  value?: number;
  /** ISO 4217 currency code (e.g. 'USD', 'GBP'). */
  currency?: string;
  /** Name of the page or product associated with the event. */
  content_name?: string;
  /** Category of the content or product. */
  content_category?: string;
  /** Product or content IDs (e.g. SKUs). */
  content_ids?: string[];
  /** Either 'product' or 'product_group'. */
  content_type?: string;
  /** Order or transaction identifier. */
  order_id?: string;
  /** Predicted lifetime value of a subscriber. */
  predicted_ltv?: number;
  /** Number of items in the cart or order. */
  num_items?: number;
  /** Registration or subscription status (e.g. 'registered'). */
  status?: string;
  /** Search query string for Search events. */
  search_string?: string;
  /** Delivery category: 'in_store', 'curbside', or 'home_delivery'. */
  delivery_category?: 'in_store' | 'curbside' | 'home_delivery';
}

/**
 * A single conversion event to send via the Conversions API.
 * event_name and event_time are required on every event.
 */
export interface ServerEvent {
  /**
   * Standard or custom event name.
   * Standard names must match the Meta Pixel reference exactly (PascalCase).
   */
  event_name: StandardEventName | string;
  /** Unix timestamp in seconds. Must not be more than 7 days in the past. */
  event_time: number;
  /** Customer matching data. At least one field is strongly recommended. */
  user_data?: UserData;
  /** Business-specific event data. */
  custom_data?: CustomData;
  /** URL of the webpage where the event occurred (required for website action_source). */
  event_source_url?: string;
  /** Set to true to exclude this event from being used for ads delivery optimisation. */
  opt_out?: boolean;
  /**
   * Unique identifier for deduplication against browser-side pixel events.
   * Should match the eventID sent via fbq('track', ..., { eventID: '...' }).
   */
  event_id?: string;
  /**
   * Where the conversion took place.
   * Required for all events — 'website' events also require event_source_url
   * and user_data.client_user_agent.
   */
  action_source: ActionSource;
  /**
   * Data processing options for Limited Data Use (LDU).
   * Pass an empty array [] to not apply LDU, or ['LDU'] to enable it.
   */
  data_processing_options?: string[];
  /** Country for LDU (1 = USA). */
  data_processing_options_country?: number;
  /** US State for LDU (1000 = California). */
  data_processing_options_state?: number;
}

/**
 * Payload sent to the Conversions API endpoint.
 * Up to 1,000 events per request.
 */
interface ConversionsApiPayload {
  /** Array of server events to send. Maximum 1,000 per request. */
  data: ServerEvent[];
  /** Provide this code (from Events Manager) to send test events without affecting production data. */
  test_event_code?: string;
}

/**
 * Response returned by the Conversions API after a successful batch upload.
 */
export interface ConversionsApiResponse {
  /** Number of events that were received and validated. */
  events_received: number;
  /** Diagnostic messages (populated when test_event_code is used). */
  messages: string[];
  /** Facebook trace ID for debugging with Meta support. */
  fbtrace_id: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Service wrapping the Facebook Conversions API.
 * Use this service from stores — never inject it directly into components.
 *
 * The pixel/dataset ID is scoped to each call so that apps managing
 * multiple pixels do not need to reconfigure the service between calls.
 */
@Injectable({ providedIn: 'root' })
export class ConversionsApiService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  /** Returns common Graph API query parameters including the access token. */
  private authParams(): HttpParams {
    const token = this.authStore.accessToken();
    if (!token) throw new Error('Not authenticated — no access token available.');
    return new HttpParams().set('access_token', token);
  }

  /**
   * Sends a batch of server-side conversion events to Meta.
   * Invalid events in the batch cause the entire request to be rejected.
   *
   * @param pixelId - The Meta Pixel / Dataset ID that events are linked to.
   * @param events - Array of server events to send (maximum 1,000 per call).
   * @param testEventCode - Optional test event code from Events Manager.
   *   When provided, events appear in test mode and do not affect live reporting.
   * @returns Promise resolving to the API response with event counts and trace ID.
   * @throws When not authenticated, pixelId is empty, the batch exceeds 1,000 events,
   *   or the API returns an error.
   */
  async sendEvents(
    pixelId: string,
    events: ServerEvent[],
    testEventCode?: string
  ): Promise<ConversionsApiResponse> {
    if (!pixelId) throw new Error('A pixel / dataset ID is required.');
    if (events.length === 0) throw new Error('At least one event is required.');
    if (events.length > 1000) throw new Error('A maximum of 1,000 events can be sent per request.');

    const params = this.authParams();
    const payload: ConversionsApiPayload = { data: events };
    if (testEventCode) payload.test_event_code = testEventCode;

    return firstValueFrom(
      this.http.post<ConversionsApiResponse>(`${GRAPH_API_BASE}/${pixelId}/events`, payload, { params })
    );
  }

  /**
   * Convenience method to send a single conversion event.
   * Delegates to {@link sendEvents} with a one-element array.
   *
   * @param pixelId - The Meta Pixel / Dataset ID.
   * @param event - The server event to send.
   * @param testEventCode - Optional test event code from Events Manager.
   * @returns Promise resolving to the API response.
   * @throws When not authenticated or the API returns an error.
   */
  async sendEvent(
    pixelId: string,
    event: ServerEvent,
    testEventCode?: string
  ): Promise<ConversionsApiResponse> {
    return this.sendEvents(pixelId, [event], testEventCode);
  }
}
