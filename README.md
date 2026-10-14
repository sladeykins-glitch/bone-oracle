# The Bone Oracle · Version 3

**Public website:** https://sladeykins-glitch.github.io/bone-oracle/

A physical Astragalomancy caster with six realistic bone specimens, six casting realms, Gemini prophecies and a browser-local journal. GitHub Pages hosts the website; the Gemini key stays in a separate Cloudflare Worker.

## What changed in Version 3

- Six transparent specimen sprites: Raven’s Talon (d4), Wolf Fang (d6), Serpent Vertebra (d8), Deer Rib (d10), Owl Skull Shard (d12), and Ancestor’s Jawbone (d20).
- Collision hulls sampled from the artwork; different masses, angular impulses, cloth friction, airborne bounce and tumbling. Fixed simulation steps prevent frame-rate-dependent changes. The static mat is cached and the renderer sleeps when idle.
- A black-crystal outcome window: softly glowing words rise through drifting mist, then settle beneath the glass. Version 3.1 adds **Replay reveal**, **Enlarge crystal**, **Reveal all**, and reduced-motion support for both offline and Gemini outcomes. The full interpretation stays readable below; the effect does not change a cast, its meaning, or the saved journal. Failed or stale AI replies cannot replace a newer cast.
- Optional story context, closest-to-centre influence, relative intensity, geometric contact, ancestral links, Raven pointing, realm concentration, isolation, and approximate path/circle/cross readings.
- An automatic journal of up to 100 casts on the current device, with exact placement, notes, favourites, search, restore, deletion undo and JSON export/import. AI updates the same entry. Imports are validated and all content is rendered as text.
- Responsive controls, larger touch targets, a scrollable mobile cloth until **Move bones** is enabled, and keyboard/realm/rotation placement controls.
- A service worker caches the site shell and artwork after a successful online visit. AI requests, questions and API responses are never cached. The journal is local to the browser; export it before clearing browser data or changing device.

## Rules preserved

The six bone definitions and 36 realm meanings are retained from the inspected site and checked against the original Astragalomancy reference. Random mode rolls a d6 for every specimen selection and permits repeated bones; every occurrence has its own identity and corresponding intensity die. Two to six bones are cast. Manual mode now casts each selected bone once, matching the reference’s instruction to choose relevant bones.

**Physical placement determines the realm:** centre = Present, left = Past, top = Spirits, right = Future, bottom = Flesh, beyond the realm ring = Hidden. There is no independent positioning d6 in this physical mode. Realm boundaries are unchanged. Higher relative intensity carries more emphasis; proximity and pattern add positional meaning without changing the die roll. Formation detection and collision hulls are geometric approximations. Readings remain fictional narrative divination.

## Hosting and compatibility

GitHub Pages remains configured for `main` → `/(root)`. Publishing the frontend does **not** deploy the Cloudflare Worker. The frontend preserves the existing `boneOracleAiEndpoint` setting and defaults to `https://bone-oracle-ai.sladeykins.workers.dev`.

The frontend works with the previous POST-only Worker. It first tries the optional `/config` endpoint; an old Worker’s refusal falls back to the existing POST flow. Deeper AI context and the server protections below require deploying the v3 Worker. The offline Oracle and journal work with either version.

## Cloudflare changes requiring separate access

Use the prepared **Actions → Deploy Cloudflare Worker** workflow once the private Cloudflare account ID and restricted API token are saved in GitHub Actions secrets. The workflow tests first, creates or reuses the website’s Turnstile widget, and applies the V3 code and protections in one upload while retaining the existing Gemini secret. It only runs when manually dispatched on the original repository’s main branch. See [GITHUB_DEPLOY.md](./GITHUB_DEPLOY.md) for the exact setup; [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) also covers direct Cloudflare deployment.

`cloudflare-worker.js` is a self-contained bundle that can be pasted into the Cloudflare editor or deployed with Wrangler. It includes the exact tested casting rules so the server recomputes v3 realms, contacts, pointing and formations from validated coordinates. It also supports legacy cast payloads.

Required for the v3 Worker:

1. Deploy the updated Worker into the existing `bone-oracle-ai` service.
2. Preserve the existing **secret** `GEMINI_API_KEY` and currently working model.
3. Add the `RATE_LIMITER` binding. The included Wrangler config sets six requests per minute per IP and an `AGGREGATE_LIMITER` binding at 30 per minute per Cloudflare location.
4. For public bot protection, create a Turnstile widget for `sladeykins-glitch.github.io`, add its public key as `TURNSTILE_SITE_KEY`, and its secret as `TURNSTILE_SECRET_KEY`. The frontend discovers this automatically; there is no API key field.

The v3 Worker intentionally refuses AI requests if the rate-limit binding is missing or broken. Offline readings remain available. Origin checks are CORS controls, not authentication: a non-browser client can spoof an Origin. Cloudflare rate limits are location-scoped and approximate, not an absolute global spend cap. Keep conservative project quotas in Google and enable Turnstile for a public endpoint. Nothing in GitHub deploys or changes the existing Cloudflare account automatically.

## Development and validation

Node 22 or newer:

```sh
npm ci --ignore-scripts
npm run build:worker
npm test
```

There is no frontend build step. The generated Worker combines `core.js` with `worker-handler.js`; its consistency is checked by the test command. Edit those sources and regenerate the bundle when changing backend or rule logic.

The 57 automated checks pass, covering the rules, 200 seeded physical casts, artwork geometry, journal persistence/imports, frontend interactions, legacy/new Worker compatibility, cancelled/stale requests, safe text rendering, API byte limits, rate limiting, Turnstile validation, upstream errors, and offline caching. The actual WebP artwork and desktop layout were inspected on the public GitHub Pages release. Live browser verification confirmed a complete six-bone cast, a Gemini response through the existing Worker, automatic saving of that response, notes and favourites surviving a reload, field restoration, realm placement, and keyboard movement updating the offline reading. The deployed HTML matches the V3 commit, and the GitHub Pages build succeeded. Mobile interaction logic is covered by the automated coarse-pointer checks; physical phone/tablet layout and touch testing remain unverified. Worker security and deployment tests use synthetic keys and mocked upstream services: the new V3 Worker protections and richer AI context remain prepared for separate Cloudflare deployment, not active on the existing Worker.

All generated sprites are project assets in `assets/`; the generation brief is recorded in [assets/ARTWORK.md](./assets/ARTWORK.md). No real credentials are stored in this repository.
