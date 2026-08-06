# Conversions API Service

Sends server-side conversion events to Meta via the [Facebook Conversions API (CAPI)](https://developers.facebook.com/docs/marketing-api/conversions-api). Server events are linked to a Pixel / Dataset ID and processed equivalently to browser-side Meta Pixel events, enabling attribution, delivery optimisation, and offline measurement.

---

## Endpoints

### `POST /{pixel-id}/events`

Sends one or more conversion events in a single batch.

**Full URL**

```
POST https://graph.facebook.com/v21.0/{pixel-id}/events?access_token={token}
```

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `data` | `ServerEvent[]` | Yes | Array of events. Maximum **1,000** per request. |
| `test_event_code` | `string` | No | Code from Events Manager. Routes events to test mode without affecting live reporting. |

**Response**

```json
{
  "events_received": 1,
  "messages": [],
  "fbtrace_id": "AbCdEfGhIjKlMn"
}
```

| Field | Type | Description |
|---|---|---|
| `events_received` | `number` | Count of events that passed validation. |
| `messages` | `string[]` | Diagnostic messages; populated in test mode. |
| `fbtrace_id` | `string` | Trace ID to share with Meta support when debugging. |

---

## ServerEvent fields

| Field | Type | Required | Description |
|---|---|---|---|
| `event_name` | `StandardEventName \| string` | Yes | Standard Pixel event name (e.g. `Purchase`) or a custom string. |
| `event_time` | `number` | Yes | Unix timestamp in seconds. Must not be more than **7 days** in the past. |
| `action_source` | `ActionSource` | Yes | Where the conversion occurred (see [ActionSource values](#actionsource-values)). |
| `user_data` | `UserData` | Recommended | Customer matching fields (see [UserData fields](#userdata-fields)). |
| `custom_data` | `CustomData` | Recommended | Business-specific event details (see [CustomData fields](#customdata-fields)). |
| `event_source_url` | `string` | Required for `website` | URL of the page where the event occurred. |
| `event_id` | `string` | Recommended | Unique ID for deduplication with browser-side Pixel events. |
| `opt_out` | `boolean` | No | When `true`, excludes the event from delivery optimisation. |
| `data_processing_options` | `string[]` | No | Pass `['LDU']` to enable Limited Data Use; `[]` to opt out. |
| `data_processing_options_country` | `number` | No | Country for LDU (`1` = USA). |
| `data_processing_options_state` | `number` | No | US state for LDU (`1000` = California). |

### ActionSource values

| Value | When to use |
|---|---|
| `website` | Event triggered on a website. Requires `event_source_url` and `user_data.client_user_agent`. |
| `app` | Event triggered in a mobile or desktop app. |
| `physical_store` | In-store or point-of-sale conversion. |
| `chat` | Conversion via chat (Messenger, WhatsApp, Instagram DM). |
| `crm` | Event imported from a CRM system. |
| `email` | Conversion attributed to an email campaign. |
| `phone_call` | Conversion via phone. |
| `system_generated` | Automatically generated event (e.g. subscription renewal). |
| `other` | Any other origin not covered above. |

### StandardEventName values

| Event name | Description |
|---|---|
| `Purchase` | Completion of a purchase. Requires `value` and `currency` in `custom_data`. |
| `ViewContent` | Viewing a product page or content item. |
| `AddToCart` | Adding an item to a shopping cart. |
| `AddToWishlist` | Adding an item to a wishlist. |
| `InitiateCheckout` | Starting the checkout process. |
| `AddPaymentInfo` | Adding payment info during checkout. |
| `Lead` | Submission of a lead form. |
| `CompleteRegistration` | Completing a registration form. |
| `Search` | Performing a search. |
| `Contact` | Contacting the business. |
| `CustomizeProduct` | Customising a product. |
| `Donate` | Making a donation. |
| `FindLocation` | Finding a business location. |
| `Schedule` | Booking an appointment. |
| `StartTrial` | Starting a free trial. |
| `SubmitApplication` | Submitting an application. |
| `Subscribe` | Starting a paid subscription. |

---

## UserData fields

All fields that require hashing must be **SHA-256 hashed to lowercase hex** by the caller before being passed to the service. No salting.

### Hash required

| Field | Description | Pre-hash format |
|---|---|---|
| `em` | Email address(es) | Lowercase, trimmed |
| `ph` | Phone number(s) | E.164 format, digits only |
| `fn` | First name(s) | Lowercase |
| `ln` | Last name(s) | Lowercase |
| `ge` | Gender | `'m'` or `'f'` |
| `db` | Date of birth | `YYYYMMDD` |
| `ct` | City | Lowercase, no spaces |
| `st` | State/province | Lowercase 2-letter ISO code |
| `zp` | Zip/postal code | Lowercase, no spaces |
| `country` | Country | Lowercase ISO 3166-1 alpha-2 |
| `external_id` | CRM customer ID(s) | Any consistent format |

### Do not hash

| Field | Description |
|---|---|
| `client_ip_address` | Client IPv4 or IPv6 address |
| `client_user_agent` | Browser or app user-agent string |
| `fbc` | Facebook click ID from `_fbc` cookie or `fbclid` URL parameter |
| `fbp` | Facebook browser ID from `_fbp` cookie |
| `subscription_id` | Subscription identifier in your system |
| `fb_login_id` | Facebook Login user ID |
| `lead_id` | Lead ID from a Facebook Lead Ad |
| `page_id` | Facebook Page ID |
| `anon_id` | Anonymous app user ID (app events only) |
| `madid` | Mobile advertising ID — IDFA (iOS) or AAID (Android) |

---

## CustomData fields

| Field | Type | Description |
|---|---|---|
| `value` | `number` | Monetary value of the conversion in `currency`. Required for `Purchase`. |
| `currency` | `string` | ISO 4217 currency code (e.g. `'USD'`, `'GBP'`). Required for `Purchase`. |
| `content_name` | `string` | Name of the product or page. |
| `content_category` | `string` | Category of the product or content. |
| `content_ids` | `string[]` | Product IDs or SKUs. |
| `content_type` | `string` | `'product'` or `'product_group'`. |
| `order_id` | `string` | Order or transaction identifier for deduplication. |
| `predicted_ltv` | `number` | Predicted lifetime value of a subscriber. |
| `num_items` | `number` | Number of items in the cart or order. |
| `status` | `string` | Registration or subscription status (e.g. `'registered'`). |
| `search_string` | `string` | Search query for `Search` events. |
| `delivery_category` | `'in_store' \| 'curbside' \| 'home_delivery'` | Fulfilment method. |

---

## Service methods

### `sendEvents(pixelId, events, testEventCode?)`

Sends a batch of up to 1,000 server events.

```typescript
const response = await conversionsApiService.sendEvents(
  '123456789',
  [
    {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: 'https://example.com/checkout/confirm',
      event_id: 'order_abc_001',
      user_data: {
        em: ['309a0a5c3e211326ae75ca18196d301a9bdbd1a882a4d2569511033da23f0abd'],
        client_ip_address: '1.2.3.4',
        client_user_agent: navigator.userAgent,
        fbp: 'fb.1.1558571054389.1098115397',
      },
      custom_data: {
        value: 49.99,
        currency: 'USD',
        content_ids: ['SKU-001'],
        content_type: 'product',
        order_id: 'order_abc',
      },
    },
  ]
);
// { events_received: 1, messages: [], fbtrace_id: '...' }
```

### `sendEvent(pixelId, event, testEventCode?)`

Convenience wrapper for sending a single event.

```typescript
await conversionsApiService.sendEvent('123456789', {
  event_name: 'Lead',
  event_time: Math.floor(Date.now() / 1000),
  action_source: 'website',
  user_data: {
    em: ['hashed_email_here'],
  },
});
```

---

## Usage notes

- **Deduplication** — Set `event_id` to the same value used in `fbq('track', 'Purchase', {}, { eventID: '...' })` so Meta can deduplicate browser and server events for the same conversion.
- **event_time window** — Events more than 7 days old are rejected. Offline conversion events (physical_store) may be uploaded up to 62 days after the fact.
- **Batch limits** — Maximum 1,000 events per request. If you have more, split into multiple calls.
- **Test mode** — Supply a `testEventCode` from the Events Manager Test Events tab to validate your integration without affecting live reporting.
- **LDU / CCPA** — Pass `data_processing_options: ['LDU']` for users who have opted out of data sharing under CCPA or similar legislation.
