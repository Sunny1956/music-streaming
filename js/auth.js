/* SWITCH FORMS */
function showRegister() {
    document.getElementById("login-form").classList.add("hidden")
    document.getElementById("register-form").classList.remove("hidden")
    document.getElementById("auth-msg").innerText = "";
}

function showLogin() {
    document.getElementById("register-form").classList.add("hidden")
    document.getElementById("login-form").classList.remove("hidden")
    document.getElementById("auth-msg").innerText = "";
}

function showMsg(msg, isError=false) {
    const el = document.getElementById("auth-msg");
    if (!el) return;
    el.innerText = msg;
    el.style.color = isError ? "#FF4444" : "#0E9EEF";
}

/* REGISTER USER */
async function registerUser() {
    const name = document.getElementById("reg-name").value
    const email = document.getElementById("reg-email").value
    const password = document.getElementById("reg-password").value

    if (!email || !password || !name) {
        showMsg("Please fill all fields", true)
        return
    }

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Registration failed");
        
        showMsg("Account Created Successfully! Please login.");
        setTimeout(() => showLogin(), 1500);
    } catch (err) {
        showMsg(err.message, true);
    }
}

/* LOGIN USER */
async function loginUser() {
    const email = document.getElementById("login-email").value
    const password = document.getElementById("login-password").value

    if (!email || !password) {
        showMsg("Please fill all fields", true)
        return
    }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Login failed");

        // Set auth state
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("melody_user", JSON.stringify(data.user));
        
        showMsg("Login Successful! Redirecting...");
        setTimeout(() => {
            window.location.href = "index.html"
        }, 500);

    } catch (err) {
        showMsg(err.message, true);
    }
}
