import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Eye, Edit, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { statusColors, statusLabels, eventTypeLabels, type DbEvent, type EventType, type EventStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserEvents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [myEvents, setMyEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', user!.id)
      .order('date', { ascending: false });
    setMyEvents((data as DbEvent[]) || []);
    setLoading(false);
  };

  const handleClose = async (id: string) => {
    const { error } = await supabase.from('events').update({ status: 'closed' }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Evento cerrado' });
      fetchEvents();
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Mis Eventos</h1>
          <p className="text-muted-foreground mt-1">Gestiona los eventos que has creado</p>
        </div>
        <Button className="gradient-primary text-white border-0" onClick={() => navigate('/u/events/new')}>
          <PlusCircle className="w-4 h-4 mr-2" /> Crear Evento
        </Button>
      </div>

      {myEvents.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <PlusCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-display font-semibold text-lg mb-2">No tienes eventos aún</h3>
          <p className="text-sm mb-4">Crea un evento para buscar artistas</p>
          <Button className="gradient-primary text-white border-0" onClick={() => navigate('/u/events/new')}>Crear tu primer evento</Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myEvents.map(event => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{eventTypeLabels[event.type as EventType]}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.city}</TableCell>
                  <TableCell><Badge className={statusColors[event.status as EventStatus]}>{statusLabels[event.status as EventStatus]}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${event.id}`)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/u/events/${event.id}/edit`)}><Edit className="w-4 h-4" /></Button>
                      {event.status !== 'closed' && (
                        <Button variant="ghost" size="icon" onClick={() => handleClose(event.id)}><XCircle className="w-4 h-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
