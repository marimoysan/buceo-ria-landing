# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single static landing page (pre-launch waitlist) for Buceo Ría, a diving center in the Ría de Vigo / Islas Cíes, Spain. **The brand name is "Buceo Ría"** (at most "Buceo Ría - Vigo"), never "Buceo Ría de Vigo". That wrong form appeared in the legal notice, the LOPD form text and the footer © until 2026-11-28. "Ría de Vigo" on its own is a place name and is fine in copy (e.g. "Descubre la Ría de Vigo"). No build step, no package manager, no framework — plain HTML/CSS/JS served as-is.

## Running locally

There is no dev server or build command. Open `index.html` directly in a browser, or serve the directory with any static file server (e.g. `python -m http.server` or VS Code Live Server) so relative paths resolve correctly.

There is no linter, formatter, or test suite configured.

## Structure

- `index.html` — the single-page landing (nav, hero, actividades, certificados, valores, equipo, CTA form, footer).
- `aviso-legal.html` — standalone legal/privacy notice page, `noindex`. Shares `css/styles.css`, `js/i18n.js`, `js/nav.js`, and the same nav/footer markup as `index.html` (the markup itself is kept in sync manually, not templated — see "Nav/footer parity" below).
- `css/styles.css` — one stylesheet for both pages, organized in commented sections (`/* ─── NAV ─── */`, `/* ─── HERO ─── */`, etc.) that map 1:1 to the sections in the HTML.
- `js/i18n.js` — translation dictionary (`es`/`gl`/`en`) and the `applyLang()` engine; also owns the language-dropdown UI (nav + footer).
- `js/nav.js` — the nav scroll-shadow effect (`.nav--scrolled` toggle on `window.scroll`). Shared by both pages. Kept separate from `main.js` specifically so `aviso-legal.html` can use it without pulling in the waitlist-form code (which assumes form elements that only exist on `index.html` and would throw if loaded where they don't exist).
- `js/analytics.js` — Google Analytics 4 (`G-SM26JSXCMX`) behind an opt-in cookie banner, plus the banner itself. Loaded by both pages, after `i18n.js` (it uses `window.t` and `data-i18n` keys `cookies.*` / `footer.cookies`). See "Analytics & cookie consent" below.
- `js/main.js` — waitlist form handling only (validation, submit, feedback messages). Loaded by `index.html` only.
- `google-apps-script/Code.gs` — reference copy of the Google Apps Script Web App code that actually receives the waitlist form submissions (see "Form submission"). Not deployed by git/Vercel — it has to be manually pasted into the Apps Script editor bound to the destination Google Sheet; this file exists purely so the pasted script has a source-of-truth copy in the repo instead of living only inside Google's editor.
- `design/` — design references that are not part of the site (excluded from deploys via `.vercelignore`). Currently holds `banner-opciones.html`, the cookie-banner variants.
- `assets/images/` — logo and photos.
- `assets/images/hero_image.jpg` — the `#hero` background (`.hero-bg-img`). Decided after an A/B test comparing 4 candidates; the runner-up stock photo is kept as `hero_image_old.jpg` (unused, not referenced anywhere) rather than deleted.
- `assets/images/og-image.jpg` — the Open Graph / Twitter Card share image (1200×630), cropped from `hero_image.jpg`. Regenerate at 1200×630 and re-optimize (`quality≈80`, keep well under 1MB) if the source photo changes.
- `favicon.ico` (repo root) + `assets/images/favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` — generated from `Logo_splash.webp` (cropped tight to the non-transparent splash shape). At 16×16 the logo reads as little more than a pink blob since it has no simplified icon-only mark — a proper single-glyph icon would favicon better if one is ever produced.
- `assets/images/logos/` — certifying-body / partner logos shown in the `#certificados` carousel (PADI, Observadores del Mar, PEJCONA, REEDUCAMAR, Alen Formación, Turislab, etc.). Filenames are standardized as lowercase-kebab-case with no spaces (e.g. `padi-elite-bronce.png`, `observadores-del-mar.png`) — `padi-rosa.png` and `turislab-old.png` are unused leftover variants (same pattern as `hero_image_old.jpg`), kept but not referenced anywhere.
- `robots.txt`, `sitemap.xml` — reference `https://www.buceoriavigo.com`.

## Nav/footer parity between pages

`aviso-legal.html`'s nav and footer are hand-copied from `index.html`, not templated — every nav/footer change made on one page must be manually re-applied to the other or they drift (this has already happened once: the CTA button text and the nav scroll-shadow behavior both went stale on `aviso-legal.html`). The two intentional, permanent differences are: the nav logo links to `index.html` (not `#`) and the nav CTA points to `index.html#cta` (not `#cta`). Everything else — including `data-i18n` attributes on the CTA/footer links — should match `index.html` exactly.

## Footer layout

The footer has two rows, both capped at 1200px. They stack centered on mobile (≤768px).
- `.footer-top`: brand + contact. The logo sits on the left. `.footer-contact` (email + `.social-links`) sits on the right, so new social icons go there.
- `.footer-bottom`: small print. `.footer-legal` (©, "Aviso legal", "Configurar cookies") sits on the left and the language dropdown on the right.

Keep that split when adding things: visitor-facing contact/social links go in the top row, and legal/utility links go in the bottom row. Don't put everything back into one flat row; it's been restructured once already for being cluttered. The logo is 76px tall because `Logo_splash.webp` has a lot of transparent padding and looks much smaller than its box.

## i18n architecture

Translations are **not** loaded from JSON — `js/i18n.js` hardcodes the `translations` object inline (es/gl/en) and `applyLang(lang)` walks the DOM applying it via three data attributes:

- `data-i18n="key"` → sets `textContent`
- `data-i18n-html="key"` → sets `innerHTML` (used where a translation embeds `<em>`/`<strong>`/`<br>`)
- `data-i18n-placeholder="key"` → sets `placeholder`

Language choice persists via `localStorage['lang']` and defaults to `es`. `aviso-legal.html` does not carry `data-i18n` attributes — its legal copy is Spanish-only.

**When adding or changing copy**: update the string in all three locales inside `translations` in `js/i18n.js`, and keep the hardcoded Spanish fallback text in `index.html`'s markup in sync (it's what renders before JS runs / if JS fails).

