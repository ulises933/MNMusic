import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, MessageSquare, Star, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { applicationStatusColors, applicationStatusLabels, type ApplicationStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface AppWithDetails {
  id: string;
  event_id: string;
  musician_id: string;
  message: string;
  proposed_rate: number;
  status: ApplicationStatus;
  created_at: string;
  events: { title: string } | null;
  profiles: { display_name: string; avatar_url: string | null; city: string | null } | null;
}

export default function Applications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [apps, setApps] = useState<AppWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<AppWithDetails | null>(null);

  useEffect(() => {
    if (user) fetchApps();
  }, [user]);

  const fetchApps = async () => {
    // Get applications for events owned by this organizer
    const { data: myEvents } = await supabase.from('events').select('id').eq('organizer_id', user!.id);
    if (!myEvents || myEvents.length === 0) { setLoading(false); return; }

    const eventIds = myEvents.map(e => e.id);
    const { data } = await supabase
      .from('applications')
      .select('*, events(title), profiles!applications_musician_id_fkey(display_name, avatar_url, city)')
      .in('event_id', eventIds)
      .order('created_at', { ascending: false });

    // The join might not work with the generated types, so let's do manual joins
    const { data: appsRaw } = await supabase
      .from('applications')
      .select('*')
      .in('event_id', eventIds)
      .order('created_at', { ascending: false });

    if (appsRaw) {
      const enriched: AppWithDetails[] = [];
      for (const app of appsRaw) {
        const { data: evt } = await supabase.from('events').select('title').eq('id', app.event_id).maybeSingle();
        const { data: prof } = await supabase.from('profiles').select('display_name, avatar_url, city').eq('user_id', app.musician_id).maybeSingle();
        enriched.push({
          ...app,
          status: app.status as ApplicationStatus,
          events: evt,
          profiles: prof,
        });
      }
      setApps(enriched);
    }
    setLoading(false);
  };

  const filtered = apps.filter(a => statusFilter === 'all' || a.status === statusFilter);

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const { error } = await supabase.from('applications').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Aplicación ${status === 'accepted' ? 'aceptada' : 'rechazada'}` });
      setSelectedApp(null);
      fetchApps();
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Aplicaciones</h1>
        <p className="text-muted-foreground mt-1">Gestiona las solicitudes de artistas</p>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="accepted">Aceptada</SelectItem>
            <SelectItem value="rejected">Rechazada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-display font-semibold text-lg mb-2">No hay aplicaciones aún</h3>
          <p className="text-sm">Las aplicaciones aparecerán aquí cuando los artistas apliquen a tus eventos</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artista</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Tarifa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(app => (
                <TableRow key={app.id} className="cursor-pointer" onClick={() => setSelectedApp(app)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={app.profiles?.avatar_url || ''} />
                        <AvatarFallback>{(app.profiles?.display_name || '?')[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{app.profiles?.display_name || 'Artista'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{app.events?.title || 'Evento'}</TableCell>
                  <TableCell className="font-semibold">€{app.proposed_rate}</TableCell>
                  <TableCell><Badge className={applicationStatusColors[app.status]}>{applicationStatusLabels[app.status]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {app.status === 'pending' && (
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => updateStatus(app.id, 'accepted')}><Check className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => updateStatus(app.id, 'rejected')}><X className="w-4 h-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Detalle de Aplicación</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={selectedApp.profiles?.avatar_url || ''} />
                  <AvatarFallback>{(selectedApp.profiles?.display_name || '?')[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-display font-semibold">{selectedApp.profiles?.display_name}</h3>
                  {selectedApp.profiles?.city && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {selectedApp.profiles.city}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Evento: {selectedApp.events?.title}</p>
                <p className="text-sm text-muted-foreground">{selectedApp.message}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tarifa propuesta</span>
                <span className="text-lg font-display font-bold text-primary">€{selectedApp.proposed_rate}</span>
              </div>
              <Badge className={applicationStatusColors[selectedApp.status]}>{applicationStatusLabels[selectedApp.status]}</Badge>
              {selectedApp.status === 'pending' && (
                <div className="flex gap-2">
                  <Button className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => updateStatus(selectedApp.id, 'accepted')}>
                    <Check className="w-4 h-4 mr-1" /> Aceptar
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => updateStatus(selectedApp.id, 'rejected')}>
                    <X className="w-4 h-4 mr-1" /> Rechazar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
