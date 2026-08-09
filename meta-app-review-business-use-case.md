# Meta App Review — Business Use Case

## Overview

AI Social Media Ads is an internal desktop application used by our marketing team to streamline the creation and management of Facebook advertising campaigns. The application automates the end-to-end campaign workflow — from generating AI-assisted ad copy and uploading creative assets, to publishing campaigns, ad sets, and ads directly to the Meta Marketing API.

## Permission Justifications

### ads_management

The `ads_management` permission is required to:

- Create campaigns, ad sets, and ads programmatically on behalf of the authenticated user's ad account
- Upload image creatives to the ad account's creative library
- Pause and activate campaigns and ad sets in response to performance data
- Read campaign structure to display and manage existing campaigns within the app

### ads_read

The `ads_read` permission is required to:

- Fetch performance insights (impressions, clicks, CTR, CPC, spend, reach) at the account, campaign, and ad level
- Evaluate creative performance against configurable learning rule thresholds to surface optimisation recommendations

### business_management

The `business_management` permission is required to:

- Access ad accounts associated with the user's Business Manager

### pages_read_engagement

The `pages_read_engagement` permission is required to:

- List Facebook Pages administered by the user so they can select a Page identity for their ad creatives

## Data Handling

All API calls are made directly from the user's device to the Meta Graph API. No data is stored on external servers. The app is used exclusively by our internal marketing team to improve campaign creation efficiency and reduce manual work in Ads Manager.
