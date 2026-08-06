# Ad Preview API Service

Generates HTML preview iframes for ads and creatives via the Facebook Ad Preview API, enabling in-app rendering of how ads will appear across placements before they are published.

## Facebook API Spec

- **Reference**: https://developers.facebook.com/docs/marketing-api/reference/ad-preview
- **API version**: v21.0

---

## Endpoints

### Get Preview for an Existing Ad

Generates a preview iframe for a published or paused ad.

| Field | Value |
|---|---|
| Method | `GET` |
| URL | `https://graph.facebook.com/v21.0/{ad-id}/previews` |

#### Request

| Parameter | Type | Source |
|---|---|---|
| `{ad-id}` | path | `Ad.id` from the Ads NgRx Signal Store |
| `access_token` | query | `AuthStore.accessToken()` |
| `ad_format` | query | `PreviewFormat` — caller-supplied, defaults to `DESKTOP_FEED_STANDARD` |

#### Supported `ad_format` values

| Value | Placement |
|---|---|
| `DESKTOP_FEED_STANDARD` | Facebook desktop news feed (default) |
| `MOBILE_FEED_STANDARD` | Facebook mobile news feed |
| `MOBILE_FEED_BASIC` | Stripped-down mobile feed view |
| `INSTAGRAM_STANDARD` | Instagram feed post |
| `INSTAGRAM_STORY` | Instagram Story (9:16) |
| `AUDIENCE_NETWORK_OUTSTREAM_VIDEO` | Audience Network outstream video |
| `RIGHT_COLUMN_STANDARD` | Facebook right column (desktop) |

#### Response

```typescript
interface AdPreviewResponse {
  data: AdPreview[];
}

interface AdPreview {
  body: string; // HTML iframe snippet for embedding in the UI
}
```

```json
{
  "data": [
    {
      "body": "<iframe src=\"https://www.facebook.com/ads/api/preview_iframe.php?d=...\" width=\"476\" height=\"322\" scrolling=\"yes\" style=\"border: none;\"></iframe>"
    }
  ]
}
```

The `body` string should be injected into the DOM via `[innerHTML]` inside a sandboxed container. The iframe loads from `facebook.com` and may require an active internet connection to render.

---

### Generate Preview from a Creative (no ad required)

Generates a preview iframe directly from a creative ID without needing a published ad object.

| Field | Value |
|---|---|
| Method | `GET` |
| URL | `https://graph.facebook.com/v21.0/{ad-account-id}/generatepreviews` |

#### Request

| Parameter | Type | Source |
|---|---|---|
| `{ad-account-id}` | path | `AuthStore.adAccountId()` |
| `access_token` | query | `AuthStore.accessToken()` |
| `ad_format` | query | `PreviewFormat` — caller-supplied, defaults to `DESKTOP_FEED_STANDARD` |
| `creative` | query | JSON string `{"creative_id": "{creative-id}"}` — `AdCreative.id` from the Creatives store |

#### Response

Same shape as the ad preview response above.

---

## Payload data sources summary

| Data | Origin |
|---|---|
| `access_token` | `AuthStore.accessToken()` — loaded from Electron `safeStorage` on startup |
| `{ad-id}` | `Ad.id` — from the Ads NgRx Signal Store, set when user selects an ad |
| `{ad-account-id}` | `AuthStore.adAccountId()` — loaded from Electron `safeStorage` on startup |
| `{creative-id}` | `AdCreative.id` — from the Ad Creatives NgRx Signal Store |
| `ad_format` | Caller-supplied — driven by a placement selector in the Preview feature component |

## Usage notes

- The returned `body` iframe is hosted on `facebook.com` and requires a live internet connection to render.
- Do not cache preview iframes — they contain short-lived signed tokens that expire quickly.
- Sandbox the iframe container in the Angular component with `sandbox="allow-scripts allow-same-origin"` to limit XSS surface area.
