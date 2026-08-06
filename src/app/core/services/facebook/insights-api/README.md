# Insights API Service

Retrieves performance metrics for campaigns, ad sets, and individual ads via the Facebook Insights API.

## Facebook API Spec

- **Reference**: https://developers.facebook.com/docs/marketing-api/insights
- **Reference**: https://developers.facebook.com/docs/marketing-api/insights/fields
- **API version**: v21.0

---

## Endpoints

### Get Insights for Any Object

Fetches aggregated metrics for a campaign, ad set, or ad over a relative date range.

| Field | Value |
|---|---|
| Method | `GET` |
| URL | `https://graph.facebook.com/v21.0/{object-id}/insights` |

#### Request

| Parameter | Type | Source |
|---|---|---|
| `{object-id}` | path | Campaign / AdSet / Ad ID from the relevant NgRx Signal Store |
| `access_token` | query | `AuthStore.accessToken()` |
| `fields` | query | hardcoded: `impressions,clicks,ctr,cpc,cpm,spend,reach,date_start,date_stop` |
| `date_preset` | query | `DatePreset` — caller-supplied, defaults to `last_30d` |

#### Supported `date_preset` values

| Value | Description |
|---|---|
| `today` | Today only |
| `yesterday` | Yesterday only |
| `last_7d` | Last 7 days |
| `last_14d` | Last 14 days |
| `last_28d` | Last 28 days |
| `last_30d` | Last 30 days (default) |
| `last_month` | Previous calendar month |
| `this_month` | Current calendar month to date |
| `this_year` | Current year to date |

#### Response

```typescript
interface InsightsResponse {
  data: InsightMetrics[];
}

interface InsightMetrics {
  impressions: string;   // Total ad impressions
  clicks: string;        // Total link clicks
  ctr: string;           // Click-through rate as percentage string
  cpc: string;           // Cost per click (account currency)
  cpm: string;           // Cost per 1,000 impressions
  spend: string;         // Total amount spent (account currency)
  reach: string;         // Unique people reached
  dateStart: string;     // YYYY-MM-DD
  dateStop: string;      // YYYY-MM-DD
}
```

```json
{
  "data": [
    {
      "impressions": "48230",
      "clicks": "1204",
      "ctr": "2.4963",
      "cpc": "0.41",
      "cpm": "10.32",
      "spend": "497.82",
      "reach": "31450",
      "date_start": "2025-06-01",
      "date_stop": "2025-06-30"
    }
  ]
}
```

---

### Get Account-Level Insights

Convenience wrapper around the above — uses `AuthStore.adAccountId()` as the object ID.

| Field | Value |
|---|---|
| Method | `GET` |
| URL | `https://graph.facebook.com/v21.0/{ad-account-id}/insights` |

#### Request

| Parameter | Type | Source |
|---|---|---|
| `{ad-account-id}` | path | `AuthStore.adAccountId()` |
| `access_token` | query | `AuthStore.accessToken()` |
| `fields` | query | hardcoded (same as above) |
| `date_preset` | query | Caller-supplied, defaults to `last_30d` |

#### Response

Same shape as `InsightsResponse` above.

---

## Payload data sources summary

| Data | Origin |
|---|---|
| `access_token` | `AuthStore.accessToken()` — loaded from Electron `safeStorage` on startup |
| `{object-id}` | Campaign / AdSet / Ad / Account ID — from NgRx Signal Stores or `AuthStore` |
| `date_preset` | Caller-supplied — typically driven by a date range picker in the Optimisation feature |