Treat `js/i18n.js` as the single source of truth for copy. (A `texto_landing_es.json` export of the `es` strings used to sit at the repo root, tracked but unreferenced by any code — it was deleted 2026-09-19 once it had drifted out of sync with `js/i18n.js`; don't recreate a similar export without wiring it up as the actual source of copy, or it'll drift again.)

## Form submission

The waitlist form in `js/main.js` POSTs JSON (`nombre`, `email`, `intereses`, `newsletter`) to `SHEETS_WEBHOOK_URL`, a live Google Apps Script Web App `/exec` URL bound to a Google Sheet (set 2026-09-19; the deployed script's source lives at `google-apps-script/Code.gs` — if it ever needs changing, edit that file, paste it into the Apps Script editor, then **Implementar → Administrar implementaciones → editar → Nueva versión** so the same `/exec` URL keeps working instead of minting a new one). `intereses` is an array of the checked interest slugs (`padi`, `recreativo`, `viajes`, `ciencia`, `comunidad` — see `.interest-check` checkbox values in `index.html`'s `#cta`), not free text; it replaced an earlier open-text "what interests you" textarea. In the markup it's a `<details class="interests-dropdown">` collapsed to one input-height row by default (`js/main.js` keeps its summary text in sync with the checked options and closes it on an outside click) — a native `<select multiple>` was avoided since that control's UX is poor for multi-selection. The options are framed around future products/services (PADI training, recreational diving, dive trips, citizen science, community), not the `#actividades` section's own tags — the two lists are intentionally separate and don't need to stay in sync. "Who has access: Anyone" on the Apps Script deployment only controls who can trigger the script (needed since the public site can't authenticate as a Google account); it does not make the underlying Sheet's data public — that stays governed by the Sheet's own sharing settings.

The `fetch()` call uses `mode: 'no-cors'` with a `text/plain` Content-Type (not `application/json`) — Apps Script Web Apps don't return CORS headers, so a normal `cors` fetch would have its response blocked by the browser even though the request succeeds server-side; `no-cors` avoids that at the cost of the client never being able to read success/failure from the response. Apps Script's `doPost` reads the raw body via `e.postData.contents` regardless of the declared Content-Type, so sending JSON as `text/plain` still parses fine.

**The submit handler doesn't wait for the response at all** — it fires the `fetch()` and, independently, hides `#cta-form-fields` and shows the `#cta-success` thank-you message after a fixed ~900ms delay (`setTimeout`, purely cosmetic so the button's brief "Enviando…" disabled state feels like it did something). This is deliberate: since `no-cors` already prevents reading the real response, and Apps Script itself is slow enough that waiting for it made the UI visibly lag behind the row actually landing in the Sheet, the UI no longer reflects the true outcome of the request at all — success is shown unconditionally once validation passes, never based on what Apps Script actually did. The only place a real failure becomes visible is server-side: `Code.gs`'s `doPost` wraps the sheet write in `try/catch` and emails `NOTIFY_EMAIL` (currently `vigo@buceoriavigo.com`) with the error and raw payload on failure, specifically because the client-side fire-and-forget design means nothing else would ever surface it. `Code.gs` also runs every string field through `asText()` before writing it (prefixes values starting with `=`/`+`/`-`/`@` with a `'`) to block formula/CSV injection — necessary because the endpoint is public and unauthenticated, so anyone who reads the URL out of the page source can POST arbitrary field values directly, bypassing both the client-side checkbox values and `isValidEmail`.

`isValidEmail` in `js/main.js` does real structural validation (charset, single `@`, dotless-domain/TLD-length checks, no leading/trailing/double dots) rather than the old "no spaces, has an `@` and a `.`" check — it still only catches typos/malformed input client-side, not deliverability, and (per the point above) doesn't apply at all to a direct POST against the Apps Script URL.

**If the webhook URL ever needs to change**, also confirm the `connect-src` directive in `vercel.json`'s CSP allows the domain the webhook actually lives on — currently `https://script.google.com https://script.googleusercontent.com` (the `/exec` URL 302-redirects to `script.googleusercontent.com` to serve the actual response, so both hosts are needed even though only `script.google.com` appears in the webhook URL itself). Otherwise the browser will silently block the `fetch()` call and the form will look broken with no console-visible cause beyond a CSP violation.

