The Meta Pixel is a small piece of tracking code that goes on your website. It tells Meta when someone visits a page, adds something to their cart, or makes a purchase — and that information is what Meta uses to optimise your ads for conversions and build lookalike audiences. Without it, you're limited to optimising for clicks rather than actual business outcomes. This video shows you how to create one, install it, and verify it's working.

To create a Pixel, go to your Meta Business Manager at business.facebook.com. Open Business Settings, go to Data Sources, then Datasets. Click Add and give your Pixel a name — usually your brand or website name. Make sure it's assigned to the correct ad account.

Once created, you'll see the Pixel ID — a long number. Copy this and paste it into the Meta Pixel field in the Workspace Meta Defaults panel of this app. That's all the app needs to link your pixel to your campaigns.

Now you need to install the Pixel code on your website. In the Business Manager, go to Events Manager, select your Pixel, and click Set Up. Meta will offer you a few installation options.

If you're using Shopify, there's a native integration — go to your Shopify settings, click Customer Events or Pixels depending on your version, and connect your Meta Pixel by pasting the Pixel ID. Shopify handles the rest automatically.

If you're using WordPress, the easiest approach is the Meta Pixel for WordPress plugin. Install it, open the settings, and paste your Pixel ID. It will add the base code to every page of your site.

If you're on a custom website or any other platform, choose the manual installation option in Events Manager. Meta will give you a snippet of JavaScript to paste into the head section of your site, just before the closing head tag. This base code fires on every page load.

On top of the base code, you'll want to add standard events for the key actions on your site. The most important ones are PageView which fires automatically with the base code, ViewContent which fires on product pages, AddToCart which fires when someone adds a product to their cart, InitiateCheckout which fires when they start checkout, and Purchase which fires on the order confirmation page. Meta's Events Manager has code snippets for each of these that you or your developer can add to the relevant pages.

Once the Pixel is installed, you need to verify it's firing correctly before you run any ads. The easiest way to do this is the Meta Pixel Helper — it's a free Chrome extension. Install it, then visit your website and open the extension. It will show you which events are firing on each page, what data they're sending, and whether there are any errors.

You can also use the Test Events tool inside Events Manager. Click Test Events, then visit your website and go through the actions — add something to cart, start checkout, make a test purchase if you have a test environment. The events will appear in real time in the Events Manager, confirming the data is coming through.

A common issue is duplicate events — seeing the same event fire twice. This usually happens when both a theme-level integration and a manual code snippet are running at the same time. If you see this, remove one of them.

Another thing worth setting up is Conversions API, which is Meta's server-side tracking. It runs alongside the browser Pixel and improves accuracy by capturing events that might be blocked by ad blockers or browser privacy settings. If you're on Shopify, the Conversions API is included automatically in the native integration. For other platforms, Meta has documentation on how to implement it.

Once your Pixel is verified and events are flowing, go back to the Workspace Meta Defaults panel in this app and confirm your Pixel ID is entered. Your campaigns will then be set up to track conversions automatically, and Meta will be able to optimise your ads based on the results that actually matter to your business.
