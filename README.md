# The Bone Oracle

Public interactive bone-casting site based on the Astragalomancy system. The physical simulation and offline interpretation run entirely in the browser.

**Website (after Pages deployment):** https://sladeykins-glitch.github.io/bone-oracle/

## GitHub Pages
Repository → Settings → Pages → Deploy from a branch → `main` → `/(root)` → Save.

## Free-tier Gemini AI through Cloudflare Workers

The repository contains **cloudflare-worker.js**. The Worker is not deployed automatically through GitHub Pages.

1. Sign up for Cloudflare at https://dash.cloudflare.com/.
2. Open **Workers & Pages → Create → Worker** (the labels may vary), choose a unique Worker name and deploy the starter Worker.
3. Open the Worker’s editor, replace the starter code with the contents of [cloudflare-worker.js](./cloudflare-worker.js), then deploy.
4. Open **Worker Settings → Variables and Secrets**. Add a **secret** named `GEMINI_API_KEY` with your key from https://aistudio.google.com/apikey. Never add the secret to GitHub or browser JavaScript.
5. In the same section, optionally add a **text variable** `GEMINI_MODEL` set to `gemini-2.5-flash`. The Worker defaults to this model. Availability of free Gemini calls depends on your Google API project's current free quota.
6. Copy your Worker's `https://<your-name>.<your-subdomain>.workers.dev` URL. Open the GitHub Pages site and paste that URL into **Secure AI Endpoint**. Enable **Use Gemini AI interpretation** and cast the bones.

The endpoint accepts POST requests, checks the public site's origin, validates casting inputs, applies a best-effort in-memory throttle, and never exposes your Gemini key in responses. **Before sharing widely**, add Cloudflare WAF/rate-limiting (or Turnstile) and set a conservative Gemini quota/budget. Client-side requests are not trustworthy; origin checks and the in-memory throttle alone are not strong abuse prevention.

If Gemini errors or reaches its quota, the offline interpreter remains available. For personal/private tests, do not assume an unconfigured Worker is live.

## Preservation of rules
- Six bones (d4/d6/d8/d10/d12/d20).
- 2–6 selections and intensity rolls.
- The **physical simulation** derives realms from final positions instead of a separate positioning d6.
- Contacts and isolation influence interpretation.
- Readings are fictional narrative divination, not real-world predictions.
