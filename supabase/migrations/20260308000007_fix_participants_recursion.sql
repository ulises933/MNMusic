-- Fix infinite recursion in conversation_participants SELECT policy
-- The previous policy was querying conversation_participants from within itself

-- Drop existing policies
DROP POLICY IF EXISTS "Users see own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users see participants in own conversations" ON public.conversation_participants;

-- Drop function if exists
DROP FUNCTION IF EXISTS public.user_is_in_conversation(UUID);

-- Create a function that checks if user is in the conversation (avoids recursion)
CREATE OR REPLACE FUNCTION public.user_is_in_conversation(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  -- and can directly query conversation_participants without recursion
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = conv_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_is_in_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_in_conversation(UUID) TO anon;

-- Create new policy that allows users to see all participants in their conversations
-- This is needed to find the "other user" in a conversation
CREATE POLICY "Users see participants in own conversations" ON public.conversation_participants 
  FOR SELECT 
  USING (public.user_is_in_conversation(conversation_id));
