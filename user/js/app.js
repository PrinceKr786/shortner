/* ============================================================
   FILE      : user/js/app.js
   KAAM      : USER PANEL ENGINE - Firebase helpers + AdminLTE
               shell ke liye common functions.
   DESIGN    : Pages ab AdminLTE skin-blue layout use karte hain
               (bilkul AdLinkFly jaisa). Ye file sirf LOGIC
               handle karti hai - design ki zaroorat nahi.
   EXPORTS   :
     SITE_URL, SITE_NAME       - constants
     showToast(msg,type)       - notification popup
     escapeHtml / formatDate / formatMoney / formatNumber
     generateAlias / isValidUrl / copyToClipboard
     getCurrentUser / requireLogin / doLogout / sendResetEmail
     avatarUrl(email)          - gravatar SHA-256 URL (identicon)
     fillUserHeader(me)        - header me naam+avatar+wallet
     wireLogout()              - logout buttons chalu karta hai
     initShortenModal(me)      - "New Shorten Link" modal chalu
   ============================================================ */

import { auth, db } from "./firebase-config.js";
import {
    onAuthStateChanged, signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    ref, get, child, set, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* ============================================================
   SECTION 1: CONSTANTS
   ============================================================ */
export const SITE_NAME = "Shortify";
export const SITE_URL = (() => {
    const origin = window.location.origin;
    let path = window.location.pathname.replace(/(user\/|admin\/)[^\/]*$/, "/");
    path = path.replace(/\/+$/, "") + "/";
    return origin + path;
})();

/* -------- CURRENCY (admin settings se load hota hai) -------- */
let CURRENCY = "\u20B9";   // default ₹
export function setCurrency(sym) {
    if (sym) CURRENCY = sym;
}
export function getCurrency() { return CURRENCY; }


/* ============================================================
   SECTION 2: FORMAT HELPERS
   ============================================================ */
export function showToast(message, type = "info") {
    // AdminLTE style toast - top right, colored border
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText =
            "position:fixed;top:56px;right:14px;z-index:99999;display:flex;flex-direction:column;gap:8px";
        document.body.appendChild(container);
    }
    const colors = {
        success: "#00a65a", error: "#dd4b39",
        warning: "#f39c12", info: "#00c0ef"
    };
    const t = document.createElement("div");
    t.style.cssText = `
        min-width:250px;max-width:340px;padding:12px 16px;background:#fff;
        border-left:4px solid ${colors[type] || colors.info};
        box-shadow:0 3px 12px rgba(0,0,0,.22);font-size:.9rem;
        border-radius:3px;font-family:'Source Sans Pro',sans-serif`;
    t.textContent = message;
    container.appendChild(t);
    setTimeout(() => {
        t.style.transition = "opacity .4s";
        t.style.opacity = "0";
        setTimeout(() => t.remove(), 400);
    }, 3200);
}

export function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];

export function formatDate(ts) {
    if (!ts) return "-";
    const d = new Date(ts);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(ts) {
    if (!ts) return "-";
    const d = new Date(ts);
    let h = d.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${formatDate(ts)} ${h}:${String(d.getMinutes()).padStart(2,"0")} ${ampm}`;
}

export function formatMoney(n) {
    return CURRENCY + (Number(n) || 0).toFixed(2);
}

export function formatNumber(n) {
    n = n || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return String(n);
}


/* ============================================================
   SECTION 3: VALIDATION HELPERS
   ============================================================ */
export function isValidUrl(str) {
    try {
        const u = new URL(str);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

export function generateAlias() {
    const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 6; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
}

export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback purane browsers ke liye
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch {}
        ta.remove();
        return true;
    }
}


/* ============================================================
   SECTION 4: AUTH GUARDS
   ============================================================ */
export function getCurrentUser() {
    return new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (u) => {
            unsub();
            resolve(u ? {
                uid: u.uid,
                email: u.email,
                name: u.displayName || u.email.split("@")[0]
            } : null);
        });
    });
}

/**
 * LOGIN GUARD - bina login kuch nahi dikhega.
 * Disabled account bhi check hota hai.
 * @returns {Promise<Object>} user profile (uid,name,email,wallet...)
 */
export async function requireLogin() {
    const u = await getCurrentUser();

    if (!u) {
        location.href = "signin.html";
        return new Promise(() => {});
    }

    // Profile load + disabled check
    try {
        const snap = await get(child(ref(db), `users/${u.uid}`));
        const profile = snap.val();
        if (!profile) throw new Error("no-profile");
        if (profile.disabled) {
            await signOut(auth);
            alert("Aapka account band kar diya gaya hai.");
            location.href = "signin.html";
            return new Promise(() => {});
        }

        // SETTINGS LOAD (currency + site name)
        try {
            const sSnap = await get(child(ref(db), "settings"));
            const s = sSnap.val() || {};
            setCurrency(s.currency_symbol || "\u20B9");
            // SITE_NAME is const, can't change but pages can read settings directly if needed
        } catch { /* defaults */ }

        return {
            uid: u.uid,
            email: u.email,
            name: profile.name || u.name,
            referral_code: profile.referral_code || "",
            wallet_money: Number(profile.wallet_money) || 0,
            total_withdrawn: Number(profile.total_withdrawn) || 0,
            created_at: profile.created_at
        };
    } catch {
        location.href = "signin.html";
        return new Promise(() => {});
    }
}

export async function doLogout() {
    try {
        await signOut(auth);
        location.href = "signin.html";
    } catch (err) {
        showToast("Logout fail: " + err.message, "error");
    }
}

export async function sendResetEmail(email) {
    await sendPasswordResetEmail(auth, email);
}


/* ============================================================
   SECTION 5: GRAVATAR AVATAR (SHA-256 - AdLinkFly jaisa)
   Email hash banake gravatar pe bhejta hai; account na ho to
   identicon dikhta hai (d=identicon).
   ============================================================ */
async function sha256Hex(str) {
    const buf = await crypto.subtle.digest(
        "SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function avatarUrl(email, size = 160) {
    try {
        const hash = await sha256Hex(String(email || "user").trim().toLowerCase());
        return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
    } catch {
        return `https://ui-avatars.com/api/?size=${size}&background=2980f3&color=fff&name=${encodeURIComponent(email || "U")}`;
    }
}


