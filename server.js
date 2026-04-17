const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Serve static files, default page is auth.html
app.use(express.static(path.join(__dirname), { index: 'auth.html' }));

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const dataDir   = path.join(__dirname, 'data');
const songsFile = path.join(dataDir, 'songs.json');
const usersFile = path.join(dataDir, 'users.json');

try { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}

function readJSON(file, fallback = []) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); return true; } catch { return false; }
}

// ─────────────────────────────────────────────
//  ADMIN CREDENTIALS  (change password here!)
// ─────────────────────────────────────────────
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'melody2024';  // ← change this

// Simple admin token store (in-memory, fine for demo)
const adminTokens = new Set();

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─────────────────────────────────────────────
//  PUBLIC: GET /api/songs
// ─────────────────────────────────────────────
app.get('/api/songs', (req, res) => {
  const songsDir = path.join(__dirname, 'assets', 'songs');

  fs.readdir(songsDir, (err, files) => {
    const local = (err ? [] : files.filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f)).map((file, idx) => ({
      id: `local-${idx + 1}`,
      title: path.basename(file, path.extname(file)).replace(/[-_]/g, ' '),
      artist: 'Local Artist',
      file: `/assets/songs/${encodeURIComponent(file)}`,
      cover: ''
    })));

    const seeded = readJSON(songsFile, []).map((s, i) => ({ id: s.id || `seed-${i + 1}`, ...s }));
    res.json([...seeded, ...local]);
  });
});

// ─────────────────────────────────────────────
//  PUBLIC: POST /api/register
// ─────────────────────────────────────────────
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const users = readJSON(usersFile, []);
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'User already exists' });

  const hash = bcrypt.hashSync(password, 8);
  const user = { id: `u_${Date.now()}`, name: name || 'User', email, passwordHash: hash, createdAt: new Date().toISOString() };
  users.push(user);
  writeJSON(usersFile, users);

  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
});

// ─────────────────────────────────────────────
//  PUBLIC: POST /api/login
// ─────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const users = readJSON(usersFile, []);
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = bcrypt.compareSync(password, user.passwordHash || '');
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
});

// ─────────────────────────────────────────────
//  ADMIN: POST /api/admin/login
// ─────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = 'adm_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    adminTokens.add(token);
    // Auto-expire token after 24 hours
    setTimeout(() => adminTokens.delete(token), 24 * 60 * 60 * 1000);
    return res.json({ ok: true, token });
  }
  res.status(401).json({ error: 'Wrong credentials' });
});

// ─────────────────────────────────────────────
//  ADMIN: GET /api/admin/stats
// ─────────────────────────────────────────────
app.get('/api/admin/stats', adminAuth, (req, res) => {
  const songs = readJSON(songsFile, []);
  const users = readJSON(usersFile, []);
  res.json({
    totalSongs: songs.length,
    totalUsers: users.length,
    totalPlaylists: 0, // extend later with Supabase
    lastUpdated: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────
//  ADMIN: GET /api/admin/songs
// ─────────────────────────────────────────────
app.get('/api/admin/songs', adminAuth, (req, res) => {
  const songs = readJSON(songsFile, []);
  res.json(songs);
});

// ─────────────────────────────────────────────
//  ADMIN: POST /api/admin/songs  (add a song)
// ─────────────────────────────────────────────
app.post('/api/admin/songs', adminAuth, (req, res) => {
  const { title, artist, file, cover } = req.body || {};
  if (!title || !file) return res.status(400).json({ error: 'title and file are required' });

  const songs = readJSON(songsFile, []);
  const newSong = {
    id: `song_${Date.now()}`,
    title: title.trim(),
    artist: (artist || 'Unknown').trim(),
    file: file.trim(),
    cover: (cover || '').trim(),
    addedAt: new Date().toISOString()
  };
  songs.push(newSong);
  writeJSON(songsFile, songs);
  res.json({ ok: true, song: newSong });
});

// ─────────────────────────────────────────────
//  ADMIN: PUT /api/admin/songs/:id  (edit song)
// ─────────────────────────────────────────────
app.put('/api/admin/songs/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  const { title, artist, file, cover } = req.body || {};

  const songs = readJSON(songsFile, []);
  const idx = songs.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Song not found' });

  songs[idx] = { ...songs[idx], title: title || songs[idx].title, artist: artist || songs[idx].artist, file: file || songs[idx].file, cover: cover !== undefined ? cover : songs[idx].cover };
  writeJSON(songsFile, songs);
  res.json({ ok: true, song: songs[idx] });
});

// ─────────────────────────────────────────────
//  ADMIN: DELETE /api/admin/songs/:id
// ─────────────────────────────────────────────
app.delete('/api/admin/songs/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  let songs = readJSON(songsFile, []);
  const before = songs.length;
  songs = songs.filter(s => s.id !== id);
  if (songs.length === before) return res.status(404).json({ error: 'Song not found' });
  writeJSON(songsFile, songs);
  res.json({ ok: true });
});

// ─────────────────────────────────────────────
//  ADMIN: GET /api/admin/users
// ─────────────────────────────────────────────
app.get('/api/admin/users', adminAuth, (req, res) => {
  const users = readJSON(usersFile, []).map(u => ({
    id: u.id, name: u.name, email: u.email, createdAt: u.createdAt || 'N/A'
  }));
  res.json(users);
});

// ─────────────────────────────────────────────
//  ADMIN: DELETE /api/admin/users/:id
// ─────────────────────────────────────────────
app.delete('/api/admin/users/:id', adminAuth, (req, res) => {
  let users = readJSON(usersFile, []);
  users = users.filter(u => u.id !== req.params.id);
  writeJSON(usersFile, users);
  res.json({ ok: true });
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const os = require('os');
  app.listen(PORT, '0.0.0.0', () => {
    const interfaces = os.networkInterfaces();
    let localIP = 'localhost';
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) { localIP = iface.address; break; }
      }
      if (localIP !== 'localhost') break;
    }
    console.log(`\n🎵 MelodyStream Server`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${localIP}:${PORT}`);
    console.log(`   Admin:   http://localhost:${PORT}/admin.html\n`);
  });
}

module.exports = app;