The Campaign & Ad Manager tab is your read-and-control view of everything currently running in your Meta ad account. It pulls data directly from the Facebook API so you're always looking at the live state — not a cached copy.

There are three sub-tabs across the top: Campaigns, Ad Sets, and Ads. Each one shows a table for that level of the Meta hierarchy. The data is shared across all three tabs, so once you've synced on any tab the data stays available as you switch between them without needing to sync again.

When you first arrive, the table will be empty. Click Sync from Meta to fetch your campaigns. The app calls the Facebook API and pulls back all campaigns associated with your selected ad account.

If you're not connected to Meta yet, you'll see a note prompting you to connect in the Workspace tab first.

If there's an API error — for example an expired token or a permission issue — an error banner appears at the top of the panel.

Once synced, your campaigns appear in a table with six columns.

Campaign: the campaign name as it appears in Meta Ads Manager.

Status: a colour-coded badge. Active campaigns show in green, Paused in amber, and other states like Deleted or Archived in grey.

Objective: the campaign objective in plain English — Sales, Traffic, Leads, and so on.

Budget: the daily or lifetime budget, formatted in your account's currency. If the budget is set at the ad set level rather than the campaign level, this column shows a dash.

Created: the date the campaign was first created in Meta.

Actions: a Pause or Activate button, depending on the current status. Only Active and Paused campaigns have this button — you can't toggle Deleted or Archived campaigns from here.

Click Pause on an active campaign to pause it immediately in Meta. Click Activate on a paused campaign to resume spending. The button is disabled briefly while the API call is in flight — you'll see it grey out to prevent double-clicks.

These actions are live — they call the Meta API straight away and the status badge updates once the response comes back.

Click Ad Sets in the sub-navigation to switch to the ad sets view.

Click Sync from Meta here if you haven't already. The app fetches all ad sets across all campaigns in your account. If you've already synced on the Campaigns tab, the ad sets may already be loaded — the app fetches ad sets as part of the campaign sync and caches them for the session.

The Ad Sets table has seven columns.

Ad Set: the ad set name.

Status: same colour-coded badge as campaigns.

Optimisation: the optimisation goal — what Meta is bidding towards, such as Offsite Conversions, Link Clicks, or Reach.

Billing: the billing event — typically Impressions, meaning you pay per thousand impressions.

Budget: the daily or lifetime budget for this ad set. If the campaign uses Campaign Budget Optimisation, this will show a dash.

Created: the creation date.

Actions: Pause or Activate button.

Pausing an ad set stops all the ads within it from running, without affecting other ad sets in the same campaign. This is useful when you want to stop spending on a specific audience while keeping others active.

Click Ads to see every individual ad in your account.

Click Sync from Meta to load ads. The app fetches all ads and maps each one back to its parent ad set so the ad set name appears in the table rather than just the raw ad set ID.

The Ads table has five columns.

Ad: the ad name, typically your creative name or a generated name from the naming template.

Status: Active, Paused, or another status badge.

Ad Set: the name of the ad set this ad belongs to, resolved from the ad set sync.

Created: the creation date.

Actions: Pause or Activate button.

Pausing a single ad stops just that creative from running. The ad set and campaign stay active — other ads within the same ad set continue to run. This is the most granular level of control and is useful when the Optimisation tab flags a specific ad as underperforming and you want to pause it while keeping the rest of the ad set live.

One important thing to know: the data you sync stays in memory for the entire session. If you navigate to another tab — Monitoring, Optimisation, New Campaign — and come back to Campaign & Ad Manager, your data will still be there. You only need to click Sync again if you want to refresh from Meta to pick up any changes made elsewhere.

The Campaign & Ad Manager gives you a fast, clear picture of everything running in your account and lets you make quick pause and activate decisions without leaving the app. For deeper performance analysis — spend, CTR, CPC, ROAS — head over to the Monitoring and Optimisation tabs.