## Git remote & identity

This machine has two GitHub SSH keys (see `~/.ssh/config`): the plain `github.com` host uses the **work** key (authenticates as `marimoyz`), while the `github-personal` host alias uses the **personal** key (authenticates as `marimoysan`, who owns this repo). So `origin` must be `git@github-personal:marimoysan/buceo-ria-landing.git` (set 2026-11-26), not `git@github.com:...` — the latter silently pushes/pulls as the wrong account. Commit author is set per-repo in `.git/config` (`git config --local`, name `marimoysan` + the email verified on that GitHub account); there's no global git identity on this machine, so a fresh clone needs both the remote and the local identity set again before committing.

## Analytics & cookie consent

**Current state (2026-11-26): GA4 is switched OFF** via `GA_ENABLED = false` at the top of `js/analytics.js`. The site runs on Vercel Web Analytics only. While off, `analytics.js` loads no GA and shows no banner. It hides the footer's `[data-cookie-settings]` "Configurar cookies" button and cleans up after visitors who accepted while GA was live (deletes `_ga*` cookies and the `cookieConsent` key). With no consent-requiring cookies left, no banner is legally needed: the `lang` localStorage key is a user-requested UI preference, exempt under LSSI art. 22.2. Everything below (banner, consent flow, CSP allowances) is kept intact so GA can come back.

