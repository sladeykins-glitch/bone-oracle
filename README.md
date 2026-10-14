# The Bone Oracle

An interactive browser-based bone casting website based on the user's Astragalomancy rules.

## Play
The website is meant to be hosted at https://sladeykins-glitch.github.io/bone-oracle/ once GitHub Pages is enabled.

Cast 2–6 bones, see them tumble, collide, and settle on the six-realm mat, then receive an offline reading based on intensity, realm, grouping, touching, and isolation.

## Enable GitHub Pages
1. In this repository, open **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose **main** and **/(root)**, then **Save**.
4. Wait for GitHub's deployment and use the URL above.

## Optional Gemini integration
GitHub Pages cannot run a private API gateway. Never put a Gemini API key in this repository or in browser JavaScript.

To enable Gemini, deploy a separate server-side endpoint (for example, a Cloudflare Worker) that:
- reads the Gemini API key from a server-side secret;
- accepts POST casting JSON and forwards the validated data to Gemini;
- returns JSON in the form `{"reading":"..."}`;
- permits CORS only for the GitHub Pages origin;
- uses request validation, rate limiting, and other appropriate safeguards.

Enter that endpoint's HTTPS URL in the **Secure AI Endpoint** field on the site. Without an endpoint, the local offline interpreter works normally. The original Vercel serverless handler is **not** compatible with GitHub Pages alone.

## Notes
This is an interpretive physical simulation. Realm assignment comes from each bone's simulated final position, not a separate d6. Divination readings are narrative fiction, not predictions.
