# Shortify — Free URL Shortener (100% AdLinkFly Look)

HTML + Firebase se bana URL shortener — **bilkul AdLinkFly jaisa dikhta hai**
kyunki uske asli vendor assets (Bootstrap, AdminLTE, Font Awesome, jQuery)
aur images use hote hain. Koi PHP nahi, koi server nahi — sab kuch FREE
hosting (GitHub Pages) pe chalta hai.

**PANELS ALAG-ALAG DEPLOY HO SAKTE HAIN:**
`user/` aur `admin/` dono folders **self-contained** hain — apna apna
vendor/theme/js rakhte hain. Chaaho to teen alag GitHub repos banao.

---

## 📁 Project Structure

```
shortner/
│
├── index.html              HOME PAGE - AdLinkFly home ka exact replica
│                           (hero shorten form, features, payout rates,
│                           counters, how-it-works) + #alias redirect
├── 404.html                Error page (standalone design)
├── favicon.ico             Site icon
│
├── assets/                 ★ ADLINKFLY KE ASLI IMAGES
│   ├── logo.png            Site logo
│   ├── header.jpg          Hero background
│   ├── footer.jpg          Footer background
│   ├── step1/2/3.png       How It Works images
│   ├── total-clicks/links/users.png   Counter icons
│   └── skip-ad.png         Skip button image
│
├── vendor/                 ★ ADLINKFLY KA ASLI VENDOR CODE
│   ├── bootstrap/          Bootstrap 3 (css/js)
│   ├── font-awesome/       Font Awesome 4 icons
│   ├── dashboard/          AdminLTE 2 (css/skins/js/app.min.js)
│   ├── owl/                Owl carousel
│   ├── jquery.min.js       jQuery
│   ├── wow.min.js / animate.min.css    Animations
│   ├── clipboard.min.js    Copy-to-clipboard
│   └── conditionize.jquery.js
│
├── theme/css/              ★ ADLINKFLY THEME CSS
│   ├── front.css           Home/front pages ka theme (primary #2980f3)
│   ├── app.css             Shared tweaks
│   └── spritesheet.css     Sprite icons
│
├── js/                     ROOT SCRIPTS
│   ├── firebase-config.js  Firebase config + DB schema comments
│   ├── app.js              Root helpers (navbar, toast, guards)
│   └── fullpage.js         ★ FULL PAGE SCRIPT ENGINE - user apni site
│                           pe lagata hai, saare outgoing links auto-
│                           short ho jate hain (go.html#?u=...&o=...)
│
├── user/                   ===== USER PANEL (AdminLTE skin-blue) =====
│   ├── js/firebase-config.js   User panel ka apna Firebase file
│   ├── js/app.js           Engine: requireLogin, showToast, format
│   │                       helpers, gravatar avatarUrl, fillUserHeader,
│   │                       wireLogout, initShortenModal
│   ├── signin.html         Login page (AdminLTE login-box)
│   ├── signup.html         Signup + ?ref=CODE capture (refcodes +
│   │                       referrals nodes + stats counter update)
│   ├── forgot-password.html Password reset email
│   ├── dashboard.html      Statistics small-boxes, announcements,
│   │                       top links, summary table
│   ├── links.html          All links (search/edit/hide/delete/copy)
│   ├── links-hidden.html   Sirf hidden links (?filter=hidden mode)
│   ├── go.html             ★ INTERSTITIAL PAGE (view_interstitial.ctp
│   │                       jaisa): countdown/banner/no-ads flow,
│   │                       clicks+1, wallet credit, referral commission,
│   │                       stats counter, frame-buster.
│   │                       Alias mode (#aB3xK9) + passthrough mode
│   │                       (#?u=<url>&o=<uid>&t=<type> for fullpage.js)
│   ├── withdraw.html       Payout request (min-payout check, atomic
│   │                       balance deduction) + history
│   ├── referrals.html      Referral link, social share buttons,
│   │                       team list (live), commission %
│   ├── profile.html        Naam change, password change, account info,
│   │                       danger zone (account delete)
│   ├── tools-quick.html    Quick Link tool
│   ├── tools-mass.html     Mass Shrinker (20 URLs ek saath)
│   ├── tools-fullpage.html Full Page Script generator (code copy)
│   ├── tools-api.html      Developers API docs + personal API key
│   └── index.html          Redirect stub -> signin.html
│
├── pages/                  STATIC LEGAL PAGES
│   ├── privacy-policy.html Privacy Policy
│   └── terms-of-service.html Terms of Service
│
└── admin/                  ===== ADMIN PANEL "CP" (AdminLTE skin-black) =====
    ├── js/firebase-config.js   Admin ka apna Firebase file
    ├── js/app.js           Engine: requireAdmin DOUBLE-CHECK
    │                       (users/{uid}/role==="admin" AND admins/{uid}===true),
    │                       format helpers, fillAdminHeader
    ├── index.html          Admin login (verifyAdmin ke baad hi entry)
    ├── dashboard.html      Stats small-boxes (users/links/clicks/pending),
    │                       latest users + withdrawals, pending badge
    ├── users.html          Users manage (search, wallet +/- adjust modal,
    │                       disable/enable, profile delete)
    ├── links.html          Sab users ki links (search/hide/delete/open)
    ├── rates.html          ★ CPM rates editor (earning_rates/default) +
    │                         min payout, referral %, banner ad code
    ├── withdrawals.html    ★ Payout management - Pay Hua / Reject
    │                         (reject pe ATOMIC wallet refund)
    └── settings.html       Site settings (naam, support email, hero text,
                              announcement, signup on/off, maintenance)
```

