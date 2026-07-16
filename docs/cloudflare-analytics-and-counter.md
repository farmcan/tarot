# Cloudflare Analytics and Public Counter

Date: 2026-07-16

MiaoTarot uses two Cloudflare features for two different jobs:

- Cloudflare Web Analytics: private operational analytics for page views, visitors, referrers, countries, and trends.
- Cloudflare D1: a permanent all-time counter that can be displayed publicly and does not disappear after the Web Analytics retention window.

## Public Counter Behavior

The public label reads `已有 N 次猫猫围观` in the site footer.

- A browser contributes at most once every 24 hours, enforced by an HttpOnly, SameSite cookie.
- Known crawler user agents do not increment the counter.
- Cross-site POST requests are rejected.
- The D1 increment is one atomic SQLite upsert, so concurrent visits do not use the lossy KV read-then-write pattern.
- `GET /api/site-counter` reads the public count without incrementing it.
- `POST /api/site-counter` increments when eligible and returns the current count.
- If D1 is missing or unavailable, the UI hides the label and the Tarot experience continues normally.

The number is a lightweight 24-hour deduplicated visit count, not a verified human identity count. Clearing cookies, changing browsers, and private browsing can contribute another visit.

## Cloudflare Setup

Authenticate Wrangler first:

```bash
npx wrangler login
```

Create an Asia-Pacific D1 database and let Wrangler add the binding to `wrangler.jsonc`:

```bash
npm run counter:db:create
```

The resulting binding must be named `MIAOTAROT_DB`. Apply the tracked migration remotely:

```bash
npm run counter:db:migrate
```

Then deploy the Pages project:

```bash
npm run deploy
```

Verify the deployed endpoint twice. The second request should preserve the same count when the cookie jar is reused:

```bash
curl -i -c /tmp/miaotarot-counter-cookie -X POST https://YOUR_DOMAIN/api/site-counter
curl -i -b /tmp/miaotarot-counter-cookie -X POST https://YOUR_DOMAIN/api/site-counter
curl -s https://YOUR_DOMAIN/api/site-counter
```

## Web Analytics Setup

For the private analytics dashboard, Cloudflare Pages supports one-click Web Analytics:

1. Open Cloudflare Dashboard -> Workers & Pages -> `tarot`.
2. Open Metrics.
3. Select Enable under Web Analytics.
4. Redeploy the project so Cloudflare injects the official beacon.

The public D1 count remains the long-lived source of truth even when Web Analytics only retains a recent window.

## Local Tests

The counter behavior test does not need Cloudflare credentials:

```bash
npm run test:counter
```

After the real D1 binding has been added to `wrangler.jsonc`, apply the migration to Wrangler's local D1 storage and use Pages Dev:

```bash
npm run counter:db:migrate:local
npm run pages:dev
```