**To re-enable GA:** set `GA_ENABLED = true`, then in `aviso-legal.html` section 3 restore the commented-out `GOOGLE ANALYTICS` block. That means swapping in its intro paragraph, re-adding the `cookieConsent` list item, adding the GA sections, and removing the "no se muestra aviso de cookies" paragraph. The GA hosts are still allowed in `vercel.json`'s CSP, deliberately, so nothing else needs changing.

Google Analytics 4 is **opt-in**: `js/analytics.js` only injects `gtag.js` (from `www.googletagmanager.com`) after the user accepts in the cookie banner ("¡Claro!"). Spanish law (LSSI + AEPD guidance) requires prior consent for analytics cookies, so never load GA unconditionally or move the snippet into `<head>`. The choice persists in `localStorage['cookieConsent']` (`granted`/`denied`). With no stored choice, the banner shows on every page load. The reject ("No, gracias") and accept ("¡Claro!") buttons deliberately have identical styling: the AEPD requires rejecting to be as easy as accepting, so don't turn reject into a less prominent secondary/link button. The banner is intentionally friendly rather than legalistic: a near-full-width (max 1200px) translucent navy "glass" bar (`backdrop-filter` blur + light border, with a more opaque fallback where unsupported) floating at the bottom, with an inline-SVG cookie slowly spinning inside a floating bubble (title "¡Hola!"). Its animations are disabled under `prefers-reduced-motion`. A floating bubble button to reopen the banner (`.cookie-fab`, bottom-right) is implemented but **disabled** via `SHOW_FAB = false` in `analytics.js`. It was removed by choice: the AEPD requires that withdrawing consent stays permanently and easily accessible, but doesn't mandate a floating icon, and on a one-page landing the footer link is enough. Flip the flag to bring it back. The footer's "Configurar cookies" button (`[data-cookie-settings]`, present in both pages' footers) is therefore the only way to reopen the banner, so don't remove it from either footer. Withdrawing consent sets `ga-disable-<ID>`, updates consent mode to denied, and deletes `_ga`/`_ga_*` cookies. Ads-related consent signals are always `denied`; the site only does analytics.

The gtag bootstrap lives in `analytics.js` rather than Google's usual inline `<script>` because the CSP has no `'unsafe-inline'` for scripts. `vercel.json`'s CSP allows `https://www.googletagmanager.com` (script-src), `*.google-analytics.com` / `*.analytics.google.com` / `*.googletagmanager.com` (connect-src), and `*.google-analytics.com` / `*.googletagmanager.com` (img-src). If GA appears dead in production but works locally, check for CSP violations first.

**Alternative banner designs** are kept in `design/banner-opciones.html`, a standalone preview page (excluded from deploys via `.vercelignore`) with six variants: A fish (the first shipped version), B jellyfish, C cookie-in-a-bubble (current), D pressure gauge "pre-dive check", E bubbles-only, F dive mask. To switch, port that variant's SVG into `cookieSVG()` in `analytics.js`, its animation CSS into the COOKIE BANNER block of `styles.css`, and, if wanted, its title into `cookies.title` in all three locales. The current variant C deliberately uses the plain "¡Hola!" title instead of the preview's "¿Una galleta bajo el agua?".

