# Meta App Review — Submission Tutorial

Working document for preparing and submitting AI Social Media Ads for Meta App Review.
Fill in each section as we work through the process.

---

## General

### What this review is for

**App:** AI Social Media Ads
**Platform:** Desktop (Electron + Angular)
**Graph API version:** v22.0

AI Social Media Ads is a desktop application for marketing teams and freelance media buyers. It provides an end-to-end workflow for creating and managing Facebook advertising campaigns:

- A guided campaign creation wizard (objective, budget, ad sets, targeting, creative upload, ad copy generation via AI).
- A live monitoring dashboard showing campaign, ad set, and ad status alongside Insights metrics (impressions, clicks, spend, ROAS) with one-click pause/resume controls.
- A workspace configuration panel for setting global defaults (Meta Page, Pixel, URL parameters, targeting rules) that are pre-populated into every new campaign.
- AI-generated optimisation recommendations based on current performance data.

The app automates the repetitive parts of campaign creation — applying consistent settings, generating ad copy, and surfacing performance alerts — so that marketing professionals can manage more accounts in less time without leaving a single interface.

App Review is required because the four permissions listed below are **not available by default** in Live mode. Without review approval, users outside the developer account cannot authenticate and the app cannot write to the Marketing API.

### Permissions being reviewed

| Permission | What it is used for | Why it cannot be omitted |
|---|---|---|
| `ads_management` | `POST /{ad-account-id}/campaigns`, `/adsets`, `/adcreatives`, `/adimages`, `/ads` (create); `POST /{id}` (status updates — pause/resume) | Required for every write operation. There is no read-only mode; creating and managing ads is the core purpose of the app. |
| `ads_read` | `GET /{ad-account-id}/campaigns`, `/adsets`, `/ads` (read status); `GET /{ad-account-id}/insights` (performance metrics) | Required to display live campaign status and the Insights metrics dashboard. |
| `business_management` | `GET /me/adaccounts?fields=id,name,account_status,...` (list accessible ad accounts) | Required when the user's ad accounts are held inside a Business Manager rather than a personal account. |
| `pages_read_engagement` | `GET /me/accounts?fields=id,name,category` (list Facebook Pages for the Page selector) | Required to populate the Page selector used as `page_id` in ad creative `object_story_spec`. Ad creatives require a Page ID. |

### App icon requirements

The app icon must be uploaded to **App Dashboard → Settings → Basic** before submission.

| Requirement | Detail |
|---|---|
| Size | 1024 × 1024 px |
| Format | PNG or JPG |
| Meta trademarks / logos | **Not permitted** — no Facebook, Instagram, Meta, or Messenger logos or wordmarks |
| Content | Must represent the app, not a person or generic placeholder |

- [ ] Icon uploaded to Settings → Basic
- [ ] Icon does not include any Meta trademark or logo

### Platform Terms alignment

