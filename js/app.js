/* ============================================================
   FILE      : js/app.js
   KAAM      : Common helper functions jo HAR page use karta
               hai. Isme 3 tarah ke kaam hain:

     A) UI Helpers    - toast messages, copy button, date format
     B) Auth Guards   - login check (bina login page na khule)
     C) Navbar/User   - har page pe navbar & user info render

   USE Kaise Karein:
     <script type="module">
       import { showToast, requireLogin } from "../js/app.js";
       await requireLogin();        // login check
       showToast("Ho gaya!", "success");
     </script>
   ============================================================ */

import { auth, db } from "./firebase-config.js";
import {
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    ref,
    get,
    child
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* ============================================================
   SECTION A: SITE SETTINGS (chhoti config)
   ============================================================ */

export let CURRENCY = "\u20B9";   // default ₹
export function setCurrency(sym) { if (sym) CURRENCY = sym; }
export function getCurrency() { return CURRENCY; }

/* Site ka naam - yahan ek baar badlo, sab jagah change hoga */
export const SITE_NAME = "Shortify";

/* Site ka base URL (short links isi se banenge).
   GitHub Pages pe auto-detect karta hai, custom domain ke liye override kar sakte hain. */
export const SITE_URL = (() => {
    const origin = window.location.origin;
    let path = window.location.pathname;
    if (path !== "/") {
        const parts = path.split("/").filter(Boolean);
        if (parts.length > 0) {
            path = "/" + parts[0] + "/";
        } else {
            path = "/";
        }
    } else {
        path = "/";
    }
    return origin + path;
})();


/* ============================================================
   SECTION B: UI HELPERS
   ============================================================ */

/**
 * Chhota popup message dikhata hai (3 second me gayab).
 * @param {string} message - Jo message dikhana hai
 * @param {string} type    - "success" | "error" | "warning" | "info"
 * @example showToast("Link copy ho gaya!", "success")
 */
export function showToast(message, type = "info") {
    // Container nahi hai to bana lo (har page pe ek hi baar)
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    // Toast element banao
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // 3 second baad hata do
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * HTML injection se bachne ke liye text ko safe banata hai.
 * User ke likhe hue data ko DIRECT html me dalne se pehle
 * HAMESHA isse pass karo (security ke liye zaroori!).
 * @param {string} str - Unsafe text
 * @returns {string} Safe text
 */
export function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replaceAll("&",  "&amp;")
        .replaceAll("<",  "&lt;")
        .replaceAll(">",  "&gt;")
        .replaceAll('"',  "&quot;")
        .replaceAll("'",  "&#039;");
}

/**
 * Timestamp ko readable date me convert karta hai.
 * @param {number} ts - Milliseconds me timestamp
 * @returns {string} "12 Aug 2026" format
 */
export function formatDate(ts) {
    if (!ts) return "-";
    const d = new Date(ts);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Number ko readable banata hai (12500 -> 12.5K).
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000)    return (n / 1000).toFixed(1)    + "K";
    return String(n || 0);
}

/**
 * Text clipboard pe copy karta hai.
 * @param {string} text
 * @returns {Promise<boolean>} copy hua ya nahi
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Purane browsers ke liye fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        return true;
    }
}

/**
 * URL sahi format me hai ya nahi check karta hai.
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
    try {
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * Random chhota alias generate karta hai.
 * e.g. "aB3xK9" (6 character, confusing letters hata ke)
 * @param {number} length - Kitne character (default 6)
 * @returns {string}
 */
export function generateAlias(length = 6) {
    // l,1,I,O,0 hataye kyunki dikhte same hain
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}


/* ============================================================
   SECTION C: AUTH GUARDS
   Ye functions check karte hain ki user logged in hai ya nahi.
   Har protected page ke script me sabse pehle call hota hai.
   ============================================================ */

/**
 * Current logged-in user ka object laata hai.
 * Login nahi hai to null return karta hai.
 * @returns {Promise<Object|null>} { uid, email, name, role, ... }
 */
export function getCurrentUser() {
    return new Promise((resolve) => {
        // Firebase khud batayega jab auth state pata chalega
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            unsubscribe(); // Ek hi baar sunna hai, band karo

            if (!firebaseUser) {
                resolve(null);
                return;
            }

            // Firebase Auth me sirf email/password hota hai.
            // Baaki details (name, role) Realtime Database se laate hain
            try {
                const snapshot = await get(child(ref(db), `users/${firebaseUser.uid}`));
                const userData = snapshot.val() || {};

                resolve({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: userData.name || firebaseUser.email.split("@")[0],
                    role: userData.role || "user",
                    disabled: userData.disabled || false,
                    created_at: userData.created_at || null
                });
            } catch {
                // DB se data nahi mila par user logged in hai
                resolve({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.email.split("@")[0],
                    role: "user",
                    disabled: false
                });
            }
        });
    });
}

/**
 * LOGIN CHECK: Agar user login nahi hai to login page pe
 * bhej do. Protected pages (dashboard etc.) me use karo.
 * @returns {Promise<Object>} user data (kabhi null nahi ayega)
 */
