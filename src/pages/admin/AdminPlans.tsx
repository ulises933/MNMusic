import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Edit, Check, X, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  max_events: number;
  max_applications: number;
  is_active: boolean;
  sort_order: number;
}

export default function AdminPlans() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    const { data } = await supabase.from('subscription_plans').select('*').order('sort_order');
    setPlans((data as Plan[]) || []);
    setLoading(false);
  };

  const openEdit = (plan: Plan) => {
    setEditForm({
      ...plan,
      features_text: (plan.features || []).join('\n'),
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    const { id, features_text, ...rest } = editForm;
    const features = features_text.split('\n').map((f: string) => f.trim()).filter(Boolean);
    const { error } = await supabase.from('subscription_plans').update({
      ...rest,
      features,
      price_monthly: parseFloat(rest.price_monthly) || 0,
      price_yearly: parseFloat(rest.price_yearly) || 0,
      max_events: parseInt(rest.max_events) || -1,
      max_applications: parseInt(rest.max_applications) || -1,
    }).eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Plan actualizado' });
      setEditOpen(false);
      fetchPlans();
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-80" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Planes y Precios</h1>
        <p className="text-muted-foreground mt-1">Configura los planes de suscripción de la plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(plan => (
          <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-50' : ''} ${plan.slug === 'pro' ? 'ring-2 ring-primary' : ''}`}>
            {plan.slug === 'pro' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="gradient-primary text-white border-0">Popular</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div>
                <p className="text-3xl font-display font-bold text-primary">
                  ${plan.price_monthly}
                  <span className="text-sm font-normal text-muted-foreground"> /mes</span>
                </p>
                {plan.price_yearly > 0 && (
                  <p className="text-xs text-muted-foreground">${plan.price_yearly}/año</p>
                )}
              </div>

              <div className="text-left space-y-2">
                {(plan.features || []).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Max eventos: {plan.max_events === -1 ? 'Ilimitados' : plan.max_events}</p>
                <p>Max aplicaciones: {plan.max_applications === -1 ? 'Ilimitadas' : plan.max_applications}</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(plan)}>
                <Edit className="w-3 h-3 mr-1" /> Editar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Integración OpenPay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">OpenPay — Pendiente de configurar</p>
              <p className="text-xs text-muted-foreground">La pasarela de pago OpenPay está lista para conectarse. Configura tus credenciales para activar cobros reales.</p>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">Simulación</Badge>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div>
              <Label>OpenPay Merchant ID</Label>
              <Input placeholder="Tu Merchant ID de OpenPay" disabled />
            </div>
            <div>
              <Label>OpenPay API Key</Label>
              <Input placeholder="Tu API Key de OpenPay" type="password" disabled />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Los pagos actualmente se simulan. Cuando conectes OpenPay, los cobros se procesarán automáticamente.</p>
        </CardContent>
      </Card>

      {/* Edit Plan Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Editar Plan: {editForm.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><Label>Descripción</Label><Input value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Precio mensual (MXN)</Label><Input type="number" value={editForm.price_monthly || ''} onChange={e => setEditForm({ ...editForm, price_monthly: e.target.value })} /></div>
              <div><Label>Precio anual (MXN)</Label><Input type="number" value={editForm.price_yearly || ''} onChange={e => setEditForm({ ...editForm, price_yearly: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Max eventos (-1 = ilimitados)</Label><Input type="number" value={editForm.max_events ?? ''} onChange={e => setEditForm({ ...editForm, max_events: e.target.value })} /></div>
              <div><Label>Max aplicaciones (-1 = ilimitadas)</Label><Input type="number" value={editForm.max_applications ?? ''} onChange={e => setEditForm({ ...editForm, max_applications: e.target.value })} /></div>
            </div>
            <div><Label>Características (una por línea)</Label><Textarea value={editForm.features_text || ''} onChange={e => setEditForm({ ...editForm, features_text: e.target.value })} rows={5} /></div>
            <div className="flex items-center gap-3">
              <Switch checked={editForm.is_active || false} onCheckedChange={v => setEditForm({ ...editForm, is_active: v })} />
              <Label>Plan activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button className="gradient-primary text-white border-0" onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
