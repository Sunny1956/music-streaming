-- =============================================
-- Melody Stream — Complete Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. USER PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id         uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name  text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. SONGS TABLE (music catalog)
CREATE TABLE IF NOT EXISTS songs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text NOT NULL,
  artist     text,
  file       text NOT NULL,
  cover      text,
  created_at timestamptz DEFAULT now()
);

-- 3. FAVORITES TABLE
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

-- 4. PLAYLISTS TABLE
CREATE TABLE IF NOT EXISTS playlists (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. PLAYLIST SONGS TABLE
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

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

-- User profiles: users can read/update their own profile
CREATE POLICY "profiles_own_select" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Songs: everyone can read the catalog
CREATE POLICY "songs_public_read" ON songs FOR SELECT USING (true);

-- Favorites: users can only see/edit their own
CREATE POLICY "favorites_select" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Playlists: users can only see/edit their own
CREATE POLICY "playlists_select" ON playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "playlists_insert" ON playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "playlists_delete" ON playlists FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "playlists_update" ON playlists FOR UPDATE USING (auth.uid() = user_id);

-- Playlist songs: accessible if user owns the parent playlist
CREATE POLICY "playlist_songs_select" ON playlist_songs FOR SELECT USING (
  playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid())
);
CREATE POLICY "playlist_songs_insert" ON playlist_songs FOR INSERT WITH CHECK (
  playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid())
);
CREATE POLICY "playlist_songs_delete" ON playlist_songs FOR DELETE USING (
  playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid())
);

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED SONGS DATA (20 tracks)
-- =============================================
INSERT INTO songs (title, artist, file, cover) VALUES
  ('Sunrise Drive', 'Chillhop Collective', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?w=400&q=60'),
  ('Late Night', 'Electronica', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=60'),
  ('Coastal Run', 'Indie Waves', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=60'),
  ('Neon Lights', 'Synthwave City', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=60'),
  ('Acoustic Morning', 'Sarah Strings', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=60'),
  ('Midnight Drive', 'Retro Racers', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', 'https://images.unsplash.com/photo-1507802871141-8664188cf46f?w=400&q=60'),
  ('Electric Soul', 'Voltage Band', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=60'),
  ('Desert Wind', 'Sandstorm DJ', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=60'),
  ('City Pulse', 'Urban Beats', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=60'),
  ('Forest Echo', 'Nature Sounds', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=60'),
  ('Space Journey', 'Cosmic Flow', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=60'),
  ('Rain Dance', 'Tribal Groove', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=60'),
  ('Velvet Underground', 'The Lounge Collective', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=60'),
  ('Jazz Horizon', 'Blue Note Trio', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&q=60'),
  ('Summer Haze', 'Beachside Boys', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=60'),
  ('Cold Nights', 'Winter Vibes', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&q=60'),
  ('Fire & Ice', 'Dual Nature', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=60'),
  ('Mountain High', 'Alpine Track', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=60'),
  ('Ocean Deep', 'Neptune Dive', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=60'),
  ('Starlight', 'Galaxy Dreams', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&q=60')
ON CONFLICT DO NOTHING;
