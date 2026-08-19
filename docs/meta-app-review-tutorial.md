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
| Audio | Not required (no narration) |
| Language | English UI preferred |
| Mouse cursor | Visible; increase size for clarity |
| Recording format | Full-screen or window-only |

### Recommended tools

- **Camtasia** or **Snagit** — dedicated screen recording (recommended)
- **QuickTime** or **OBS** — free alternatives
- **iMovie** — post-production annotations and zoom

### Content requirements

- [ ] Show the user granting each permission in the Facebook OAuth dialog
- [ ] Demonstrate actual usage of each permission/feature after login
- [ ] Add **captions or tooltips** to explain button labels and UI elements
- [ ] Explain what each screen does — reviewers are not familiar with the app

### Our screen recordings

<!-- List each recording file, what it covers, and which permission(s) it satisfies -->

| Recording | Covers | Permission(s) |
|---|---|---|
| | | |

### Caption / tooltip notes

<!-- Note any UI elements that need captions added before recording -->

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
