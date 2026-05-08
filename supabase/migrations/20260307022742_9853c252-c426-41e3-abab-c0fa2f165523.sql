
-- Add rate_type to artist_profiles
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS rate_type text NOT NULL DEFAULT 'per_event';

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- RLS for avatars bucket
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Allow users (not just organizers) to create events
DROP POLICY IF EXISTS "Organizers can insert events" ON public.events;
CREATE POLICY "Authenticated users can insert events" ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id);

-- Allow users to update/delete their own events
DROP POLICY IF EXISTS "Organizers can update own events" ON public.events;
CREATE POLICY "Owners can update own events" ON public.events FOR UPDATE USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizers can delete own events" ON public.events;
CREATE POLICY "Owners can delete own events" ON public.events FOR DELETE USING (auth.uid() = organizer_id);
