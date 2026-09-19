const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzk5KZQKpqJCniMjJ9x4oRYNTu_cXcnLB4qmAieVrhjKfBAdqzmVuJNJHAiP2EjPjbT/exec';

const form = {
  nombre:     document.querySelector('input[autocomplete="name"]'),
  email:      document.querySelector('input[autocomplete="email"]'),
  intereses:  document.querySelectorAll('.interest-check'),
  newsletter: document.getElementById('newsletter-check'),
  btn:        document.querySelector('.btn-submit'),
  fields:     document.getElementById('cta-form-fields'),
  success:    document.getElementById('cta-success'),
};

form.btn.addEventListener('click', () => {
  const nombre    = form.nombre.value.trim();
  const email     = form.email.value.trim();
  const intereses = Array.from(form.intereses).filter(c => c.checked).map(c => c.value);

  if (!nombre || !email) {
    showFeedback(t('form.validation'), 'error');
    return;
  }
  if (!isValidEmail(email)) {
    showFeedback(t('form.email_invalid'), 'error');
    return;
  }

  // no-cors: la respuesta no se puede leer igualmente, así que no esperamos
  // a que vuelva la petición para confirmar — Apps Script tarda varios
  // segundos en responder aunque la fila ya se haya guardado en la hoja.
  fetch(SHEETS_WEBHOOK_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      nombre,
      email,
      intereses,
      newsletter: form.newsletter.checked,
    }),
  }).catch(err => console.error('Error enviando el formulario:', err));

  setLoading(true);
  setTimeout(() => {
    resetForm();
    form.fields.hidden = true;
    form.success.hidden = false;
  }, 900);
});

function isValidEmail(email) {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
  const local = email.split('@')[0] || '';
  return re.test(email) && !email.includes('..') && !local.startsWith('.') && !local.endsWith('.');
}

function setLoading(isLoading) {
  form.btn.disabled = isLoading;
  form.btn.textContent = isLoading ? t('form.sending') : t('btn.submit');
}

function resetForm() {
  form.nombre.value    = '';
  form.email.value     = '';
  form.intereses.forEach(c => { c.checked = false; });
  form.newsletter.checked = false;
  updateInterestsSummary();
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

const tooltipBtn = document.querySelector('.info-tooltip');
if (tooltipBtn) {
  tooltipBtn.addEventListener('click', (e) => {
    e.preventDefault();
    tooltipBtn.classList.toggle('is-open');
  });
  document.addEventListener('click', (e) => {
    if (!tooltipBtn.contains(e.target)) tooltipBtn.classList.remove('is-open');
  });
}

const interestsDropdown = document.querySelector('.interests-dropdown');
const interestsSummary = document.querySelector('.interests-summary-text');

function updateInterestsSummary() {
  if (!interestsSummary) return;
  const checked = Array.from(form.intereses).filter(c => c.checked);
  if (checked.length === 0) {
    interestsSummary.textContent = t('form.message');
    interestsSummary.classList.remove('has-value');
  } else {
    interestsSummary.textContent = checked.map(c => c.nextElementSibling.textContent).join(', ');
    interestsSummary.classList.add('has-value');
  }
}

if (interestsDropdown) {
  form.intereses.forEach(c => c.addEventListener('change', updateInterestsSummary));
  document.addEventListener('click', (e) => {
    if (interestsDropdown.open && !interestsDropdown.contains(e.target)) {
      interestsDropdown.removeAttribute('open');
    }
  });
}
