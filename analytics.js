(() => {
  'use strict';

  const MEASUREMENT_ID = 'G-K95ZZV60ER';
  const SITE_URL = 'https://tonyye1016.github.io/tianhao-quant-profile/';
  const COOKIE_PATH = '/tianhao-quant-profile/';
  const STORAGE_KEY = 'tony-profile-analytics-v1';
  const CHOICE_LIFETIME = 180 * 24 * 60 * 60 * 1000;
  const disableKey = `ga-disable-${MEASUREMENT_ID}`;
  const notice = document.getElementById('analytics-notice');
  const settings = document.getElementById('privacy-settings');
  const status = document.getElementById('privacy-status');
  if (!notice || !settings || !status) return;

  // Never contaminate the production property from local previews or other hosts.
  const isProduction = location.origin === new URL(SITE_URL).origin &&
    [COOKIE_PATH, `${COOKIE_PATH}index.html`].includes(location.pathname);
  const privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  let loaded = false;
  let granted = false;
  let returnFocus = null;
  window[disableKey] = true;

  function savedChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (value && ['granted', 'denied'].includes(value.choice) &&
          Number.isFinite(value.time) && Date.now() >= value.time &&
          Date.now() - value.time < CHOICE_LIFETIME) return value.choice;
    } catch { /* Storage may be unavailable; default to no collection. */ }
    return null;
  }

  function storeChoice(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, time: Date.now() }));
      return true;
    } catch { return false; /* This choice still works for the current page. */ }
  }

  // Fixed, non-personal campaign labels only. Never put a person's name/email in a UTM.
  function measurementContext() {
    const allowed = {
      utm_source: ['jpmc', 'jpmorgan', 'sg', 'societe_generale', 'linkedin', 'resume', 'email', 'github', 'goldman_sachs', 'morgan_stanley', 'citi', 'barclays', 'ubs', 'wellington'],
      utm_medium: ['email', 'referral', 'social', 'resume'],
      utm_campaign: ['quant_2027', 'risk_2027', 'new_grad_2027', 'portfolio']
    };
    const incoming = new URLSearchParams(location.search);
    const clean = new URL(SITE_URL);
    for (const [key, values] of Object.entries(allowed)) {
      const value = incoming.get(key);
      if (values.includes(value)) clean.searchParams.set(key, value);
    }
    let referrer = '';
    try {
      const url = new URL(document.referrer);
      if (['https:', 'http:'].includes(url.protocol)) referrer = `${url.origin}/`;
    } catch { /* Direct visits have no referrer. */ }
    return { page_location: clean.href, page_referrer: referrer, page_title: 'Tianhao (Tony) Ye' };
  }

  function clearAnalyticsCookies() {
    // These cookies are host-only and scoped to this portfolio, not other GitHub Pages sites.
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (name === '_ga' || name === `_ga_${MEASUREMENT_ID.slice(2)}`) {
        document.cookie = `${name}=; Max-Age=0; Path=${COOKIE_PATH}; SameSite=Lax; Secure`;
      }
    }
  }

  function startAnalytics() {
    if (loaded || !granted || !isProduction || privacySignal) return;
    loaded = true;
    window[disableKey] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      ...measurementContext(),
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: 'none',
      cookie_path: COOKIE_PATH,
      cookie_expires: CHOICE_LIFETIME / 1000,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure',
      send_page_view: true
    });
    const script = document.createElement('script');
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  function updateStatus() {
    status.textContent = privacySignal ? 'Analytics off — browser privacy preference respected.' :
      granted ? (isProduction ? 'Analytics allowed.' : 'Analytics off in this preview.') : 'Analytics off.';
  }

  function closeNotice() {
    notice.hidden = true;
    if (returnFocus) returnFocus.focus();
    returnFocus = null;
  }

  function choose(choice) {
    granted = choice === 'granted' && !privacySignal;
    const persisted = storeChoice(granted ? 'granted' : 'denied');
    if (granted) startAnalytics();
    else {
      window[disableKey] = true;
      clearAnalyticsCookies();
      // Unload Google's code on withdrawal, so it cannot send later lifecycle events.
      if (loaded) {
        window.gtag('consent', 'update', { analytics_storage: 'denied' });
        if (persisted) { location.reload(); return; }
      }
    }
    updateStatus();
    closeNotice();
  }

  settings.hidden = false;
  settings.addEventListener('click', () => {
    returnFocus = settings;
    notice.hidden = false;
    document.getElementById('analytics-title').focus();
  });
  document.getElementById('analytics-accept').disabled = privacySignal;
  document.getElementById('analytics-accept').addEventListener('click', () => choose('granted'));
  document.getElementById('analytics-reject').addEventListener('click', () => choose('denied'));
  document.getElementById('analytics-close').addEventListener('click', closeNotice);
  notice.addEventListener('keydown', event => { if (event.key === 'Escape') closeNotice(); });

  // Track only these two explicit destinations, not every external/contact link.
  function trackClick(event) {
    if (!granted || !loaded || window[disableKey] || event.defaultPrevented) return;
    if (event.type === 'auxclick' && event.button !== 1) return;
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    let url;
    try { url = new URL(link.href, SITE_URL); } catch { return; }
    let name;
    if (url.origin === new URL(SITE_URL).origin && url.pathname === `${COOKIE_PATH}resume.pdf`) name = 'resume_click';
    else if (url.hostname === 'www.linkedin.com' && url.pathname === '/in/tony-ye-11b54b263/') name = 'linkedin_click';
    if (name) window.gtag('event', name, { send_to: MEASUREMENT_ID, ...measurementContext() });
  }
  document.addEventListener('click', trackClick);
  document.addEventListener('auxclick', trackClick);
  // Honor withdrawal in another tab without retaining a running Google tag here.
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY && savedChoice() !== 'granted') {
      granted = false;
      window[disableKey] = true;
      clearAnalyticsCookies();
      if (loaded) location.reload();
      else updateStatus();
    }
  });

  const choice = savedChoice();
  granted = choice === 'granted' && !privacySignal;
  if (granted) startAnalytics();
  else clearAnalyticsCookies();
  notice.hidden = choice !== null || privacySignal || !isProduction;
  updateStatus();
})();
