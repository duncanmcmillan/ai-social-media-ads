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
| Audio | **Not listened to by reviewers — omit narration** |
| Language | English UI preferred |
| Mouse cursor | Visible; increase cursor size in System Preferences |
| Recording format | Full-screen or window-only |
| Tool used | QuickTime Player (macOS) |

> **Key implication:** Because audio is ignored, every action and UI element must be self-explanatory from the video alone — either through clear labels in the app, or through text overlays / captions added in post (iMovie).

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

### Step 1 — Select Permissions and Features

**Where:** App Dashboard → App Review → Permissions and Features

<!-- Notes on which permissions to select and any issues encountered -->

- [ ] `ads_management` selected
- [ ] `ads_read` selected
- [ ] `business_management` selected
- [ ] `pages_read_engagement` selected

---

### Step 1.5 — Business Verification (if required)

**Where:** App Dashboard → Publish → Start Verification

<!-- Notes on business verification status and any steps remaining -->

- [ ] Business verification complete

---

### Step 2 — Answer Data Handling Questions

**What:** A short questionnaire about how each permission's data is used.
Evaluation is immediate (up to 30 seconds).

<!-- Notes on the questions asked and answers given -->

**`ads_management`**

>

**`ads_read`**

>

**`business_management`**

>

**`pages_read_engagement`**

>

---

### Step 3 — Complete App Settings

**Where:** App Dashboard → Settings → Basic

- [ ] App icon uploaded (1024×1024, no Meta trademarks or logos)
- [ ] Privacy Policy URL set — `https://duncanmcmillan.github.io/ai-social-media-ads/privacy-policy`
- [ ] App Purpose set (Yourself / Clients)
- [ ] App Category selected
- [ ] Primary contact email verified

<!-- Notes on any issues with app settings -->

---

### Step 4 — Complete App Verification

**What:** Confirm Meta authentication solution and describe how a reviewer can access the app.

- [ ] Facebook Login for Business confirmed as authentication method
- [ ] Platform settings validated
- [ ] Access instructions written (do **not** include your personal Meta account credentials)

**Access instructions for reviewer:**

<!-- Draft the instructions a Meta reviewer would follow to test the app.
     They will need their own Facebook account and ad account. -->

>

---

### Step 5 — Complete Usage Descriptions and Upload Recordings

**Rules:**
- Each permission must have its **own unique description** — do not copy and paste
- Each description must answer the specific guidance questions Meta provides
- A screen recording must be uploaded for each permission

**`ads_management` description**

<!-- Reference: docs/meta-review-submission.txt Section 1 for justification copy -->

>

**Recording uploaded:** [ ]

---

**`ads_read` description**

>

**Recording uploaded:** [ ]

---

**`business_management` description**

>

**Recording uploaded:** [ ]

---

**`pages_read_engagement` description**

>

**Recording uploaded:** [ ]

---

### Step 6 — Submit for Review

- [ ] Platform Onboarding Terms accepted
- [ ] All four permissions have descriptions and recordings
- [ ] Submission confirmed

**Submitted on:**

**Decision expected by:**

<!-- Notes on any feedback or follow-up required after submission -->
