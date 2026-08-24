/* ============================================================
   FILE : js/fullpage.js
   KAAM : FULL PAGE SCRIPT ENGINE - AdLinkFly ke full page
          script jaisa. User isko apni website me lagata hai
          (tools-fullpage.html se code copy karke).

   CONFIG (window._shortify):
     key          -> owner ka uid (kamai isi ko jayegi)
     api          -> is file ka poora URL (origin nikalne ke liye)
     note_domain  -> user ki apni site ka domain (isko chhod dena)
     ad_type      -> interstitial | banner | none
     pages        -> optional array, sirf in paths pe chale

   KAISE: page ke saare external <a href="http..."> links ko
   humare go.html redirect format me badal deta hai:
     /user/go.html#?u=<encoded-url>&o=<owner-uid>&t=<ad-type>
   ============================================================ */
(function () {
    "use strict";

    var cfg = window._shortify;
    if (!cfg || !cfg.key) return;

    /* ---------- Pages filter (agar diya ho) ---------- */
    if (cfg.pages && cfg.pages.length) {
        var path = window.location.pathname;
        var ok = false;
        for (var p = 0; p < cfg.pages.length; p++) {
            if (path.indexOf(cfg.pages[p]) === 0) { ok = true; break; }
        }
        if (!ok) return;
    }

    /* ---------- Apna origin nikalo (api url se) ---------- */
    var myOrigin = "";
    try {
        var cs = document.currentScript;
        if (cs && cs.src) {
            myOrigin = cs.src.substring(0,
                cs.src.lastIndexOf("/") + 1).replace(/js\/$/, "");
        } else if (cfg.api) {
            var a = document.createElement("a");
            a.href = cfg.api;
            myOrigin = a.protocol + "//" + a.host + "/";
        }
    } catch (e) {}
    if (!myOrigin) return;

    var GO_BASE = myOrigin + "user/go.html";
    var MY_DOMAIN = (cfg.note_domain || "").toLowerCase();

    function isExternal(href) {
        if (!/^https?:\/\//i.test(href)) return false;
        if (MY_DOMAIN && href.toLowerCase().indexOf(MY_DOMAIN) !== -1 &&
            href.toLowerCase().indexOf("//" + MY_DOMAIN) !== -1) return false;
        return true;
    }

    function convert(link) {
        var href = link.getAttribute("href");
        if (!href || link.dataset.shortified) return;
        if (!isExternal(href)) return;

        link.dataset.shortified = "1";
        var target = encodeURIComponent(href);
        link.href = GO_BASE + "#?u=" + target +
                    "&o=" + encodeURIComponent(cfg.key) +
                    "&t=" + encodeURIComponent(cfg.ad_type || "interstitial");
    }

    /* ---------- Sab existing links ---------- */
    var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) convert(links[i]);

    /* ---------- Baad me aaye links bhi (dynamic content) ---------- */
    if (window.MutationObserver) {
        new MutationObserver(function () {
            var fresh = document.querySelectorAll('a[href]:not([data-shortified])');
            for (var i = 0; i < fresh.length; i++) convert(fresh[i]);
        }).observe(document.body, { childList: true, subtree: true });
    }

})();
