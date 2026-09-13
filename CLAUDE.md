# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single static landing page (pre-launch waitlist) for Buceo Ría, a diving center in the Ría de Vigo / Islas Cíes, Spain. No build step, no package manager, no framework — plain HTML/CSS/JS served as-is.

## Running locally

There is no dev server or build command. Open `index.html` directly in a browser, or serve the directory with any static file server (e.g. `python -m http.server` or VS Code Live Server) so relative paths resolve correctly.

There is no linter, formatter, or test suite configured.

## Structure

- `index.html` — the single-page landing (nav, hero, actividades, certificados, valores, equipo, CTA form, footer).
- `aviso-legal.html` — standalone legal/privacy notice page, `noindex`. Shares `css/styles.css`, `js/i18n.js`, `js/nav.js`, and the same nav/footer markup as `index.html` (the markup itself is kept in sync manually, not templated — see "Nav/footer parity" below).
- `css/styles.css` — one stylesheet for both pages, organized in commented sections (`/* ─── NAV ─── */`, `/* ─── HERO ─── */`, etc.) that map 1:1 to the sections in the HTML.
- `js/i18n.js` — translation dictionary (`es`/`gl`/`en`) and the `applyLang()` engine; also owns the language-dropdown UI (nav + footer).
- `js/nav.js` — the nav scroll-shadow effect (`.nav--scrolled` toggle on `window.scroll`). Shared by both pages. Kept separate from `main.js` specifically so `aviso-legal.html` can use it without pulling in the waitlist-form code (which assumes form elements that only exist on `index.html` and would throw if loaded where they don't exist).
- `js/main.js` — waitlist form handling only (validation, submit, feedback messages). Loaded by `index.html` only.
- `js/hero-test.js` + the `.hero-test-nav` block at the top of `index.html`'s `<body>` — **temporary** A/B-test harness for picking the hero background (see "Hero image A/B test" below). Not present on `aviso-legal.html`.
- `assets/images/` — logo and photos.
- `assets/images/hero_image.jpg`, `hero_image2.jpg`, `hero_image3.jpg`, `hero_video.mp4` — the four hero background candidates used by the A/B test harness.
- `assets/images/og-image.jpg` — the Open Graph / Twitter Card share image (1200×630), generated from a crop of `hero_image2.jpg`. Regenerate at 1200×630 and re-optimize (`quality≈80`, keep well under 1MB) if the source photo changes.
- `favicon.ico` (repo root) + `assets/images/favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` — generated from `Logo_splash.webp` (cropped tight to the non-transparent splash shape). At 16×16 the logo reads as little more than a pink blob since it has no simplified icon-only mark — a proper single-glyph icon would favicon better if one is ever produced.
- `assets/images/logos/` — certifying-body / partner logos shown in the `#certificados` carousel (PADI, Observadores del Mar, PEJCONA, REEDUCAMAR, Alen Formación, Turislab, etc.). Filenames contain spaces and are referenced with `%20` escapes in `index.html`.
- `robots.txt`, `sitemap.xml` — reference `https://www.buceoriavigo.com`.

## Nav/footer parity between pages

`aviso-legal.html`'s nav and footer are hand-copied from `index.html`, not templated — every nav/footer change made on one page must be manually re-applied to the other or they drift (this has already happened once: the CTA button text and the nav scroll-shadow behavior both went stale on `aviso-legal.html`). The two intentional, permanent differences are: the nav logo links to `index.html` (not `#`) and the nav CTA points to `index.html#cta` (not `#cta`). Everything else — including `data-i18n` attributes on the CTA/footer links — should match `index.html` exactly.

## Hero image A/B test (temporary)

`index.html` currently has a floating pill nav (`.hero-test-nav`, buttons 1–4) wired up by `js/hero-test.js` to swap `#hero`'s background live: 1/2/3 swap `.hero-bg-img`'s `background-image` between `hero_image.jpg` / `hero_image2.jpg` / `hero_image3.jpg`; 4 shows a looping muted `<video>` of `hero_video.mp4` instead. This is a temporary decision-making tool, not a feature — once a final hero background is chosen, remove the `.hero-test-nav` block from `index.html`, delete `js/hero-test.js` and its `<script>` tag, remove the `.hero-test-nav`/`.hero-bg-video` CSS rules, and hardcode the winning image (or swap `.hero-bg-img` for a `<video>`, if the video wins) directly.

## i18n architecture

Translations are **not** loaded from JSON — `js/i18n.js` hardcodes the `translations` object inline (es/gl/en) and `applyLang(lang)` walks the DOM applying it via three data attributes:

- `data-i18n="key"` → sets `textContent`
- `data-i18n-html="key"` → sets `innerHTML` (used where a translation embeds `<em>`/`<strong>`/`<br>`)
- `data-i18n-placeholder="key"` → sets `placeholder`

Language choice persists via `localStorage['lang']` and defaults to `es`. `aviso-legal.html` does not carry `data-i18n` attributes — its legal copy is Spanish-only.

**When adding or changing copy**: update the string in all three locales inside `translations` in `js/i18n.js`, and keep the hardcoded Spanish fallback text in `index.html`'s markup in sync (it's what renders before JS runs / if JS fails).

