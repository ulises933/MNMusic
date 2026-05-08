import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, DollarSign, X, MessageSquare, User, Send, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { eventTypeLabels, eventTypeColors, type EventType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface SentInvitationWithDetails {
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
  artist: {
    display_name: string;
    avatar_url: string | null;
    artist_name?: string;
  };
}

export default function SentInvitations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<SentInvitationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState<SentInvitationWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) fetchInvitations();
  }, [user]);

  const fetchInvitations = async () => {
    if (!user) return;
    
    const { data: invs } = await supabase
      .from('invitations')
      .select('*')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    if (!invs) {
      setLoading(false);
      return;
    }

    const enriched: SentInvitationWithDetails[] = [];
    for (const inv of invs) {
      const [eventRes, artistRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', inv.event_id).maybeSingle(),
        supabase.from('profiles').select('display_name, avatar_url').eq('user_id', inv.artist_id).maybeSingle(),
      ]);

      // Get artist name if available
      let artistName = artistRes.data?.display_name || 'Artista';
      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('artist_name')
        .eq('user_id', inv.artist_id)
        .maybeSingle();
      
      if (artistProfile?.artist_name) {
        artistName = artistProfile.artist_name;
      }

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
          artist: {
            display_name: artistName,
            avatar_url: artistRes.data?.avatar_url || null,
            artist_name: artistProfile?.artist_name || undefined,
          },
        });
      }
    }

    setInvitations(enriched);
    setLoading(false);
  };

  const handleCancel = async (invitationId: string) => {
    setCancelling(true);
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Invitación cancelada', description: 'La invitación ha sido eliminada' });
      setDetailOpen(false);
      fetchInvitations();
    }
    setCancelling(false);
  };

  const openDetail = (inv: SentInvitationWithDetails) => {
    setSelectedInvitation(inv);
    setDetailOpen(true);
  };

  const pendingCount = invitations.filter(i => i.status === 'pending').length;
  const acceptedCount = invitations.filter(i => i.status === 'accepted').length;
  const rejectedCount = invitations.filter(i => i.status === 'rejected').length;

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Invitaciones Enviadas</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las invitaciones que has enviado a artistas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aceptadas</p>
                <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <X className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Send className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-display font-semibold text-lg mb-2">No has enviado invitaciones</h3>
            <p className="text-sm text-muted-foreground mb-4">Las invitaciones que envíes a artistas aparecerán aquí</p>
            <Button onClick={() => navigate('/o/artists')} className="gradient-primary text-white border-0">
              Buscar Artistas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map(inv => (
            <Card key={inv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={inv.artist.avatar_url || ''} />
                    <AvatarFallback>{inv.artist.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-display font-semibold text-base">{inv.artist.display_name}</p>
                        <p className="text-sm text-muted-foreground">Invitado a: {inv.event.title}</p>
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
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{inv.message}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge className={eventTypeColors[inv.event.type]}>{eventTypeLabels[inv.event.type]}</Badge>
                      <div className="flex gap-2 ml-auto">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openDetail(inv)}
                        >
                          <Eye className="w-4 h-4 mr-1" /> Ver detalles
                        </Button>
                        {inv.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('¿Estás seguro de cancelar esta invitación?')) {
                                handleCancel(inv.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Cancelar
                          </Button>
                        )}
                        {inv.status === 'accepted' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary/10"
                            onClick={() => navigate('/messages')}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" /> Mensajes
                          </Button>
                        )}
                      </div>
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
                <DialogTitle className="font-display text-xl">Invitación a {selectedInvitation.artist.display_name}</DialogTitle>
                <DialogDescription>
                  Detalles de la invitación enviada
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Artist Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedInvitation.artist.avatar_url || ''} />
                    <AvatarFallback>{selectedInvitation.artist.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">Artista invitado</p>
                    <p className="text-sm text-muted-foreground">{selectedInvitation.artist.display_name}</p>
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

                {/* Message */}
                {selectedInvitation.message && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" /> Tu Mensaje
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
              <DialogFooter>
                <Button variant="outline" onClick={() => navigate(`/events/${selectedInvitation.event.id}`)}>
                  Ver evento completo
                </Button>
                {selectedInvitation.status === 'pending' ? (
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (confirm('¿Estás seguro de cancelar esta invitación? Esta acción no se puede deshacer.')) {
                        handleCancel(selectedInvitation.id);
                      }
                    }}
                    disabled={cancelling}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Cancelar Invitación
                  </Button>
                ) : selectedInvitation.status === 'accepted' ? (
                  <Button 
                    className="gradient-primary text-white border-0"
                    onClick={() => {
                      setDetailOpen(false);
                      navigate('/messages');
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" /> Ir a Mensajes
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setDetailOpen(false)}>
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
