# 🎵 MelodyStream

A full-stack music streaming web application with a stunning dark UI, admin panel, persistent authentication, and Supabase integration.

---

## ✨ Features

### User App
- 🎵 **Music Playback** — Play, pause, skip, and seek with a mini + full-screen player
- 🏠 **Home Feed** — Weekly Top, Trending, and Discover sections
- ❤️ **Favorites** — Heart any song; persists across sessions via localStorage + Supabase
- 📋 **Custom Playlists** — Create playlists and add songs
- 🔍 **Search** — Real-time search across titles and artists
- 📁 **Local Files** — Upload and play your own music files from device
- 🎨 **Album & Artist Pages** — Dedicated browse pages

### Authentication (Spotify-style)
- 🔐 **Split-panel login/register** with sliding animation & floating labels
- 💾 **30-day persistent session** — stay logged in after closing the browser
- 🌐 **Supabase Auth** + automatic local storage fallback if Supabase is unavailable
- 👁️ **Password show/hide** toggle

### Admin Panel (`/admin.html`)
- 📊 **Dashboard** — Live stats: song count, user count, server status
- 🎵 **Song Management** — Add, edit, delete songs from the catalog
- 👥 **User Management** — View and remove registered users
- 🔒 **Token-based admin auth** — 24-hour session, persistent across browser close

---

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/Sunny1956/music-streaming.git
cd music-streaming
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Open in Browser
| Page | URL |
|------|-----|
| App (Login) | http://localhost:3000 |
| Main App | http://localhost:3000/index.html |
| Admin Panel | http://localhost:3000/admin.html |

### 4. Access on Your Local Network (other devices)
When the server starts, it will print a **Network URL** — use that on any device on the same Wi-Fi.

---

## 🔑 Admin Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `melody2024` |

> ⚠️ Change the password in `server.js` (`ADMIN_PASS` constant) before deploying publicly.

---

## 📁 Project Structure

```
music-streaming/
├── assets/
│   ├── images/         # Cover art & UI images
│   └── songs/          # Local MP3 files (optional)
├── data/
│   ├── songs.json      # Song catalog (managed via Admin Panel)
│   └── users.json      # Registered users (local fallback)
├── js/
│   ├── app.js          # Main frontend logic (player, playlists, favorites)
│   ├── auth.js         # Authentication (Supabase + local fallback)
│   └── supabase-config.js  # Supabase client initialization
├── supabase/
│   └── schema.sql      # Database schema + seed data
├── admin.html          # Admin control panel
├── auth.html           # Login & Sign Up page
├── index.html          # Main app UI
├── server.js           # Express server + REST API
├── vercel.json         # Vercel deployment config
└── package.json
```

---

## 🌐 Deploy to Vercel (Free, 24/7)

Your app is pre-configured for Vercel deployment.

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New → Project**
3. Import the `music-streaming` repository
4. Click **Deploy** — done!

Your app will be live at a public URL, accessible from any device, any network, 24/7.

---

## 🔧 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/songs` | List all songs |
| `POST` | `/api/register` | Register a user |
| `POST` | `/api/login` | Login a user |

### Admin (requires `x-admin-token` header)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Get admin token |
| `GET` | `/api/admin/stats` | Dashboard stats |
| `GET` | `/api/admin/songs` | List all songs |
| `POST` | `/api/admin/songs` | Add a song |
| `PUT` | `/api/admin/songs/:id` | Edit a song |
| `DELETE`| `/api/admin/songs/:id` | Delete a song |
| `GET` | `/api/admin/users` | List users |
| `DELETE`| `/api/admin/users/:id` | Remove a user |

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) + localStorage fallback |
| Auth | Supabase Auth + local bcrypt fallback |
| Fonts | Inter (admin), Vazirmatn (app), Google Fonts |
| Icons | Material Icons, Font Awesome |
| Deployment | Vercel |

---

## 🎵 Adding Songs

**Via Admin Panel (recommended):**
1. Go to `/admin.html`
2. Click **Songs → Add Song**
3. Enter title, artist, audio URL, and cover image URL

**Via `data/songs.json` directly:**
```json
[
  {
    "title": "My Song",
    "artist": "My Artist",
    "file": "https://example.com/song.mp3",
    "cover": "https://images.unsplash.com/photo-...?w=400&q=60"
  }
]
```

**Via local files:**
Drop `.mp3`, `.wav`, or `.ogg` files into `assets/songs/` — they auto-appear in the app.

---

## 📱 Mobile Support

The app is fully responsive:
- Sidebar collapses to a hamburger menu on mobile
- Auth page stacks vertically on small screens
- Music player adapts to small viewports

---

Made with ❤️ by [Sunny1956](https://github.com/Sunny1956)
