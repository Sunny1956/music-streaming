// js/auth.js — Supabase-powered authentication

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
    const name     = document.getElementById("reg-name").value.trim();
    const email    = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!email || !password || !name) {
        showMsg("Please fill all fields", true);
        return;
    }

    showMsg("Creating account...");

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
    });

    if (error) {
        showMsg(error.message, true);
        return;
    }

    showMsg("Account created! Please check your email to confirm, then login.");
    setTimeout(() => showLogin(), 2000);
}

/* LOGIN USER — Supabase Auth */
async function loginUser() {
    const email    = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        showMsg("Please fill all fields", true);
        return;
    }

    showMsg("Logging in...");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showMsg(error.message, true);
        return;
    }

    // Store session info
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("melody_user", JSON.stringify({
        id:    data.user.id,
        name:  data.user.user_metadata?.full_name || email.split('@')[0],
        email: data.user.email
    }));

    showMsg("Login Successful! Redirecting...");
    setTimeout(() => { window.location.href = "index.html"; }, 500);
}
