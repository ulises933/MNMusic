import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, MessageSquare, ArrowRight, PlusCircle, FileText, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { statusColors, statusLabels, type DbEvent, type EventStatus } from '@/lib/types';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { userName, user } = useAuth();
  const [myEvents, setMyEvents] = useState<DbEvent[]>([]);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);
  const [sentInvitationsCount, setSentInvitationsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: evts } = await supabase.from('events').select('*').eq('organizer_id', user!.id).order('date', { ascending: false }).limit(5);
    setMyEvents((evts as DbEvent[]) || []);

    if (evts && evts.length > 0) {
      const eventIds = evts.map(e => e.id);
      const { count } = await supabase.from('applications').select('id', { count: 'exact', head: true }).in('event_id', eventIds).eq('status', 'pending');
      setPendingAppsCount(count || 0);
    }

    // Count sent invitations
    const { count: invCount } = await supabase
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user!.id);
    setSentInvitationsCount(invCount || 0);

    setLoading(false);
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div></div>;
  }

  const activeCount = myEvents.filter(e => e.status === 'published').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Dashboard Organizador</h1>
        <p className="text-muted-foreground mt-1">Bienvenido, {userName} 🎉</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Eventos Activos', value: String(activeCount), icon: Calendar, color: 'text-primary', action: undefined },
          { label: 'Aplicaciones Pendientes', value: String(pendingAppsCount), icon: Users, color: 'text-amber-500', action: undefined },
          { label: 'Invitaciones Enviadas', value: String(sentInvitationsCount), icon: Mail, color: 'text-purple-500', action: () => navigate('/o/invitations') },
          { label: 'Total Eventos', value: String(myEvents.length), icon: FileText, color: 'text-emerald-500', action: undefined },
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
        <Button onClick={() => navigate('/o/events/new')} className="gradient-primary text-white border-0">
          <PlusCircle className="w-4 h-4 mr-2" /> Crear Evento
        </Button>
        <Button variant="outline" onClick={() => navigate('/o/applications')}>
          <Users className="w-4 h-4 mr-2" /> Ver Aplicaciones
        </Button>
        <Button variant="outline" onClick={() => navigate('/o/events')}>
          <FileText className="w-4 h-4 mr-2" /> Mis Eventos
        </Button>
        {sentInvitationsCount > 0 && (
          <Button variant="outline" onClick={() => navigate('/o/invitations')} className="border-purple-500 text-purple-600 hover:bg-purple-50">
            <Mail className="w-4 h-4 mr-2" /> Invitaciones ({sentInvitationsCount})
          </Button>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold">Mis Eventos</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/o/events')}>
            Ver todos <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {myEvents.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No tienes eventos aún. ¡Crea tu primer evento!</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {myEvents.slice(0, 3).map(event => (
              <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/events/${event.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{event.title}</h3>
                    <p className="text-xs text-muted-foreground">{event.date} · {event.city}</p>
                  </div>
                  <Badge className={statusColors[event.status as EventStatus]}>{statusLabels[event.status as EventStatus]}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
