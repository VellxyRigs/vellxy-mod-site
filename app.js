(function () {
    "use strict";

    var SITE = window.location.origin;
    var RETURN_URL = SITE + "/?paid=1";
    var payForm = document.getElementById("paypal-form");
    if (payForm) {
        payForm.querySelector('input[name="return"]').value = RETURN_URL;
    }

    var unlockKey = Math.random().toString(36).slice(2, 12).toUpperCase();
    var keyEl = document.getElementById("install-key");
    if (keyEl) keyEl.textContent = unlockKey;
    var dlLink = document.getElementById("dl-link");
    if (dlLink) dlLink.setAttribute("href", "downloads/Vellxy Mod.jar?key=" + unlockKey);

    var paid = new URLSearchParams(window.location.search).get("paid");
    var dlBox = document.getElementById("download-box");
    if (paid === "1" && dlBox) {
        dlBox.classList.remove("hidden");
        var btn = document.getElementById("pay-btn");
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Unlocked ✓";
        }
    }
})();