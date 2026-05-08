import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Clock, Music, ArrowRight, FileText, User, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { eventTypeLabels, eventTypeColors, type DbEvent, type EventType } from '@/lib/types';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function MusicianDashboard() {
  const navigate = useNavigate();
  const { userName, user } = useAuth();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [invitationsCount, setInvitationsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [eventsRes, appsRes, invsRes] = await Promise.all([
      supabase.from('events').select('*').eq('status', 'published').order('date').limit(3),
      supabase.from('applications').select('id').eq('musician_id', user!.id).eq('status', 'pending'),
      supabase.from('invitations').select('id').eq('artist_id', user!.id).eq('status', 'pending'),
    ]);
    setEvents((eventsRes.data as DbEvent[]) || []);
    setPendingCount(appsRes.data?.length || 0);
    setInvitationsCount(invsRes.data?.length || 0);
    setLoading(false);
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Dashboard Artista</h1>
        <p className="text-muted-foreground mt-1">Bienvenido, {userName} 🎸</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Eventos Disponibles', value: String(events.length), icon: Calendar, color: 'text-primary', action: undefined },
          { label: 'Solicitudes Pendientes', value: String(pendingCount), icon: FileText, color: 'text-amber-500', action: undefined },
          { label: 'Invitaciones', value: String(invitationsCount), icon: Mail, color: 'text-purple-500', action: () => navigate('/m/invitations') },
          { label: 'Perfil', value: 'Editar', icon: User, color: 'text-emerald-500', action: undefined },
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
        <Button onClick={() => navigate('/m/events')} className="gradient-primary text-white border-0">
          <Music className="w-4 h-4 mr-2" /> Explorar Eventos
        </Button>
        {invitationsCount > 0 && (
          <Button variant="outline" onClick={() => navigate('/m/invitations')} className="border-purple-500 text-purple-600 hover:bg-purple-50">
            <Mail className="w-4 h-4 mr-2" /> Ver Invitaciones ({invitationsCount})
          </Button>
        )}
        <Button variant="outline" onClick={() => navigate('/m/profile')}>
          <User className="w-4 h-4 mr-2" /> Editar Perfil
        </Button>
        <Button variant="outline" onClick={() => navigate('/calendar')}>
          <Calendar className="w-4 h-4 mr-2" /> Calendario
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold">Eventos Disponibles</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/m/events')}>
            Ver todos <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {events.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No hay eventos disponibles aún.</CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/events/${event.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={eventTypeColors[event.type as EventType]}>{eventTypeLabels[event.type as EventType]}</Badge>
                    <span className="text-sm font-semibold text-primary">€{event.payment}{event.payment_max ? `–${event.payment_max}` : ''}</span>
                  </div>
                  <h3 className="font-semibold mb-1">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{event.venue}, {event.city}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
