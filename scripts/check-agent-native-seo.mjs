const BASE_URL = process.env.SEO_BASE_URL ?? "https://ginzburg.work";
const WWW_URL = process.env.SEO_WWW_URL ?? "https://www.ginzburg.work";

const SEARCH_BOTS = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"];
const USER_FETCH_BOTS = ["ChatGPT-User", "Claude-User"];
const TRAINING_BOTS = ["GPTBot", "ClaudeBot"];
const DISALLOWED_PATHS = ["/admin", "/admin/*", "/perf-test"];

const checks = [];

const normalizeBase = (url) => url.replace(/\/+$/, "");

const base = normalizeBase(BASE_URL);
const www = normalizeBase(WWW_URL);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function get(url, init = {}) {
  const response = await fetch(url, { redirect: "manual", ...init });
  const text = await response.text();
  return { response, text };
}

function hasMeta(html, name, value) {
  const pattern = new RegExp(
    `<meta\\s+name=["']${name}["']\\s+content=["']${value}["']\\s*/?>`,
    "i",
  );
  return pattern.test(html);
}

function hasCanonical(html, expectedUrl) {
  const variants = new Set([expectedUrl, expectedUrl.replace(/\/+$/, ""), `${expectedUrl.replace(/\/+$/, "")}/`]);
  return [...variants].some((url) => {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `<link\\s+rel=["']canonical["']\\s+href=["']${escaped}["']\\s*/?>`,
      "i",
    );
    return pattern.test(html);
  });
}

function countJsonLd(html) {
  const matches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi);
  return matches?.length ?? 0;
}

async function run() {
  const robotsUrl = `${base}/robots.txt`;
  const sitemapUrl = `${base}/sitemap.xml`;
  const homeUrl = `${base}/`;
  const workUrl = `${base}/work`;
  const caseUrl = `${base}/work/design-system-runtime`;
  const perfTestUrl = `${base}/perf-test`;
  const wwwRedirectUrl = `${www}/work?utm=agent-native-check`;

  const robots = await get(robotsUrl);
  assert(robots.response.status === 200, `robots.txt must return 200, got ${robots.response.status}`);
  assert(robots.text.includes(`Sitemap: ${sitemapUrl}`), "robots.txt must reference sitemap.xml");
  DISALLOWED_PATHS.forEach((path) => {
    assert(robots.text.includes(`Disallow: ${path}`), `robots.txt missing Disallow for ${path}`);
  });
  [...SEARCH_BOTS, ...USER_FETCH_BOTS, ...TRAINING_BOTS].forEach((bot) => {
    assert(robots.text.includes(`User-Agent: ${bot}`), `robots.txt missing rule for ${bot}`);
  });
  checks.push("robots.txt policy");

  const sitemap = await get(sitemapUrl);
  assert(sitemap.response.status === 200, `sitemap.xml must return 200, got ${sitemap.response.status}`);
  [base, `${base}/work`, `${base}/contact`].forEach((url) => {
    assert(sitemap.text.includes(`<loc>${url}</loc>`), `sitemap.xml missing ${url}`);
  });
  checks.push("sitemap.xml availability");

  const wwwRedirect = await get(wwwRedirectUrl);
  assert(
    wwwRedirect.response.status === 301 || wwwRedirect.response.status === 308,
    `www redirect must be 301/308, got ${wwwRedirect.response.status}`,
  );
  const redirectLocation = wwwRedirect.response.headers.get("location");
  assert(
    redirectLocation === `${base}/work?utm=agent-native-check`,
    `www redirect location mismatch: ${redirectLocation}`,
  );
  checks.push("www to apex redirect");

  const home = await get(homeUrl);
  assert(home.response.status === 200, `home must return 200, got ${home.response.status}`);
  assert(hasCanonical(home.text, `${base}/`), "home canonical missing or incorrect");
  assert(hasMeta(home.text, "robots", "index, follow"), "home robots meta missing");
  assert(countJsonLd(home.text) >= 2, "home must include at least 2 JSON-LD blocks");
  checks.push("home metadata and schema");

  const work = await get(workUrl);
  assert(work.response.status === 200, `work must return 200, got ${work.response.status}`);
  assert(hasCanonical(work.text, `${base}/work`), "work canonical missing or incorrect");
  assert(hasMeta(work.text, "robots", "index, follow"), "work robots meta missing");
  assert(countJsonLd(work.text) >= 1, "work page must include JSON-LD");
  checks.push("work metadata and schema");

  const casePage = await get(caseUrl);
  assert(casePage.response.status === 200, `case page must return 200, got ${casePage.response.status}`);
  assert(hasCanonical(casePage.text, caseUrl), "case canonical missing or incorrect");
  assert(hasMeta(casePage.text, "robots", "index, follow"), "case robots meta missing");
  assert(casePage.text.includes(`${base}/cases/design-system-runtime/cover.png`), "case social image missing");
  assert(countJsonLd(casePage.text) >= 1, "case page must include JSON-LD");
  checks.push("case metadata and schema");

  const perf = await get(perfTestUrl);
  assert(perf.response.status === 200, `perf-test must return 200, got ${perf.response.status}`);
  assert(hasMeta(perf.text, "robots", "noindex, nofollow"), "perf-test must be noindex,nofollow");
  checks.push("technical page noindex");

  console.log("Agent-native SEO checks passed:");
  checks.forEach((check, index) => {
    console.log(`${index + 1}. ${check}`);
  });
}

run().catch((error) => {
  console.error(`Agent-native SEO check failed: ${error.message}`);
  process.exit(1);
});
