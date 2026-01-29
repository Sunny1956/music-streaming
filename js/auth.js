document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const showLoginBtn = document.getElementById('show-login');
  const showRegBtn = document.getElementById('show-register');
  const gHello = document.getElementById('g-hello');
  const gWelcome = document.getElementById('g-welcome');
  const card = document.getElementById('material-card');

  function show(which) {
    if (which === 'login') {
      loginForm.classList.remove('hidden');
      regForm.classList.add('hidden');
      card.classList.remove('show-register');
    } else {
      regForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      card.classList.add('show-register');
    }
  }
  
  
  showLoginBtn.addEventListener('click', () => show('login'));
  showRegBtn.addEventListener('click', () => show('register'));
  gHello.addEventListener('click', () => show('register'));
  gWelcome.addEventListener('click', () => show('login'));

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm));
    const msg = document.getElementById('login-msg');
    msg.textContent = '';
    try {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Login failed');
      // persist user to localStorage so homepage can show auth state
      try { localStorage.setItem('melody_user', JSON.stringify(j.user)); } catch (e) { /* ignore */ }
      msg.textContent = 'Signed in — redirecting...';
      setTimeout(() => location.href = '/', 700);
    } catch (err) { msg.textContent = err.message; }
  });

  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(regForm));
    const msg = document.getElementById('reg-msg');
    msg.textContent = '';
    try {
      const r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Registration failed');
      msg.textContent = 'Account created — you can sign in now';
      setTimeout(() => show('login'), 900);
    } catch (err) { msg.textContent = err.message; }
  });
});
