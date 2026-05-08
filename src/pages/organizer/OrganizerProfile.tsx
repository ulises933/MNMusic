import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Phone, Building2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { eventTypeLabels, eventTypeColors, statusLabels, statusColors, type DbEvent, type EventType, type EventStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizerProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const [orgProfile, setOrgProfile] = useState<any>(null);
  const [myEvents, setMyEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ company_name: '', company_type: '', payment_method: '', city: '', phone: '' });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [orgRes, evtsRes] = await Promise.all([
      supabase.from('organizer_profiles').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('events').select('*').eq('organizer_id', user!.id).order('date', { ascending: false }),
    ]);
    setOrgProfile(orgRes.data);
    setMyEvents((evtsRes.data as DbEvent[]) || []);
    if (orgRes.data) {
      setForm({
        company_name: orgRes.data.company_name || '',
        company_type: orgRes.data.company_type || '',
        payment_method: orgRes.data.payment_method || '',
        city: profile?.city || '',
        phone: profile?.phone || '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ city: form.city, phone: form.phone }).eq('user_id', user.id);

    const orgData = { user_id: user.id, company_name: form.company_name, company_type: form.company_type, payment_method: form.payment_method };
    if (orgProfile) {
      await supabase.from('organizer_profiles').update(orgData).eq('user_id', user.id);
    } else {
      await supabase.from('organizer_profiles').insert(orgData);
    }
    await refreshProfile();
    setEditing(false);
    toast({ title: 'Perfil actualizado' });
    fetchData();
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Perfil Organizador</h1>
        <Button variant="outline" onClick={() => setEditing(true)}><Edit className="w-4 h-4 mr-2" /> Editar</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center text-white text-xl font-bold">
              {(orgProfile?.company_name || profile?.display_name || '?')[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-display font-bold">{orgProfile?.company_name || profile?.display_name}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                {orgProfile?.company_type && <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {orgProfile.company_type}</span>}
                {profile?.city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.city}</span>}
                {profile?.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {profile.phone}</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">Historial de Eventos</CardTitle></CardHeader>
        <CardContent>
          {myEvents.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No tienes eventos aún</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myEvents.map(event => (
                <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/events/${event.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={eventTypeColors[event.type as EventType]}>{eventTypeLabels[event.type as EventType]}</Badge>
                      <Badge className={statusColors[event.status as EventStatus]}>{statusLabels[event.status as EventStatus]}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm">{event.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{event.date} · {event.city}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Editar Perfil</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre de empresa</Label><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
            <div><Label>Tipo de empresa</Label><Input value={form.company_type} onChange={e => setForm({ ...form, company_type: e.target.value })} placeholder="Ej: Empresa de eventos" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ciudad</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Método de pago</Label><Input value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} placeholder="Ej: Transferencia bancaria" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button className="gradient-primary text-white border-0" onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
