-- =========================================
-- Melody Stream - Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =========================================

-- FAVORITES TABLE
CREATE TABLE IF NOT EXISTS favorites (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  song_file   text NOT NULL,
  song_title  text,
  song_artist text,
  song_cover  text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, song_file)
);

-- PLAYLISTS TABLE
CREATE TABLE IF NOT EXISTS playlists (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- PLAYLIST SONGS TABLE
CREATE TABLE IF NOT EXISTS playlist_songs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  song_file   text NOT NULL,
  song_title  text,
  song_artist text,
  song_cover  text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(playlist_id, song_file)
);

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================
ALTER TABLE favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists     ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

-- Favorites: users can only see/edit their own
CREATE POLICY "favorites_own" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Playlists: users can only see/edit their own
CREATE POLICY "playlists_own" ON playlists
  FOR ALL USING (auth.uid() = user_id);

-- Playlist songs: only accessible if user owns the playlist
CREATE POLICY "playlist_songs_own" ON playlist_songs
  FOR ALL USING (
    playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid())
  );
