import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, Music, ArrowRight, MapPin, MessageSquare, PlusCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { eventTypeLabels, eventTypeColors, type DbEvent, type EventType } from '@/lib/types';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { userName, user } = useAuth();
  const [artists, setArtists] = useState<any[]>([]);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [myEvents, setMyEvents] = useState<DbEvent[]>([]);
  const [sentInvitationsCount, setSentInvitationsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: artistData } = await supabase.from('artist_profiles').select('*').limit(4);
    if (artistData) {
      const enriched = [];
      for (const a of artistData) {
        const { data: prof } = await supabase.from('profiles').select('display_name, avatar_url, city').eq('user_id', a.user_id).maybeSingle();
        enriched.push({ ...a, profile: prof });
      }
      setArtists(enriched);
    }

    const { data: eventsData } = await supabase.from('events').select('*').eq('status', 'published').order('date').limit(3);
    setEvents((eventsData as DbEvent[]) || []);

    if (user) {
      const { data: myEventsData } = await supabase.from('events').select('*').eq('organizer_id', user.id).order('date', { ascending: false }).limit(3);
      setMyEvents((myEventsData as DbEvent[]) || []);

      // Count sent invitations
      const { count: invCount } = await supabase
        .from('invitations')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', user.id);
      setSentInvitationsCount(invCount || 0);
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Bienvenido, {userName} 👋</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Artistas Disponibles', value: String(artists.length), icon: Music, color: 'text-primary', action: undefined },
          { label: 'Mis Eventos', value: String(myEvents.length), icon: Calendar, color: 'text-emerald-500', action: undefined },
          { label: 'Invitaciones Enviadas', value: String(sentInvitationsCount), icon: Mail, color: 'text-purple-500', action: () => navigate('/u/invitations') },
          { label: 'Mensajes', value: '—', icon: MessageSquare, color: 'text-amber-500', action: undefined },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={stat.action ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={stat.action}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-display font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate('/u/artists')} className="gradient-primary text-white border-0">
          <Search className="w-4 h-4 mr-2" /> Buscar Artistas
        </Button>
        <Button variant="outline" onClick={() => navigate('/u/events/new')}>
          <PlusCircle className="w-4 h-4 mr-2" /> Crear Evento
        </Button>
        <Button variant="outline" onClick={() => navigate('/u/events')}>
          <Calendar className="w-4 h-4 mr-2" /> Ver Eventos
        </Button>
        <Button variant="outline" onClick={() => navigate('/messages')}>
          <MessageSquare className="w-4 h-4 mr-2" /> Mensajes
        </Button>
        {sentInvitationsCount > 0 && (
          <Button variant="outline" onClick={() => navigate('/u/invitations')} className="border-purple-500 text-purple-600 hover:bg-purple-50">
            <Mail className="w-4 h-4 mr-2" /> Invitaciones ({sentInvitationsCount})
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">Artistas Destacados</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/u/artists')}>
              Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {artists.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No hay artistas registrados aún.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {artists.map(m => (
                <Card key={m.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/u/artists')}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={m.profile?.avatar_url || ''} />
                      <AvatarFallback>{(m.artist_name || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{m.artist_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{m.profile?.city || '—'}</span>
                      </div>
                    </div>
                    <p className="font-display font-bold text-primary">${m.base_rate}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">Eventos Próximos</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/u/events')}>
              Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {events.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No hay eventos publicados aún.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/events/${event.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={eventTypeColors[event.type as EventType]}>{eventTypeLabels[event.type as EventType]}</Badge>
                      <span className="text-sm font-semibold text-primary">${event.payment}{event.payment_max ? `–${event.payment_max}` : ''}</span>
                    </div>
                    <h3 className="font-semibold text-sm">{event.title}</h3>
                    <p className="text-xs text-muted-foreground">{event.date} · {event.venue}, {event.city}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
