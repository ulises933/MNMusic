-- Simplify the SELECT policy for conversations
-- Instead of using a function, use a direct JOIN approach that works better with RLS

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users see own conversations" ON public.conversations;

-- Create a simpler SELECT policy that directly checks participation
-- This uses a subquery that should work with RLS
CREATE POLICY "Users see own conversations" ON public.conversations 
  FOR SELECT 
  USING (
    id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );
