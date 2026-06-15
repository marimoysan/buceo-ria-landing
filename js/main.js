const WEBHOOK_URL = 'REEMPLAZA_CON_TU_URL_DE_MAKE';

const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('nav--scrolled', window.scrollY > 40);
}, { passive: true });

const form = {
  nombre:     document.querySelector('input[autocomplete="name"]'),
  email:      document.querySelector('input[autocomplete="email"]'),
  mensaje:    document.querySelector('textarea'),
  newsletter: document.getElementById('newsletter-check'),
  btn:        document.querySelector('.btn-submit'),
};

form.btn.addEventListener('click', async () => {
  const nombre  = form.nombre.value.trim();
  const email   = form.email.value.trim();
  const mensaje = form.mensaje.value.trim();

  if (!nombre || !email) {
    showFeedback(t('form.validation'), 'error');
    return;
  }
  if (!isValidEmail(email)) {
    showFeedback(t('form.email_invalid'), 'error');
    return;
  }

  setLoading(true);

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        email,
        mensaje,
        newsletter: form.newsletter.checked,
      }),
    });

    showFeedback(t('form.success'), 'success');
    resetForm();
  } catch {
    showFeedback(t('form.error'), 'error');
  } finally {
    setLoading(false);
  }
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoading(isLoading) {
  form.btn.disabled = isLoading;
  form.btn.textContent = isLoading ? 'Enviando…' : 'Quiero unirme al proyecto';
}

function resetForm() {
  form.nombre.value    = '';
  form.email.value     = '';
  form.mensaje.value   = '';
  form.newsletter.checked = false;
}

function showFeedback(message, type) {
  const existing = document.getElementById('form-feedback');
  if (existing) existing.remove();

  const el = document.createElement('p');
  el.id = 'form-feedback';
  el.textContent = message;
  el.style.cssText = `
    margin-top: 1rem;
    padding: 0.9rem 1.25rem;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 500;
    text-align: center;
    background: ${type === 'success' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.15)'};
    color: ${type === 'success' ? 'rgba(255,255,255,0.95)' : '#FFB3C6'};
    border: 1px solid ${type === 'success' ? 'rgba(255,255,255,0.2)' : 'rgba(255,180,180,0.3)'};
  `;
  form.btn.insertAdjacentElement('afterend', el);

  if (type === 'success') return;
  setTimeout(() => el.remove(), 5000);
}
