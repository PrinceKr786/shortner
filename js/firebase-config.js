/* ============================================================
   FILE      : js/firebase-config.js
   KAAM      : Firebase se connection establish karta hai.
               Ye file SAB pages import karte hain (auth,
               database sab yahin se milta hai).

   IMPORTANT :
     - Ye config keys PUBLIC hoti hain, ye secret nahi hai.
     - Asli suraksha Firebase Console > Realtime Database >
       Rules se aati hai (wahan rules set karne honge).
     - Agar kabhi naya Firebase project banao to sirf
       niche wala firebaseConfig object update karna hai.
   ============================================================ */

/* ---------- 1. Firebase SDK Import (CDN se) ----------
   Hum build tools use nahi karte, isliye SDK direct
   Google ke CDN se import hota hai. Version v10.12.2 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ---------- 2. Tumhare Project Ki Keys ----------
   Ye tumne di hui config hai (Firebase Console se milti hai). */
const firebaseConfig = {
    apiKey:            "AIzaSyD-gYBFLbbBMy3wac6L6woR-aclsNSWEsw",
    authDomain:        "testing-233c1.firebaseapp.com",
    databaseURL:       "https://testing-233c1-default-rtdb.firebaseio.com",
    projectId:         "testing-233c1",
    storageBucket:     "testing-233c1.firebasestorage.app",
    messagingSenderId: "119697068614",
    appId:             "1:119697068614:web:efd1045499924f457fb047",
    measurementId:     "G-X4GQ0J7QY8"
};

/* ---------- 3. Initialize ----------
   App banate hain aur usse Auth + Database nikalte hain.
   Inhi 3 cheezon ko baaki files use karengi:
     auth = login/signup/password system
     db   = Realtime Database (links, users, settings) */
const app  = initializeApp(firebaseConfig);

/* Analytics optional hai - agar internet na ho ya adblock
   ho to error na aye isliye try-catch me hai */
let analytics = null;
try {
    analytics = getAnalytics(app);
} catch (err) {
    console.warn("Analytics load nahi hua (adblock/offline):", err.message);
}

/* ---------- 4. Export ----------
   Baaki JS files inko aise import karengi:
   import { auth, db } from "../js/firebase-config.js"; */
export { app, analytics };
export const auth = getAuth(app);
export const db   = getDatabase(app);


/* ============================================================
   DATABASE STRUCTURE (Schema)
   ============================================================
   Tumhara data Realtime Database me aise store hoga:

   shortner/
   ├── aliases/
   │     {alias}/                    ← chhota code, e.g. "aB3xK9"
   │         url:      "https://..." ← original lambi URL
   │         title:    "Mera Link"   ← user ne diya hua naam
   │         uid:      "user-ki-id"  ← kis user ki link hai
   │         clicks:   0             ← kitni baar khula
   │         status:   "active"      ← active / hidden
   │         created_at: 1234567890  ← kab bani (timestamp)
   │
   ├── users/
   │     {uid}/
   │         name:       "Rahul"
   │         email:      "rahul@gmail.com"
   │         role:       "user"       ← "user" ya "admin"
   │         disabled:   false        ← admin ban kar sakta hai
   │         created_at: 1234567890
   │
   ├── admins/
   │     {uid}: true                   ← admin panel access list
   │
   └── settings/
         site_name:      "Shortify"
         homepage_title: "..."
         announcement:   "..."

   NOTE: Cloudflare Worker sirf "aliases/{alias}" padhega
   redirect dene ke liye - bahut fast rahega.
   ============================================================ */
