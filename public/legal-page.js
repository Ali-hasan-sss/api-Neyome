(function () {
  const SUPPORTED = ['ar', 'en', 'de'];
  const pageType = document.documentElement.dataset.pageType;
  const apiBase = document.documentElement.dataset.apiBase || '';

  const els = {
    title: document.getElementById('legal-title'),
    body: document.querySelector('#legal-body .ql-editor'),
    version: document.getElementById('legal-version'),
    loading: document.getElementById('legal-loading'),
    error: document.getElementById('legal-error'),
    card: document.getElementById('legal-card'),
    langButtons: document.querySelectorAll('[data-lang]'),
  };

  function getLocale() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('lang');
    if (fromQuery && SUPPORTED.includes(fromQuery)) return fromQuery;

    const stored = localStorage.getItem('neyome-legal-locale');
    if (stored && SUPPORTED.includes(stored)) return stored;

    const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(browser)) return browser;
    return 'en';
  }

  function setLocale(locale) {
    localStorage.setItem('neyome-legal-locale', locale);
    const params = new URLSearchParams(window.location.search);
    params.set('lang', locale);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', next);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    els.langButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === locale);
    });
    return locale;
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function plainTextToHtml(text) {
    if (!text) return '';
    if (/<[a-z][\s\S]*>/i.test(text)) return text;
    return text
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  async function loadPage(locale) {
    if (!pageType) {
      showError('Page type is not configured.');
      return;
    }

    showLoading();

    try {
      const res = await fetch(`${apiBase}/public/pages/${pageType}`, {
        headers: { 'X-Locale': locale, Accept: 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message || 'Failed to load page');
      }

      const data = json.data;
      els.title.textContent = data.title || '';
      els.version.textContent = data.version ? `Version ${data.version}` : '';
      els.body.innerHTML = plainTextToHtml(data.body || '');
      showContent();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load page');
    }
  }

  function showLoading() {
    els.loading.hidden = false;
    els.error.hidden = true;
    els.card.hidden = true;
  }

  function showContent() {
    els.loading.hidden = true;
    els.error.hidden = true;
    els.card.hidden = false;
  }

  function showError(message) {
    els.loading.hidden = true;
    els.card.hidden = true;
    els.error.hidden = false;
    els.error.textContent = message;
  }

  let currentLocale = setLocale(getLocale());
  loadPage(currentLocale);

  els.langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const locale = btn.dataset.lang;
      if (!locale || locale === currentLocale) return;
      currentLocale = setLocale(locale);
      loadPage(currentLocale);
    });
  });
})();