/* ============================================================
   SECTION 6: MEMBER SHELL HELPERS
   Har member page ka main-header (naam/avatar/wallet) +
   logout buttons wire karna.
   ============================================================ */
export async function fillUserHeader(me) {
    // Top-right user menu
    const url = await avatarUrl(me.email);

    const nameEl = document.getElementById("header-name");
    if (nameEl) nameEl.textContent = me.name;

    const imgEl = document.getElementById("header-avatar");
    if (imgEl) imgEl.src = url;

    const dropImg = document.getElementById("dropdown-avatar");
    if (dropImg) dropImg.src = url;

    const sinceEl = document.getElementById("member-since");
    if (sinceEl && me.created_at) sinceEl.textContent = formatDate(me.created_at);

    // Sidebar wallet balance (agar page pe hai)
    const walEl = document.getElementById("wallet-balance");
    if (walEl) walEl.textContent = formatMoney(me.wallet_money);
}

export function wireLogout() {
    ["logout-btn", "sidebar-logout"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("click", (e) => {
                e.preventDefault();
                doLogout();
            });
        }
    });
}


/* ============================================================
   SECTION 7: NEW SHORTEN LINK MODAL
   Sidebar wala button ek modal kholta hai (#shorten-modal).
   Ye function uska poora logic chalata hai - har page pe
   bas initShortenModal(me) call karo.
   ============================================================ */
export function initShortenModal(me) {
    const form = document.getElementById("modal-shorten-form");
    if (!form) return;

    const urlInput = document.getElementById("modal-url-input");
    const aliasInput = document.getElementById("modal-alias-input");
    const resultBox = document.getElementById("modal-result");
    const resultLink = document.getElementById("modal-result-link");
    const errEl = document.getElementById("modal-error");
    const submitBtn = document.getElementById("modal-submit");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errEl.classList.add("hidden");

        const longUrl = urlInput.value.trim();
        if (!isValidUrl(longUrl)) {
            errEl.textContent =
                "Valid URL dalo (http:// ya https:// se shuru hona chahiye)";
            errEl.classList.remove("hidden");
            return;
        }

        submitBtn.disabled = true;

        try {
            let alias = aliasInput.value.trim() || generateAlias();

            if (aliasInput.value.trim()) {
                const exists = await get(ref(db, `aliases/${alias}`));
                if (exists.exists()) {
                    throw new Error(`"${alias}" pehle le liya gaya hai.`);
                }
            } else {
                for (let i = 0; i < 5; i++) {
                    const exists = await get(ref(db, `aliases/${alias}`));
                    if (!exists.exists()) break;
                    alias = generateAlias();
                }
            }

            await set(ref(db, `aliases/${alias}`), {
                url: longUrl,
                title: new URL(longUrl).hostname,
                uid: me.uid,
                clicks: 0,
                status: "active",
                created_at: Date.now()
            });

            runTransaction(ref(db, "stats/total_links"),
                (cur) => (cur || 0) + 1);

            const shortUrl = SITE_URL + "#" + alias;
            resultLink.href = shortUrl;
            resultLink.textContent = shortUrl;
            resultBox.classList.remove("hidden");

            form.reset();
            showToast("Link ban gaya! \uD83C\uDF89", "success");

        } catch (err) {
            errEl.textContent = err.message;
            errEl.classList.remove("hidden");
        } finally {
            submitBtn.disabled = false;
        }
    });

    // Copy button modal ke andar
    const mCopy = document.getElementById("modal-copy");
    if (mCopy) {
        mCopy.addEventListener("click", async () => {
            await copyToClipboard(resultLink.textContent);
            mCopy.innerHTML = '<i class="fa fa-check"></i> Copied!';
            setTimeout(() => {
                mCopy.innerHTML = '<i class="fa fa-clipboard"></i> Copy';
            }, 2000);
        });
    }
}
