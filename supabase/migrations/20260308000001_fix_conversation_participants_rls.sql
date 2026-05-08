-- Fix infinite recursion in conversation_participants RLS policy
-- The policy was checking conversation_participants from within conversation_participants, causing recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users see own participation" ON public.conversation_participants;

-- Create a simpler policy that just checks if the user_id matches
CREATE POLICY "Users see own participation" ON public.conversation_participants 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Also ensure INSERT policy is correct (should already be fixed but making sure)
DROP POLICY IF EXISTS "Authenticated users can add participants" ON public.conversation_participants;
CREATE POLICY "Authenticated users can add participants" ON public.conversation_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix conversations SELECT policy to avoid recursion
DROP POLICY IF EXISTS "Users see own conversations" ON public.conversations;
CREATE POLICY "Users see own conversations" ON public.conversations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = conversations.id 
      AND user_id = auth.uid()
    )
  );
