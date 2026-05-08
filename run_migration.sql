-- ============================================
-- MIGRACIÓN COMPLETA: Fix RLS y agregar invitation_id
-- ============================================
-- Ejecuta este script en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New Query > Paste this > Run

-- ============================================
-- PARTE 1: Fix infinite recursion en conversation_participants
-- ============================================

-- Drop la política problemática
DROP POLICY IF EXISTS "Users see own participation" ON public.conversation_participants;

-- Crear política simple que solo verifica user_id
CREATE POLICY "Users see own participation" ON public.conversation_participants 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Asegurar que INSERT policy es correcta
DROP POLICY IF EXISTS "Authenticated users can add participants" ON public.conversation_participants;
CREATE POLICY "Authenticated users can add participants" ON public.conversation_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix conversations SELECT policy
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

-- ============================================
-- PARTE 2: Agregar invitation_id a conversations
-- ============================================

-- 1. Agregar columna invitation_id a conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES public.invitations(id) ON DELETE SET NULL;

-- 2. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_conversations_invitation ON public.conversations(invitation_id);

-- 3. Agregar columna conversation_id a invitations (si no existe)
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

-- 4. Crear índice para invitations.conversation_id
CREATE INDEX IF NOT EXISTS idx_invitations_conversation ON public.invitations(conversation_id);

-- ============================================
-- Verificación
-- ============================================
SELECT 
  'conversation_participants policies fixed' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'conversation_participants';

SELECT 
  'conversations' as tabla,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'conversations'
  AND column_name = 'invitation_id'

UNION ALL

SELECT 
  'invitations' as tabla,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'invitations'
  AND column_name = 'conversation_id';
