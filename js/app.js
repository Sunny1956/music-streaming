document.addEventListener('DOMContentLoaded', () => {

  /* =========================
     BASIC ELEMENTS
  ========================= */
  const grid = document.getElementById('card-grid'); // Home grid
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('play');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const seek = document.getElementById('seek');
  const playerTitle = document.getElementById('player-title');
  const playerArtist = document.getElementById('player-artist');
  const playerCover = document.getElementById('player-cover');
  const search = document.getElementById('search');
  const profileBtn = document.getElementById('profile-btn');

  const menuLinks = document.querySelectorAll('.menu a');
  const pages = document.querySelectorAll('.page');

  let songs = [];
  let current = -1;

  /* =========================
     SPA PAGE NAVIGATION
  ========================= */
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      menuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const pageId = link.dataset.page;
      pages.forEach(p => p.classList.remove('active'));
      const page = document.getElementById(pageId);
      if (page) page.classList.add('active');
    });
  });

  // Greeting based on time
 const greeting = document.querySelector('.greeting');
  if (greeting) {
    const h = new Date().getHours();
    greeting.textContent =
     h < 12 ? 'Good morning' :
     h < 18 ? 'Good afternoon' :
     'Good evening';
  }

  /* =========================
     LOAD SONGS (API / MOCK)
  ========================= */
  function loadSongs() {
    // 🔁 Replace with real backend later
    fetch('/api/songs')
      .then(r => r.json())
      .then(data => {
        songs = data;
        renderList(songs);       // Home
        renderDiscover(songs);   // Discover
      })
      .catch(() => {
        // Fallback demo data
        songs = [
          {
            title: "Dream Night",
            artist: "Unknown Artist",
            file: "assets/songs/song1.mp3",
            cover: "assets/images/song1.jpg"
          },
          {
            title: "Lost Sky",
            artist: "Electronic",
            file: "assets/songs/song2.mp3",
            cover: "assets/images/song2.jpg"
          }
        ];
        renderList(songs);
        renderDiscover(songs);
      });
  }

  /* =========================
     RENDER HOME SONG LIST
  ========================= */
  function renderList(list) {
    if (!grid) return;
    grid.innerHTML = '';

    list.forEach((s, idx) => {
      const card = document.createElement('article');
      card.className = 'song-card';
      card.innerHTML = `
        <img src="${s.cover || 'assets/images/placeholder.jpg'}">
        <div class="card-info">
          <h4>${s.title}</h4>
          <p>${s.artist}</p>
        </div>
        <button class="play-btn" data-idx="${idx}">
          <span class="material-icons">play_arrow</span>
        </button>
      `;
      grid.appendChild(card);
    });

    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playIndex(Number(btn.dataset.idx));
      });
    });
  }

  /* =========================
     RENDER DISCOVER
  ========================= */
  function renderDiscover(list) {
    const discoverGrid = document.getElementById('discover-grid');
    if (!discoverGrid) return;

    discoverGrid.innerHTML = '';
    list.slice(0, 6).forEach((s, idx) => {
      const card = document.createElement('div');
      card.className = 'song-card';
      card.innerText = s.title;
      card.onclick = () => playIndex(idx);
      discoverGrid.appendChild(card);
    });
  }

  /* =========================
     PLAYER FUNCTIONS
  ========================= */
  function playIndex(i) {
    if (!songs[i]) return;
    current = i;
    audio.src = songs[i].file;
    audio.play();

    playerTitle.textContent = songs[i].title;
    playerArtist.textContent = songs[i].artist;
    playerCover.src = songs[i].cover || 'assets/images/placeholder.jpg';
    playBtn.innerHTML = '<span class="material-icons">pause</span>';
  }

  playBtn.addEventListener('click', () => {
    if (!audio.src && songs.length) {
      playIndex(0);
      return;
    }
    if (audio.paused) {
      audio.play();
      playBtn.innerHTML = '<span class="material-icons">pause</span>';
    } else {
      audio.pause();
      playBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
    }
  });

  prevBtn.addEventListener('click', () => {
    if (!songs.length) return;
    playIndex(current > 0 ? current - 1 : songs.length - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (!songs.length) return;
    playIndex(current < songs.length - 1 ? current + 1 : 0);
  });

  audio.addEventListener('ended', () => nextBtn.click());

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    seek.value = (audio.currentTime / audio.duration) * 100;
  });

  seek.addEventListener('input', () => {
    if (!audio.duration) return;
    audio.currentTime = (seek.value / 100) * audio.duration;
  });

  /* =========================
     SEARCH
  ========================= */
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    const filtered = songs.filter(s =>
      (s.title + s.artist).toLowerCase().includes(q)
    );
    renderList(filtered);
  });

  /* =========================
     AUTH UI
  ========================= */
  function refreshAuthUI() {
    const raw = localStorage.getItem('melody_user');
    const user = raw ? JSON.parse(raw) : null;

    if (user) {
      profileBtn.textContent = user.name || user.email || 'Account';
      profileBtn.classList.add('signed');
    } else {
      profileBtn.textContent = 'Sign in';
      profileBtn.classList.remove('signed');
    }
  }

  profileBtn.addEventListener('click', () => {
    const raw = localStorage.getItem('melody_user');
    const user = raw ? JSON.parse(raw) : null;

    if (!user) {
      window.location.href = 'auth.html';
      return;
    }

    if (confirm(`Sign out ${user.name || user.email}?`)) {
      localStorage.removeItem('melody_user');
      refreshAuthUI();
    }
  });

  /* =========================
     UPGRADE (FAKE PAYMENT)
  ========================= */
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('upgrade-btn')) {
      alert('🎉 Premium Activated (Demo)');
      localStorage.setItem('melody_premium', 'true');
    }
  });

  /* =========================
     INIT
  ========================= */
  refreshAuthUI();
  loadSongs();

});
