import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Paperclip, MessageSquare, Calendar, Clock, MapPin, DollarSign, Music, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { eventTypeLabels, eventTypeColors, type EventType } from '@/lib/types';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

interface ConversationItem {
  id: string;
  otherUser: { id: string; name: string; avatar: string };
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  invitationId?: string | null;
  invitationStatus?: 'pending' | 'accepted' | 'rejected' | null;
  applicationStatus?: 'pending' | 'accepted' | 'rejected' | null;
  eventInfo?: {
    id: string;
    title: string;
    date: string;
    time: string;
    end_time: string | null;
    venue: string;
    city: string;
    payment: number;
    payment_max: number | null;
    description: string | null;
    type: EventType;
  } | null;
}

interface MessageItem {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
}

export default function Messages() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  // Reload conversations when navigating to this page (to catch newly created ones)
  useEffect(() => {
    if (user && location.pathname === '/messages') {
      fetchConversations();
    }
  }, [location.pathname, user]);

  // Check for conversation ID in URL params
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId && convId !== selectedId) {
      // Wait a bit for conversations to load, then select
      setTimeout(() => {
        setSelectedId(convId);
        // Remove from URL after setting
        setSearchParams({}, { replace: true });
      }, 500);
    }
  }, [searchParams, selectedId, setSearchParams]);

  useEffect(() => {
    if (selectedId) fetchMessages(selectedId);
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`messages-${selectedId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedId}` }, (payload) => {
        const msg = payload.new as MessageItem;
        setMessages(prev => [...prev, msg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  // Realtime subscription for new conversation participants (to detect new conversations)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('conversation-participants')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'conversation_participants', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        // Reload conversations when a new participant is added (new conversation)
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    
    // Use JOIN to get conversations directly from conversation_participants
    // This avoids RLS issues by querying from a table the user can access
    const { data: participations, error: partError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!inner (
          id,
          invitation_id
        )
      `)
      .eq('user_id', user.id);

    if (partError) {
      console.error('Error fetching participations with JOIN:', partError);
      setLoading(false);
      return;
    }

    if (!participations || participations.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    console.log('Found participations with conversations:', participations.length);
    const items: ConversationItem[] = [];

    for (const part of participations) {
      const convId = part.conversation_id;
      // The conversation data comes from the JOIN
      const conv = Array.isArray(part.conversations) ? part.conversations[0] : part.conversations;
      
      if (!conv) {
        console.warn(`Conversation ${convId} not found in JOIN result`);
        continue;
      }

      console.log(`Processing conversation ${convId}:`, conv);

      // Fix missing participants if conversation has invitation_id
      if (conv.invitation_id) {
        const { data: invitation } = await supabase
          .from('invitations')
          .select('sender_id, artist_id')
          .eq('id', conv.invitation_id)
          .maybeSingle();
        
        if (invitation) {
          const { data: currentParts } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', convId);
          
          const currentUserIds = currentParts?.map(p => p.user_id) || [];
          const requiredIds = [invitation.sender_id, invitation.artist_id];
          
          // Add missing participants
          for (const requiredId of requiredIds) {
            if (!currentUserIds.includes(requiredId)) {
              console.log(`Fixing: Adding missing participant ${requiredId} to conversation ${convId}`);
              const { error: fixError } = await supabase
                .from('conversation_participants')
                .insert({ conversation_id: convId, user_id: requiredId });
              
              if (fixError) {
                console.error('Error adding missing participant:', fixError);
              } else {
                console.log('Successfully added missing participant');
              }
            }
          }
        }
      }

      // Get ALL participants first to debug
      const { data: allParts, error: allPartsError } = await supabase
        .from('conversation_participants')
        .select('user_id, conversation_id')
        .eq('conversation_id', convId);

      console.log(`All participants for ${convId}:`, allParts, 'Error:', allPartsError);
      
      // Get other participant (not the current user)
      const { data: parts, error: partsError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', convId)
        .neq('user_id', user!.id);

      if (partsError) {
        console.error(`Error fetching other participant for ${convId}:`, partsError);
        console.error('Error details:', {
          message: partsError.message,
          details: partsError.details,
          hint: partsError.hint,
          code: partsError.code
        });
        continue;
      }

      console.log(`Other participants (excluding current user) for ${convId}:`, parts);
      
      const otherId = parts?.[0]?.user_id;
      if (!otherId) {
        console.warn(`No other participant found for conversation ${convId}. All parts:`, allParts, 'Filtered parts:', parts);
        console.log('Current user ID:', user!.id);
        console.log('All parts structure:', JSON.stringify(allParts, null, 2));
        
        // Try to get it from allParts manually
        const manualOther = allParts?.find(p => {
          console.log('Checking participant:', p, 'user_id:', p?.user_id, 'current user:', user!.id, 'match:', p?.user_id !== user!.id);
          return p?.user_id !== user!.id;
        });
        
        console.log('Manual other found:', manualOther);
        
        if (manualOther) {
          console.log('Found other participant manually:', manualOther.user_id);
          // Use this as fallback
          const fallbackOtherId = manualOther.user_id;
          // Continue with fallbackOtherId instead of otherId
          const { data: prof, error: profError } = await supabase.from('profiles').select('display_name, avatar_url').eq('user_id', fallbackOtherId).maybeSingle();
          
          if (profError) {
            console.error(`Error fetching profile for ${fallbackOtherId}:`, profError);
          }
          
          console.log(`Profile for ${fallbackOtherId}:`, prof);
          
          // Get event info if there's an invitation
          let eventInfo = null;
          if (conv?.invitation_id) {
            const { data: invitation } = await supabase
              .from('invitations')
              .select('event_id')
              .eq('id', conv.invitation_id)
              .maybeSingle();
            
            if (invitation?.event_id) {
              const { data: event } = await supabase
                .from('events')
                .select('*')
                .eq('id', invitation.event_id)
                .maybeSingle();
              
              if (event) {
                eventInfo = {
                  id: event.id,
                  title: event.title,
                  date: event.date,
                  time: event.time,
                  end_time: event.end_time,
                  venue: event.venue,
                  city: event.city,
                  payment: event.payment,
                  payment_max: event.payment_max,
                  description: event.description,
                  type: event.type as EventType,
                };
              }
            }
          }

          // Get last message
          const { data: lastMsgs } = await supabase
            .from('messages')
            .select('text, created_at')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(1);

          // Count unread
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', convId)
            .eq('is_read', false)
            .neq('sender_id', user!.id);

          // Get invitation status and application status if exists
          let fallbackInvitationStatus: 'pending' | 'accepted' | 'rejected' | null = null;
          let fallbackApplicationStatus: 'pending' | 'accepted' | 'rejected' | null = null;
          if (conv?.invitation_id) {
            const { data: invitation } = await supabase
              .from('invitations')
              .select('status, artist_id, event_id')
              .eq('id', conv.invitation_id)
              .maybeSingle();
            fallbackInvitationStatus = invitation?.status as 'pending' | 'accepted' | 'rejected' | null;
            
            // Get application status if invitation is accepted
            if (fallbackInvitationStatus === 'accepted' && invitation?.artist_id && invitation?.event_id) {
              const { data: application } = await supabase
                .from('applications')
                .select('status')
                .eq('event_id', invitation.event_id)
                .eq('musician_id', invitation.artist_id)
                .maybeSingle();
              
              fallbackApplicationStatus = application?.status as 'pending' | 'accepted' | 'rejected' | null;
            }
          }
          
          const conversationItem = {
            id: convId,
            otherUser: {
              id: fallbackOtherId,
              name: prof?.display_name || 'Usuario',
              avatar: prof?.avatar_url || '',
            },
            lastMessage: lastMsgs?.[0]?.text || '',
            lastTime: lastMsgs?.[0]?.created_at || '',
            unreadCount: count || 0,
            invitationId: conv?.invitation_id || null,
            invitationStatus: fallbackInvitationStatus,
            applicationStatus: fallbackApplicationStatus,
            eventInfo,
          };
          
          console.log(`Adding conversation item (fallback):`, conversationItem);
          items.push(conversationItem);
        }
        continue;
      }

      console.log(`Found other participant for ${convId}:`, otherId);

      const { data: prof, error: profError } = await supabase.from('profiles').select('display_name, avatar_url').eq('user_id', otherId).maybeSingle();
      
      if (profError) {
        console.error(`Error fetching profile for ${otherId}:`, profError);
      }
      
      console.log(`Profile for ${otherId}:`, prof);

      // Get event info if there's an invitation
      let eventInfo = null;
      let invitationStatus: 'pending' | 'accepted' | 'rejected' | null = null;
      let applicationStatus: 'pending' | 'accepted' | 'rejected' | null = null;
      if (conv?.invitation_id) {
        const { data: invitation } = await supabase
          .from('invitations')
          .select('event_id, status, artist_id')
          .eq('id', conv.invitation_id)
          .maybeSingle();
        
        invitationStatus = invitation?.status as 'pending' | 'accepted' | 'rejected' | null;
        
        if (invitation?.event_id) {
          const { data: event } = await supabase
            .from('events')
            .select('*')
            .eq('id', invitation.event_id)
            .maybeSingle();
          
          if (event) {
            eventInfo = {
              id: event.id,
              title: event.title,
              date: event.date,
              time: event.time,
              end_time: event.end_time,
              venue: event.venue,
              city: event.city,
              payment: event.payment,
              payment_max: event.payment_max,
              description: event.description,
              type: event.type as EventType,
            };
            
            // Get application status if invitation is accepted
            if (invitationStatus === 'accepted' && invitation.artist_id) {
              const { data: application } = await supabase
                .from('applications')
                .select('status')
                .eq('event_id', invitation.event_id)
                .eq('musician_id', invitation.artist_id)
                .maybeSingle();
              
              applicationStatus = application?.status as 'pending' | 'accepted' | 'rejected' | null;
            }
          }
        }
      }

      // Get last message
      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('text, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1);

      // Count unread
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', convId)
        .eq('is_read', false)
        .neq('sender_id', user!.id);

      const conversationItem = {
        id: convId,
        otherUser: {
          id: otherId,
          name: prof?.display_name || 'Usuario',
          avatar: prof?.avatar_url || '',
        },
        lastMessage: lastMsgs?.[0]?.text || '',
        lastTime: lastMsgs?.[0]?.created_at || '',
        unreadCount: count || 0,
        invitationId: conv?.invitation_id || null,
        invitationStatus,
        applicationStatus,
        eventInfo,
      };
      
      console.log(`Adding conversation item:`, conversationItem);
      items.push(conversationItem);
    }

    console.log('Loaded conversations:', items.length, items.map(i => ({ id: i.id, otherUser: i.otherUser.name })));
    setConversations(items);
    if (!isMobile && items.length > 0 && !selectedId) {
      setSelectedId(items[0].id);
    }
    setLoading(false);
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages((data as MessageItem[]) || []);

    // Mark as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .neq('sender_id', user!.id)
      .eq('is_read', false);
  };

  const handleAcceptEvent = async () => {
    if (!selected || !selected.invitationId || !selected.eventInfo || !user || role !== 'musician') return;
    
    setSending(true);
    
    // Update invitation status
    const { error: invError } = await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', selected.invitationId);

    if (invError) {
      toast({ title: 'Error', description: invError.message, variant: 'destructive' });
      setSending(false);
      return;
    }

    // Create application with pending status (waiting for organizer confirmation)
    const { error: appError } = await supabase
      .from('applications')
      .upsert({
        event_id: selected.eventInfo.id,
        musician_id: user.id,
        message: `Acepté la invitación para el evento "${selected.eventInfo.title}"`,
        proposed_rate: selected.eventInfo.payment,
        status: 'pending', // Will be confirmed by organizer
      }, {
        onConflict: 'event_id,musician_id'
      });

    if (appError) {
      console.error('Error creating application:', appError);
    }

    // Send confirmation message
    await supabase.from('messages').insert({
      conversation_id: selectedId!,
      sender_id: user.id,
      text: `✅ He aceptado tu invitación para el evento "${selected.eventInfo.title}". Esperando tu confirmación.`,
    });

    toast({ 
      title: '✅ Invitación aceptada',
      description: 'Esperando la confirmación del organizador.'
    });
    
    // Refresh conversations to update status
    fetchConversations();
    if (selectedId) {
      fetchMessages(selectedId);
    }
    
    setSending(false);
  };

  const handleConfirmApplication = async () => {
    if (!selected || !selected.invitationId || !selected.eventInfo || !user || (role !== 'organizer' && role !== 'user')) return;
    
    setSending(true);
    
    // Get invitation to find artist_id
    const { data: invitation } = await supabase
      .from('invitations')
      .select('artist_id')
      .eq('id', selected.invitationId)
      .maybeSingle();
    
    if (!invitation?.artist_id) {
      toast({ title: 'Error', description: 'No se pudo encontrar la información de la invitación', variant: 'destructive' });
      setSending(false);
      return;
    }
    
    // Update application status to accepted
    const { error: appError } = await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('event_id', selected.eventInfo.id)
      .eq('musician_id', invitation.artist_id);

    if (appError) {
      toast({ title: 'Error', description: appError.message, variant: 'destructive' });
      setSending(false);
      return;
    }

    // Send confirmation message
    await supabase.from('messages').insert({
      conversation_id: selectedId!,
      sender_id: user.id,
      text: `✅ He confirmado tu participación en el evento "${selected.eventInfo.title}". ¡El evento está confirmado!`,
    });

    toast({ 
      title: '✅ Asignación confirmada',
      description: 'El artista ha sido confirmado para el evento y aparecerá en el calendario.'
    });
    
    // Refresh conversations to update status
    fetchConversations();
    if (selectedId) {
      fetchMessages(selectedId);
    }
    
    setSending(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedId || !user) return;
    setSending(true);
    await supabase.from('messages').insert({
      conversation_id: selectedId,
      sender_id: user.id,
      text: newMessage,
    });
    setNewMessage('');
    setSending(false);
  };

  const selected = conversations.find(c => c.id === selectedId);
  const showList = isMobile ? !selectedId : true;
  const showChat = isMobile ? !!selectedId : true;

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl sm:text-3xl font-display font-bold">Mensajes</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-display font-semibold text-lg mb-2">No tienes conversaciones aún</h3>
          <p className="text-sm">Las conversaciones aparecerán aquí cuando te comuniques con otros usuarios</p>
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
          {showList && (
            <div className={cn("flex flex-col border rounded-lg overflow-hidden", isMobile ? "w-full" : "w-80 shrink-0")}>
              <div className="flex-1 overflow-y-auto">
                {conversations.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b border-border",
                      selectedId === c.id && "bg-primary/5"
                    )}
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={c.otherUser.avatar} />
                      <AvatarFallback>{c.otherUser.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">{c.otherUser.name}</p>
                        {c.unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs ml-1">{c.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showChat && (
            <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
              {selected ? (
                <>
                  <div className="p-3 border-b flex items-center gap-3">
                    {isMobile && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>←</Button>
                    )}
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={selected.otherUser.avatar} />
                      <AvatarFallback>{selected.otherUser.name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm">{selected.otherUser.name}</p>
                    {selected.invitationId && (
                      <Badge className="ml-auto bg-primary/10 text-primary border-primary/20">
                        <Music className="w-3 h-3 mr-1" /> Invitación
                      </Badge>
                    )}
                  </div>

                  {/* Event Info Card for Invitations */}
                  {selected.eventInfo && (
                    <div className="p-4 border-b bg-muted/30">
                      <Card className="border-primary/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={eventTypeColors[selected.eventInfo.type]}>
                                  {eventTypeLabels[selected.eventInfo.type]}
                                </Badge>
                                <span className="text-sm font-semibold text-primary">
                                  ${selected.eventInfo.payment}{selected.eventInfo.payment_max ? `–${selected.eventInfo.payment_max}` : ''} MXN
                                </span>
                              </div>
                              <h3 className="font-display font-bold text-base mb-1">{selected.eventInfo.title}</h3>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/events/${selected.eventInfo!.id}`)}
                            >
                              Ver evento
                            </Button>
                          </div>
                          <div className="space-y-1.5 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{selected.eventInfo.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{selected.eventInfo.time}{selected.eventInfo.end_time ? ` - ${selected.eventInfo.end_time}` : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{selected.eventInfo.venue}, {selected.eventInfo.city}</span>
                            </div>
                          </div>
                          {selected.eventInfo.description && (
                            <p className="mt-3 text-sm leading-relaxed line-clamp-2">{selected.eventInfo.description}</p>
                          )}
                          {/* Artist: Accept invitation button */}
                          {role === 'musician' && selected.invitationId && selected.invitationStatus === 'pending' && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <Button 
                                className="w-full gradient-primary text-white border-0"
                                onClick={handleAcceptEvent}
                                disabled={sending}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Aceptar Evento
                              </Button>
                            </div>
                          )}
                          
                          {/* Artist: Show status after accepting */}
                          {role === 'musician' && selected.invitationStatus === 'accepted' && selected.applicationStatus === 'pending' && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mb-2">
                                ✅ Aceptado - Esperando confirmación del organizador
                              </Badge>
                            </div>
                          )}
                          
                          {/* Artist: Show confirmed status */}
                          {role === 'musician' && selected.invitationStatus === 'accepted' && selected.applicationStatus === 'accepted' && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                ✅ Evento Confirmado
                              </Badge>
                            </div>
                          )}
                          
                          {/* Organizer/User: Confirm artist acceptance button */}
                          {(role === 'organizer' || role === 'user') && selected.invitationId && selected.invitationStatus === 'accepted' && selected.applicationStatus === 'pending' && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="mb-3">
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mb-2">
                                  El artista aceptó - Pendiente de tu confirmación
                                </Badge>
                              </div>
                              <Button 
                                className="w-full gradient-primary text-white border-0"
                                onClick={handleConfirmApplication}
                                disabled={sending}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Confirmar Asignación
                              </Button>
                            </div>
                          )}
                          
                          {/* Organizer/User: Show confirmed status */}
                          {(role === 'organizer' || role === 'user') && selected.invitationStatus === 'accepted' && selected.applicationStatus === 'accepted' && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                ✅ Evento Confirmado
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className={cn("flex", msg.sender_id === user?.id ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[70%] px-4 py-2 rounded-2xl text-sm",
                          msg.sender_id === user?.id
                            ? "gradient-primary text-white rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <p className={cn("text-[10px] mt-1", msg.sender_id === user?.id ? "text-white/70" : "text-muted-foreground")}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t flex gap-2">
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      className="flex-1"
                    />
                    <Button size="icon" className="gradient-primary text-white border-0 shrink-0" onClick={handleSend} disabled={sending}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p>Selecciona una conversación</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
