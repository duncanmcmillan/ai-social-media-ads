# Account Details — Screencast Transcript

**Panel:** Workspace › Account Details
**Purpose:** Connect your Facebook developer credentials and authorise the app to manage your ad account.

---

## Intro

The Account Details panel is the first thing you need to set up. It's where you connect the app to your Facebook ad account — nothing else in the app will work until this is done.

There are three sub-sections here: your App Credentials, your Meta connection, and a manual token option for developers.

---

## App Credentials

At the top you'll see two fields: **App ID** and **App Secret**.

These come from your Facebook developer account. To find them, go to developers.facebook.com, open your app, and you'll see the App ID and App Secret on the dashboard. Copy them and paste them here.

The App Secret is a password field — it's stored in your operating system's encrypted storage, not in plain text. It never leaves this device.

Once both fields are filled, click **Save Credentials**.

---

## Connecting Meta

Once your credentials are saved, click the **Connect** button next to the Meta row.

This launches the standard Facebook OAuth flow in your browser. You'll log in to Facebook, grant the app permission to manage your ads, and then get redirected back automatically.

When you're connected you'll see your name appear with a green status dot, and the button changes to **Disconnect** if you ever want to unlink.

If there's an error, a message will appear below the connect button explaining what went wrong.

---

## Manual Token (Advanced)

Below the connection card there's a manual token field. This is for developers or anyone who needs to bypass the OAuth flow — for example, if you're using the **Graph API Explorer** to test with a specific token.

Paste any valid access token with `ads_management` scope here and click **Apply Token**. Note that this token is held in memory only — it's not saved to storage, so if you restart the app you'll need to paste it again.

---

## Ad Account Selector

Once you're connected, a fourth card appears: **Ad Account**.

If you manage multiple ad accounts, they'll all appear in the dropdown. Select the one you want to work with. The app will show you the account's currency, timezone, business name, and status.

If no accounts appear in the list, click **Refresh accounts** and the app will re-fetch them from the Facebook API.

---

## TikTok

At the bottom you'll see TikTok listed as **Coming soon**. TikTok for Business integration is planned for a future release.

---

## Wrap-up

That's the Account Details panel. Once you're connected and have an ad account selected, head over to the **Meta Defaults** section to set up your Facebook Page and Pixel.
