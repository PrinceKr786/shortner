/* ============================================================
   FILE      : admin/js/firebase-config.js
   FOLDER    : ADMIN PANEL KA APNA FILE (self-contained)
               Admin folder ko akele alag GitHub repo pe upload
               kar sakte ho.
   KAAM      : Firebase connection. Same project keys hain
               (kyunki same database use hota hai) par ye file
               physically alag hai taaki koi dependency na rahe.
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
