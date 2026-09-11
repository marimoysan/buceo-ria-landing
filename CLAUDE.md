# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single static landing page (pre-launch waitlist) for Buceo Ría, a diving center in the Ría de Vigo / Islas Cíes, Spain. No build step, no package manager, no framework — plain HTML/CSS/JS served as-is.

## Running locally

There is no dev server or build command. Open `index.html` directly in a browser, or serve the directory with any static file server (e.g. `python -m http.server` or VS Code Live Server) so relative paths resolve correctly.

There is no linter, formatter, or test suite configured.

## Structure

- `index.html` — the single-page landing (nav, hero, actividades, certificados, valores, equipo, CTA form, footer).
- `aviso-legal.html` — standalone legal/privacy notice page, `noindex`. Shares `css/styles.css` and the same nav/footer markup as `index.html` (kept in sync manually, not templated).
- `css/styles.css` — one stylesheet for both pages, organized in commented sections (`/* ─── NAV ─── */`, `/* ─── HERO ─── */`, etc.) that map 1:1 to the sections in the HTML.
- `js/i18n.js` — translation dictionary (`es`/`gl`/`en`) and the `applyLang()` engine; also owns the language-dropdown UI (nav + footer).
- `js/main.js` — waitlist form handling (validation, submit, feedback messages) and the nav scroll-shadow effect.
- `assets/images/` — logo and photos.
- `assets/images/logos/` — certifying-body / partner logos shown in the `#certificados` carousel (PADI, Observadores del Mar, PEJCONA, REEDUCAMAR, Alen Formación, Turislab, etc.). Filenames contain spaces and are referenced with `%20` escapes in `index.html`.
- `robots.txt`, `sitemap.xml` — reference `https://www.buceoriavigo.com`.

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

- `.vercelignore` excludes `CLAUDE.md` and `texto_landing_es.json` from the deployment — both are dev-only files that were previously publicly served (confirmed via direct `curl` to the live URL) and leaked internal maintenance notes. Add any other internal-only file here rather than relying on it just being "unreferenced."
- `vercel.json` sets response headers on every route: `X-Frame-Options: DENY` and a CSP `frame-ancestors 'none'` (clickjacking protection — the site has a data-collecting form and previously had no framing protection at all), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (locks down camera/mic/geolocation, unused by the site), and a `Content-Security-Policy` scoped to what the site actually loads (`self` scripts/styles, Google Fonts, and `*.make.com` for the waitlist webhook). If you add a new external resource (another CDN, an analytics/GA snippet, an embed), it needs a matching CSP allowance in `vercel.json` or it will be silently blocked in production while working fine locally (there's no CSP enforcement when opening `index.html` directly or via a plain static server).

## Layout width

Every `<section>` except `#hero` owns full-bleed background color/padding, but its actual content (label/title/intro/grid) is wrapped in a `.section-inner` div (`max-width: 1200px; margin: 0 auto;`, defined in the "SECTIONS COMMON" CSS block) so content doesn't stretch edge-to-edge on wide viewports. `#cta` uses its own pre-existing `.cta-inner` (max-width 600px, centered, text-centered) instead — don't wrap it in `.section-inner` too. `#hero` is intentionally full-bleed (its background layers are `position: absolute; inset: 0` on the section itself) and constrains only `.hero-content` (780px). When adding a new section, follow the same pattern: full-width `<section>` + a `.section-inner` (or purpose-built inner div) wrapping its actual content.

## Editorial/config notes visible in the markup

- The hero tag (`.hero-tag`, `data-i18n="hero.tag"`) is intentionally hidden via inline `style="visibility: hidden;"` — there's an HTML comment noting it's temporarily disabled and how to re-enable it (remove that inline style).
- Social links (Instagram/Facebook/YouTube) in the hero and footer are currently placeholder URLs (`https://instagram.com`, etc.), not the center's real profiles.
- The nav logo (`.nav-logo img`, `assets/images/Logo_splash.webp`) has a transparent-background PNG-style silhouette (an irregular paint-stroke shape), not a rectangle. Its white outline is done with a stack of 8 `drop-shadow()` filters (not `border`/`background`) so the outline follows the actual silhouette instead of boxing the image.
- The `#certificados` logo carousel (`.certs-track`) is a CSS-only infinite marquee: the list of logo `<img>`s is duplicated once in the markup and the track animates `translateX(0)` → `translateX(-50%)` on a loop, which is only seamless because the duplicate set is byte-for-byte identical to the first — if you add/remove a logo, update both copies. `.certs-carousel` fades the edges via `mask-image`, and the animation pauses on `:hover`.
