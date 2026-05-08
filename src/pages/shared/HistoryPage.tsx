import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Music, Star, DollarSign, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { eventTypeLabels, eventTypeColors, type EventType } from '@/lib/types';

interface HistoryEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
  venue: string;
  city: string;
  payment: number;
  payment_max: number | null;
  organizer_id: string;
  organizer_name?: string;
}

interface HistoryApplication {
  id: string;
  status: string;
  proposed_rate: number;
  created_at: string;
  event?: {
    id: string;
    title: string;
    date: string;
    type: string;
    venue: string;
    city: string;
  };
}

interface HistoryInvitation {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  event?: {
    id: string;
    title: string;
    date: string;
  };
  artist_name?: string;
  sender_name?: string;
}

interface HistoryReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  artist_name?: string;
  reviewer_name?: string;
}

export default function HistoryPage() {
  const { user, role } = useAuth();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [applications, setApplications] = useState<HistoryApplication[]>([]);
  const [invitations, setInvitations] = useState<HistoryInvitation[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<HistoryReview[]>([]);
  const [reviewsReceived, setReviewsReceived] = useState<HistoryReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const uid = user!.id;

    // Events created by me (organizer/user)
    const { data: myEvents } = await supabase.from('events').select('*').eq('organizer_id', uid).order('date', { ascending: false });
    if (myEvents) {
      setEvents(myEvents as HistoryEvent[]);
    }

    // Applications (musician)
    const { data: myApps } = await supabase.from('applications').select('*').eq('musician_id', uid).order('created_at', { ascending: false });
    if (myApps) {
      const enriched: HistoryApplication[] = [];
      for (const app of myApps) {
        const { data: ev } = await supabase.from('events').select('id, title, date, type, venue, city').eq('id', app.event_id).maybeSingle();
        enriched.push({ ...app, event: ev || undefined } as HistoryApplication);
      }
      setApplications(enriched);
    }

    // Invitations sent or received
    const { data: myInvs } = await supabase.from('invitations').select('*').or(`sender_id.eq.${uid},artist_id.eq.${uid}`).order('created_at', { ascending: false });
    if (myInvs) {
      const enriched: HistoryInvitation[] = [];
      for (const inv of myInvs) {
        const { data: ev } = await supabase.from('events').select('id, title, date').eq('id', inv.event_id).maybeSingle();
        const { data: artist } = await supabase.from('profiles').select('display_name').eq('user_id', inv.artist_id).maybeSingle();
        const { data: sender } = await supabase.from('profiles').select('display_name').eq('user_id', inv.sender_id).maybeSingle();
        enriched.push({ ...inv, event: ev || undefined, artist_name: artist?.display_name, sender_name: sender?.display_name } as HistoryInvitation);
      }
      setInvitations(enriched);
    }

    // Reviews given by me
    const { data: given } = await supabase.from('reviews').select('*').eq('reviewer_id', uid).order('created_at', { ascending: false });
    if (given) {
      const enriched: HistoryReview[] = [];
      for (const r of given) {
        const { data: p } = await supabase.from('profiles').select('display_name').eq('user_id', r.artist_id).maybeSingle();
        enriched.push({ ...r, artist_name: p?.display_name } as HistoryReview);
      }
      setReviewsGiven(enriched);
    }

    // Reviews received (if musician)
    const { data: received } = await supabase.from('reviews').select('*').eq('artist_id', uid).order('created_at', { ascending: false });
    if (received) {
      const enriched: HistoryReview[] = [];
      for (const r of received) {
        const { data: p } = await supabase.from('profiles').select('display_name').eq('user_id', r.reviewer_id).maybeSingle();
        enriched.push({ ...r, reviewer_name: p?.display_name } as HistoryReview);
      }
      setReviewsReceived(enriched);
    }

    setLoading(false);
  };

  const statusIcon = (status: string) => {
    if (status === 'accepted' || status === 'published') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4 text-destructive" />;
    if (status === 'pending' || status === 'draft') return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'Pendiente', accepted: 'Aceptado', rejected: 'Rechazado',
      draft: 'Borrador', published: 'Publicado', closed: 'Cerrado',
    };
    return map[status] || status;
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-80" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Historial</h1>
        <p className="text-muted-foreground mt-1">Tu actividad, eventos, aplicaciones y reseñas</p>
      </div>

      <Tabs defaultValue={role === 'musician' ? 'applications' : 'events'} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Eventos ({events.length})</TabsTrigger>
          <TabsTrigger value="applications">Aplicaciones ({applications.length})</TabsTrigger>
          <TabsTrigger value="invitations">Invitaciones ({invitations.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reseñas</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4 space-y-3">
          {events.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No has creado eventos aún</p>
            </CardContent></Card>
          ) : events.map(ev => (
            <Card key={ev.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{ev.venue}, {ev.city} — {new Date(ev.date).toLocaleDateString('es-MX')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={eventTypeColors[ev.type as EventType]}>{eventTypeLabels[ev.type as EventType]}</Badge>
                  <div className="flex items-center gap-1">{statusIcon(ev.status)}<span className="text-xs">{statusLabel(ev.status)}</span></div>
                </div>
                <p className="font-display font-bold text-sm text-primary shrink-0">${ev.payment} MXN</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="applications" className="mt-4 space-y-3">
          {applications.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No has aplicado a eventos aún</p>
            </CardContent></Card>
          ) : applications.map(app => (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{app.event?.title || 'Evento'}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.event?.venue}, {app.event?.city} — {app.event?.date ? new Date(app.event.date).toLocaleDateString('es-MX') : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">{statusIcon(app.status)}<span className="text-xs">{statusLabel(app.status)}</span></div>
                <p className="font-display font-bold text-sm text-primary shrink-0">${app.proposed_rate} MXN</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="invitations" className="mt-4 space-y-3">
          {invitations.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Sin invitaciones</p>
            </CardContent></Card>
          ) : invitations.map(inv => (
            <Card key={inv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{inv.event?.title || 'Evento'}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.sender_name === user?.email ? `Invitaste a ${inv.artist_name}` : `Te invitó ${inv.sender_name}`}
                    {' — '}{new Date(inv.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">{statusIcon(inv.status)}<span className="text-xs">{statusLabel(inv.status)}</span></div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 space-y-6">
          {/* Reviews received (musician) */}
          {reviewsReceived.length > 0 && (
            <div>
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> Reseñas recibidas ({reviewsReceived.length})</h3>
              <div className="space-y-3">
                {reviewsReceived.map(r => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex">{[...Array(5)].map((_, j) => <Star key={j} className={`w-4 h-4 ${j < r.rating ? 'fill-primary text-primary' : 'text-muted'}`} />)}</div>
                        <span className="text-xs text-muted-foreground">por {r.reviewer_name || 'Usuario'} — {new Date(r.created_at).toLocaleDateString('es-MX')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.comment || 'Sin comentario'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Reviews given */}
          {reviewsGiven.length > 0 && (
            <div>
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-accent" /> Reseñas que diste ({reviewsGiven.length})</h3>
              <div className="space-y-3">
                {reviewsGiven.map(r => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex">{[...Array(5)].map((_, j) => <Star key={j} className={`w-4 h-4 ${j < r.rating ? 'fill-primary text-primary' : 'text-muted'}`} />)}</div>
                        <span className="text-xs text-muted-foreground">a {r.artist_name || 'Artista'} — {new Date(r.created_at).toLocaleDateString('es-MX')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.comment || 'Sin comentario'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {reviewsGiven.length === 0 && reviewsReceived.length === 0 && (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Sin reseñas aún</p>
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
