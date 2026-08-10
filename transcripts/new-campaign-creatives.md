# New Campaign — Creatives Step — Screencast Transcript

**Panel:** New Campaign › Step 3: Creatives
**Purpose:** Upload ad images or videos, write copy for each creative, and preview the finished ad before launching.

---

## Intro

Step three is Creatives — this is where the ad actually comes together. You upload your images or videos on the left, and write the copy for each one on the right. The app pairs every creative with every ad set to create the full set of ads.

---

## Website URL Mode

At the top of the left panel there's a **Website URL** dropdown with three options:

- **Use default website URL**: uses the URL from your Workspace Meta Defaults panel. This is the most common setting.
- **Use ad set URL**: lets you set a different URL per ad set — useful if different ad sets go to different landing pages.
- **Set per creative**: lets you specify a unique URL for each individual creative.

---

## Uploading Creatives

Below that is the **upload drop zone**. Click anywhere in the dotted area to open a file picker, or drag and drop files directly onto it.

The app accepts JPG and PNG images, and MP4 and MOV video files, up to 4GB.

You can upload multiple files at once. Each one appears in the file list below the drop zone as a thumbnail. Click a file in the list to select it and edit its copy on the right.

---

## Copy Editor

Once you've selected a creative, the **Copy Editor** opens on the right side.

At the top you'll see a small preview of the image or video with the filename. Below that are three sets of chip buttons:

**Tone** — select one or more tone styles for the copy: Conversational, Professional, Urgent, Bold, or Emotional. You can pick multiple.

**Hook** — choose a hook style that determines the angle of the copy: Humorous, Questions, Bold Claims, Statistics, Stories, or Pain Points.

**Length** — Short, Medium, or Long, which controls how much text Claude generates.

These chips are primarily for the AI copy generator, but they're also useful notes for writing copy manually.

---

## Copy Fields

Below the chips are the three main copy fields:

- **Primary Text**: the main ad copy that appears above the image in the feed. Facebook recommends keeping this under 125 characters, though longer copy can work. A character counter in the preview shows if you're over the limit.
- **Headline**: the short bold text that appears in the link card below the image. Keep this under 27 characters ideally.
- **Description**: optional supporting text in the link card. Also ideally under 27 characters.

---

## Call to Action and Launch Status

Below the copy fields are two more settings:

**Call to Action** — a dropdown with options like Learn More, Shop Now, Sign Up, Book Now, and others. This controls the button that appears on your ad.

**Launch Status** — **Active** or **Paused**. If you want some creatives to go live and others to stay paused for review, you can set this per creative here. Paused creatives are still created in Meta but won't spend until you activate them.

---

## Ad Creation Mode

The **Separate Ads** vs **Flexible Ad** toggle controls how the copy is structured in Meta:

- **Separate Ads**: creates one distinct ad for each creative, with its own copy. Full visibility into per-ad performance in reporting.
- **Flexible Ad**: bundles multiple text variations into a single ad and lets Meta automatically test which combination of text and creative performs best. Good for volume testing with fewer ads to manage.

---

## Generate AI Copy

Click **Generate AI Copy** to have Claude write the primary text, headline, and description for the selected creative. It uses the tone, hook, and length chips you've selected, plus your website URL from the workspace settings.

The generation takes a few seconds. Review what it produces and edit it freely — it's a first draft, not a finished product. Once you're happy, move on to the next creative.

---

## Preview

Click **Preview** to see a realistic mockup of how your ad will look in the Facebook Feed on a phone screen.

The preview shows the Facebook card with your page name, primary text, the image or video, the link card with headline and CTA button, and placeholder reaction counts. Below the phone, a spec bar shows character counts for primary text, headline, and description — they turn red if you're over the recommended limits.

---

## Duplicate

The **Duplicate** button copies the currently selected creative — same image, same copy — with "(copy)" appended to the filename. This is useful when you want to test a minor copy variation without starting from scratch.

---

## Total Ads

Each creative is paired with each ad set. So if you have 2 ad sets and 3 creatives, you'll get 6 ads total. The running count is shown in the summary panel on the right.

---

## Launch

Once all your creatives have copy, click **Launch Ads** at the bottom.

The app sends everything to the Facebook Marketing API: creates the campaign, each ad set, the ad creative objects, and the individual ads. You'll see a spinner while this happens — it can take 10–30 seconds depending on how many ads are being created.

If anything goes wrong, an error banner appears at the top of the page explaining what failed.

When it succeeds, you'll see a confirmation and can navigate to the **Campaign Manager** tab to see your new campaign live in Meta.