`texto_landing_es.json` at the repo root is a tracked-but-unreferenced export of the `es` strings only — nothing in the code reads it, and it has been allowed to drift out of sync with `js/i18n.js` (also contains a pre-existing invalid-JSON syntax error in the `lopd` string, left unfixed since the file is dead). Treat `js/i18n.js` as the single source of truth for copy; don't add a fetch of this JSON without removing the duplication it would create. It's excluded from the Vercel deployment via `.vercelignore` (see Deployment/security below) but stays in the git repo since the user asked to leave it as-is.

## Form submission

The waitlist form in `js/main.js` POSTs JSON (`nombre`, `email`, `mensaje`, `newsletter`) to `WEBHOOK_URL`, a Make.com (Integromat) webhook. The placeholder value `'REEMPLAZA_CON_TU_URL_DE_MAKE'` must be replaced with the real webhook URL before the form works in production — check this is set before treating form-related work as done.

**When the real webhook URL is set**, also update the `connect-src` directive in `vercel.json`'s CSP (currently `'self' https://*.make.com'`) if the webhook doesn't live on a `*.make.com` host — otherwise the browser will silently block the `fetch()` call and the form will look broken with no console-visible cause beyond a CSP violation.

## Deployment & security headers

Deployed on Vercel (`https://buceo-ria-landing.vercel.app`, tracks the `main` branch) as a plain static site — no build step, so every file tracked in git is served as-is unless excluded.

**`www.buceoriavigo.com` is not yet connected to this Vercel deployment** (checked 2026-09-13): the domain currently serves an old WordPress "under construction" placeholder (lighthouse theme, "Muy pronto disponible"), unrelated to this repo. Until DNS/domain is pointed at Vercel, testing must use the `buceo-ria-landing.vercel.app` URL directly — anything that hardcodes the `www.buceoriavigo.com` absolute URL (canonical link, `og:url`, sitemap) will not resolve to this site in the meantime. `og:image`/`twitter:image` in `index.html` are temporarily pointed at the `vercel.app` absolute URL instead (marked `TEMPORAL` in an HTML comment right above each) specifically so link-preview crawlers can find the share image while testing with the vercel.app URL — switch both back to `https://www.buceoriavigo.com/assets/images/og-image.jpg` once the custom domain is live.

- `.vercelignore` excludes `CLAUDE.md` and `texto_landing_es.json` from the deployment — both are dev-only files that were previously publicly served (confirmed via direct `curl` to the live URL) and leaked internal maintenance notes. Add any other internal-only file here rather than relying on it just being "unreferenced."
- `vercel.json` sets response headers on every route: `X-Frame-Options: DENY` and a CSP `frame-ancestors 'none'` (clickjacking protection — the site has a data-collecting form and previously had no framing protection at all), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (locks down camera/mic/geolocation, unused by the site), and a `Content-Security-Policy` scoped to what the site actually loads (`self` scripts/styles, Google Fonts, and `*.make.com` for the waitlist webhook). If you add a new external resource (another CDN, an analytics/GA snippet, an embed), it needs a matching CSP allowance in `vercel.json` or it will be silently blocked in production while working fine locally (there's no CSP enforcement when opening `index.html` directly or via a plain static server).

## Layout width

Every `<section>` except `#hero` owns full-bleed background color/padding, but its actual content (label/title/intro/grid) is wrapped in a `.section-inner` div (`max-width: 1200px; margin: 0 auto;`, defined in the "SECTIONS COMMON" CSS block) so content doesn't stretch edge-to-edge on wide viewports. `#cta` uses its own pre-existing `.cta-inner` (max-width 600px, centered, text-centered) instead — don't wrap it in `.section-inner` too. `#hero` is intentionally full-bleed (its background layers are `position: absolute; inset: 0` on the section itself) and constrains only `.hero-content` (780px). When adding a new section, follow the same pattern: full-width `<section>` + a `.section-inner` (or purpose-built inner div) wrapping its actual content.

## Editorial/config notes visible in the markup

- The hero tag (`.hero-tag`, `data-i18n="hero.tag"`) is intentionally hidden via inline `style="visibility: hidden;"` — there's an HTML comment noting it's temporarily disabled and how to re-enable it (remove that inline style).
- Social links (Instagram/Facebook/YouTube) in the hero and footer are currently placeholder URLs (`https://instagram.com`, etc.), not the center's real profiles.
- The nav logo (`.nav-logo img`, `assets/images/Logo_splash.webp`) has a transparent-background PNG-style silhouette (an irregular paint-stroke shape), not a rectangle. Its white outline is done with a stack of 8 `drop-shadow()` filters (not `border`/`background`) so the outline follows the actual silhouette instead of boxing the image.
- The `#certificados` logo carousel (`.certs-track`) is a CSS-only infinite marquee: the list of logo `<img>`s is duplicated once in the markup and the track animates `translateX(0)` → `translateX(-50%)` on a loop, which is only seamless because the duplicate set is byte-for-byte identical to the first — if you add/remove a logo, update both copies. `.certs-carousel` fades the edges via `mask-image`, and the animation pauses on `:hover`.
