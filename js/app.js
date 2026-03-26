// js/app.js
let songs = [];
let currentIndex = -1;
let favorites = [];
let customPlaylists = [];
let localSongs = [];
let activePlaylistId = null;

// Global showPage for HTML onclick attributes
window.showPage = function (pageId) {
    const pages = document.querySelectorAll(".page-content");
    pages.forEach(page => page.classList.remove("active"));
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => item.classList.remove("active"));

    const selectedPage = document.getElementById("page-" + pageId);
    if (selectedPage) selectedPage.classList.add("active");

    const activeNav = document.getElementById("nav-" + pageId);
    if (activeNav) activeNav.classList.add("active");

    const mainHeader = document.getElementById("main-header");
    if (mainHeader) {
        if (pageId === "album" || pageId === "artists") {
            mainHeader.style.display = "none";
        } else {
            mainHeader.style.display = "flex";
        }
    }
    window.scrollTo(0, 0);
};

window.logout = async function () {
    if (typeof supabase !== 'undefined') await supabase.auth.signOut();
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("melody_user");
    window.location.href = "auth.html";
};

document.addEventListener('DOMContentLoaded', () => {

    /* =========================
       DOM ELEMENTS
    ========================= */
    const audio = document.getElementById('audio');

    // Mini Player
    const playerContainer = document.getElementById('player');
    const playBtn = document.getElementById('play');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const seek = document.getElementById('seek');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playerCover = document.getElementById('player-cover');
    const searchInput = document.querySelector('.search-bar input');

    // Large Player
    const largePlayer = document.getElementById('large-player');
    const closeLargeBtn = document.getElementById('close-large-player');
    const largeTitle = document.getElementById('large-title');
    const largeArtist = document.getElementById('large-artist');
    const largeCover = document.getElementById('large-cover');
    const largePlayBtn = document.getElementById('large-play');
    const largePrevBtn = document.getElementById('large-prev');
    const largeNextBtn = document.getElementById('large-next');

    /* =========================
       FETCH SONGS
    ========================= */
    async function loadSongs() {
        try {
            let supabaseSongs = [];
            if (typeof supabase !== 'undefined') {
                const { data, error } = await supabase.from('songs').select('*');
                if (!error && data && data.length > 0) {
                    supabaseSongs = data;
                }
            }
            
            let localSongsList = [];
            try {
                const res = await fetch('/api/songs');
                localSongsList = await res.json();
            } catch (e) {
                console.error('Local API fetch failed:', e);
            }

            // Use supabase if available, otherwise local API
            songs = supabaseSongs.length ? supabaseSongs : (localSongsList || []);
            
            renderHome(songs);
        } catch (err) {
            console.error('Failed to load songs:', err);
        }
    }

    /* =========================
       RENDER HOME LISTS
    ========================= */
    function renderHome(list) {
        const weeklyGrid = document.getElementById('weekly-top-grid');
        const trendingList = document.getElementById('trending-list-container');
        const discoverGrid = document.getElementById('discover-tracks-grid');
        const albumList = document.getElementById('album-track-list');
        const artistList = document.getElementById('artist-track-list');

        if (weeklyGrid) {
            weeklyGrid.innerHTML = '';
            list.slice(0, 5).forEach((song, idx) => {
                const card = document.createElement('div');
                card.className = 'music-card';
                card.onclick = () => playSong(idx);
                card.innerHTML = `
                    <img src="${song.cover || 'assets/images/softcore.png'}" onerror="this.src='assets/images/softcore.png'">
                    <h4>${song.title}</h4>
                    <p>${song.artist || 'Unknown'}</p>
                `;
                weeklyGrid.appendChild(card);
            });
        }

        const getIconsHtml = (song) => {
            const isFav = favorites.some(s => s.file === song.file);
            const heartIcon = `<span class="material-icons-outlined" style="color: ${isFav ? 'var(--accent-pink)' : '#888'}; margin-right: 10px;" onclick="event.stopPropagation(); toggleFavorite('${song.file}')">${isFav ? 'favorite' : 'favorite_border'}</span>`;
            const plusIcon = customPlaylists.length > 0 ? `<span class="material-icons-outlined" style="color: #888;" title="Add to Playlist" onclick="event.stopPropagation(); addToPlaylist('${song.file}')">add_circle_outline</span>` : '';
            return `<div style="display:flex; align-items:center;">${heartIcon}${plusIcon}</div>`;
        };

        if (trendingList) {
            trendingList.innerHTML = '';
            list.slice(0, 5).forEach((song, idx) => {
                const row = document.createElement('div');
                row.className = 'trending-row';
                row.style.cursor = 'pointer';
                row.onclick = () => playSong(idx);
                row.innerHTML = `
                    <span class="rank">#${idx + 1}</span>
                    <img src="${song.cover || 'assets/images/softcore.png'}" onerror="this.src='assets/images/softcore.png'">
                    <div style="margin-left:15px; flex:1;">
                        <h4>${song.title}</h4>
                        <p style="color:#888; font-size:12px;">${song.artist || 'Unknown'}</p>
                    </div>
                    <span style="flex:1;">Added recently</span>
                    <span style="flex:1;">Single</span>
                    <span style="width:50px;">3:00</span>
                    ${getIconsHtml(song)}
                `;
                trendingList.appendChild(row);
            });
        }

        if (discoverGrid) {
            const DISCOVER_LIMIT = 8;
            const viewAllBtn = document.getElementById('discover-view-all');
            discoverGrid.innerHTML = '';
            let discoverExpanded = false;

            list.forEach((song, idx) => {
                const card = document.createElement('div');
                card.className = 'music-card';
                if (idx >= DISCOVER_LIMIT) {
                    card.classList.add('discover-extra');
                    card.style.display = 'none';
                }
                card.onclick = () => playSong(idx);
                card.innerHTML = `
                    <img src="${song.cover || 'assets/images/softcore.png'}" onerror="this.src='assets/images/softcore.png'">
                    <h4>${song.title}</h4>
                    <p>${song.artist || 'Unknown'}</p>
                `;
                discoverGrid.appendChild(card);
            });

            if (viewAllBtn) {
                const extras = discoverGrid.querySelectorAll('.discover-extra');
                if (extras.length === 0) { viewAllBtn.style.display = 'none'; }
                else {
                    viewAllBtn.textContent = 'View All';
                    viewAllBtn.onclick = () => {
                        discoverExpanded = !discoverExpanded;
                        extras.forEach(c => c.style.display = discoverExpanded ? '' : 'none');
                        viewAllBtn.textContent = discoverExpanded ? 'Show Less' : 'View All';
                    };
                }
            }
        }

        if (albumList || artistList) {
            const INITIAL_LIMIT = 5;

            const createTrackRow = (song, idx, thirdColText, hidden = false) => {
                const row = document.createElement('tr');
                row.className = 'track-row';
                row.style.cursor = 'pointer';
                if (hidden) {
                    row.classList.add('extra-track');
                    row.style.display = 'none';
                }
                row.onclick = () => playSong(idx);
                row.innerHTML = `
                    <td class="track-index">${idx + 1}</td>
                    <td>
                        <div class="track-title-cell">
                            <img src="${song.cover || 'assets/images/softcore.png'}" class="track-img" onerror="this.src='assets/images/softcore.png'">
                            <div>
                                <div class="track-name">${song.title}</div>
                                <div class="track-artist">${song.artist || 'Unknown'}</div>
                            </div>
                        </div>
                    </td>
                    <td>Added recently</td>
                    <td>${thirdColText}</td>
                    <td>3:00</td>
                    <td>${getIconsHtml(song)}</td>
                `;
                return row;
            };

            const wireShowMore = (tbodyEl, btnEl) => {
                if (!btnEl) return;
                const extras = tbodyEl.querySelectorAll('.extra-track');
                if (extras.length === 0) { btnEl.style.display = 'none'; return; }
                btnEl.style.display = 'block';
                let expanded = false;
                btnEl.textContent = `Show More (${extras.length} more)`;
                btnEl.onclick = () => {
                    expanded = !expanded;
                    extras.forEach(r => r.style.display = expanded ? '' : 'none');
                    btnEl.textContent = expanded ? 'Show Less' : `Show More (${extras.length} more)`;
                };
            };

            if (albumList) {
                albumList.innerHTML = '';
                list.forEach((song, idx) => {
                    albumList.appendChild(createTrackRow(song, idx, 'Single', idx >= INITIAL_LIMIT));
                });
                wireShowMore(albumList, document.getElementById('album-show-more'));
            }

            if (artistList) {
                artistList.innerHTML = '';
                list.forEach((song, idx) => {
                    artistList.appendChild(createTrackRow(song, idx, '10,000,000', idx >= INITIAL_LIMIT));
                });
                wireShowMore(artistList, document.getElementById('artist-show-more'));
            }
        }
    }

    /* =========================
       FAVORITES — Supabase
    ========================= */
    async function loadFavorites() {
        if (typeof supabase === 'undefined') return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
            .from('favorites').select('*').eq('user_id', user.id);
        if (!error && data) {
            favorites = data.map(row => ({
                file:   row.song_file,
                title:  row.song_title,
                artist: row.song_artist,
                cover:  row.song_cover
            }));
            renderHome(songs);
            renderFavorites();
        }
    }

    window.toggleFavorite = async function (file) {
        const existing = favorites.findIndex(s => s.file === file);
        if (existing > -1) {
            favorites.splice(existing, 1);
            if (typeof supabase !== 'undefined') {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) await supabase.from('favorites').delete()
                    .eq('user_id', user.id).eq('song_file', file);
            }
        } else {
            const song = songs.find(s => s.file === file);
            if (song) {
                favorites.push(song);
                if (typeof supabase !== 'undefined') {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) await supabase.from('favorites').upsert({
                        user_id:     user.id,
                        song_file:   song.file,
                        song_title:  song.title,
                        song_artist: song.artist || 'Unknown',
                        song_cover:  song.cover || ''
                    }, { onConflict: 'user_id,song_file' });
                }
            }
        }
        renderHome(songs);
        renderFavorites();
    };

    /* =========================
       PLAYLISTS
    ========================= */

    window.renderFavorites = function () {
        const container = document.getElementById('favorites-track-list');
        if (!container) return;
        container.innerHTML = '';
        if (favorites.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">No favorites yet. Click the heart icon on any song to add it here.</td></tr>';
            return;
        }
        favorites.forEach((song, idx) => {
            const originalIndex = songs.findIndex(s => s.file === song.file);
            const isFav = true;

            const row = document.createElement('tr');
            row.className = 'track-row';
            row.style.cursor = 'pointer';
            row.onclick = () => playSong(originalIndex);
            row.innerHTML = `
                <td class="track-index">${idx + 1}</td>
                <td>
                    <div class="track-title-cell">
                        <img src="${song.cover || 'assets/images/softcore.png'}" class="track-img" onerror="this.src='assets/images/softcore.png'">
                        <div>
                            <div class="track-name">${song.title}</div>
                            <div class="track-artist">${song.artist || 'Unknown'}</div>
                        </div>
                    </div>
                </td>
                <td>Single</td>
                <td>Added recently</td>
                <td>3:00</td>
                <td><span class="material-icons-outlined" style="color: var(--accent-pink)" onclick="event.stopPropagation(); toggleFavorite('${song.file}')">favorite</span></td>
            `;
            container.appendChild(row);
        });
    };

    window.createPlaylist = async function () {
        if (typeof supabase === 'undefined') {
            alert("Supabase not initialized.");
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Please login first to create playlists.");
            return;
        }

        const name = "Playlist #" + (customPlaylists.length + 1);

        const { data, error } = await supabase
            .from('playlists')
            .insert({ user_id: user.id, name: name })
            .select()
            .single();

        if (error || !data) {
            console.error("Error creating playlist:", error);
            alert("Failed to create playlist.");
            return;
        }

        const newPlaylist = {
            id: data.id,
            name: data.name,
            tracks: []
        };
        customPlaylists.push(newPlaylist);

        // Add to sidebar
        const container = document.getElementById('custom-playlists-container');
        const item = document.createElement('div');
        item.className = 'nav-item';
        item.id = 'nav-' + newPlaylist.id;
        item.innerHTML = `<span class="material-icons-outlined">queue_music</span> ${name}`;
        item.onclick = () => {
            activePlaylistId = newPlaylist.id;
            document.getElementById('active-playlist-title').textContent = name;
            renderPlaylist();
            showPage('playlist');
        };
        if (container) container.appendChild(item);

        alert(`Playlist "${name}" created! To add songs, click the (+) icon that will now appear next to songs in the lists.`);
        renderHome(songs); // re-render to show [+] buttons
    };

    window.addToPlaylist = async function (file) {
        if (!activePlaylistId && customPlaylists.length > 0) {
            activePlaylistId = customPlaylists[0].id;
        } else if (customPlaylists.length === 0) {
            alert("Create a playlist first!");
            return;
        }

        const playlist = customPlaylists.find(p => p.id === activePlaylistId);
        if (!playlist) return;

        const song = songs.find(s => s.file === file);
        if (song && !playlist.tracks.some(t => t.file === file)) {
            // Add locally first for instant UI
            playlist.tracks.push(song);
            alert(`Added to ${playlist.name}!`);
            renderPlaylist();

            // Save to Supabase
            if (typeof supabase !== 'undefined') {
                await supabase.from('playlist_songs').insert({
                    playlist_id: playlist.id,
                    song_file: song.file,
                    song_title: song.title,
                    song_artist: song.artist || 'Unknown',
                    song_cover: song.cover || ''
                });
            }
        } else {
            alert("Song already in playlist.");
        }
    };
    
    async function loadPlaylists() {
        if (typeof supabase === 'undefined') return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch playlists
        const { data: playlistsData, error: pError } = await supabase
            .from('playlists')
            .select('*')
            .eq('user_id', user.id);
            
        if (!pError && playlistsData) {
            customPlaylists = playlistsData.map(p => ({
                id: p.id,
                name: p.name,
                tracks: []
            }));

            // Render sidebar
            const container = document.getElementById('custom-playlists-container');
            if (container) container.innerHTML = '';
            customPlaylists.forEach(playlist => {
                const item = document.createElement('div');
                item.className = 'nav-item';
                item.id = 'nav-' + playlist.id;
                item.innerHTML = `<span class="material-icons-outlined">queue_music</span> ${playlist.name}`;
                item.onclick = () => {
                    activePlaylistId = playlist.id;
                    document.getElementById('active-playlist-title').textContent = playlist.name;
                    renderPlaylist();
                    showPage('playlist');
                };
                if (container) container.appendChild(item);
            });

            // Fetch playlist songs
            const { data: songsData, error: sError } = await supabase
                .from('playlist_songs')
                .select('*');
                
            if (!sError && songsData) {
                // Group songs by playlist_id
                songsData.forEach(row => {
                    const playlist = customPlaylists.find(p => p.id === row.playlist_id);
                    if (playlist) {
                        playlist.tracks.push({
                            file: row.song_file,
                            title: row.song_title,
                            artist: row.song_artist,
                            cover: row.song_cover
                        });
                    }
                });
            }
        }
    }

    window.renderPlaylist = function () {
        const container = document.getElementById('playlist-track-list');
        const countSpan = document.getElementById('active-playlist-count');
        if (!container || !activePlaylistId) return;

        const playlist = customPlaylists.find(p => p.id === activePlaylistId);
        if (!playlist) return;

        countSpan.textContent = `${playlist.tracks.length} songs`;
        container.innerHTML = '';

        if (playlist.tracks.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">Empty playlist. Add songs using the (+) icon on the home/album views.</td></tr>';
            return;
        }

        playlist.tracks.forEach((song, idx) => {
            const originalIndex = songs.findIndex(s => s.file === song.file);
            const isFav = favorites.some(s => s.file === song.file);

            const row = document.createElement('tr');
            row.className = 'track-row';
            row.style.cursor = 'pointer';
            row.onclick = () => playSong(originalIndex);
            row.innerHTML = `
                <td class="track-index">${idx + 1}</td>
                <td>
                    <div class="track-title-cell">
                        <img src="${song.cover || 'assets/images/softcore.png'}" class="track-img" onerror="this.src='assets/images/softcore.png'">
                        <div>
                            <div class="track-name">${song.title}</div>
                            <div class="track-artist">${song.artist || 'Unknown'}</div>
                        </div>
                    </div>
                </td>
                <td>${playlist.name}</td>
                <td>Just now</td>
                <td>3:00</td>
                <td><span class="material-icons-outlined" style="color: ${isFav ? 'var(--accent-pink)' : '#888'}" onclick="event.stopPropagation(); toggleFavorite('${song.file}')">${isFav ? 'favorite' : 'favorite_border'}</span></td>
            `;
            container.appendChild(row);
        });
    };

    window.playActivePlaylist = function () {
        if (!activePlaylistId) return;
        const playlist = customPlaylists.find(p => p.id === activePlaylistId);
        if (playlist && playlist.tracks.length > 0) {
            const originalIndex = songs.findIndex(s => s.file === playlist.tracks[0].file);
            if (originalIndex > -1) playSong(originalIndex);
        }
    };

    window.setupLocalFiles = function () {
        const input = document.getElementById('local-file-input');
        if (!input) return;

        input.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length === 0) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const url = URL.createObjectURL(file);

                const newSong = {
                    title: file.name.replace(/\.[^/.]+$/, ""), // strip extension
                    artist: "Local Device",
                    file: url,
                    cover: "assets/images/softcore.png"
                };

                localSongs.push(newSong);
                songs.push(newSong);
            }

            renderLocalFiles();
            showPage('local');
            renderHome(songs); // re-render list with local songs available
        });
    };

    window.renderLocalFiles = function () {
        const container = document.getElementById('local-track-list');
        if (!container) return;

        container.innerHTML = '';
        if (localSongs.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">No local files added.</td></tr>';
            return;
        }

        localSongs.forEach((song, idx) => {
            const originalIndex = songs.findIndex(s => s.file === song.file);
            const isFav = favorites.some(s => s.file === song.file);

            const row = document.createElement('tr');
            row.className = 'track-row';
            row.style.cursor = 'pointer';
            row.onclick = () => playSong(originalIndex);
            row.innerHTML = `
                <td class="track-index">${idx + 1}</td>
                <td>
                    <div class="track-title-cell">
                        <img src="${song.cover || 'assets/images/softcore.png'}" class="track-img" onerror="this.src='assets/images/softcore.png'">
                        <div>
                            <div class="track-name">${song.title}</div>
                            <div class="track-artist">${song.artist || 'Unknown'}</div>
                        </div>
                    </div>
                </td>
                <td>Disk File</td>
                <td>Today</td>
                <td>Unknown</td>
                <td>
                    <span class="material-icons-outlined" style="color: ${isFav ? 'var(--accent-pink)' : '#888'}" onclick="event.stopPropagation(); toggleFavorite('${song.file}')">${isFav ? 'favorite' : 'favorite_border'}</span>
                </td>
            `;
            container.appendChild(row);
        });
    };

    // SETTINGS MODAL
    window.openSettings = function () {
        document.getElementById('settings-modal').classList.add('open');
    };
    window.closeSettings = function () {
        document.getElementById('settings-modal').classList.remove('open');
        // Mock save toast
        const div = document.createElement('div');
        div.textContent = 'Preferences saved!';
        div.style.position = 'fixed';
        div.style.bottom = '20px';
        div.style.left = '50%';
        div.style.transform = 'translateX(-50%)';
        div.style.background = 'var(--accent-pink)';
        div.style.color = 'white';
        div.style.padding = '10px 20px';
        div.style.borderRadius = '5px';
        div.style.zIndex = '99999';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    };

    /* =========================
       PLAYER LOGIC
    ========================= */
    function syncUI() {
        if (!songs[currentIndex]) return;
        const song = songs[currentIndex];

        const coverSrc = song.cover || 'assets/images/softcore.png';
        const titleStr = song.title;
        const artistStr = song.artist || 'Unknown Artist';

        // Update Mini Player
        playerTitle.textContent = titleStr;
        playerArtist.textContent = artistStr;
        playerCover.src = coverSrc;

        // Update Large Player
        if (largeTitle) largeTitle.textContent = titleStr;
        if (largeArtist) largeArtist.textContent = artistStr;
        if (largeCover) largeCover.src = coverSrc;

        const isPlaying = !audio.paused && !audio.ended;
        if (playBtn) playBtn.innerHTML = isPlaying ? '<span class="material-icons">pause</span>' : '<span class="material-icons">play_arrow</span>';
        if (largePlayBtn) largePlayBtn.innerHTML = isPlaying ? '<span class="material-icons">pause</span>' : '<span class="material-icons">play_arrow</span>';
    }

    window.playSong = function(index) {
        if (!songs[index]) return;
        currentIndex = index;
        audio.src = songs[index].file;
        syncUI();
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => syncUI()).catch(err => { console.warn('Playback error:', err); syncUI(); });
        }
    }

    function togglePlay() {
        if (!audio.src && songs.length > 0) {
            playSong(0);
            return;
        }
        if (audio.paused) {
            const p = audio.play();
            if (p !== undefined) p.then(() => syncUI()).catch(err => { console.warn(err); syncUI(); });
        } else {
            audio.pause();
            syncUI();
        }
    }

    function playNext() {
        if (songs.length === 0) return;
        const newIndex = currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
        playSong(newIndex);
    }

    function playPrev() {
        if (songs.length === 0) return;
        const newIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
        playSong(newIndex);
    }

    // Mini Player Events
    if (playBtn) playBtn.addEventListener('click', togglePlay);
    if (nextBtn) nextBtn.addEventListener('click', playNext);
    if (prevBtn) prevBtn.addEventListener('click', playPrev);

    // Large Player Events
    if (largePlayBtn) largePlayBtn.addEventListener('click', togglePlay);
    if (largeNextBtn) largeNextBtn.addEventListener('click', playNext);
    if (largePrevBtn) largePrevBtn.addEventListener('click', playPrev);

    if (playerContainer && largePlayer) {
        playerContainer.addEventListener('click', () => {
            if (currentIndex >= 0 || audio.src) {
                largePlayer.classList.add('open');
            }
        });

        if (closeLargeBtn) {
            closeLargeBtn.addEventListener('click', () => {
                largePlayer.classList.remove('open');
            });
        }
    }

    if (audio) {
        audio.addEventListener('ended', playNext);

        audio.addEventListener('timeupdate', () => {
            if (!audio.duration || !seek) return;
            seek.value = (audio.currentTime / audio.duration) * 100;
        });
    }

    if (seek) {
        seek.addEventListener('input', () => {
            if (!audio.duration) return;
            audio.currentTime = (seek.value / 100) * audio.duration;
        });
    }

    /* =========================
       SEARCH
    ========================= */
    if (searchInput) {
        const searchResultsGrid = document.getElementById('search-results-grid');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            if (query.length > 0) {
                // Show search page
                if (typeof showPage === 'function') {
                    showPage('search');
                }

                // Filter songs
                const results = songs.filter(song => {
                    const titleMatch = (song.title || '').toLowerCase().includes(query);
                    const artistMatch = (song.artist || '').toLowerCase().includes(query);
                    return titleMatch || artistMatch;
                });

                // Render results
                if (searchResultsGrid) {
                    searchResultsGrid.innerHTML = '';
                    if (results.length === 0) {
                        searchResultsGrid.innerHTML = '<p style="color: #888; grid-column: 1/-1;">No results found.</p>';
                    } else {
                        results.forEach((song) => {
                            // Find actual index in main songs array
                            const originalIndex = songs.findIndex(s => s.file === song.file);

                            const card = document.createElement('div');
                            card.className = 'music-card';
                            card.onclick = () => playSong(originalIndex);
                            card.innerHTML = `
                                <img src="${song.cover || 'assets/images/softcore.png'}" onerror="this.src='assets/images/softcore.png'">
                                <h4>${song.title}</h4>
                                <p>${song.artist || 'Unknown'}</p>
                            `;
                            searchResultsGrid.appendChild(card);
                        });
                    }
                }
            } else {
                // If input is cleared, go back to home
                if (typeof showPage === 'function') {
                    showPage('home');
                }
            }
        });
    }

    // Fetch initial data
    loadSongs();

    // Initialize library features
    setupLocalFiles();
    renderFavorites();
    renderLocalFiles();

    // Load user's saved favorites from Supabase
    loadFavorites();
    
    // Load user's saved playlists from Supabase
    loadPlaylists();
});

// Play all songs from album page (plays first song)
window.playAlbum = function () {
    if (typeof window.playSong === 'function' && songs.length > 0) {
        window.playSong(0);
    }
};
