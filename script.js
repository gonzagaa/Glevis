/* GLEVIS — minimal interactions */
(function () {
  "use strict";

  // Hero CTA: smooth scroll to the VIP form and focus the first input on desktop
  const heroCta = document.querySelector("[data-cta='hero']");
  const vipForm = document.querySelector(".vip-form");
  const formBlock = document.querySelector(".section-form");

  if (heroCta && formBlock) {
    heroCta.addEventListener("click", function (e) {
      e.preventDefault();
      formBlock.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstInput = vipForm && vipForm.querySelector("input");
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (firstInput && isDesktop) setTimeout(() => firstInput.focus({ preventScroll: true }), 600);
    });
  }

})();

// Trocar para a URL final após o deploy de produção na Vercel.
const ENDPOINT = 'https://glevis-backend.vercel.app/api/inscricao';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

(function initVipForm() {
  const form = document.getElementById('vip-form');
  if (!form) return;

  const button = document.getElementById('vip-form__cta');
  const originalButtonText = button ? button.innerHTML : '';

  let errorEl = null;

  function showError(message) {
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'vip-form__error';
      errorEl.setAttribute('role', 'alert');
      errorEl.style.color = '#b00020';
      errorEl.style.margin = '0.5rem 0';
      errorEl.style.fontSize = '0.95rem';
      button.parentNode.insertBefore(errorEl, button);
    }
    errorEl.textContent = message;
  }

  function clearError() {
    if (errorEl) errorEl.textContent = '';
  }

  function setLoading(isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    button.innerHTML = isLoading ? 'Enviando...' : originalButtonText;
  }

  function showSuccess() {
    const wrapper = form.parentNode;
    const success = document.createElement('div');
    success.className = 'vip-form__success';
    success.setAttribute('role', 'status');
    success.innerHTML = `
      <h3 style="margin:0 0 0.5rem 0;">Pronto!</h3>
      <p style="margin:0;">Seu acesso VIP foi garantido. Fique de olho no seu email.</p>
    `;
    form.replaceWith(success);
    wrapper && wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const nome = (form.elements.nome?.value || '').trim();
    const email = (form.elements.email?.value || '').trim();
    const whatsapp = (form.elements.whatsapp?.value || '').trim();

    if (nome.length < 2) {
      showError('Por favor, informe seu nome.');
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      showError('Por favor, informe um email válido.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, whatsapp }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Falha ao enviar.');
      }

      showSuccess();
    } catch (err) {
      showError(err.message || 'Não foi possível enviar agora. Tente novamente.');
      setLoading(false);
    }
  });
})();
