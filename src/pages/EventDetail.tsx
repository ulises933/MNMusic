import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Music, Shirt, Speaker, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { eventTypeLabels, eventTypeColors, applicationStatusColors, applicationStatusLabels, type DbEvent, type EventType, type ApplicationStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [organizerName, setOrganizerName] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyRate, setApplyRate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    if (data) {
      setEvent(data as DbEvent);
      const { data: prof } = await supabase.from('profiles').select('display_name').eq('user_id', data.organizer_id).maybeSingle();
      setOrganizerName(prof?.display_name || 'Organizador');

      if (role === 'organizer') {
        const { data: apps } = await supabase.from('applications').select('*').eq('event_id', data.id);
        if (apps) {
          const enriched = [];
          for (const app of apps) {
            const { data: p } = await supabase.from('profiles').select('display_name, avatar_url').eq('user_id', app.musician_id).maybeSingle();
            enriched.push({ ...app, profile: p });
          }
          setApplications(enriched);
        }
      }
    }
    setLoading(false);
  };

  const handleApply = async () => {
    if (!event || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('applications').insert({
      event_id: event.id,
      musician_id: user.id,
      message: applyMessage,
      proposed_rate: parseFloat(applyRate) || 0,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Aplicación enviada' });
      setApplyOpen(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>;

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-display font-bold mb-2">Evento no encontrado</h2>
        <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={eventTypeColors[event.type as EventType]}>{eventTypeLabels[event.type as EventType]}</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">{event.title}</h1>
          <p className="text-muted-foreground mt-1">Organizado por {organizerName}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-display font-bold text-primary">
            ${event.payment}{event.payment_max ? `–${event.payment_max}` : ''} MXN
          </p>
          <p className="text-sm text-muted-foreground">por artista</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {event.date}</span>
        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {event.time}{event.end_time ? ` - ${event.end_time}` : ''}</span>
        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.venue}, {event.city}</span>
        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {event.musicians_needed} artistas</span>
      </div>

      {role === 'musician' ? (
        <Button size="lg" className="gradient-primary text-white border-0" onClick={() => setApplyOpen(true)}>
          <Music className="w-5 h-5 mr-2" /> Aplicar a este evento
        </Button>
      ) : (
        <Button size="lg" variant="outline" onClick={() => navigate(role === 'organizer' ? '/o/artists' : '/u/artists')}>
          <Search className="w-5 h-5 mr-2" /> Buscar artistas
        </Button>
      )}

      <Tabs defaultValue="description">
        <TabsList>
          <TabsTrigger value="description">Descripción</TabsTrigger>
          <TabsTrigger value="requirements">Requisitos</TabsTrigger>
          <TabsTrigger value="location">Ubicación</TabsTrigger>
          {role === 'organizer' && <TabsTrigger value="applications">Aplicaciones ({applications.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="description" className="mt-4">
          <Card><CardContent className="p-6"><p className="text-sm leading-relaxed">{event.description}</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="requirements" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Géneros</p>
                  <div className="flex flex-wrap gap-1">{(event.genres || []).map(g => <Badge key={g} variant="outline">{g}</Badge>)}</div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Instrumentos</p>
                  <div className="flex flex-wrap gap-1">{(event.instruments_needed || []).map(i => <Badge key={i} variant="outline">{i}</Badge>)}</div>
                </div>
                {event.duration && <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-muted-foreground" /> Duración: {event.duration}</div>}
                {event.dress_code && <div className="flex items-center gap-2 text-sm"><Shirt className="w-4 h-4 text-muted-foreground" /> Dress code: {event.dress_code}</div>}
                <div className="flex items-center gap-2 text-sm"><Speaker className="w-4 h-4 text-muted-foreground" /> Sonido: {event.sound_provided ? 'Incluido' : 'No incluido'}</div>
                <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-muted-foreground" /> {event.musicians_needed} artistas necesarios</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="bg-muted rounded-lg h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">{event.venue}</p>
                  <p className="text-sm">{event.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {role === 'organizer' && (
          <TabsContent value="applications" className="mt-4">
            <div className="space-y-3">
              {applications.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground">No hay aplicaciones aún.</CardContent></Card>
              ) : (
                applications.map(app => (
                  <Card key={app.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={app.profile?.avatar_url || ''} />
                        <AvatarFallback>{(app.profile?.display_name || '?')[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{app.profile?.display_name || 'Artista'}</p>
                        <p className="text-xs text-muted-foreground">{app.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">${app.proposed_rate} MXN</p>
                        <Badge className={applicationStatusColors[app.status as ApplicationStatus]}>{applicationStatusLabels[app.status as ApplicationStatus]}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Aplicar a: {event.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Mensaje</Label><Textarea placeholder="¿Por qué eres ideal para este evento?" value={applyMessage} onChange={e => setApplyMessage(e.target.value)} /></div>
            <div><Label>Tarifa propuesta ($ MXN)</Label><Input type="number" placeholder="Ej: 3000" value={applyRate} onChange={e => setApplyRate(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancelar</Button>
            <Button className="gradient-primary text-white border-0" onClick={handleApply} disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
