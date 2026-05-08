import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Calendar, Clock, MapPin, Music, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { eventTypeLabels, eventTypeColors, type DbEvent, type EventType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExploreEvents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [applyModal, setApplyModal] = useState<DbEvent | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyRate, setApplyRate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('date', { ascending: true });
    setEvents((data as DbEvent[]) || []);
    setLoading(false);
  };

  const filtered = events.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.city.toLowerCase().includes(search.toLowerCase())) return false;
    if (cityFilter !== 'all' && e.city !== cityFilter) return false;
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    return true;
  });

  const cities = [...new Set(events.map(e => e.city))];

  const handleApply = async () => {
    if (!applyModal || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('applications').insert({
      event_id: applyModal.id,
      musician_id: user.id,
      message: applyMessage,
      proposed_rate: parseFloat(applyRate) || 0,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Aplicación enviada', description: `Tu solicitud para "${applyModal.title}" fue registrada.` });
      setApplyModal(null);
      setApplyMessage('');
      setApplyRate('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-60" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Explorar Eventos</h1>
        <p className="text-muted-foreground mt-1">Encuentra tu próximo gig</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar eventos..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-full sm:w-40"><MapPin className="w-4 h-4 mr-1" /><SelectValue placeholder="Ciudad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40"><Filter className="w-4 h-4 mr-1" /><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(eventTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">No se encontraron eventos</h3>
          <p className="text-muted-foreground text-sm">Intenta con otros filtros</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(event => (
            <Card key={event.id} className="hover:shadow-lg transition-all group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={eventTypeColors[event.type as EventType]}>{eventTypeLabels[event.type as EventType]}</Badge>
                  <span className="text-sm font-bold text-primary">${event.payment}{event.payment_max ? `–${event.payment_max}` : ''}</span>
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/events/${event.id}`)}>
                  {event.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{event.venue}, {event.city}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {(event.genres || []).map((g: string) => (
                    <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 gradient-primary text-white border-0" onClick={() => setApplyModal(event)}>Aplicar</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/events/${event.id}`)}>Ver detalle</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!applyModal} onOpenChange={() => setApplyModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Aplicar a: {applyModal?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mensaje al organizador</Label>
              <Textarea placeholder="Cuéntanos por qué eres ideal para este evento..." value={applyMessage} onChange={e => setApplyMessage(e.target.value)} />
            </div>
            <div>
              <Label>Tarifa propuesta ($ MXN)</Label>
              <Input type="number" placeholder="Ej: 3000" value={applyRate} onChange={e => setApplyRate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyModal(null)}>Cancelar</Button>
            <Button className="gradient-primary text-white border-0" onClick={handleApply} disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar Aplicación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
