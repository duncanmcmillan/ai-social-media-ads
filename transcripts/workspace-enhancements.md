# Enhancements — Screencast Transcript

**Panel:** Workspace › Enhancements
**Purpose:** Configure creative optimisations, attribution windows, naming templates, UTM tracking, and EU advertising identity.

---

## Intro

The Enhancements panel covers four areas: creative optimisations Meta can apply, how you measure attribution, how your campaigns and creatives are named, and — if you're advertising to EU audiences — your legal identity for Digital Services Act compliance.

---

## Creative Enhancements

The first toggle is **Creative Enhancements**.

When this is on, Meta is allowed to make automatic adjustments to your ad creative — things like adjusting brightness and contrast, adding text overlays, expanding images to fit different placements, or showing different versions of your copy to different people.

Some advertisers find this helpful because Meta can find a better-performing version of your creative without you having to test manually. Others prefer to keep full control over exactly how their ads look. If brand consistency matters more than automated optimisation, turn this off.

---

## Attribution Window

The **Attribution Window** tells Meta how far back to look when crediting a conversion to your ad.

There are three dimensions:

- **Click-Through**: how many days after someone clicks your ad should a conversion still be counted. Options are 1, 7, or 28 days.
- **Engaged View**: how many days after someone watches at least 10 seconds of your video ad should a conversion count. Options are 1 or 7 days.
- **View-Through**: how many days after someone simply sees your ad (no click) should a conversion count. Options are 1 or 7 days.

The defaults here — 7-day click, 1-day engaged view, 1-day view-through — are what Meta recommends for most campaigns. Longer windows show more conversions attributed to your ads but can overstate performance; shorter windows are more conservative.

---

## Naming & UTM

This section controls how your creatives and ad sets are named, and what UTM parameters get appended to your URLs.

You'll see three monospace text fields. These use template tokens — placeholders in double curly braces that get substituted with real values when the campaign is created. The available tokens are listed just above the fields.

For example, a creative name template like `{{campaign.name}} - {{creative.id}}` would produce names like `Summer Sale - cr_abc123`.

The **UTM Parameters** field is appended to your ad URL so you can track traffic sources in Google Analytics or your analytics platform. A typical value might be `utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}`.

---

## EU Advertising Identity (DSA)

The last section is **EU Advertising Identity**, which relates to the Digital Services Act.

If you're running ads targeting audiences in EU countries, Meta requires you to declare who is paying for the ad and who it benefits. This maps to the `beneficiary` and `payer` fields on the Facebook ad creative.

- **Beneficiary Name**: the legal entity or brand that benefits from the ad — usually your company name.
- **Payer Name**: who is paying for the ad — again usually your company, unless you're an agency running ads on a client's behalf.

If you're not targeting EU countries, you can leave these blank.

---

## Wrap-up

All of these settings are applied at the workspace level and feed through to every campaign you create. The naming templates and UTM parameters in particular save a lot of manual work if you're running a high volume of ads.
