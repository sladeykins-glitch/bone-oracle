# Activate the Version 3 Worker

The GitHub Pages release and the Cloudflare deployment are separate. The upgraded website remains compatible with the current Worker. The steps here require access to your existing Cloudflare account; they were prepared, not performed, as part of the GitHub release.

For deployment through GitHub without signing in through the shared browser, follow [GITHUB_DEPLOY.md](./GITHUB_DEPLOY.md). That manual workflow can provision Turnstile and deploy all Worker protections together after the restricted account token and account ID are entered privately into GitHub Actions secrets. No token belongs in chat or source code.

## 1. Preserve the working service

Open the existing **bone-oracle-ai** Worker. Keep its current deployed version available for rollback, retain the `GEMINI_API_KEY` secret, and note its working `GEMINI_MODEL` setting. No new Gemini key is needed. Do not paste a key into chat, the website, GitHub or a command-line argument.

The allowed origin is `https://sladeykins-glitch.github.io` (an origin has no `/bone-oracle/` path). Preserve a different allowed origin if you deliberately host elsewhere.

## 2. Deploy the bundle and rate-limiter bindings together

The recommended route is Wrangler 4.36.0 or newer from this repository:

```sh
npm run build:worker
npx wrangler login
npx wrangler deploy
```

Before deployment, check `wrangler.jsonc` against the existing service. It targets `bone-oracle-ai` and sets `keep_vars: true` so existing dashboard variables, including your working `GEMINI_MODEL` and public Turnstile key, are retained. Secrets are also retained. The bundled code uses the model default from the inspected repository only when no allowed model is configured.

The config includes these rate-limit bindings:

| Binding | Namespace | Limit | Window |
| --- | --- | --- | --- |
| `RATE_LIMITER` | `3001` | 6 calls per IP | 60 seconds |
| `AGGREGATE_LIMITER` | `3002` | 30 calls in a Cloudflare location | 60 seconds |

Namespace numbers are account-scoped, user-chosen identifiers. If another Worker already uses either namespace, choose unused positive numbers. Limits are local to a Cloudflare location; they do not promise an exact global allowance or budget cap. The IP limit is intentionally conservative for this anonymous personal site and can affect people sharing a network.

You can also paste the complete `cloudflare-worker.js` into the dashboard editor, but ensure `RATE_LIMITER` is provisioned before switching traffic. Use Wrangler/API binding configuration if the dashboard does not offer that binding. Without the binding the new code returns 503 and the website displays its offline reading; it never silently reverts to the old in-memory throttle.

Reference: [Cloudflare rate-limiting bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

## 3. Enable Turnstile for the public endpoint

Create a Turnstile widget in Cloudflare for the hostname `sladeykins-glitch.github.io`. Configure the existing Worker with:

| Setting | Type | Value |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | Text variable | The widget’s public site key |
| `TURNSTILE_SECRET_KEY` | Secret | The widget’s secret key |
| `GEMINI_API_KEY` | Existing secret | Keep the working Gemini key |
| `ALLOWED_ORIGIN` | Text variable | `https://sladeykins-glitch.github.io` |
| `GEMINI_MODEL` | Text variable | Your currently working allowed model |

Deploy these settings. The website reads `/config` and shows verification only when the Worker requires it. Each AI request sends a fresh token. The Worker verifies it with Cloudflare and checks both hostname and the action `bone-reading` before contacting Gemini. Invalid, expired or duplicate tokens do not authorize a prophecy. Keep Turnstile secret; its public site key is designed to be visible.

Reference: [Cloudflare server-side Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## 4. Verify and retain rollback

Open the website, enable Gemini in Settings, and cast a question with story context. Confirm the offline reading appears first, followed by an animated Gemini reading saved to the same journal entry. If Turnstile is enabled, verify the challenge appears and succeeds. Move a bone and confirm the local reading updates; request AI again when ready. Test one quota/rate-limited failure using your staging setup and confirm the offline result remains readable.

Keep conservative Google API project quotas. The Worker caps incoming bytes, question/context length, bone counts, geometry, generation tokens and request duration, but these are not a billing budget. Changing project quotas requires Google account access.

A successful deployment should retain the existing Worker URL. If you intentionally change it, update the site’s **Settings → Secure AI Endpoint**; that URL is a public address, not a secret. If a test environment receives Cloudflare 403/1010 before the application answers, test in your normal browser and review your Cloudflare access/bot policy separately; do not weaken it automatically.

Use Cloudflare’s retained previous Worker deployment to roll back the backend if needed. The v3 frontend can continue using that old POST-only Worker. GitHub Pages rollback is independent: revert the Version 3 Git commit to restore the previous frontend.
