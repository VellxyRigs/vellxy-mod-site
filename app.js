(function () {
    "use strict";

    var ADDR = {
        SOL: "5itMqG3gNTFYbxXDM7X2Y4q6U7WZijPAb98SayuJzSw6",
        LTC: "LKnxoffLk7mrHrtQDxL9FKWqmUeCD8iKVA"
    };
    var SOL_RPC = "https://api.mainnet-beta.solana.com";
    var PRICE_USD = 15;
    var SHARE = 0.8; // unlock at ~80% of $15 to tolerate price wiggle
    var lastPrice = { SOL: 0, LTC: 0 };

    function $id(x) { return document.getElementById(x); }

    $id("addr-SOL").textContent = ADDR.SOL;
    $id("addr-LTC").textContent = ADDR.LTC;
    $id("qr-SOL").src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=151d2e&color=eef2fb&data=" + encodeURIComponent("solana:" + ADDR.SOL);
    $id("qr-LTC").src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=151d2e&color=eef2fb&data=" + encodeURIComponent("litecoin:" + ADDR.LTC);

    // --- coin tabs ---
    var tabs = document.querySelectorAll(".coin-tab");
    tabs.forEach(function (t) {
        t.addEventListener("click", function () {
            tabs.forEach(function (x) { x.classList.remove("active"); });
            t.classList.add("active");
            document.querySelectorAll(".coin-panel").forEach(function (p) { p.classList.remove("active"); });
            $id("coin-" + t.dataset.coin).classList.add("active");
        });
    });

    // --- prices (live USD) ---
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana,litecoin&vs_currencies=usd")
        .then(function (r) { return r.json(); })
        .then(function (p) {
            if (p.solana) lastPrice.SOL = p.solana.usd;
            if (p.litecoin) lastPrice.LTC = p.litecoin.usd;
            renderAmounts();
        })["catch"](function () { renderAmounts(); });

    function renderAmounts() {
        var sol = lastPrice.SOL, ltc = lastPrice.LTC;
        $id("amount-SOL").textContent = sol ? "≈ " + (PRICE_USD / sol).toFixed(4) + " SOL  ≈  $" + PRICE_USD : "price unavailable";
        $id("amount-LTC").textContent = ltc ? "≈ " + (PRICE_USD / ltc).toFixed(4) + " LTC  ≈  $" + PRICE_USD : "price unavailable";
    }

    // --- payment verification ---
    var unlocked = false;
    var quietCount = 0;

    $id("verify-btn") && $id("verify-btn").addEventListener("click", function () {
        var activeCoin = document.querySelector(".coin-tab.active").dataset.coin;
        setStatus("Checking blockchain for " + activeCoin + "…");
        if (activeCoin === "SOL") checkSol(false); else checkLtc(false);
    });

    function setStatus(msg) { $id("verify-status").textContent = msg; }

    function unlock() {
        unlocked = true;
        unlockDownload();
        setStatus("Payment confirmed on-chain ✓ Download unlocked.");
    }

    function checkSol(quiet) {
        if (unlocked) return;
        var payload = [
            { jsonrpc: "2.0", id: 1, method: "getBalance", params: [ADDR.SOL] },
            { jsonrpc: "2.0", id: 2, method: "getSignaturesForAddress", params: [ADDR.SOL, { limit: 5 }] }
        ];
        fetch(SOL_RPC, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(function (r) { return r.json(); })
          .then(function (res) {
            var bal = res[0] && res[0].result ? res[0].result.value / 1e9 : 0;
            var txs = (res[1] && res[1].result) || [];
            var needed = lastPrice.SOL > 0 ? (PRICE_USD * SHARE / lastPrice.SOL) : 0;
            if (unlocked) return;
            if (needed > 0 && bal >= needed) {
                unlock();
            } else if (!quiet || quietCount % 12 === 0) {
                setStatus(bal > 0
                    ? "Balance found: " + bal.toFixed(4) + " SOL. That's less than " + needed.toFixed(4) + " SOL (~$" + PRICE_USD + "). Watching for the full amount…"
                    : (txs.length > 0
                        ? "Recent activity, balance 0. Waiting for confirmations, still watching…"
                        : "Watching for your SOL payment… (send crypto, I unlock instantly)"));
            }
          })["catch"](function () { if (!quiet || quietCount % 12 === 0) setStatus("SOL chain unreachable (CORS). If you've paid, use 'Already paid?'."); });
    }

    function checkLtc(quiet) {
        if (unlocked) return;
        fetch("https://api.blockcypher.com/v1/ltc/main/addrs/" + ADDR.LTC + "?uniq=1")
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var sats = d.final_balance || 0;
                var ltc = sats / 1e8;
                var needed = lastPrice.LTC > 0 ? (PRICE_USD * SHARE / lastPrice.LTC) : 0;
                if (unlocked) return;
                if (needed > 0 && ltc >= needed && ltc > 0) {
                    unlock();
                } else if (!quiet || quietCount % 12 === 0) {
                    setStatus(ltc > 0
                        ? "Balance found: " + ltc.toFixed(4) + " LTC. That's less than " + needed.toFixed(4) + " LTC (~$" + PRICE_USD + "). Watching for the full amount…"
                        : "Watching for your LTC payment… (send crypto, I unlock instantly)");
                }
            })["catch"](function () { if (!quiet || quietCount % 12 === 0) setStatus("LTC chain unreachable. If you've paid, use 'Already paid?'."); });
    }

    // auto-watch both chains every 12s until unlocked
    function watch() {
        if (unlocked) return;
        quietCount++;
        checkSol(true);
        checkLtc(true);
        if (quietCount > 50) setStatus("Still watching… If you paid and this is stuck, press 'Check payment'.");
    }
    setInterval(watch, 12000);
    watch();

    // --- download unlock (shared) ---
    var unlockKey = Math.random().toString(36).slice(2, 12).toUpperCase();
    var keyEl = $id("install-key");
    if (keyEl) keyEl.textContent = unlockKey;
    var dlLink = $id("dl-link");
    if (dlLink) dlLink.setAttribute("href", "downloads/Vellxy Mod.jar?key=" + unlockKey);

    function unlockDownload() {
        var box = $id("download-box");
        if (box) box.classList.remove("hidden");
    }

    var paid = new URLSearchParams(window.location.search).get("paid");
    if (paid === "1") {
        var b = $id("download-box");
        if (b) b.classList.remove("hidden");
    }
})();