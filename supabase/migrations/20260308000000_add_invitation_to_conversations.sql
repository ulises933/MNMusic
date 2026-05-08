-- Add invitation_id to conversations to link conversations with invitations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES public.invitations(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_invitation ON public.conversations(invitation_id);
