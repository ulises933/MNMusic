import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, DollarSign, Check, X, MessageSquare, User, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { eventTypeLabels, eventTypeColors, type EventType, type ApplicationStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface InvitationWithDetails {
  id: string;
  event_id: string;
  artist_id: string;
  sender_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  event: {
    id: string;
    title: string;
    type: EventType;
    date: string;
    time: string;
    end_time: string | null;
    city: string;
    venue: string;
    description: string | null;
    payment: number;
    payment_max: number | null;
    organizer_id: string;
  };
  sender: {
    display_name: string;
    avatar_url: string | null;
  };
}

export default function Invitations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (user) fetchInvitations();
  }, [user]);

  const fetchInvitations = async () => {
    const { data: invs } = await supabase
      .from('invitations')
      .select('*')
      .eq('artist_id', user!.id)
      .order('created_at', { ascending: false });

    if (!invs) {
      setLoading(false);
      return;
    }

    const enriched: InvitationWithDetails[] = [];
    for (const inv of invs) {
      const [eventRes, senderRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', inv.event_id).maybeSingle(),
        supabase.from('profiles').select('display_name, avatar_url').eq('user_id', inv.sender_id).maybeSingle(),
      ]);

      if (eventRes.data) {
        enriched.push({
          ...inv,
          status: inv.status as 'pending' | 'accepted' | 'rejected',
          event: {
            id: eventRes.data.id,
            title: eventRes.data.title,
            type: eventRes.data.type as EventType,
            date: eventRes.data.date,
            time: eventRes.data.time,
            end_time: eventRes.data.end_time,
            city: eventRes.data.city,
            venue: eventRes.data.venue,
            description: eventRes.data.description,
            payment: eventRes.data.payment,
            payment_max: eventRes.data.payment_max,
            organizer_id: eventRes.data.organizer_id,
          },
          sender: {
            display_name: senderRes.data?.display_name || 'Organizador',
            avatar_url: senderRes.data?.avatar_url || null,
          },
        });
      }
    }

    setInvitations(enriched);
    setLoading(false);
  };

  const handleResponse = async (invitationId: string, status: 'accepted' | 'rejected') => {
    if (!selectedInvitation || !user) return;
    
    setResponding(true);
    
    // Update invitation status
    const { error: invError } = await supabase
      .from('invitations')
      .update({ status })
      .eq('id', invitationId);

    if (invError) {
      toast({ title: 'Error', description: invError.message, variant: 'destructive' });
      setResponding(false);
      return;
    }

    if (status === 'accepted') {
      // Create application with accepted status (assign event to artist)
      const { error: appError } = await supabase
        .from('applications')
        .upsert({
          event_id: selectedInvitation.event_id,
          musician_id: user.id,
          message: `Acepté la invitación para el evento "${selectedInvitation.event.title}"`,
          proposed_rate: selectedInvitation.event.payment,
          status: 'accepted',
        }, {
          onConflict: 'event_id,musician_id'
        });

      if (appError) {
        console.error('Error creating application:', appError);
        // Continue anyway - the invitation is already accepted
      }

      // Find or create conversation linked to this invitation
      let conversationId: string | null = null;
      
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('invitation_id', invitationId)
        .maybeSingle();
      
      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create conversation if doesn't exist
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ invitation_id: invitationId })
          .select()
          .single();
        
        if (!convError && newConv) {
          conversationId = newConv.id;
          // Add participants
          await Promise.all([
            supabase.from('conversation_participants').upsert(
              { conversation_id: conversationId, user_id: user.id },
              { onConflict: 'conversation_id,user_id' }
            ),
            supabase.from('conversation_participants').upsert(
              { conversation_id: conversationId, user_id: selectedInvitation.sender_id },
              { onConflict: 'conversation_id,user_id' }
            ),
          ]);
        }
      }

      // Send confirmation message in conversation
      if (conversationId) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          text: `✅ He aceptado tu invitación para el evento "${selectedInvitation.event.title}". ¡Estoy confirmado para el evento!`,
        });
      }

      toast({ 
        title: '✅ Invitación aceptada',
        description: 'El evento ha sido asignado. Puedes comunicarte con el organizador en Mensajes.'
      });
      
      setDetailOpen(false);
      fetchInvitations();
      
      // Navigate to messages
      setTimeout(() => {
        navigate('/messages');
      }, 500);
    } else {
      toast({ title: 'Invitación rechazada' });
      setDetailOpen(false);
      fetchInvitations();
    }
    setResponding(false);
  };

  const openDetail = (inv: InvitationWithDetails) => {
    setSelectedInvitation(inv);
    setDetailOpen(true);
  };

  const startConversation = async (invitation: InvitationWithDetails) => {
    if (!user) return;
    
    // Check if conversation already exists for this invitation
    let conversationId: string | null = null;
    
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('invitation_id', invitation.id)
      .maybeSingle();
    
    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      // Generate conversation ID first
      const newConvId = crypto.randomUUID();
      
      // Create new conversation without select to avoid RLS issues
      const { error: convError } = await supabase
        .from('conversations')
        .insert({ id: newConvId, invitation_id: invitation.id });
      
      if (convError) {
        toast({ title: 'Error', description: 'Error al crear conversación: ' + convError.message, variant: 'destructive' });
        return;
      }

      conversationId = newConvId;

      // Add participants - use insert instead of upsert to ensure they're added
      console.log('Adding participants:', { 
        conversationId, 
        artistId: user.id, 
        senderId: invitation.sender_id 
      });
      
      const part1Res = await supabase.from('conversation_participants').insert(
        { conversation_id: conversationId, user_id: user.id }
      );
      
      console.log('Participant 1 (artist) result:', { 
        error: part1Res.error, 
        data: part1Res.data,
        status: part1Res.status,
        statusText: part1Res.statusText
      });
      
      const part2Res = await supabase.from('conversation_participants').insert(
        { conversation_id: conversationId, user_id: invitation.sender_id }
      );
      
      console.log('Participant 2 (sender) result:', { 
        error: part2Res.error, 
        data: part2Res.data,
        status: part2Res.status,
        statusText: part2Res.statusText
      });

      if (part1Res.error || part2Res.error) {
        console.error('Error adding participants:', part1Res.error || part2Res.error);
        console.error('Error details:', {
          part1Error: part1Res.error ? {
            message: part1Res.error.message,
            details: part1Res.error.details,
            hint: part1Res.error.hint,
            code: part1Res.error.code
          } : null,
          part2Error: part2Res.error ? {
            message: part2Res.error.message,
            details: part2Res.error.details,
            hint: part2Res.error.hint,
            code: part2Res.error.code
          } : null
        });
        toast({ 
          title: 'Error', 
          description: 'Error al agregar participantes: ' + (part1Res.error?.message || part2Res.error?.message), 
          variant: 'destructive' 
        });
        return;
      }

      // Verify participants were added
      const { data: verifyParts, error: verifyError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId);
      
      console.log('Verification - participants in conversation:', verifyParts, 'Error:', verifyError);
      console.log('Participants added successfully:', { conversationId, user1: user.id, user2: invitation.sender_id });

      // Send initial message from artist asking about the event
      const initialMessage = `Hola! Recibí tu invitación para el evento "${invitation.event.title}". Me gustaría hacer algunas preguntas antes de confirmar.`;
      
      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        text: initialMessage,
      });

      if (msgError) {
        console.error('Error sending initial message:', msgError);
      }

      // Wait a bit to ensure everything is saved
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Navigate to messages with conversation ID - the conversation will be available there
    setDetailOpen(false);
    
    // Wait a moment before navigating to ensure data is persisted
    setTimeout(() => {
      navigate(`/messages?conversation=${conversationId}`);
      toast({ 
        title: 'Conversación iniciada', 
        description: 'Puedes hacer tus preguntas al organizador' 
      });
    }, 300);
  };

  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Invitaciones</h1>
        <p className="text-muted-foreground mt-1">
          {pendingCount > 0 
            ? `${pendingCount} invitación${pendingCount > 1 ? 'es' : ''} pendiente${pendingCount > 1 ? 's' : ''}`
            : 'No tienes invitaciones pendientes'}
        </p>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-display font-semibold text-lg mb-2">No tienes invitaciones</h3>
            <p className="text-sm text-muted-foreground">Las invitaciones de organizadores aparecerán aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map(inv => (
            <Card key={inv.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(inv)}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={inv.sender.avatar_url || ''} />
                    <AvatarFallback>{inv.sender.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-display font-semibold text-base">{inv.event.title}</p>
                        <p className="text-sm text-muted-foreground">Invitado por {inv.sender.display_name}</p>
                      </div>
                      <Badge 
                        className={
                          inv.status === 'pending' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : inv.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }
                      >
                        {inv.status === 'pending' ? 'Pendiente' : inv.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {inv.event.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {inv.event.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {inv.event.city}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> ${inv.event.payment}{inv.event.payment_max ? `–${inv.event.payment_max}` : ''} MXN</span>
                    </div>
                    {inv.message && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{inv.message}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge className={eventTypeColors[inv.event.type]}>{eventTypeLabels[inv.event.type]}</Badge>
                      {inv.status === 'pending' && (
                        <div className="flex gap-2 ml-auto">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              startConversation(inv);
                            }}
                          >
                            <Send className="w-4 h-4 mr-1" /> Hacer preguntas
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(inv);
                            }}
                          >
                            Ver detalles
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResponse(inv.id, 'rejected');
                            }}
                          >
                            <X className="w-4 h-4 mr-1" /> Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedInvitation && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{selectedInvitation.event.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Sender Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedInvitation.sender.avatar_url || ''} />
                    <AvatarFallback>{selectedInvitation.sender.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">Invitado por</p>
                    <p className="text-sm text-muted-foreground">{selectedInvitation.sender.display_name}</p>
                  </div>
                </div>

                {/* Event Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" /> Detalles del Evento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={eventTypeColors[selectedInvitation.event.type]}>
                        {eventTypeLabels[selectedInvitation.event.type]}
                      </Badge>
                      <span className="text-lg font-display font-bold text-primary">
                        ${selectedInvitation.event.payment}{selectedInvitation.event.payment_max ? `–${selectedInvitation.event.payment_max}` : ''} MXN
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Fecha:</span>
                        <span>{selectedInvitation.event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Hora:</span>
                        <span>{selectedInvitation.event.time}{selectedInvitation.event.end_time ? ` - ${selectedInvitation.event.end_time}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Ubicación:</span>
                        <span>{selectedInvitation.event.venue}, {selectedInvitation.event.city}</span>
                      </div>
                    </div>
                    {selectedInvitation.event.description && (
                      <div>
                        <p className="font-medium text-sm mb-1">Descripción:</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{selectedInvitation.event.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Organizer Message */}
                {selectedInvitation.message && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" /> Mensaje del Organizador
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{selectedInvitation.message}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Status Badge */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Estado:</span>
                  <Badge 
                    className={
                      selectedInvitation.status === 'pending' 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        : selectedInvitation.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }
                  >
                    {selectedInvitation.status === 'pending' ? 'Pendiente' : selectedInvitation.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                  </Badge>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/events/${selectedInvitation.event.id}`)}
                  className="w-full sm:w-auto"
                >
                  Ver evento completo
                </Button>
                {selectedInvitation.status === 'pending' ? (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10 flex-1 sm:flex-initial"
                      onClick={() => {
                        setDetailOpen(false);
                        startConversation(selectedInvitation);
                      }}
                    >
                      <Send className="w-4 h-4 mr-1" /> Hacer preguntas
                    </Button>
                    <Button 
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50 flex-1 sm:flex-initial"
                      onClick={() => handleResponse(selectedInvitation.id, 'rejected')}
                      disabled={responding}
                    >
                      <X className="w-4 h-4 mr-1" /> Rechazar
                    </Button>
                    <Button 
                      className="gradient-primary text-white border-0 flex-1 sm:flex-initial whitespace-nowrap"
                      onClick={() => handleResponse(selectedInvitation.id, 'accepted')}
                      disabled={responding}
                    >
                      <Check className="w-4 h-4 mr-1" /> Aceptar
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setDetailOpen(false)} className="w-full sm:w-auto">
                    Cerrar
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
