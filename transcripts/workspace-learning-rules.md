# Learning Rules — Screencast Transcript

**Panel:** Workspace › Learning Rules
**Purpose:** Define the thresholds the Optimisation tab uses to diagnose and label your ads.

---

## Intro

The Learning Rules panel is where you define the numerical thresholds that drive the Optimisation tab. When you run an analysis on your ads, the app compares each ad's performance against these rules and assigns it a verdict — winner, needs data, low CTR, high CPC, and so on.

These defaults are sensible starting points, but you should adjust them to match your business. A £50 spend floor might be fine for one advertiser and completely wrong for another.

You can always click **Reset to defaults** at the bottom to go back to the original values.

---

## Data Floors

The first group is **Data Floors** — these tell the app when an ad has enough data to be judged at all.

- **Min Impressions**: the minimum number of times an ad must have been shown before the app will pass any verdict. Below this, the ad is labelled "needs data". The default is 1,000.
- **Min Spend**: the minimum amount that must have been spent. Even if an ad has high impressions, if the spend is below this threshold the app won't make a call. Default is £50.
- **Min Conversions**: the minimum number of conversion events required before any conversion-based verdict. Default is 5.

These floors exist to prevent the app from drawing conclusions from statistically insignificant data.

---

## Winner Gate

The **Winner Gate** group defines what it takes for an ad to be called a winner.

- **Winner Min Spend**: an ad must have spent at least this much before it can earn the winner label. This prevents an ad from being called a winner too early. Default is £300.
- **Winner Min ROAS**: the minimum return on ad spend required. Default is 2 — meaning for every pound spent, the ad must return at least two pounds in revenue.

Both conditions must be met for an ad to be labelled a winner.

---

## Kill Rule

The **Kill CPA Multiple** is a single number that flags an ad as a loser.

If your ad's cost per acquisition exceeds your target CPA multiplied by this value, the app flags it as underperforming. The default is 3 — so if your target CPA is £20 and an ad is costing £60 or more per conversion, it gets flagged.

---

## Fatigue

The **Fatigue** group helps identify ads that have burned out.

- **Prospecting Frequency Max**: if the average frequency — how many times each person has seen the ad — exceeds this value for a prospecting campaign, the app considers it potentially fatigued. Default is 3.5.
- **Retargeting Frequency Max**: retargeting audiences can tolerate higher frequency, so this threshold is higher. Default is 8.
- **CTR Drop from Peak (%)**: if an ad's CTR has fallen more than this percentage from its all-time peak CTR, the app flags it as possibly fatigued. Default is 20%.

---

## Wrap-up

These rules feed directly into the Optimisation tab. The more accurately they reflect your business targets and risk tolerance, the more useful the verdicts will be. Take a few minutes to think through your typical CPA target and ROAS goal and set these values accordingly.
