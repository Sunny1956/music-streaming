// js/auth.js — Supabase-powered authentication with local fallback

/* SWITCH FORMS */
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

/* REGISTER USER — Supabase Auth */
async function registerUser() {
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!email || !password || !name) {
        showMsg("Please fill all fields", true);
        return;
    }

    showMsg("Creating account...");

    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });

        if (error) {
            // If the error is network-related, fallback to local storage
            if (error.message && error.message.toLowerCase().includes("network") || error.message.toLowerCase().includes("failed to fetch")) {
                console.error("Supabase signUp network error, falling back to local storage", error);
                fallbackRegister(name, email, password);
            } else {
                showMsg(error.message, true);
            }
            return;
        }

        showMsg("Account created! Please check your email to confirm, then login.");
        setTimeout(() => showLogin(), 2000);
    } catch (err) {
        // Unexpected error, fallback as well
        console.error("Supabase signUp failed, falling back to local storage", err);
        fallbackRegister(name, email, password);
    }
}

/* LOGIN USER — Supabase Auth */
async function loginUser() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        showMsg("Please fill all fields", true);
        return;
    }

    showMsg("Logging in...");

    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            // Network-related error fallback
            if (error.message && error.message.toLowerCase().includes("network") || error.message.toLowerCase().includes("failed to fetch")) {
                console.error("Supabase login network error, falling back to local storage", error);
                fallbackLogin(email, password);
            } else {
                showMsg(error.message, true);
            }
            return;
        }

        // Store session info
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("melody_user", JSON.stringify({
            id: data.user.id,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            email: data.user.email
        }));

        showMsg("Login Successful! Redirecting...");
        setTimeout(() => { window.location.href = "index.html"; }, 500);
    } catch (err) {
        console.error("Supabase login failed, falling back to local storage", err);
        fallbackLogin(email, password);
    }
}

/* ---------- LOCAL FALLBACK IMPLEMENTATION ---------- */
function getLocalUsers() {
    const usersJson = localStorage.getItem("local_users");
    return usersJson ? JSON.parse(usersJson) : [];
}

function setLocalUsers(users) {
    localStorage.setItem("local_users", JSON.stringify(users));
}

function fallbackRegister(name, email, password) {
    const users = getLocalUsers();
    if (users.find(u => u.email === email)) {
        showMsg("Email already registered", true);
        return;
    }
    const newUser = { id: Date.now().toString(), name, email, password };
    users.push(newUser);
    setLocalUsers(users);
    showMsg("Account created locally! You can now log in.");
    setTimeout(() => showLogin(), 2000);
}

function fallbackLogin(email, password) {
    const users = getLocalUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        showMsg("Invalid credentials (local fallback)", true);
        return;
    }
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("melody_user", JSON.stringify({ id: user.id, name: user.name, email: user.email }));
    showMsg("Login Successful (local fallback)! Redirecting...");
    setTimeout(() => { window.location.href = "index.html"; }, 500);
}
