-- Fix SELECT policy for conversations to avoid RLS recursion issues
-- Use a simpler approach: allow users to see conversations where they are participants
-- by directly checking conversation_participants without RLS recursion

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users see own conversations" ON public.conversations;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.user_can_see_conversation(UUID);

-- Create a function with SECURITY DEFINER that bypasses RLS
-- This function checks if the current user is a participant
CREATE OR REPLACE FUNCTION public.user_can_see_conversation(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  -- and can directly query conversation_participants
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = conv_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.user_can_see_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_see_conversation(UUID) TO anon;

-- Create SELECT policy using the function
CREATE POLICY "Users see own conversations" ON public.conversations 
  FOR SELECT 
  USING (public.user_can_see_conversation(id));
