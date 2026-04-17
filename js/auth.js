// js/auth.js — Supabase auth with local fallback + 30-day persistent session

/* ============================================================
   SESSION MANAGEMENT — persists across browser close/reopen
============================================================ */
const SESSION_KEY    = 'melody_session';
const SESSION_DAYS   = 30; // stay logged in for 30 days

function saveSession(user) {
    const session = {
        user,
        expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // Also set legacy key so index.html guard works
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('melody_user', JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('melody_user');
}

// Called by index.html guard — checks session validity
window.checkSession = function() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return false;
        const session = JSON.parse(raw);
        if (!session || !session.expiresAt) return !!localStorage.getItem('isLoggedIn');
        if (Date.now() > session.expiresAt) {
            clearSession();
            return false;
        }
        return true;
    } catch { return false; }
};

/* ============================================================
   FORM SWITCHING
============================================================ */
function showRegister() {
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("register-form").classList.remove("hidden");
    document.getElementById("auth-msg").innerText = "";
}

function showLogin() {
    document.getElementById("register-form").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
    document.getElementById("auth-msg").innerText = "";
}

function showMsg(msg, isError = false) {
    const el = document.getElementById("auth-msg");
    if (!el) return;
    el.innerText = msg;
    el.style.color = isError ? "#FF4444" : "#0E9EEF";
}

/* ============================================================
   LOCAL STORAGE HELPERS
============================================================ */
function getLocalUsers() {
    try { return JSON.parse(localStorage.getItem("local_users") || "[]"); } catch { return []; }
}
function setLocalUsers(users) {
    localStorage.setItem("local_users", JSON.stringify(users));
}

/* ============================================================
   CHECK WHETHER SUPABASE IS REACHABLE (with 4s timeout)
============================================================ */
function isSupabaseAvailable() {
    return new Promise((resolve) => {
        if (typeof window.supabaseClient === 'undefined') return resolve(false);
        const timer = setTimeout(() => resolve(false), 4000);
        window.supabaseClient.auth.getSession()
            .then(() => { clearTimeout(timer); resolve(true); })
            .catch(() => { clearTimeout(timer); resolve(false); });
    });
}

/* ============================================================
   REGISTER
============================================================ */
async function registerUser() {
    const name     = document.getElementById("reg-name").value.trim();
    const email    = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!email || !password || !name) { showMsg("Please fill all fields", true); return; }
    if (password.length < 6) { showMsg("Password must be at least 6 characters", true); return; }

    showMsg("Creating account...");

    // Try Supabase first
    const supabaseOk = await isSupabaseAvailable();
    if (supabaseOk) {
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email, password,
                options: { data: { full_name: name } }
            });
            if (!error) {
                showMsg("Account created! You can now log in.");
                setTimeout(() => showLogin(), 1500);
                return;
            }
            if (error.message && error.message.toLowerCase().includes("already")) {
                showMsg(error.message, true); return;
            }
        } catch (e) { /* Fall through to local */ }
    }

    // LOCAL FALLBACK
    fallbackRegister(name, email, password);
}

/* ============================================================
   LOGIN
============================================================ */
async function loginUser() {
    const email    = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) { showMsg("Please fill all fields", true); return; }

    showMsg("Logging in...");

    // Try Supabase first
    const supabaseOk = await isSupabaseAvailable();
    if (supabaseOk) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (!error && data.user) {
                const user = {
                    id: data.user.id,
                    name: data.user.user_metadata?.full_name || email.split('@')[0],
                    email: data.user.email
                };
                saveSession(user);
                showMsg("Login Successful! Redirecting...");
                setTimeout(() => { window.location.href = "index.html"; }, 400);
                return;
            }
            // Wrong password (not a network error)
            if (error && !error.message.toLowerCase().includes("network") && !error.message.toLowerCase().includes("fetch")) {
                showMsg(error.message, true); return;
            }
        } catch (e) { /* Fall through to local */ }
    }

    // LOCAL FALLBACK
    fallbackLogin(email, password);
}

/* ============================================================
   LOCAL FALLBACK
============================================================ */
function fallbackRegister(name, email, password) {
    const users = getLocalUsers();
    if (users.find(u => u.email === email)) {
        showMsg("Email already registered. Please log in.", true); return;
    }
    const newUser = { id: "local_" + Date.now(), name, email, password };
    users.push(newUser);
    setLocalUsers(users);
    showMsg("Account created! You can now log in.");
    setTimeout(() => showLogin(), 1500);
}

function fallbackLogin(email, password) {
    const users = getLocalUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) { showMsg("Invalid email or password", true); return; }
    saveSession({ id: user.id, name: user.name, email: user.email });
    showMsg("Login Successful! Redirecting...");
    setTimeout(() => { window.location.href = "index.html"; }, 400);
}
