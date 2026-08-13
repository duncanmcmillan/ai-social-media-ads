Before you can use this app to create and manage Facebook ads, there are a few things you need to set up on the Meta side. This video walks you through all of them — your developer app, your ad account, your Facebook Pages, user permissions, and what to expect from the app review process.

The first thing you need is a Meta developer account. Go to developers.facebook.com and log in with your personal Facebook account. If you haven't been here before, you'll be prompted to register as a developer — just accept the terms and you're in.

Once you're in the developer portal, click Create App. You'll be asked what type of app you want to build. Choose Other, then Business. Give it a name — something like "My Ads Manager" or your company name — and click Create App.

Once your app is created, you'll land on the app dashboard. The two things you need from here are the App ID and the App Secret. The App ID is shown prominently on the dashboard. To see the App Secret, click Show next to it — you'll need to confirm your Facebook password. Copy both of these and paste them into the Workspace Account Details panel in this app.

Next, you need an Ad Account. Ad accounts live inside a Business Manager. If you don't have one yet, go to business.facebook.com and create one — it takes about two minutes. Once your Business Manager is set up, go to Business Settings, then Accounts, then Ad Accounts, and click Add. You can create a new ad account or request access to an existing one. Make sure the ad account is assigned to the same Business Manager as your developer app.

After connecting this app to Facebook via the OAuth flow in the Account Details panel, your ad accounts will appear in the account selector automatically. If you manage multiple accounts, you'll be able to switch between them from that dropdown.

Facebook Pages are the identity that appears on your ads — the name and profile picture people see in the feed. You'll need at least one Facebook Page connected to your Business Manager. Go to Business Settings, then Accounts, then Pages, and add the page you want to advertise from. Once it's added, it will appear in the Facebook Page dropdown in the Workspace Meta Defaults panel.

For user permissions, the key thing is making sure your personal Facebook account has the right role on both the Business Manager and the Ad Account. You should be an Admin on the Business Manager, and have Manage Ads permission on the Ad Account. Without these, the API calls this app makes will fail with permission errors.

You also need to add the correct permissions to your developer app. In the App Dashboard, go to App Review, then Permissions and Features. You need to request ads_management and ads_read. For development and testing, these permissions work without full app review — you can use them with accounts that have a role on your app. For production use with other people's ad accounts, you will need to go through Meta's app review process.

App review is Meta's process for verifying that your app uses the API responsibly. You'll need to submit a screencast showing how your app uses each permission, provide a privacy policy URL, and answer some questions about your use case. The review can take a few days to a few weeks. While you're waiting, you can still use the app fully with your own ad account — the restrictions only apply when accessing accounts that don't have a role on your developer app.

Once everything is set up — App ID, App Secret, Ad Account connected, Page selected, and permissions in place — you're ready to start creating campaigns. Head to the Workspace tab in this app and work through the Account Details and Meta Defaults sections to get everything configured.
