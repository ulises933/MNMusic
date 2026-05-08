import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Shield, Edit, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface UserRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  city: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  subscription?: { status: string; plan_name: string; trial_ends_at: string | null };
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (profiles) {
      const enriched: UserRow[] = [];
      for (const p of profiles) {
        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('status, trial_ends_at, plan_id')
          .eq('user_id', p.user_id)
          .maybeSingle();
        let plan_name = 'Sin plan';
        if (sub?.plan_id) {
          const { data: plan } = await supabase.from('subscription_plans').select('name').eq('id', sub.plan_id).maybeSingle();
          plan_name = plan?.name || 'Desconocido';
        }
        enriched.push({
          ...p,
          subscription: sub ? { status: sub.status, plan_name, trial_ends_at: sub.trial_ends_at } : undefined,
        });
      }
      setUsers(enriched);
    }
    setLoading(false);
  };

  const filtered = users.filter(u => {
    const matchSearch = u.display_name.toLowerCase().includes(search.toLowerCase()) || u.user_id.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'trial': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const roleLabel = (r: string) => r === 'musician' ? 'Artista' : r === 'organizer' ? 'Organizador' : 'Usuario';

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground mt-1">{users.length} usuarios registrados</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o ID..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Rol" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="musician">Artista</SelectItem>
            <SelectItem value="organizer">Organizador</SelectItem>
            <SelectItem value="user">Usuario</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(u => (
              <TableRow key={u.user_id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={u.avatar_url || ''} />
                      <AvatarFallback>{u.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{u.display_name}</p>
                      <p className="text-xs text-muted-foreground">{u.city || '—'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{roleLabel(u.role)}</Badge>
                </TableCell>
                <TableCell className="text-sm">{u.subscription?.plan_name || 'Sin plan'}</TableCell>
                <TableCell>
                  {u.subscription ? (
                    <Badge className={statusColor(u.subscription.status)}>
                      {u.subscription.status === 'trial' ? 'Prueba' : u.subscription.status === 'active' ? 'Activo' : u.subscription.status}
                    </Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground">—</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(u); setDetailOpen(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">Detalle de Usuario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedUser.avatar_url || ''} />
                    <AvatarFallback className="text-xl">{selectedUser.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-display font-bold">{selectedUser.display_name}</h3>
                    <p className="text-sm text-muted-foreground">Rol: {roleLabel(selectedUser.role)}</p>
                    <p className="text-xs text-muted-foreground">ID: {selectedUser.user_id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="font-semibold">Ciudad</p><p className="text-muted-foreground">{selectedUser.city || '—'}</p></div>
                  <div><p className="font-semibold">Teléfono</p><p className="text-muted-foreground">{selectedUser.phone || '—'}</p></div>
                  <div><p className="font-semibold">Plan</p><p className="text-muted-foreground">{selectedUser.subscription?.plan_name || 'Sin plan'}</p></div>
                  <div><p className="font-semibold">Estado</p><p className="text-muted-foreground">{selectedUser.subscription?.status || '—'}</p></div>
                </div>
                {selectedUser.bio && <div className="text-sm"><p className="font-semibold">Bio</p><p className="text-muted-foreground">{selectedUser.bio}</p></div>}
                {selectedUser.subscription?.trial_ends_at && (
                  <div className="text-sm"><p className="font-semibold">Prueba termina</p><p className="text-muted-foreground">{new Date(selectedUser.subscription.trial_ends_at).toLocaleDateString()}</p></div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
