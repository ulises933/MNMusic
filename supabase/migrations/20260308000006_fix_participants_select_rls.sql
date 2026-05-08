-- Fix SELECT policy for conversation_participants
-- Users should be able to see ALL participants in conversations they are part of
-- Current policy only allows seeing own participation, which prevents finding "other participant"
-- Use a function with SECURITY DEFINER to avoid recursion

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users see own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users see participants in own conversations" ON public.conversation_participants;

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
