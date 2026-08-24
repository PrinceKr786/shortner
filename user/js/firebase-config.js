/* ============================================================
   FILE      : user/js/firebase-config.js
   FOLDER    : YE USER PANEL KA APNA FILE HAI (self-contained)
               Is folder ko akele bhi GitHub repo pe upload kar
               sakte ho - kuch aur chahiye hi nahi.
   KAAM      : Firebase connection + DATABASE STRUCTURE docs.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getDatabase(app);


/* ============================================================
   DATABASE STRUCTURE v2 (AdLinkFly-style money system)
   ============================================================

   aliases/{alias}:
     url, title, uid, clicks, status("active"/"hidden"),
     ad_type ("interstitial"/"banner"/"none"), created_at

   users/{uid}:
     name, email, role("user"/"admin"), disabled,
     created_at,
     wallet_money        <- total kamai jo withdraw ho sakti hai
     referral_code       <- e.g. "RAHUL1234" (har user ka unique)
     referred_by         <- jisne refer kiya uska code (ya null)
     total_withdrawn     <- kitna nikala ab tak

   earning_rates/{group}:          <- ADMIN set karta hai
     interstitial: 8.00            <- per 1000 views ka rate
     banner:       3.00
     none:         1.00

   withdrawals/{wid}:              <- payout requests
     uid, name, amount, method("paypal"/"paytm"),
     payment_details, status("pending"/"completed"/"rejected"),
     created_at, processed_at

   referrals_log/{uid}/{log}:      <- referral commission entries
     amount, from_user_name, timestamp

   admins/{uid}: true

   settings/:
     site_name, announce_..., signup_enabled,
     min_payout, referral_commission (e.g. 20 = 20%),
     default_ad_type
   ============================================================ */
