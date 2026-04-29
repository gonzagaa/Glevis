/* GLEVIS — minimal interactions */
(function () {
  "use strict";

  // VIP form: fake submit + smooth scroll to it from CTA
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

  if (vipForm) {
    vipForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const fd = new FormData(vipForm);
      const data = Object.fromEntries(fd.entries());
      const button = vipForm.querySelector(".vip-form__cta");
      if (!data.nome || !data.email) {
        // gentle inline feedback
        vipForm.querySelectorAll("input").forEach((el) => {
          if (el.required && !el.value) {
            el.style.boxShadow = "0 0 0 2px rgba(180,40,40,.55)";
            el.addEventListener("input", () => (el.style.boxShadow = "none"), { once: true });
          }
        });
        return;
      }
      if (button) {
        const prev = button.textContent;
        button.textContent = "✓ Acesso confirmado";
        button.style.pointerEvents = "none";
        setTimeout(() => {
          button.textContent = prev;
          button.style.pointerEvents = "";
          vipForm.reset();
        }, 2200);
      }
    });
  }
})();
