const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // Ensure you ran: npm install bcryptjs

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// --- CRITICAL CHANGE HERE ---
// This options object { index: 'auth.html' } tells the server to load auth.html
// automatically when you visit http://localhost:3000
app.use(express.static(path.join(__dirname), { index: 'auth.html' }));

// API: list songs in assets/songs plus optional seeded data
app.get('/api/songs', (req, res) => {
  const songsDir = path.join(__dirname, 'assets', 'songs');
  const dataFile = path.join(__dirname, 'data', 'songs.json');

  // read local files (if any)
  fs.readdir(songsDir, (err, files) => {
    const local = (err ? [] : files.filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f)).map((file, idx) => {
      const title = path.basename(file, path.extname(file)).replace(/[-_]/g, ' ');
      return {
        id: `local-${idx + 1}`,
        title: title,
        artist: 'Local Artist',
        file: `/assets/songs/${encodeURIComponent(file)}`,
        cover: `/assets/images/${encodeURIComponent(title)}.jpg`
      };
    })) || [];

    // read seeded data if present
    let seeded = [];
    try {
      if (fs.existsSync(dataFile)) {
        const raw = fs.readFileSync(dataFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) seeded = parsed.map((s, i) => ({ id: `seed-${i+1}`, ...s }));
      }
    } catch (e) {
      console.warn('Failed to read seeded songs:', e && e.message);
    }

    // merge seeded first (so user sees curated samples), then local
    const songs = [...seeded, ...local];
    res.json(songs);
  });
});

// Simple auth: register and login (demo only, not production-ready)
const usersFile = path.join(__dirname, 'data', 'users.json');

// Ensure data folder exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  let users = [];
  try { users = JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]'); } catch (e) { users = []; }
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'User already exists' });

  const hash = bcrypt.hashSync(password, 8);
  const user = { id: `u_${Date.now()}`, name: name || 'User', email, passwordHash: hash };
  users.push(user);
  try { fs.writeFileSync(usersFile, JSON.stringify(users, null, 2)); } catch (e) { console.error(e); }
  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  let users = [];
  try { users = JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]'); } catch (e) { users = []; }
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.passwordHash || '');
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});