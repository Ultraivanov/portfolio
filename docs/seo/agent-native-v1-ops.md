# Agent-Native SEO v1 Ops

## Scope
- No page-content rewrite (`TL;DR`, `FAQ`) in this wave.
- Technical SEO and crawler policy only.

## Crawler policy
- Search bots allowed: `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`.
- User-triggered fetch bots allowed: `ChatGPT-User`, `Claude-User`.
- Training bots policy (current): `GPTBot`, `ClaudeBot` allowed.
- Technical paths blocked for all bots: `/admin`, `/admin/*`, `/perf-test`.

## Release checklist
1. Deploy to production.
2. Verify:
   - `https://ginzburg.work/robots.txt` returns 200.
   - `https://ginzburg.work/sitemap.xml` returns 200.
   - `https://www.ginzburg.work/` returns 301 to `https://ginzburg.work/`.
3. Submit sitemap in:
   - Google Search Console
   - Bing Webmaster Tools
4. Request recrawl for:
   - `/`
   - `/work`
   - top 3 case URLs

## Weekly loop
1. Check GSC:
   - Index coverage errors
   - Canonical conflicts
   - Impressions/clicks for `/`, `/work`, case pages
2. Check Bing Webmaster:
   - Crawl/index issues
   - Sitemap freshness
3. Check AI referral traffic in GA4:
   - `chatgpt.com`
   - `perplexity.ai`
   - `claude.ai`
4. Revalidate robots/sitemap endpoints after each production deploy.

## Rollback note
- If training reuse must be blocked, set `GPTBot` and `ClaudeBot` to `Disallow: /` in `src/app/robots.ts` and redeploy.
