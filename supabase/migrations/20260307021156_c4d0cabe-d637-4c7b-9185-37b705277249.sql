
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('musician', 'organizer', 'user');

-- Create event type enum
CREATE TYPE public.event_type AS ENUM ('wedding', 'bar', 'restaurant', 'festival', 'corporate', 'private');

-- Create status enums
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'rejected');

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  city TEXT,
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || LEFT(NEW.id::text, 8),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== ARTIST PROFILES (extended) ==========
CREATE TABLE public.artist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL DEFAULT '',
  base_rate NUMERIC DEFAULT 0,
  genres TEXT[] DEFAULT '{}',
  instruments TEXT[] DEFAULT '{}',
  experience TEXT,
  education TEXT,
  languages TEXT[] DEFAULT '{}',
  availability TEXT,
  travel_radius TEXT,
  equipment TEXT[] DEFAULT '{}',
  website TEXT,
  social_media JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artist profiles viewable by everyone" ON public.artist_profiles FOR SELECT USING (true);
CREATE POLICY "Artists can insert own profile" ON public.artist_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Artists can update own profile" ON public.artist_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_artist_profiles_updated_at BEFORE UPDATE ON public.artist_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== ORGANIZER PROFILES ==========
CREATE TABLE public.organizer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT DEFAULT '',
  company_type TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizer profiles viewable by everyone" ON public.organizer_profiles FOR SELECT USING (true);
CREATE POLICY "Organizers can insert own profile" ON public.organizer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Organizers can update own profile" ON public.organizer_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_organizer_profiles_updated_at BEFORE UPDATE ON public.organizer_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== EVENTS ==========
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type event_type NOT NULL DEFAULT 'bar',
  date DATE NOT NULL,
  time TIME NOT NULL,
  end_time TIME,
  city TEXT NOT NULL,
  venue TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  payment NUMERIC NOT NULL DEFAULT 0,
  payment_max NUMERIC,
  genres TEXT[] DEFAULT '{}',
  musicians_needed INTEGER DEFAULT 1,
  duration TEXT DEFAULT '',
  dress_code TEXT DEFAULT '',
  sound_provided BOOLEAN DEFAULT false,
  instruments_needed TEXT[] DEFAULT '{}',
  status event_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events viewable by everyone" ON public.events FOR SELECT USING (status = 'published' OR auth.uid() = organizer_id);
CREATE POLICY "Organizers can insert events" ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update own events" ON public.events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete own events" ON public.events FOR DELETE USING (auth.uid() = organizer_id);

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== APPLICATIONS ==========
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  musician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  proposed_rate NUMERIC DEFAULT 0,
  status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, musician_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Musicians see own applications" ON public.applications FOR SELECT USING (
  auth.uid() = musician_id
  OR EXISTS (SELECT 1 FROM public.events WHERE events.id = applications.event_id AND events.organizer_id = auth.uid())
);
CREATE POLICY "Musicians can apply" ON public.applications FOR INSERT WITH CHECK (auth.uid() = musician_id);
CREATE POLICY "Organizers can update application status" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = applications.event_id AND events.organizer_id = auth.uid())
);
CREATE POLICY "Musicians can delete own applications" ON public.applications FOR DELETE USING (auth.uid() = musician_id);

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== CONVERSATIONS ==========
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own conversations" ON public.conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = conversations.id AND user_id = auth.uid())
);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users see own participation" ON public.conversation_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Users can add participants" ON public.conversation_participants FOR INSERT WITH CHECK (true);

-- ========== MESSAGES ==========
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can see messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Recipients can mark as read" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ========== REVIEWS ==========
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- ========== PORTFOLIO ITEMS ==========
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'link',
  url TEXT NOT NULL DEFAULT '#',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio viewable by everyone" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Artists can manage own portfolio" ON public.portfolio_items FOR INSERT WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Artists can update own portfolio" ON public.portfolio_items FOR UPDATE USING (auth.uid() = artist_id);
CREATE POLICY "Artists can delete own portfolio" ON public.portfolio_items FOR DELETE USING (auth.uid() = artist_id);

-- ========== INVITATIONS ==========
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, artist_id)
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists see own invitations" ON public.invitations FOR SELECT USING (auth.uid() = artist_id OR auth.uid() = sender_id);
CREATE POLICY "Users can send invitations" ON public.invitations FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Artists can respond to invitations" ON public.invitations FOR UPDATE USING (auth.uid() = artist_id);

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== INDEXES ==========
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_applications_event ON public.applications(event_id);
CREATE INDEX idx_applications_musician ON public.applications(musician_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_reviews_artist ON public.reviews(artist_id);
CREATE INDEX idx_invitations_artist ON public.invitations(artist_id);
