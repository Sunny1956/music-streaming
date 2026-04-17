// js/auth.js — Supabase auth with instant local fallback

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
function setLoggedIn(user) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("melody_user", JSON.stringify({ id: user.id, name: user.name, email: user.email }));
}

/* ============================================================
   CHECK WHETHER SUPABASE IS REACHABLE (with 4s timeout)
============================================================ */
function isSupabaseAvailable() {
    return new Promise((resolve) => {
        if (typeof window.supabaseClient === 'undefined') return resolve(false);
        const timer = setTimeout(() => resolve(false), 4000);
        // A lightweight ping — just get session (no network for anon)
        window.supabaseClient.auth.getSession()
            .then(() => { clearTimeout(timer); resolve(true); })
            .catch(() => { clearTimeout(timer); resolve(false); });
    });
}

/* ============================================================
   REGISTER
============================================================ */
async function registerUser() {
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!email || !password || !name) { showMsg("Please fill all fields", true); return; }
    if (password.length < 6) { showMsg("Password must be at least 6 characters", true); return; }

    showMsg("Creating account...");

    // Try Supabase if available
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
            // If email already exists in Supabase
            if (error.message && error.message.toLowerCase().includes("already")) {
                showMsg(error.message, true); return;
            }
        } catch (e) { /* Supabase failed, fall through to local */ }
    }

    // LOCAL FALLBACK
    fallbackRegister(name, email, password);
}

/* ============================================================
   LOGIN
============================================================ */
async function loginUser() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) { showMsg("Please fill all fields", true); return; }

    showMsg("Logging in...");

    // Try Supabase if available
    const supabaseOk = await isSupabaseAvailable();
    if (supabaseOk) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (!error && data.user) {
                setLoggedIn({
                    id: data.user.id,
                    name: data.user.user_metadata?.full_name || email.split('@')[0],
                    email: data.user.email
                });
                showMsg("Login Successful! Redirecting...");
                setTimeout(() => { window.location.href = "index.html"; }, 400);
                return;
            }
            // Wrong password on Supabase
            if (error && error.message && !error.message.toLowerCase().includes("network") && !error.message.toLowerCase().includes("fetch")) {
                showMsg(error.message, true); return;
            }
        } catch (e) { /* Supabase failed, fall through to local */ }
    }

    // LOCAL FALLBACK
    fallbackLogin(email, password);
}

/* ============================================================
   LOCAL FALLBACK IMPLEMENTATIONS
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
    if (!user) {
        showMsg("Invalid email or password", true); return;
    }
    setLoggedIn(user);
    showMsg("Login Successful! Redirecting...");
    setTimeout(() => { window.location.href = "index.html"; }, 400);
}
