# Marketing API Service

Wraps the Facebook Marketing API for Campaign, Ad Set, and Ad CRUD operations.

## Facebook API Spec

- **Reference**: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group
- **Reference**: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign
- **Reference**: https://developers.facebook.com/docs/marketing-api/reference/adgroup
- **API version**: v21.0

---

## Endpoints

### List Campaigns

| Field | Value |
|---|---|
| Method | `GET` |
| URL | `https://graph.facebook.com/v21.0/{ad-account-id}/campaigns` |

#### Request

| Parameter | Type | Source |
|---|---|---|
| `{ad-account-id}` | path | `AuthStore.adAccountId()` |
| `access_token` | query | `AuthStore.accessToken()` |
| `fields` | query | hardcoded: `id,name,status,objective,buying_type,daily_budget,lifetime_budget,created_time,updated_time` |

#### Response

```typescript
interface GraphApiList<Campaign> {
  data: Campaign[];
  paging?: { cursors: { before: string; after: string }; next?: string };
}
```

```json
{
  "data": [
    {
      "id": "120200000001234567",
      "name": "Summer Sale 2025",
      "status": "ACTIVE",
      "objective": "OUTCOME_SALES",
      "buying_type": "AUCTION",
      "daily_budget": "5000",
      "lifetime_budget": null,
      "created_time": "2025-06-01T10:00:00+0000",
      "updated_time": "2025-06-10T15:30:00+0000"
    }
  ],
  "paging": {
    "cursors": { "before": "abc123", "after": "def456" }
  }
}
```

---

### Create Campaign

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `https://graph.facebook.com/v21.0/{ad-account-id}/campaigns` |

#### Request

| Parameter | Type | Source |
|---|---|---|
| `{ad-account-id}` | path | `AuthStore.adAccountId()` |
| `access_token` | query | `AuthStore.accessToken()` |
| `name` | body | `CampaignPayload.name` — user-entered |
| `objective` | body | `CampaignPayload.objective` — user-selected |
| `status` | body | `CampaignPayload.status` — user-selected (`ACTIVE` / `PAUSED`) |
| `buying_type` | body | `CampaignPayload.buyingType` — optional, defaults to `AUCTION` |
| `daily_budget` | body | `CampaignPayload.dailyBudget` — minor currency units, optional |
| `lifetime_budget` | body | `CampaignPayload.lifetimeBudget` — minor currency units, optional |

#### Response

```json
{ "id": "120200000001234567" }
```

---

### Update Campaign

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `https://graph.facebook.com/v21.0/{campaign-id}` |

#### Request

| Parameter | Type | Source |
|---|---|---|
| `{campaign-id}` | path | `Campaign.id` — selected campaign |
| `access_token` | query | `AuthStore.accessToken()` |
| body fields | body | Subset of `CampaignPayload` — only fields being changed |

#### Response

```json
{ "success": true }
```

---

### List Ad Sets

| Field | Value |
|---|---|
| Method | `GET` |
| URL | `https://graph.facebook.com/v21.0/{campaign-id}/adsets` |

#### Request

| Parameter | Type | Source |
|---|---|---|
| `{campaign-id}` | path | `Campaign.id` — selected campaign |
| `access_token` | query | `AuthStore.accessToken()` |
| `fields` | query | hardcoded: `id,name,campaign_id,status,billing_event,optimization_goal,daily_budget,lifetime_budget,bid_amount,created_time,updated_time` |

#### Response

```json
{
  "data": [
    {
      "id": "120200000009876543",
      "name": "Retargeting — Mobile",
      "campaign_id": "120200000001234567",
      "status": "ACTIVE",
      "billing_event": "IMPRESSIONS",
      "optimization_goal": "REACH",
      "daily_budget": "2000",
      "lifetime_budget": null,
      "bid_amount": null,
      "created_time": "2025-06-01T10:05:00+0000",
      "updated_time": "2025-06-01T10:05:00+0000"
    }
  ]
}
```

---

### Create Ad Set

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `https://graph.facebook.com/v21.0/{ad-account-id}/adsets` |

#### Request

| Parameter | Type | Source |
|---|---|---|
| `{ad-account-id}` | path | `AuthStore.adAccountId()` |
| `access_token` | query | `AuthStore.accessToken()` |
| `campaign_id` | body | `AdSetPayload.campaignId` — selected campaign |
| `name` | body | `AdSetPayload.name` — user-entered |
| `status` | body | `AdSetPayload.status` — user-selected |
| `billing_event` | body | `AdSetPayload.billingEvent` — user-selected |
| `optimization_goal` | body | `AdSetPayload.optimizationGoal` — user-selected |
| `daily_budget` | body | `AdSetPayload.dailyBudget` — optional |
| `lifetime_budget` | body | `AdSetPayload.lifetimeBudget` — optional |
| `bid_amount` | body | `AdSetPayload.bidAmount` — optional |

#### Response

```json
{ "id": "120200000009876543" }
```

---

### List Ads

| Field | Value |
|---|---|
| Method | `GET` |
| URL | `https://graph.facebook.com/v21.0/{adset-id}/ads` |

#### Request

| Parameter | Type | Source |
|---|---|---|
| `{adset-id}` | path | `AdSet.id` — selected ad set |
| `access_token` | query | `AuthStore.accessToken()` |
| `fields` | query | hardcoded: `id,name,adset_id,campaign_id,status,creative,created_time,updated_time` |

#### Response

```json
{
  "data": [
    {
      "id": "120200000005551234",
      "name": "Summer Sale — Video v1",
      "adset_id": "120200000009876543",
      "campaign_id": "120200000001234567",
      "status": "ACTIVE",
      "creative": { "id": "120200000000111222" },
      "created_time": "2025-06-02T09:00:00+0000",
      "updated_time": "2025-06-02T09:00:00+0000"
    }
  ]
}
```

---

### Create Ad

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `https://graph.facebook.com/v21.0/{ad-account-id}/ads` |

#### Request

| Parameter | Type | Source |
|---|---|---|
| `{ad-account-id}` | path | `AuthStore.adAccountId()` |
| `access_token` | query | `AuthStore.accessToken()` |
| `adset_id` | body | `AdPayload.adSetId` — selected ad set |
| `name` | body | `AdPayload.name` — user-entered |
| `status` | body | `AdPayload.status` — user-selected |
| `creative` | body | `{ creative_id: AdPayload.creativeId }` — selected creative |

#### Response

```json
{ "id": "120200000005551234" }
```

---

## Payload data sources summary

| Data | Origin |
|---|---|
| `access_token` | `AuthStore.accessToken()` — loaded from Electron `safeStorage` on startup |
| `{ad-account-id}` | `AuthStore.adAccountId()` — loaded from Electron `safeStorage` on startup |
| Campaign / ad set / ad IDs | Fetched from the API and held in the relevant NgRx Signal Store |
| User-editable fields (name, status, budget…) | Form inputs in the relevant feature component |
