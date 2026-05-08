
-- Fix overly permissive INSERT policies on conversations
DROP POLICY "Users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY "Users can add participants" ON public.conversation_participants;
CREATE POLICY "Authenticated users can add participants" ON public.conversation_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
