import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { eventTypeColors, eventTypeLabels, type DbEvent, type EventType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarPage() {
  const { user, role } = useAuth();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, role]);

  const fetchEvents = async () => {
    if (!user) return;
    
    if (role === 'musician') {
      // For musicians: show only events where they have an accepted application
      const { data: applications } = await supabase
        .from('applications')
        .select('event_id')
        .eq('musician_id', user.id)
        .eq('status', 'accepted');
      
      if (applications && applications.length > 0) {
        const eventIds = applications.map(a => a.event_id);
        const { data } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds)
          .eq('status', 'published')
          .order('date');
        setEvents((data as DbEvent[]) || []);
      } else {
        setEvents([]);
      }
    } else {
      // For organizers/users: show events they created that have at least one accepted application
      const { data: myEvents } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', user.id)
        .eq('status', 'published');
      
      if (myEvents && myEvents.length > 0) {
        const myEventIds = myEvents.map(e => e.id);
        const { data: acceptedApps } = await supabase
          .from('applications')
          .select('event_id')
          .in('event_id', myEventIds)
          .eq('status', 'accepted');
        
        if (acceptedApps && acceptedApps.length > 0) {
          const acceptedEventIds = [...new Set(acceptedApps.map(a => a.event_id))];
          const { data } = await supabase
            .from('events')
            .select('*')
            .in('id', acceptedEventIds)
            .eq('status', 'published')
            .order('date');
          setEvents((data as DbEvent[]) || []);
        } else {
          setEvents([]);
        }
      } else {
        setEvents([]);
      }
    }
    
    setLoading(false);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const upcoming = events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Calendario</h1>
        <p className="text-muted-foreground mt-1">Tu agenda de eventos</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="font-display">{months[currentMonth]} {currentYear}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
              ))}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                return (
                  <div key={day} className={`min-h-[60px] p-1 border border-border rounded-md text-sm ${isToday(day) ? 'bg-primary/10 border-primary' : ''}`}>
                    <span className={`text-xs font-medium ${isToday(day) ? 'text-primary' : ''}`}>{day}</span>
                    {dayEvents.map(e => (
                      <div key={e.id} className={`mt-0.5 px-1 py-0.5 rounded text-[9px] truncate ${eventTypeColors[e.type as EventType]}`}>
                        {e.title.slice(0, 12)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Próximos Eventos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No hay eventos próximos</p>
            ) : (
              upcoming.map(event => (
                <div key={event.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {event.date.split('-')[2]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.time} · {event.city}</p>
                    <Badge className={`${eventTypeColors[event.type as EventType]} text-[10px] mt-1`}>{eventTypeLabels[event.type as EventType]}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