The app is built in compliance with the [Meta Platform Terms](https://developers.facebook.com/terms). Key obligations and how the app meets them:

| Obligation | How AI Social Media Ads complies |
|---|---|
| Only request permissions necessary for core functionality | Four permissions requested; each is directly required by a named feature. No speculative or future-use scopes. |
| Do not sell or transfer Platform Data | All data stays on the user's device. No data is sent to any server controlled by the app developer. |
| Provide a privacy policy explaining data collection and deletion rights | Privacy policy hosted at `https://duncanmcmillan.github.io/ai-social-media-ads/privacy-policy` |
| Delete user data on request | "Delete all my data" flow revokes the token server-side, deletes all local encrypted files, and clears in-memory state. |
| Maintain security safeguards | Access token and App Secret stored encrypted via Electron `safeStorage` (OS keychain-backed AES). App Secret never exposed to renderer process. |
| Report security incidents | Acknowledged — contact email set in App Dashboard. |

### Developer Policies alignment

The app is built in compliance with the [Meta Developer Policies](https://developers.facebook.com/devpolicy). Key policy areas and how the app meets them:

| Policy area | How AI Social Media Ads complies |
|---|---|
| Advertising data used only for campaign performance | Insights data (impressions, clicks, spend, ROAS) is displayed only to the authenticated user for their own campaigns. No aggregate profiling, no cross-account mixing. |
| Obtain user consent before acting on their behalf | OAuth consent screen shown for all four permission scopes before any API call is made. GDPR consent gate on every launch. |
| Do not retarget using Meta data | No retargeting — the app reads campaign performance data only to display it back to the user who owns it. |
| Ensure clients agree to Meta's Terms of Service | The app is a single-user tool; the authenticated user is the ad account owner, bound by Meta's own Terms when they use Facebook Ads. |
| Transparency to advertisers | The app displays Meta reporting directly — no blending with other platforms. The user sees raw Meta data as returned by the API. |

### Installation guide

Instructions for a Meta reviewer (or new user) to install and run the app on macOS or Windows:

**→ [docs/installation-guide.md](./installation-guide.md)**

The guide covers cloning the repo, installing dependencies, launching via `npm run dev`, and building a distributable installer via `npm run make`. It also covers first-time Meta Setup (entering App ID and App Secret) and common troubleshooting steps.

### Important things to know

- The app must be **complete and ready for testing** before submission — reviewers will test it live
- Each permission requires **at least one successful API call within the last 30 days**
- **Do not copy and paste** usage descriptions between permissions — each must be unique and answer the specific guidance questions Meta provides for that permission
- The review decision is typically returned **within one week**
- The app should remain in **Live mode** during review so the reviewer can test it; data created in Development mode is not visible in Live mode
- Do **not** include your own Meta account credentials in the access instructions — reviewers use their own test accounts

---

## Screenshots / Screen Recordings

### Technical requirements

| Requirement | Spec |
|---|---|
| Minimum resolution | 1080p |
| Monitor width | 1440px or less |
| Audio | **Audible to app users / clients; Meta reviewers do not listen during review** |
| Language | English UI preferred |
| Mouse cursor | Visible; increase cursor size in System Preferences |
| Recording format | Full-screen or window-only |
| Tool used | QuickTime Player (macOS) |

> **Note on audio:** Include narration — it will be heard by users and clients who watch the recordings. Meta reviewers will mute or skip it, so the video must also be self-explanatory visually: clear labels in the app, slow deliberate mouse movements, and text callouts in post (iMovie) where needed.

### Trademark and logo requirements

Meta prohibits the use of its brand assets in app icons, screenshots, or recordings submitted for review:

- **Do not** use Facebook, Instagram, Meta, WhatsApp, or Messenger logos, wordmarks, or brand colours in the app icon or any submitted asset
- **Do not** imply Meta endorsement of the app
- **You may** reference Meta products by name in plain text (e.g. "Connect to Facebook")
- The current app icon (the DM monogram) contains no Meta trademarks — **no action required**
- Screenshots and recordings showing the Facebook OAuth dialog are fine — that is Meta's own UI, not ours

- [ ] App icon reviewed — no Meta trademarks present

### Common mistakes that cause rejection

Based on Meta's documented common mistakes:

| Mistake | How we avoid it |
|---|---|
| App inaccessible to reviewer | App is in Live mode; installation guide provided; reviewer uses their own Facebook account |
| Missing screen recordings | One recording per permission, each showing end-to-end usage |
| App appears unfinished | All four permissions have working end-to-end flows |
| Permissions requested for future features | Only the four permissions actively used are requested |
| Facebook Login not found or not working | Login is the first screen after consent gate; tested end-to-end in Live mode |
| Fake account credentials provided | Reviewers use their own accounts; no credentials provided |
| Copy-pasted usage descriptions | Each permission has a unique description answering Meta's specific questions |
| Recording does not show the full auth flow | Recording starts logged out, shows OAuth dialog with all four scopes, shows post-login state |

### Content requirements per recording

Each recording must demonstrate:

- [ ] App launched from a **logged-out state**
- [ ] Complete OAuth flow — Facebook dialog shown with all four permission scopes visible
- [ ] User approves permissions
- [ ] Post-login state showing the feature that uses that permission
- [ ] The specific API action being taken (e.g. creating a campaign, reading insights)
- [ ] Mouse used (not keyboard shortcuts) — actions slow enough for reviewer to follow
- [ ] Zoom into small or complex UI sections

### UI annotation audit — what needs captions / tooltips before re-recording

Since audio is ignored, the following elements need visual clarification either added to the app (tooltips / info icons) **before recording**, or annotated in post-production (iMovie text overlays).

#### Acronyms used without explanation (add `title` tooltip or info icon)

These appear in table headers, field labels, and metric displays:

| Acronym | Full meaning | Where it appears | Fix |
|---|---|---|---|
| CTR | Click-Through Rate | Monitoring table, Optimisation table, Workspace (Min CTR field), verdict chips | Add `title="Click-Through Rate"` to column headers; info icon on Workspace field |
| CPC | Cost Per Click | Monitoring table, Optimisation table, Workspace (Max CPC field), verdict chips | As above |
| CPM | Cost Per Mille (per 1,000 impressions) | Monitoring table | Add `title="Cost Per Mille (per 1,000 impressions)"` |
| CPA | Cost Per Acquisition | Workspace (Kill CPA Multiple field) | Info icon on field label |
| ROAS | Return on Ad Spend | Workspace (Winner Min ROAS field) | Info icon on field label |
| DSA | Digital Services Act (EU) | Workspace (EU Advertising Identity section) | Expand section heading or add info icon |
| UTM | Urchin Tracking Module (URL tracking) | Campaign Step, Workspace naming fields | Add `title` or info icon |
| CTA | Call to Action | Creatives Step (Call to Action field label is already spelled out — no action needed) | None — already clear |

#### Icon-only controls that need visible labels or tooltips

| Control | Location | Current state | Fix |
|---|---|---|---|
| Video play button (▶) | All new-campaign steps, Workspace sections | Has `aria-label` and `title` — shows on hover | Fine for recording; ensure cursor hovers to trigger tooltip in video |
| Section chevron toggles (›) | Workspace accordion sections | `aria-label="Toggle [section]"` — not visible | Fine — sections are labelled by heading |
| Sort arrows (⇅ ▲ ▼) | Monitoring table headers | Text symbols, no tooltip | Add `title` attribute explaining "Sort ascending/descending" |
| ↻ icon on "Fetch Insights" | Monitoring | Button has text label alongside icon | No action needed |
| ↓ icon on "Export CSV" | Monitoring | Button has text label alongside icon | No action needed |

#### Ambiguous button labels

| Label | Location | Issue | Fix |
|---|---|---|---|
| "Sync from Meta" | Campaigns, Ad Sets, Ads list | Slightly ambiguous — sync what? | Could add tooltip: "Refresh campaign data from your Meta ad account" |
| "Fetch Insights" | Monitoring | Inconsistent naming vs "Sync from Meta" | Could rename to "Sync Insights" for consistency — or leave and add tooltip |
| "Analyse Ads" | Optimisation | Clear enough in context | No action needed |
| "Build draft" | Campaign Step (AI) | Might not be obvious to reviewer | Add tooltip: "Use AI to generate a campaign structure from a description" |

#### Verdict chips in Optimisation (need tooltip on hover)

| Chip | Meaning | Fix |
|---|---|---|
| Winners | ROAS above threshold, spend above floor | Add `title` attribute with definition |
| On Track | Meets minimum thresholds, still learning | As above |
| Low CTR | CTR below workspace minimum | As above |
| High CPC | CPC above workspace maximum | As above |
| Needs Data | Insufficient spend/impressions to evaluate | As above |

### Recommended action before re-recording

1. **Add `title` attributes** to all acronym column headers and field labels listed above (quick code change — shows as browser tooltip on hover)
2. **Add info icons** to the Workspace fields for ROAS, CPA, DSA, and UTM with a `title` tooltip
3. **Add `title` tooltips** to Optimisation verdict chips
4. **Re-record all four screencasts** with QuickTime Player at full screen, cursor size increased, actions performed slowly
5. **Post-produce in iMovie** — add text callouts at key moments (e.g. "Creating campaign — uses ads_management permission", "Viewing insights — uses ads_read permission")

### Our screen recordings

| Recording | Covers | Permission(s) demonstrated | Status |
|---|---|---|---|
| Login + account selection | OAuth flow, consent gate, ad account loading | `ads_management`, `ads_read`, `business_management`, `pages_read_engagement` | Re-record after UI fixes |
| Campaign creation wizard | Campaign → Ad Set → Creative → Launch Ads | `ads_management` | Re-record after UI fixes |
| Monitoring dashboard | Fetching insights, pause/resume controls | `ads_read` | Re-record after UI fixes |
| Workspace setup | Ad account selection, Page/Pixel selection | `business_management`, `pages_read_engagement` | Re-record after UI fixes |

---

## Submit for Review

### Step 1 — Add a Use Case

**Where:** [developers.facebook.com](https://developers.facebook.com) → select the app → left sidebar: **App Review**

#### Overview

Meta's App Review no longer lists individual permissions as selectable items. Instead, permissions are bundled into **Use Cases** — each Use Case represents a real-world scenario (e.g. "Create and manage ads") and grants the underlying permissions required for that scenario.

For this app, **one Use Case covers all four required permissions.** You do not need to add them individually.

#### Navigation

1. Open [developers.facebook.com](https://developers.facebook.com) and log in with the Facebook account that owns the app.
2. Select **AI Social Media Ads** from the My Apps dropdown (top right).
3. In the left sidebar, click **App Review**.
4. Look for an **"Add Use Cases"** button or a **"Use Cases"** section (the exact label may vary by UI version).

#### Which Use Case to select

Look for a use case related to **advertising / Marketing API**, most likely named something like:

- *"Advertise with the Marketing API"*
- *"Create and manage ads using the Marketing API"*
- *"Marketing API"*

This single use case should include all four permissions: `ads_management`, `ads_read`, `business_management`, and `pages_read_engagement`.

> **Verify the included permissions:** When you hover over or expand the use case card, it should list the permissions it grants. Confirm all four are present before adding it.

#### Marketing API Access Tier

When adding a Marketing API use case, you may also be prompted to select an **Access Tier**:

| Tier | What it means |
|---|---|
| **Standard** | Rate limits suitable for most apps; sufficient for this app |
| **Advanced** | Higher rate limits for large-scale or agency platforms |

Select **Standard** unless you have a specific reason to request Advanced. Standard tier is sufficient for an app managing campaigns for a single user or small number of clients.

#### What happens after adding the Use Case

The use case appears in the submission with the individual permissions listed beneath it. The submission flow then prompts you to complete the data handling questions (Step 2) and usage descriptions / recordings (Step 5) for the use case.

#### Checklist

- [ ] Navigated to App Review
- [ ] Located the Marketing API / "Create and manage ads" Use Case
- [ ] Confirmed all four permissions are included in the use case
- [ ] Use Case added to submission
- [ ] Marketing API Access Tier selected (Standard)

---

### Step 1.5 — Business Verification (if required)

**Where:** App Dashboard → Publish → Start Verification (or prompted automatically within the submission flow)

#### Is it required?

Business verification may be prompted automatically during the submission flow. Whether it is mandatory depends on the use case and access tier selected. **Check first** — if the submission flow does not show a verification prompt or blocker, you may be able to proceed without it.

If it is required, there is a conflict for UK sole traders operating below the HMRC registration threshold — see below.

#### The sole trader conflict (UK)

| Rule | Detail |
|---|---|
| HMRC registration threshold | You do not need to register for Self Assessment until self-employment income exceeds £1,000/year |
| Companies House registration | Not required for sole traders — only for limited companies |
| Meta's accepted documents | Business registration certificate, tax ID letter, or business bank statement |

**The problem:** If you are operating below £1,000/year and have not voluntarily registered with HMRC, you have no official document that proves a business exists — because legally none is required to exist yet.

#### Options

**Option A — Voluntary HMRC Self Assessment registration (recommended)**
You can register for Self Assessment with HMRC at any time, before you hit the threshold. HMRC will issue a **UTR (Unique Taxpayer Reference)** letter to your address. This letter, combined with your name and address, may satisfy Meta's verification as proof of self-employment. Register at [gov.uk/register-for-self-assessment](https://www.gov.uk/register-for-self-assessment).

**Option B — Skip verification (if the flow allows it)**
If the submission flow does not mandate business verification for your chosen use case and access tier, proceed without it. Some use cases at Standard tier do not require it. Attempt submission first; only pursue verification if blocked.

**Option C — Form a limited company**
Registering a limited company with Companies House takes ~24 hours online and costs £50. You immediately have a registration number and certificate — unambiguous proof. This is the cleanest long-term solution if you plan to sell the app commercially, but is likely overkill at this stage.

> **Recommended approach:** Attempt the submission first (Option B). If Meta blocks it with a verification requirement, register voluntarily with HMRC for Self Assessment (Option A) and use the UTR letter.

#### If verification is required and you have a document

1. In the App Dashboard, go to **Publish → Start Verification** (or follow the prompt in the submission flow).
2. Enter your name as the business name (sole traders trade under their own name).
3. Upload the best document available — UTR letter, business bank statement, or SA302 from HMRC.
4. Submit — Meta reviews within **3–5 business days** (up to 14).

- [ ] Checked whether verification is required (attempt submission first)
- [ ] If required: document obtained and uploaded
- [ ] If required: verification approved (status shows "Verified" in App Dashboard)

---

### Step 2 — Answer Data Handling Questions

**What:** A short questionnaire about how each permission's data is used.
Evaluation is automatic and typically completes within 30 seconds. If your answers are consistent with Meta's Platform Terms (no third-party sharing, no selling, data used only for stated purpose), the questionnaire passes immediately without human review.

#### How the questionnaire works

After adding permissions in Step 1, each permission card in the Current Submission section gains a **"Complete Data Use Checkup"** link (or the submission flow prompts you to complete it before proceeding). The questions are per-permission — you answer the same set of four questions for each of the four permissions.

The four questions Meta asks for each permission:

| # | Question | Type |
|---|---|---|
| 1 | How will you use this data? | Multi-select checkboxes |
| 2 | Will you share any data you receive from this permission with a third party? | Yes / No |
| 3 | Will you store any data you receive from this permission? | Yes / No |
| 4 | Will you sell any data you receive from this permission? | Yes / No |

If you answer **Yes** to question 3, two follow-up questions appear:
- Will you store data beyond 90 days?
- Will you delete stored data within 90 days of the person deleting your app?

> **Critical:** Answer **No** to questions 2 and 4 for all permissions. Third-party sharing and data selling are disqualifying — automatic rejection. Any answer that suggests the data leaves the user's device and is processed by a third party (analytics SDKs, data brokers, cloud functions) must be disclosed and will likely trigger manual or policy review.

---

#### `ads_management`

**Q1 — How will you use this data?**
Select:
- ✅ *Provide core app features or services* (creating and managing ad campaigns is the entire purpose of the app)

Do **not** select: analytics, targeted advertising, product improvement, or any option that implies the data is used beyond serving the current user.

**Q2 — Will you share with a third party?**
**No.** All API calls go directly from the user's device to the Meta Graph API via Electron IPC. No data passes through any server we control. No third-party SDKs receive this data.

**Q3 — Will you store any data?**
**No.** Campaigns, ad sets, and ads created or updated via `ads_management` are not written to disk by our app. The API response (e.g. newly created campaign ID and status) is held in the NgRx Signal Store (in-memory only) for the current session. The next app launch fetches fresh data from the API via `ads_read`.

**Q4 — Will you sell any data?**
**No.**

---

#### `ads_read`

**Q1 — How will you use this data?**
Select:
- ✅ *Provide core app features or services* (displaying campaign status and performance metrics to the authenticated user)

**Q2 — Will you share with a third party?**
**No.** Campaign and insights data is fetched from the Meta API and displayed to the user in the monitoring and optimisation dashboards. It does not leave the device.

**Q3 — Will you store any data?**
**No.** Insights data (impressions, clicks, spend, ROAS, etc.) and campaign/ad set/ad status are held in the NgRx Signal Store (in-memory) for the current session only. No insights data is written to disk. On app restart the data is fetched fresh.

**Q4 — Will you sell any data?**
**No.**

---

#### `business_management`

**Q1 — How will you use this data?**
Select:
- ✅ *Provide core app features or services* (listing the user's ad accounts so they can select which account to manage)

**Q2 — Will you share with a third party?**
**No.** The ad account list is fetched and displayed in the app's account selector. It does not leave the device.

**Q3 — Will you store any data?**
**Yes.** The **selected ad account ID and name** is saved to `fb-config.enc` on the user's device so the user does not have to re-select their account on every launch. No other `business_management` data is persisted.

Follow-up answers:
- *Will you store data beyond 90 days?* **Yes** — the account selection is stored indefinitely until the user changes it or deletes their data.
- *Will you delete stored data within 90 days of the person deleting your app?* **Yes** — the GDPR "Delete all my data" flow (`gdpr:delete-all-data` IPC handler) deletes `fb-config.enc` immediately on request.

**Q4 — Will you sell any data?**
**No.**

---

#### `pages_read_engagement`

**Q1 — How will you use this data?**
Select:
- ✅ *Provide core app features or services* (listing the user's Facebook Pages so they can select a Page to use as the ad identity in campaign creatives)

**Q2 — Will you share with a third party?**
**No.** The Page list is fetched and displayed in the workspace Page selector. It does not leave the device.

**Q3 — Will you store any data?**
**Yes.** The **selected Page ID and name** is saved to the workspace configuration on the user's device (encrypted local storage) so the Page selector is pre-populated on next launch.

Follow-up answers:
- *Will you store data beyond 90 days?* **Yes** — the Page selection is stored indefinitely.
- *Will you delete stored data within 90 days of the person deleting your app?* **Yes** — deleted by the `gdpr:delete-all-data` handler along with `fb-config.enc` and `fb-tokens.enc`.

**Q4 — Will you sell any data?**
**No.**

---

#### What to expect after submitting the questionnaire

- If all answers are accepted automatically, the permission cards update to show the questionnaire complete and the submission moves to the next stage.
- If Meta flags an inconsistency (e.g. selected "analytics" in Q1 but answered "No" to third-party sharing), a warning appears — re-read the question and adjust.
- The automatic evaluation does **not** approve the permissions — it only validates the data handling answers. Final approval still requires the usage descriptions and recordings (Steps 5–6).

#### Checklist

- [ ] `ads_management` data use questionnaire completed
- [ ] `ads_read` data use questionnaire completed
- [ ] `business_management` data use questionnaire completed
- [ ] `pages_read_engagement` data use questionnaire completed
- [ ] All four passed (no warning or rejection flags shown)

---

### Step 3 — Complete App Settings

**Where:** App Dashboard → Settings → Basic

Fill in every required field before proceeding — Meta's submission flow will block you if any are missing.

| Field | Value |
|---|---|
| App Icon | 1024×1024 PNG — the DM monogram; upload via the icon slot on the Basic Settings page |
| Privacy Policy URL | `https://duncanmcmillan.github.io/ai-social-media-ads/privacy-policy` |
| App Category | **Business and Pages** (or closest equivalent shown in the UI) |
| Contact email | Verify the email shown is reachable — Meta sends review decisions here |

> **Note:** An "App Purpose" field does not appear in the current Meta UI — it has been removed or is not present for this app type. Fill in all fields that are shown; do not look for one that does not exist.

- [ ] App icon uploaded (1024×1024, no Meta trademarks or logos)
- [ ] Privacy Policy URL saved
- [ ] App Category set
- [ ] Contact email confirmed

---

### Step 4 — Complete App Verification

**Where:** Within the App Review submission flow — "App Verification" section

#### Authentication method

Confirm **Facebook Login for Business** (not the legacy "Facebook Login" product). This should already be configured as it powers the OAuth flow.

- [ ] Facebook Login for Business listed as the authentication method
- [ ] Valid OAuth Redirect URI is present: `https://duncanmcmillan.github.io/ai-social-media-ads/oauth/callback`

#### Platform

The submission asks what platform the app runs on. Select **Desktop** (or "Other" → "Desktop app" depending on the UI version). The reviewer needs to know it is an Electron application, not a web app.

- [ ] Platform set to Desktop

#### Access instructions for reviewer

Write instructions that let a Meta reviewer install and test the app using **their own** Facebook account. Do not include your own App Secret or personal account credentials.

> **App Secret problem:** The app's Meta Setup screen asks the reviewer to enter an App ID and App Secret. The App Secret is private and cannot be shared. Options:
> - Provide a separate test App registered in Meta Developers (with its own App ID and Secret) solely for the reviewer — safest approach
> - Ship a pre-configured build where the App ID is hardcoded but the Secret is entered once by you before handing over (not ideal for a public submission)
> - Document that the reviewer should use their own Meta Developer test app credentials
>
> Decide on the approach and update the instructions below accordingly before submitting.

**Draft access instructions** (edit to match your chosen approach before pasting into Meta's form):

```
AI Social Media Ads is a cross-platform desktop application built with Electron.

Installation:
1. Visit https://github.com/duncanmcmillan/ai-social-media-ads/releases and download
   the latest installer for your operating system (macOS .dmg / Windows .exe).
2. Install and launch the application.

First-time setup:
3. Accept the privacy consent gate on first launch.
4. On the Meta Setup screen, enter the provided test App ID and App Secret
   (supplied separately via secure channel), then click Save.
5. Click "Connect to Facebook" to begin the OAuth flow.
6. Authenticate with your own Facebook account and grant all four requested permissions:
   ads_management, ads_read, business_management, pages_read_engagement.
7. Select an ad account from the dropdown (your own test ad account).

Testing the core features:
- Campaigns tab: click "Sync from Meta" to load existing campaigns; use "New Campaign"
  to create a test campaign through the wizard.
- Monitoring tab: click "Fetch Insights" to load performance data.
- Ad Sets / Ads tabs: browse existing ad sets and ads for the selected campaign.
- Workspace tab: review the global defaults panel.

Requirements:
- A Facebook account with at least one accessible ad account (Development mode or Live mode).
- The account does not need real spend; empty ad accounts are fine for testing read flows.
  For write flows (campaign creation), the account must have a valid payment method on file.
```

- [ ] Access instructions finalised and pasted into Meta's form

---

### Step 5 — Complete Usage Descriptions and Upload Recordings

**Rules:**
- Each description must be unique — Meta checks for copy-pasted text across permissions
- Aim for 2–4 sentences: what API calls are made, what data is used, why the user benefits, why there is no less-privileged alternative
- A screen recording must be uploaded for each permission

---

**`ads_management`**

> AI Social Media Ads uses `ads_management` to create and manage Facebook ad campaigns on behalf of the authenticated user through a guided campaign creation wizard. The app posts campaign objectives, budgets, and schedules via `POST /act_{ad-account-id}/campaigns`; targeting parameters and bid strategies via `POST /act_{ad-account-id}/adsets`; creative assets and copy via `POST /act_{ad-account-id}/adcreatives` and `/adimages`; and complete ad objects via `POST /act_{ad-account-id}/ads`. The permission is also used to pause and resume delivery — `POST /{campaign-id}`, `/{adset-id}`, or `/{ad-id}` with `status=PAUSED` or `ACTIVE` — via one-click controls in the monitoring dashboard. Campaign creation and delivery management are the entire purpose of the app; there is no less-privileged permission that allows writing to a user's ad account.

**Recording uploaded:** [ ]

---

**`ads_read`**

> AI Social Media Ads uses `ads_read` to display the current delivery status and performance metrics of the user's campaigns, ad sets, and ads in a live monitoring dashboard. The app fetches campaign and ad object status via `GET /act_{ad-account-id}/campaigns`, `/adsets`, and `/ads`, and fetches Insights metrics — impressions, reach, clicks, CTR, CPC, CPM, and ROAS — via `GET /{object-id}/insights`. This data is shown only to the authenticated user for their own ad account and is also used by the built-in optimisation engine to surface performance recommendations. There is no alternative permission that provides read access to campaign status and Insights data.

**Recording uploaded:** [ ]

---

**`business_management`**

> AI Social Media Ads uses `business_management` to list the ad accounts accessible to the authenticated user, including accounts held under a Business Manager, via `GET /me/adaccounts?fields=id,name,account_status,currency,business`. The returned list populates an account selector shown immediately after login, allowing the user to choose which ad account the app manages. Without this permission, users whose ad accounts are administered through a Business Manager — the majority of professional advertisers — cannot have their accounts identified and the app cannot direct any API call to the correct account. The permission is exercised once at setup and again when the user switches accounts.

**Recording uploaded:** [ ]

---

**`pages_read_engagement`**

> AI Social Media Ads uses `pages_read_engagement` to list the Facebook Pages managed by the authenticated user via `GET /me/accounts?fields=id,name,category`, so the user can select a Page identity for their ad creatives. The selected Page ID is stored in the app's local workspace configuration and supplied as the `page_id` field inside `object_story_spec` when ad creatives are created via `POST /act_{ad-account-id}/adcreatives`. The Marketing API requires a valid `page_id` in every ad creative object; the call fails without it. There is no alternative permission that provides access to the user's managed Pages.

**Recording uploaded:** [ ]

---

### Step 6 — Submit for Review

**Where:** App Review → Permissions and Features → Submit for Review button (active once Steps 1–5 are complete for all permissions)

Before clicking Submit:

- [ ] All four permissions appear in Current Submission with descriptions and recordings attached
- [ ] Data handling questionnaire passed for all four
- [ ] App Settings (Step 3) complete — no missing required fields shown
- [ ] App Verification (Step 4) complete — no warnings shown
- [ ] Platform Onboarding Terms read and accepted (checkbox shown just before the Submit button)
- [ ] Submission confirmed — Meta shows a confirmation screen with a case/ticket reference

After submitting, the permission cards change to **"In Review"** status. Meta's policy states decisions are returned within seven business days; in practice it is often 3–5 days.

**Submitted on:** <!-- fill in date -->

**Decision received:** <!-- fill in date -->

**Outcome:** <!-- Approved / Rejected / Needs changes -->

**If rejected:** Meta provides a rejection reason per permission. Common reasons and fixes:

| Rejection reason | Fix |
|---|---|
| Recording does not show the complete auth flow | Re-record starting from logged-out state; ensure all four permission scopes visible in OAuth dialog |
| Usage description does not explain why permission is necessary | Add a sentence explicitly stating why no less-privileged alternative exists |
| App inaccessible to reviewer | Check installer link; confirm App ID/Secret supplied correctly; test from a clean machine |
| Business verification required | Complete Step 1.5 and resubmit |