export async function requireLogin() {
    const user = await getCurrentUser();

    if (!user) {
        // Next page yaad rakho taaki login ke baad wapas aye
        sessionStorage.setItem("redirect_after_login", location.href);
        location.href = getRelativePath() + "user/index.html?error=login-required";
        return new Promise(() => {}); // Redirect ho raha hai, ruk jao
    }

    // Admin ne account disable kiya ho to logout kar do
    if (user.disabled) {
        await signOut(auth);
        alert("Aapka account disable kiya gaya hai. Admin se contact karo.");
        location.href = getRelativePath() + "user/index.html?error=disabled";
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

/**
 * ADMIN CHECK: Sirf admin ko aage jaane deta hai.
 * Normal user ko home pe bhej deta hai.
 * @returns {Promise<Object>} admin user data
 */
export async function requireAdmin() {
    const user = await requireLogin();

    // admins/{uid} node exist karta hai? (double-check security)
    let isAdmin = user.role === "admin";
    try {
        const snap = await get(ref(db, `admins/${user.uid}`));
        if (snap.exists()) isAdmin = true;
    } catch { /* ignore */ }

    if (!isAdmin) {
        showToast("Sirf admin hi ye page khol sakta hai!", "error");
        setTimeout(() => {
            location.href = getRelativePath() + "user/dashboard.html";
        }, 1200);
        return new Promise(() => {}); // Redirect ho raha hai
    }

    // SETTINGS LOAD (currency) - requireLogin already loaded it but re-load for safety
    try {
        const sSnap = await get(child(ref(db), "settings"));
        const s = sSnap.val() || {};
        setCurrency(s.currency_symbol || "\u20B9");
    } catch { /* defaults */ }

    return user;
}

/**
 * Logout karta hai aur home page pe bhej deta hai.
 */
export async function doLogout() {
    try {
        await signOut(auth);
        showToast("Logout ho gaya!", "success");
        setTimeout(() => {
            location.href = getRelativePath() + "index.html";
        }, 600);
    } catch (err) {
        showToast("Logout fail: " + err.message, "error");
    }
}

/**
 * Password reset email bhejta hai.
 * @param {string} email
 */
export async function sendResetEmail(email) {
    await sendPasswordResetEmail(auth, email);
}


/* ============================================================
   SECTION D: NAVBAR RENDER
   Har page pe navbar automatically ban jata hai.
   Logged-in ho to "Dashboard" dikhta hai, warna "Login".
   ============================================================ */

/**
 * Root folder tak relative path nikalta hai.
 * (user/index.html se "../" chahiye, index.html se "" chahiye)
 * @returns {string} "../" ya ""
 */
function getRelativePath() {
    const depth = location.pathname.split("/").length -
                  location.pathname.replace(/\/$/, "").split("/").length;
    // Agar file .html pe hai to ek level kam
    if (location.pathname.endsWith(".html")) {
        const parts = location.pathname.split("/");
        parts.pop();
        return "../".repeat(Math.max(0, parts.length - 1));
    }
    return "../".repeat(Math.max(0, depth));
}

// getRelativePath ko bahar bhi chahiye (auth guards me use hota hai)
export { getRelativePath };

/**
 * Page load hote hi navbar render karo.
 * @param {string} activePage - Kaunsa link highlighted ho
 *                              ("home" | "login" | ...)
 */
export async function renderNavbar(activePage = "") {
    const el = document.getElementById("navbar");
    if (!el) return; // Page pe navbar nahi hai

    const user = await getCurrentUser();
    const root = getRelativePath();

    // Right side buttons decide karo (logged-in ya guest)
    let rightSide;
    if (user) {
        rightSide = `
            <li><a href="${root}user/dashboard.html">Dashboard</a></li>
            <li><a href="#" id="nav-logout">Logout (${escapeHtml(user.name)})</a></li>
        `;
    } else {
        rightSide = `
            <li><a href="${root}user/index.html">Login</a></li>
            <li><a href="${root}user/index.html#signup" class="btn btn-primary btn-sm"
                   style="color:#fff">Sign Up Free</a></li>
        `;
    }

    el.className = "navbar";
    el.innerHTML = `
        <div class="container">
            <div class="navbar-inner">
                <a href="${root}index.html" class="brand">
                    <span class="brand-icon">S</span>
                    ${SITE_NAME}
                </a>

                <button class="nav-toggle" id="nav-toggle-btn">&#9776;</button>

                <ul class="nav-links" id="nav-links">
                    <li><a href="${root}index.html"
                           class="${activePage === "home" ? "active" : ""}">Home</a></li>
                    ${rightSide}
                </ul>
            </div>
        </div>
    `;

    // Mobile hamburger toggle
    document.getElementById("nav-toggle-btn")?.addEventListener("click", () => {
        document.getElementById("nav-links").classList.toggle("open");
    });

    // Logout button (agar logged-in hai)
    document.getElementById("nav-logout")?.addEventListener("click", (e) => {
        e.preventDefault();
        doLogout();
    });
}


/* ============================================================
   SECTION E: THEME TOGGLE (Dark/Light mode)
   ============================================================ */

/**
 * Dark/Light mode toggle karo. Choice localStorage me save
 * hoti hai (page refresh pe bhi yaad rahega).
 */
export function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
}

/**
 * Saved theme apply karo (har page load pe call hota hai).
 */
export function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved) {
        document.documentElement.setAttribute("data-theme", saved);
    }
}
