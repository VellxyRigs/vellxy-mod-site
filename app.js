(function () {
    "use strict";

    var unlockKey = Math.random().toString(36).slice(2, 12).toUpperCase();
    var keyEl = document.getElementById("install-key");
    if (keyEl) keyEl.textContent = unlockKey;
    var dlLink = document.getElementById("dl-link");
    if (dlLink) dlLink.setAttribute("href", "downloads/Vellxy Mod.jar?key=" + unlockKey);

    var reveal = document.getElementById("reveal-link");
    if (reveal) {
        reveal.addEventListener("click", function () {
            document.getElementById("download-box").classList.remove("hidden");
            reveal.style.display = "none";
        });
    }

    var paid = new URLSearchParams(window.location.search).get("paid");
    if (paid === "1") {
        var box = document.getElementById("download-box");
        if (box) box.classList.remove("hidden");
    }
})();