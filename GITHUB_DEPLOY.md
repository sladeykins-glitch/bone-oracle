# Deploy V3 from GitHub

Use this route if you can sign in to Cloudflare through Google in your normal browser but the shared browser cannot complete that sign-in. No passwords or API tokens need to be sent through chat. The GitHub workflow is prepared; adding it to the repository does **not** deploy or change the current Worker.

## 1. Create a restricted Cloudflare API token

Sign in to your own Cloudflare dashboard with **Continue with Google**. Create a custom API token named **Bone Oracle GitHub deployment** with these account permissions:

| Permission | Access |
| --- | --- |
| Workers Scripts | Edit (API: Workers Scripts Write) |
| Turnstile | Edit (API: Turnstile Sites Write) |

Scope the token to the **specific account containing `bone-oracle-ai`**. The script does not need zone, DNS, billing, or general account administration permissions. Give the token an expiry appropriate for this deployment; you can revoke it after the release if you do not want future GitHub deployments.

Copy your Cloudflare **Account ID** from that account's dashboard. This is an account identifier, not your email address, Worker name, or Gemini key.

References: [Cloudflare GitHub authentication](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [Turnstile API permissions](https://developers.cloudflare.com/turnstile/get-started/widget-management/api/).

## 2. Add two private GitHub repository secrets

Open [this repository's Actions secrets](https://github.com/sladeykins-glitch/bone-oracle/settings/secrets/actions), or go to **Settings → Secrets and variables → Actions → New repository secret**.

| Secret name | Secret value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | The restricted token created above |
| `CLOUDFLARE_ACCOUNT_ID` | The account ID containing the existing Worker |

Enter the values directly into GitHub's secret fields. Do not put them in a repository file, issue, workflow input, screenshot, or chat. The existing `GEMINI_API_KEY` stays in Cloudflare and is not needed in GitHub.

## 3. Run the prepared deployment

Open **Actions → Deploy Cloudflare Worker → Run workflow**, select **main**, and run it. The workflow only accepts the original repository's main branch and runs the tests before receiving deployment credentials.

It then:

1. Checks that the existing `bone-oracle-ai` Worker has its Gemini secret and the expected website origin.
2. Creates **Bone Oracle - GitHub Pages**, restricted to `sladeykins-glitch.github.io`, or reuses that exact widget on later runs. It also reuses a correctly configured widget already attached to the Worker. It does not rotate keys or modify other widgets.
3. Uploads the tested V3 bundle, both rate-limit bindings, the public site key and the private Turnstile secret in **one Worker update**. Existing Gemini secrets and model variables are preserved.
4. Checks the public `/config` response for V3, rate-limit readiness and required Turnstile verification.

The script uses the namespaces and limits in `wrangler.jsonc`. Check the namespace numbers against any other rate-limit bindings in your Cloudflare account before running, as described in [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md). If preflight finds extra Worker resources, an unexpected origin or an ambiguous widget, it stops for review instead of replacing that configuration. Token values, Turnstile secrets and raw Cloudflare API responses are not printed or saved as artifacts.

## 4. Confirm the live reading

After a successful run, open [Bone Oracle](https://sladeykins-glitch.github.io/bone-oracle/), cast a question, complete the normal Turnstile verification if shown, and confirm that Gemini replaces the offline reading and saves the same journal entry. The workflow checks deployment configuration; it does not solve a challenge or claim to have tested a live Gemini response.

If the workflow says the upload succeeded but public verification failed, inspect the website and the Cloudflare deployment before rerunning it. Keep the previous Cloudflare Worker version available for rollback. The website's offline reading and journal remain available if AI verification or quota fails.
