// Google Analytics 4 con consentimiento previo (opt-in).
// GA solo se carga si el usuario acepta en el banner. La elección se guarda en
// localStorage['cookieConsent'] ('granted' | 'denied'). Cualquier elemento con
// [data-cookie-settings] (p. ej. el enlace del footer) reabre el banner.
// Depende de js/i18n.js (window.t + data-i18n), que debe cargarse antes.

(function () {
  // ─── INTERRUPTOR GENERAL ───
  // false = GA desactivado: no se carga GA, no se muestra el banner y se oculta el enlace
  // "Configurar cookies" del footer. A quien ya hubiera aceptado se le borran las cookies _ga.
  // Para reactivarlo: ponerlo a true y restaurar el bloque comentado de GA en la sección 3
  // de aviso-legal.html (ver CLAUDE.md, "Analytics & cookie consent").
  const GA_ENABLED = false;

  const GA_ID = 'G-SM26JSXCMX';
  const STORAGE_KEY = 'cookieConsent';
  // Botón flotante (burbuja abajo a la derecha) para reabrir las preferencias.
  // Desactivado: basta con el enlace "Configurar cookies" del footer. Poner a true para reactivarlo.
  const SHOW_FAB = false;

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* sin almacenamiento: se preguntará de nuevo */ }
  }

  // ─── GA ───
  let gaLoaded = false;

  function loadGA() {
    window['ga-disable-' + GA_ID] = false;
    if (gaLoaded) {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      return;
    }
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // Al retirar el consentimiento: desactivar GA y borrar sus cookies (_ga, _ga_*).
  function disableGA() {
    window['ga-disable-' + GA_ID] = true;
    if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });

    const parts = location.hostname.split('.');
    const domains = [''];
    for (let i = 0; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));

    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0].trim();
      if (name === '_ga' || name.startsWith('_ga_')) {
        domains.forEach(d => {
          document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  // ─── BANNER ───
  const tr = key => (window.t ? window.t(key) : key);
  let banner = null;
  let fab = null;

  // Galleta dentro de una burbuja. Las otras variantes de icono (pez, medusa,
  // manómetro, burbujas, gafas) están en design/banner-opciones.html.
  function cookieSVG(size) {
    return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="29" fill="rgba(160,220,240,.14)" stroke="rgba(160,220,240,.9)" stroke-width="2.5"/>' +
      '<path d="M14 22 Q18 12 28 9" stroke="rgba(255,255,255,.8)" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<g class="cookie-icon-spin">' +
        '<path d="M32 16 A16 16 0 1 0 48 33 Q44 34 42 30 Q38 30 38 25 Q34 24 35 19 Q33 18 32 16 Z" fill="#D9A066"/>' +
        '<circle cx="25" cy="29" r="2.6" fill="#5B3A1E"/><circle cx="36" cy="37" r="2.6" fill="#5B3A1E"/>' +
        '<circle cx="27" cy="40" r="2.2" fill="#5B3A1E"/><circle cx="41" cy="31" r="1.8" fill="#5B3A1E"/>' +
        '<circle cx="31" cy="23" r="1.8" fill="#5B3A1E"/>' +
      '</g>' +
      '</svg>';
  }

  function translateIn(root) {
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n); });
  }

  function buildBanner() {
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookies');
    banner.hidden = true;
    banner.innerHTML =
      '<div class="cookie-icon" aria-hidden="true">' +
        '<span class="cookie-bubble"></span><span class="cookie-bubble"></span>' +
        cookieSVG(60) +
      '</div>' +
      '<div class="cookie-banner-body">' +
        '<p class="cookie-banner-title" data-i18n="cookies.title"></p>' +
        '<p class="cookie-banner-text">' +
          '<span data-i18n="cookies.text"></span> ' +
          '<a href="aviso-legal.html#cookies" data-i18n="cookies.more"></a>' +
        '</p>' +
      '</div>' +
      '<div class="cookie-banner-btns">' +
        '<button type="button" class="cookie-btn" data-consent="denied" data-i18n="cookies.reject"></button>' +
        '<button type="button" class="cookie-btn" data-consent="granted" data-i18n="cookies.accept"></button>' +
      '</div>';

    translateIn(banner);

    banner.querySelectorAll('[data-consent]').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.consent;
        setConsent(value);
        if (value === 'granted') loadGA(); else disableGA();
        hideBanner();
      });
    });

    document.body.appendChild(banner);
  }

  // Botón flotante (lateral derecho) para reabrir las preferencias una vez elegido.
  // El texto va en un span con data-i18n para que applyLang() lo traduzca al cambiar de idioma.
  function buildFab() {
    fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'cookie-fab';
    fab.hidden = true;
    fab.innerHTML = cookieSVG(38) + '<span class="cookie-fab-label" data-i18n="footer.cookies"></span>';
    translateIn(fab);
    fab.addEventListener('click', showBanner);
    document.body.appendChild(fab);
  }

  function showBanner() {
    if (!banner) buildBanner();
    banner.hidden = false;
    if (fab) fab.hidden = true;
  }

  function hideBanner() {
    if (banner) banner.hidden = true;
    if (!SHOW_FAB) return;
    if (!fab) buildFab();
    fab.hidden = false;
  }

  document.querySelectorAll('[data-cookie-settings]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      showBanner();
    });
  });

  if (!GA_ENABLED) {
    // Limpieza para visitantes que aceptaron mientras GA estuvo activo.
    disableGA();
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nada que limpiar */ }
    document.querySelectorAll('[data-cookie-settings]').forEach(el => { el.hidden = true; });
    return;
  }

  const consent = getConsent();
  if (consent === 'granted') loadGA();
  if (consent === 'granted' || consent === 'denied') hideBanner();
  else showBanner();
})();