---

## 🔥 Setup Guide

### Step 1: Firebase Database Rules (SABSE IMPORTANT!)

Firebase Console → Realtime Database → **Rules** tab → ye paste karo:

```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "aliases": {
      ".indexOn": ["uid"],
      "$alias": {
        ".read": true,
        ".write": "auth != null && (!data.exists() || data.child('uid').val() === 'guest' || root.child('admins').child(auth.uid).exists())",
        "clicks": { ".write": true }
      }
    },

    "users": {
      ".indexOn": ["referral_code"],
      "$uid": {
        ".read": "auth != null && ($uid === auth.uid || root.child('admins').child(auth.uid).exists())",
        ".write": "auth != null && $uid === auth.uid"
      }
    },

    "admins": {
      ".read": "auth != null",
      ".write": false
    },

    "settings": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },

    "earning_rates": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },

    "withdrawals": {
      ".indexOn": ["uid"],
      "$wid": {
        ".read": "auth != null && (data.child('uid').val() === auth.uid || root.child('admins').child(auth.uid).exists())",
        ".write": "auth != null && ((!data.exists() && newData.child('uid').val() === auth.uid) || root.child('admins').child(auth.uid).exists())"
      }
    },

    "refcodes": {
      "$code": {
        ".read": "auth != null",
        ".write": "auth != null && !data.exists() && newData.val() === auth.uid"
      }
    },

    "referrals": {
      "$referrerUid": {
        ".read": "auth != null && $referrerUid === auth.uid",
        "$memberUid": {
          ".write": "auth != null && $memberUid === auth.uid && !data.exists()"
        }
      }
    },

    "stats": {
      "total_clicks": { ".read": true, ".write": true },
      "total_links":  { ".read": true, ".write": true },
      "total_users":  { ".read": true, ".write": true },
      "daily": {
        "$date": {
          "clicks": { ".read": true, ".write": true },
          "earnings": { ".read": true, ".write": true }
        }
      },
      "country": {
        "$cc": {
          "clicks": { ".read": true, ".write": true }
        }
      }
    },

    "ads": {
      ".read": true,
      "$adId": {
        ".write": "auth != null && (newData.child('uid').val() === auth.uid || root.child('admins').child(auth.uid).exists())",
        "served_views": { ".write": true }
      }
    },

    "plans": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },

    "membership_requests": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      ".write": "auth != null"
    }
  }
}
```

### Step 2: Khud Ko Admin Banao

