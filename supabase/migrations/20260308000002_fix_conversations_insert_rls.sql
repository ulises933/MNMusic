-- Fix RLS policies for conversations table to allow INSERT
-- This fixes the error: "new row violates row-level security policy for table 'conversations'"

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users see own conversations" ON public.conversations;

-- Create INSERT policy that allows authenticated users to create conversations
CREATE POLICY "Authenticated users can create conversations" ON public.conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create SELECT policy - users can see conversations they participate in
CREATE POLICY "Users see own conversations" ON public.conversations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = conversations.id 
      AND user_id = auth.uid()
    )
  );

-- Create UPDATE policy - users can update conversations they participate in (for invitation_id)
CREATE POLICY "Users can update own conversations" ON public.conversations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = conversations.id 
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants 
      WHERE conversation_id = conversations.id 
      AND user_id = auth.uid()
    )
  );
