(() => {
  "use strict";

  const forms = document.querySelectorAll(".needs-validation");

  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      },
      false,
    );
  });

  document.addEventListener("click", (event) => {
    const closeBtn = event.target.closest("[data-flash-close]");
    if (!closeBtn) return;

    const flash = closeBtn.closest("[data-flash]");
    if (flash) flash.remove();
  });
})();