`aviso-legal.html` section 3 (`#cookies`, which the banner's "Más información" link targets) documents every cookie and storage key. **If you add any new cookie, localStorage key, or third-party script, update that section**, and add it to the consent gate if it isn't strictly technical.

## Vercel Web Analytics

Both pages load `<script defer src="/_vercel/insights/script.js">` right after `nav.js`. This is Vercel's plain-HTML integration. The dashboard's "Get Started" wizard defaults to Next.js and suggests `npm i @vercel/analytics`, but that doesn't apply here (no npm, no build). It's cookieless and anonymous, so it loads unconditionally with no consent gate, and it counts every visitor, unlike GA4 which only sees people who accept cookies. The script is served same-origin by Vercel, so the CSP's `script-src 'self'` / `connect-src 'self'` already cover it. It only exists on Vercel deployments: it 404s locally, which is expected. Analytics must be enabled in the Vercel dashboard (project → Analytics) for data to show. `aviso-legal.html` section 3 mentions it under "Estadísticas de uso sin cookies".

## Deployment & security headers

Deployed on Vercel (`https://buceo-ria-landing.vercel.app`, tracks the `main` branch) as a plain static site — no build step, so every file tracked in git is served as-is unless excluded.

**Workflow: one branch per change.** `main` is production, so don't commit to it directly. Create a branch per change (e.g. `feature/analytics-cookies`) and push it. Vercel automatically builds a Preview Deployment for it, with its own URL and the same `vercel.json` headers/CSP, so CSP problems show up there. That preview is the staging environment; there's no permanent `staging` branch. Merge to `main` once the preview checks out. Previews are not sandboxed: they send hits to the same GA4 property (filter by hostname in GA), and the waitlist form writes to the real Google Sheet.

**`www.buceoriavigo.com` is not yet connected to this Vercel deployment** (checked 2026-09-13): the domain currently serves an old WordPress "under construction" placeholder (lighthouse theme, "Muy pronto disponible"), unrelated to this repo. Until DNS/domain is pointed at Vercel, testing must use the `buceo-ria-landing.vercel.app` URL directly — anything that hardcodes the `www.buceoriavigo.com` absolute URL (canonical link, `og:url`, sitemap) will not resolve to this site in the meantime. `og:image`/`twitter:image` in `index.html` are temporarily pointed at the `vercel.app` absolute URL instead (marked `TEMPORAL` in an HTML comment right above each) specifically so link-preview crawlers can find the share image while testing with the vercel.app URL — switch both back to `https://www.buceoriavigo.com/assets/images/og-image.jpg` once the custom domain is live.

- **Filename case matters for deploys, even though it doesn't matter locally on Windows.** This repo is authored on Windows (case-insensitive filesystem) but Vercel builds/serves on Linux (case-sensitive). Renaming a file's case on Windows (e.g. `Photo.JPG` → `photo.jpg`) can silently fail to update git's index (Windows/git often won't register a case-only change), so git can keep shipping the old-cased filename while every reference in the code uses the new case — works perfectly in local testing, 404s in production. This has actually happened (an `aprende.JPG`/`aprende.jpg` mismatch broke an image in production, caught only by inspecting `git ls-files` directly). After any rename involving a case change: verify the working-tree file, `git ls-files <path>`, and every `src=`/`url()` reference all agree on the exact same case — don't trust a plain `git mv` or Windows Explorer rename to have handled it.
- `.vercelignore` excludes `CLAUDE.md` from the deployment — a dev-only file that was previously publicly served (confirmed via direct `curl` to the live URL) and leaked internal maintenance notes. Add any other internal-only file here rather than relying on it just being "unreferenced."
- `vercel.json` sets response headers on every route: `X-Frame-Options: DENY` and a CSP `frame-ancestors 'none'` (clickjacking protection — the site has a data-collecting form and previously had no framing protection at all), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (locks down camera/mic/geolocation, unused by the site), and a `Content-Security-Policy` scoped to what the site actually loads (`self` scripts/styles, Google Fonts, `script.google.com`/`script.googleusercontent.com` for the waitlist webhook, and the Google Analytics hosts listed above). If you add a new external resource (another CDN, an analytics/GA snippet, an embed), it needs a matching CSP allowance in `vercel.json` or it will be silently blocked in production while working fine locally (there's no CSP enforcement when opening `index.html` directly or via a plain static server).

## Layout width

Every `<section>` except `#hero` owns full-bleed background color/padding, but its actual content (label/title/intro/grid) is wrapped in a `.section-inner` div (`max-width: 1200px; margin: 0 auto;`, defined in the "SECTIONS COMMON" CSS block) so content doesn't stretch edge-to-edge on wide viewports. `#cta` uses its own pre-existing `.cta-inner` (max-width 600px, centered, text-centered) instead — don't wrap it in `.section-inner` too. `#hero` is intentionally full-bleed (its background layers are `position: absolute; inset: 0` on the section itself) and constrains only `.hero-content` (780px). When adding a new section, follow the same pattern: full-width `<section>` + a `.section-inner` (or purpose-built inner div) wrapping its actual content.

`#actividades` is a deliberate exception: the label/title/intro sit in the normal 1200px `.section-inner`, but the 4-card gallery below it lives in a sibling `.actividades-wide` div (`max-width: 1600px`), and `#actividades` itself overrides the section's default `padding: 6rem 4rem` down to `2rem` left/right — so the gallery visibly breathes wider than every other section's content. This is intentional (the cards looked cramped at the standard 1200px/4-column width), not a bug — see "Actividades gallery" below before changing it.

## Actividades gallery

`#actividades` shows 4 activity cards (`.actividades-grid`, 4 columns down to 1 on mobile) — image on top (`.actividad-media`, 16:10, `object-fit: cover`), then a body with a number+title header (`.actividad-head` — the number is a big standalone visual element, not decorative filler) and a description/tag below. There was a carousel version of this (peek-style, then a "1 focused card + dots" version) before landing on the static wide grid — if asked to revisit the carousel approach, the git history has both prior implementations to reference rather than reinventing them.

**The image filenames do not match the card titles they're used on** — this was a deliberate choice after comparing several real dive photos against each card's theme, not an oversight:
- Card 01 "Aprende buceando" → `algo-mas.jpg` (group of divers at the surface)
- Card 02 "Descubre la Ría de Vigo" → `descubre.jpg` (light through kelp, matches the filename)
- Card 03 "Protege los océanos" → `protege.jpg` (matches the filename)
- Card 04 "Sé parte de algo más" → `aprende.jpg` (two divers close up)

Don't "fix" this by renaming files to match card titles or assume a filename tells you which card uses it — check `index.html` directly. `assets/images/buceador-tanque-verde.jpg` and `salida-playa.jpg` are leftover candidates from this photo-picking process, kept but unused.

## Editorial/config notes visible in the markup

- The hero tag (`.hero-tag`, `data-i18n="hero.tag"`) is intentionally hidden via inline `style="visibility: hidden;"` — there's an HTML comment noting it's temporarily disabled and how to re-enable it (remove that inline style).
- Social links (footer `.social-links`, both pages, in this order): Instagram (`instagram.com/buceoria.vigo/`), TikTok (`tiktok.com/@buceoriavigo`, tracking params stripped from the share URL), Facebook (`facebook.com/share/19aGgpAALt/`, a share/redirect link given by the user; swap in the page's canonical `facebook.com/<page>` URL if it becomes known), and LinkedIn (`linkedin.com/company/buceoriavigo/`). The icons are inline Simple Icons-style SVGs. YouTube is still a placeholder URL hidden via inline `style="display: none;"`. The hero's "Síguenos en redes" button (`.btn-secondary`, `data-i18n="hero.btn2"`) deliberately links to Instagram only, by the user's choice.
- The nav logo (`.nav-logo img`, `assets/images/Logo_splash.webp`) has a transparent-background PNG-style silhouette (an irregular paint-stroke shape), not a rectangle. Its white outline is done with a stack of 8 `drop-shadow()` filters (not `border`/`background`) so the outline follows the actual silhouette instead of boxing the image.
- The `#certificados` logo carousel (`.certs-track`) is a CSS-only infinite marquee: the list of logo `<img>`s is duplicated once in the markup and the track animates `translateX(0)` → `translateX(-50%)` on a loop, which is only seamless because the duplicate set is byte-for-byte identical to the first — if you add/remove a logo, update both copies. `.certs-carousel` fades the edges via `mask-image`, and the animation pauses on `:hover`.
