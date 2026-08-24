/* ============================================================
   FILE      : admin/js/app.js
   KAAM      : ADMIN PANEL ENGINE - Firebase helpers + AdminLTE
               shell ke common functions.
   DESIGN    : Admin pages AdminLTE skin-black layout use karte
               hain (bilkul AdLinkFly ke Control Panel jaisa).
   EXPORTS   :
     SITE_URL, SITE_NAME     - constants
     showToast / escapeHtml / formatDate / formatDateTime /
     formatMoney / formatNumber
     getCurrentUser          - auth state promise
     verifyAdmin(uid)        - DOUBLE check (role + admins node)
     requireAdmin()          - har admin page ka guard
     doLogout / wireLogout
     avatarUrl(email)        - gravatar identicon
     fillAdminHeader(me)     - header me naam+avatar bharta hai
   SECURITY  : requireAdmin() do jagah check karta hai:
                 1) users/{uid}/role === "admin"
                 2) admins/{uid} === true
               Dono pass hona zaroori hai.
   ============================================================ */

import { auth, db } from "./firebase-config.js";
import {
    onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    ref, get, child
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* ============================================================
   SECTION 1: CONSTANTS
   ============================================================ */
export const SITE_NAME = "Shortify";
export const SITE_URL = window.location.origin +
    window.location.pathname.replace(/(user\/|admin\/)[^\/]*$/, "/");

/* -------- CURRENCY (admin settings se load hota hai) -------- */
let CURRENCY = "\u20B9";   // default ₹
export function setCurrency(sym) {
    if (sym) CURRENCY = sym;
}
export function getCurrency() { return CURRENCY; }


/* ============================================================
   SECTION 2: FORMAT HELPERS (user/js/app.js jaise hi)
   ============================================================ */
export function showToast(message, type = "info") {
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
   SECTION 3: ADMIN AUTH GUARD (double verification)
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
 * UID sach me admin hai? Dono checks pass hone chahiye.
 * @param {string} uid
 * @returns {Promise<boolean>}
 */
export async function verifyAdmin(uid) {
    // Check 1: role field
    try {
        const userSnap = await get(child(ref(db), `users/${uid}`));
        if (userSnap.val()?.role !== "admin") return false;
    } catch { return false; }

    // Check 2: admins node entry
    try {
        const adminSnap = await get(ref(db, `admins/${uid}`));
        return adminSnap.exists() && adminSnap.val() === true;
    } catch { return false; }
}

/**
 * ADMIN GUARD - har admin page pe sabse pehle call hota hai.
 * Login nahi / admin nahi -> turant login page ya home.
 * @returns {Promise<Object>} admin user data
 */
export async function requireAdmin() {
    const user = await getCurrentUser();

    // Login hi nahi hai -> admin login pe bhejo
    if (!user) {
        location.href = "index.html";
        return new Promise(() => {});
    }

    // Admin verify karo (double-check)
    if (!(await verifyAdmin(user.uid))) {
        await signOut(auth);
        alert("Ye account admin nahi hai. Access denied!");
        location.href = "../index.html";
        return new Promise(() => {});
    }

    // SETTINGS LOAD (currency)
    try {
        const sSnap = await get(child(ref(db), "settings"));
        const s = sSnap.val() || {};
        setCurrency(s.currency_symbol || "\u20B9");
    } catch { /* defaults */ }

    return user;
}

export async function doLogout() {
    try {
        await signOut(auth);
        location.href = "index.html";   // admin ka apna login page
    } catch (err) {
        showToast("Logout fail: " + err.message, "error");
    }
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
   SECTION 4: GRAVATAR AVATAR (SHA-256)
   ============================================================ */
async function sha256Hex(str) {
    const buf = await crypto.subtle.digest(
        "SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function avatarUrl(email, size = 160) {
    try {
        const hash = await sha256Hex(String(email || "admin").trim().toLowerCase());
        return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
    } catch {
        return `https://ui-avatars.com/api/?size=${size}&background=222d32&color=ffc&name=${encodeURIComponent(email || "A")}`;
    }
}


/* ============================================================
   SECTION 5: ADMIN SHELL HELPER
   main-header me naam/avatar bharna.
   ============================================================ */
export async function fillAdminHeader(me) {
    const url = await avatarUrl(me.email);

    const nameEl = document.getElementById("header-name");
    if (nameEl) nameEl.textContent = me.name;

    const imgEl = document.getElementById("header-avatar");
    if (imgEl) imgEl.src = url;

    const dropImg = document.getElementById("dropdown-avatar");
    if (dropImg) dropImg.src = url;

    const emailEl = document.getElementById("dropdown-email");
    if (emailEl) emailEl.textContent = me.email;
}
