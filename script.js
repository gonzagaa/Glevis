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
    const success = document.createElement('div');
    success.className = 'vip-form__success';
    success.setAttribute('role', 'status');
    success.setAttribute('aria-live', 'polite');
    success.innerHTML = `
      <span class="vip-form__success-rule" aria-hidden="true"></span>
      <h3 class="vip-form__success-title">Você está dentro.</h3>
      <p class="vip-form__success-message">
        O convite VIP chega no seu email em instantes.<br>
        Fique de olho — o movimento começa em breve.
      </p>
      <span class="vip-form__success-signature" aria-hidden="true">— Glevis</span>
    `;
    form.replaceWith(success);
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

/* ============================================================
   GLEVIS — premium GSAP animations
   - Editorial fashion feel: slow, subtle, blur-lift reveals,
     curtain clip-path on imagery, scrub parallax on the watermark
     and on the hero/form imagery.
   - Layout-safe: only opacity / filter / clip-path / transform.
   - Respects prefers-reduced-motion (the head pre-flag is skipped,
     and this module exits early if reduced motion is requested).
   - Fail-safe: if GSAP fails to load, the head pre-flag self-clears
     after 2.5s, so nothing can stay invisible.
   ============================================================ */
(function glevisAnimations() {
  if (typeof window.gsap === 'undefined') return;

  const reduced = window.matchMedia &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    document.documentElement.classList.remove('gsap-pending');
    return;
  }

  const hasST = typeof window.ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ------------------------------------------------------------
     HERO — load timeline
     Slow video settle + blur-lift headline + soft CTA + logo.
     ------------------------------------------------------------ */
  const heroVideo    = $('.hero__video');
  const heroHeadline = $('.hero__headline');
  const heroCta      = $('.hero__cta');
  const heroLogo     = $('.hero__logo');

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.05 });

  if (heroVideo) {
    /* The video's resting opacity is set in CSS (~0.6) so it composes
       cleanly with mix-blend-mode: luminosity. Read the true resting
       value (lifting the pending flag while we measure) so the fade
       resolves to the designed value rather than 1. */
    const wasPending = document.documentElement.classList.contains('gsap-pending');
    if (wasPending) document.documentElement.classList.remove('gsap-pending');
    const restingOpacity = parseFloat(getComputedStyle(heroVideo).opacity) || 1;
    if (wasPending) document.documentElement.classList.add('gsap-pending');

    heroTl.fromTo(heroVideo,
      { opacity: 0, scale: 1.08 },
      { opacity: restingOpacity, scale: 1, duration: 2.4, ease: 'power2.out' },
      0
    );
  }
  if (heroHeadline) {
    heroTl.fromTo(heroHeadline,
      { opacity: 0, y: 24, filter: 'blur(10px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4 },
      0.25
    );
  }
  if (heroCta) {
    heroTl.fromTo(heroCta,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 1.0 },
      0.75
    );
  }
  if (heroLogo) {
    heroTl.fromTo(heroLogo,
      { opacity: 0, scale: 0.94, y: 8 },
      { opacity: 1, scale: 1, y: 0, duration: 1.0 },
      0.95
    );
  }

  /* ------------------------------------------------------------
     SECTION 1 — círculo / pré-save
     ------------------------------------------------------------ */
  if (hasST) {
    const imgLeft        = $('.section-circle__img-left');
    const imgRight       = $('.section-circle__img-right');
    const watermark      = $('.watermark');
    const circleTitle    = $('.section-circle__title');
    const circleSubtitle = $('.section-circle__subtitle');
    const benefits       = $('.benefits');
    const benefitItems   = $$('.benefit');

    /* Curtain reveals on the editorial imagery — different directions
       for left vs right to give the section a subtle editorial cadence. */
    if (imgLeft) {
      gsap.fromTo(imgLeft,
        { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
        {
          opacity: 1, clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.4, ease: 'power3.out',
          scrollTrigger: { trigger: imgLeft, start: 'top 85%' }
        }
      );
    }
    if (imgRight) {
      gsap.fromTo(imgRight,
        { opacity: 0, clipPath: 'inset(100% 0 0 0)' },
        {
          opacity: 1, clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.4, ease: 'power3.out',
          scrollTrigger: { trigger: imgRight, start: 'top 85%' }
        }
      );
    }

    /* Soft parallax drift on the oversized watermark. */
    if (watermark) {
      gsap.fromTo(watermark,
        { yPercent: 6 },
        {
          yPercent: -6, ease: 'none',
          scrollTrigger: {
            trigger: '.section-circle',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          }
        }
      );
    }

    /* Centered titles use translateX(-50%) on desktop — keep transforms
       untouched and use opacity + blur only for a clean lift. */
    if (circleTitle) {
      gsap.fromTo(circleTitle,
        { opacity: 0, filter: 'blur(8px)' },
        {
          opacity: 1, filter: 'blur(0px)',
          duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: circleTitle, start: 'top 88%' }
        }
      );
    }
    if (circleSubtitle) {
      gsap.fromTo(circleSubtitle,
        { opacity: 0, filter: 'blur(6px)' },
        {
          opacity: 1, filter: 'blur(0px)',
          duration: 1.1, ease: 'power3.out', delay: 0.1,
          scrollTrigger: { trigger: circleSubtitle, start: 'top 90%' }
        }
      );
    }

    /* Benefits card + items in a single chained reveal. */
    if (benefits) {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: benefits, start: 'top 85%' },
        defaults: { ease: 'power3.out' },
      });
      tl.fromTo(benefits,
        { opacity: 0, filter: 'blur(8px)' },
        { opacity: 1, filter: 'blur(0px)', duration: 1.0 }
      );
      if (benefitItems.length) {
        tl.fromTo(benefitItems,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 },
          '-=0.45'
        );
      }
    }
  }

  /* ------------------------------------------------------------
     SECTION 2 — formulário VIP
     ------------------------------------------------------------ */
  if (hasST) {
    const formImg    = $('.section-form__img');
    const formTitle  = $('.form-block__title');
    const formInputs = $$('.vip-input');
    const formCta    = $('.vip-form__cta');

    if (formImg) {
      gsap.fromTo(formImg,
        { opacity: 0, scale: 1.06, clipPath: 'inset(0 0 100% 0)' },
        {
          opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.6, ease: 'power3.out',
          scrollTrigger: { trigger: formImg, start: 'top 85%' }
        }
      );
      /* Subtle long-form parallax once the curtain has resolved. */
      gsap.fromTo(formImg,
        { yPercent: -3 },
        {
          yPercent: 3, ease: 'none',
          scrollTrigger: {
            trigger: '.section-form',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          }
        }
      );
    }

    if (formTitle) {
      gsap.fromTo(formTitle,
        { opacity: 0, y: 20, filter: 'blur(6px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: formTitle, start: 'top 88%' }
        }
      );
    }
    if (formInputs.length) {
      gsap.fromTo(formInputs,
        { opacity: 0, y: 18 },
        {
          opacity: 1, y: 0,
          duration: 0.9, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: formInputs[0], start: 'top 90%' }
        }
      );
    }
    if (formCta) {
      gsap.fromTo(formCta,
        { opacity: 0, y: 18, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 1.0, ease: 'power3.out',
          scrollTrigger: { trigger: formCta, start: 'top 92%' }
        }
      );
    }
  }

  /* ------------------------------------------------------------
     FOOTER — quiet stagger
     ------------------------------------------------------------ */
  if (hasST) {
    const footerTargets = $$(
      '.footer__logo, .footer__tagline, .footer__socials, .footer__copyright'
    );
    if (footerTargets.length) {
      gsap.fromTo(footerTargets,
        { opacity: 0, y: 14 },
        {
          opacity: 1, y: 0,
          duration: 0.9, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: '.footer', start: 'top 90%' }
        }
      );
    }
  }

  /* All initial states are now applied as inline styles by fromTo() —
     dropping the CSS pending flag will not flash the elements. */
  document.documentElement.classList.remove('gsap-pending');
})();
