# Agent-Native SEO v1 Ops

## Scope
- No page-content rewrite (`TL;DR`, `FAQ`) in this wave.
- Technical SEO and crawler policy only.

## Crawler policy
- Search bots allowed: `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`.
- User-triggered fetch bots allowed: `ChatGPT-User`, `Claude-User`.
- Training bots policy (current): `GPTBot`, `ClaudeBot` blocked with `Disallow: /`.
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
4. Verify GitHub Action `Agent-Native SEO Check`:
   - weekly run status is green
   - no regressions in `robots/sitemap/canonical/schema` checks
5. Revalidate robots/sitemap endpoints after each production deploy.

## Automation
- Workflow file: `.github/workflows/agent-native-seo-check.yml`
- Trigger modes:
  - schedule: every Monday at 06:00 UTC
  - manual: `workflow_dispatch`
- Optional repo variables:
  - `SEO_BASE_URL` (default `https://ginzburg.work`)
  - `SEO_WWW_URL` (default `https://www.ginzburg.work`)

## Rollback note
- If training reuse must be allowed again, set `GPTBot` and `ClaudeBot` back to `Allow: /` plus technical-path disallow list in `src/app/robots.ts`, then redeploy.