1. Pehle normal signup karo website se
2. Firebase Console → Realtime Database → manually set karo:
   - `users/{tumhari-uid}/role` = `"admin"`
   - `admins/{tumhari-uid}` = `true`
3. Bas! Ab `admin/index.html` se login kar sakte ho

*(Tumhari UID milengi: Console → Authentication → Users)*

### Step 3: Deploy — 2 Tarike

**Tarika A: Ek repo me sab kuch (aasan)**

1. Naya repo banao GitHub pe (e.g. `shortify`)
2. `shortner/` ki SAB files upload karo (`vendor/` aur `theme/` zaroori hain!)
3. Settings → Pages → Branch: `main` → Save
4. Live: `https://username.github.io/shortify/`

**Tarika B: Alag-alag repos**

| Repo | Folder | Pages URL |
|---|---|---|
| `shortify-home` | root files + assets + vendor + theme + js | `username.github.io/shortify-home/` |
| `shortify-user` | `user/` contents + vendor + theme | `username.github.io/shortify-user/` |
| `shortify-admin` | `admin/` contents + vendor + theme | `username.github.io/shortify-admin/` |

⚠️ Alag repos me jaane ke baad cross-paths fix karne padenge:
- Home `index.html` ka `user/go.html` path
- Admin/user pages ke `../index.html` links
- `SITE_URL` constants (teeno `js/app.js` files)

Isliye **shuruat Tarika A se hi karo**.

### Step 4: SITE_URL Check Karo

Teeno `app.js` files me SITE_URL pathname se auto-calculate hota hai.
GitHub Pages subfolder pe agar referral/API links galat jayein to
isko manually poora path do.

---

## 💰 Paisa System Kaise Kaam Karta Hai

1. **Admin** `admin/rates.html` pe CPM set karta hai
   (e.g. interstitial ₹8 / 1000 views), min payout, referral %
2. **User** link banata hai → koi click karta hai → `user/go.html` khulta hai
3. go.html ad_type ke hisaab se countdown/banner dikhata hai → Skip pe:
   clicks +1, owner wallet += rate/1000, referrer ko commission
   (+ `referral_earnings` counter), `stats/total_clicks` bump
4. **User** `withdraw.html` se request karta hai (balance atomically katta
   hai — double-spend safe)
5. **Admin** `admin/withdrawals.html` pe Pay Hua / Reject karta hai
   (Reject = paisa wapis wallet, transaction-based)

**Full Page Script bonus:** user `tools-fullpage.html` se code copy karke
apni website me lagata hai → `js/fullpage.js` us site ke saare outgoing
links ko `go.html#?u=URL&o=UID&t=TYPE` bana deta hai → har click se
uski wallet bharti hai.

---

## ☁️ Cloudflare Worker (Next Step)

Abhi short links `site.com/#alias` format me khulte hain.
Clean URLs (`site.com/alias`) + server-side earnings ke liye Worker:

1. `site.com/aB3xK9` ko pakdega
2. Firebase REST API se alias padhega
3. 301 redirect + click count server-side badhega
4. Earnings server-side calculate hongi (client-side manipulation band)

Worker hi `/api?api=KEY&url=...` endpoint serve karega
(`tools-api.html` ke docs isi format ke hain).

---

## 🔐 Security Notes

| Cheez | Status |
|---|---|
| Password hashing | ✅ Firebase Auth handle karta hai |
| XSS protection | ✅ Har user-data `escapeHtml()` se guzarta hai |
| Admin verification | ✅ Double check (role + admins node) |
| Withdrawal double-spend | ✅ Atomic transaction se balance katta hai |
| Reject refund | ✅ Transaction-based, double-refund impossible |
| Referral mapping | ✅ refcodes/referrals nodes — cross-user queries nahi |
| Frame-buster | ✅ go.html iframe me lock nahi hota |
| Database rules | ⚠️ Upar diye rules use karo |
| Earning manipulation | ⚠️ Client-side hai — Worker phase me fix hoga |

---

*Banaya gaya aapke liye — har file me Hinglish comments hain taaki sab
kuch samajh aaye. Koi bhi file kholo, top pe likha hai wo kya karti hai.*
