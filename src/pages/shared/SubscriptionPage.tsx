import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreditCard, Crown, Clock, Check, ArrowRight, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { MNMUSIC_WEB_URL, SUBSCRIPTION_WEB_ONLY_MESSAGE } from '@/lib/constants';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  max_events: number | null;
  max_applications: number | null;
  is_active: boolean;
  sort_order: number;
}

interface UserSub {
  id: string;
  plan_id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  payment_provider: string | null;
  plan?: Plan;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  provider: string;
  created_at: string;
}

// Role-based fallback plans when DB is empty
const ROLE_PLANS: Record<string, { name: string; slug: string; desc: string; monthly: number; yearly: number; features: string[] }[]> = {
  musician: [
    { name: 'Artista Básico', slug: 'artist-basic', desc: 'Para empezar tu carrera', monthly: 0, yearly: 0, features: ['Perfil público', 'Hasta 5 aplicaciones/mes', 'Portafolio básico', 'Soporte por email'] },
    { name: 'Artista Pro', slug: 'artist-pro', desc: 'Para artistas activos', monthly: 199, yearly: 1910, features: ['Aplicaciones ilimitadas', 'Perfil destacado en búsquedas', 'Portafolio completo con videos', 'Mensajería directa', 'Estadísticas de perfil', 'Soporte prioritario'] },
    { name: 'Artista Premium', slug: 'artist-premium', desc: 'Máxima visibilidad', monthly: 399, yearly: 3830, features: ['Todo de Pro', 'Prioridad #1 en resultados', 'Badge verificado ✓', 'Notificaciones de eventos nuevos', 'Analíticas avanzadas', 'Soporte dedicado'] },
  ],
  organizer: [
    { name: 'Organizador Básico', slug: 'org-basic', desc: 'Para eventos ocasionales', monthly: 0, yearly: 0, features: ['Hasta 2 eventos/mes', 'Hasta 10 aplicaciones recibidas', 'Búsqueda de artistas', 'Soporte por email'] },
    { name: 'Organizador Pro', slug: 'org-pro', desc: 'Para organizadores frecuentes', monthly: 299, yearly: 2870, features: ['Eventos ilimitados', 'Aplicaciones ilimitadas', 'Invitaciones directas a artistas', 'Mensajería directa', 'Filtros avanzados', 'Soporte prioritario'] },
    { name: 'Organizador Premium', slug: 'org-premium', desc: 'Para empresas y agencias', monthly: 599, yearly: 5750, features: ['Todo de Pro', 'Múltiples usuarios', 'Contratación express', 'Facturación automática', 'API de integración', 'Soporte dedicado 24/7'] },
  ],
  user: [
    { name: 'Usuario Gratis', slug: 'user-free', desc: 'Explora la plataforma', monthly: 0, yearly: 0, features: ['Buscar artistas', 'Ver perfiles públicos', 'Hasta 3 contactos/mes', 'Soporte por email'] },
    { name: 'Usuario Plus', slug: 'user-plus', desc: 'Para quienes buscan talento', monthly: 149, yearly: 1430, features: ['Contactos ilimitados', 'Publicar eventos', 'Mensajería directa', 'Reseñas verificadas', 'Soporte prioritario'] },
    { name: 'Usuario Business', slug: 'user-business', desc: 'Para negocios recurrentes', monthly: 349, yearly: 3350, features: ['Todo de Plus', 'Artistas favoritos', 'Contratación recurrente', 'Descuentos exclusivos', 'Facturación', 'Soporte dedicado'] },
  ],
};

export default function SubscriptionPage() {
  const { user, role } = useAuth();
  const [sub, setSub] = useState<UserSub | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [webPurchaseNoticeOpen, setWebPurchaseNoticeOpen] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    setWebPurchaseNoticeOpen(true);
  }, []);

  const openMnmusicWeb = () => {
    window.open(MNMUSIC_WEB_URL, '_blank', 'noopener,noreferrer');
  };

  const fetchData = async () => {
    const [subRes, plansRes, txRes] = await Promise.all([
      supabase.from('user_subscriptions').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('payment_transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
    ]);

    const allPlans = (plansRes.data as Plan[]) || [];
    setPlans(allPlans);
    setTransactions((txRes.data as Transaction[]) || []);

    if (subRes.data) {
      const plan = allPlans.find(p => p.id === subRes.data.plan_id);
      setSub({ ...subRes.data, plan } as UserSub);
    }
    setLoading(false);
  };

  const trialDaysLeft = sub?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const trialProgress = sub?.trial_ends_at
    ? Math.min(100, ((14 - trialDaysLeft) / 14) * 100)
    : 0;

  const currentRole = role || 'user';
  const rolePlans = ROLE_PLANS[currentRole] || ROLE_PLANS.user;

  const allDisplayPlans: { id: string; name: string; slug: string; description: string | null; price_monthly: number; price_yearly: number; features: string[]; max_events?: number | null; max_applications?: number | null }[] = plans.length > 0
    ? plans.map(p => ({ ...p, features: Array.isArray(p.features) ? p.features : [] }))
    : rolePlans.map((p, i) => ({ id: `fallback-${i}`, name: p.name, slug: p.slug, description: p.desc, price_monthly: p.monthly, price_yearly: p.yearly, features: p.features }));

  /** En la app solo se muestran planes gratuitos; el pago es en mnmusic.mx */
  const displayPlans = allDisplayPlans.filter(
    (p) => p.price_monthly === 0 && p.price_yearly === 0
  );

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-48" /><div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-80" />)}</div></div>;

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      trial: { label: 'Prueba gratuita', variant: 'secondary' },
      active: { label: 'Activa', variant: 'default' },
      expired: { label: 'Expirada', variant: 'destructive' },
      cancelled: { label: 'Cancelada', variant: 'outline' },
    };
    const s = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const txStatusBadge = (status: string) => {
    if (status === 'completed') return <Badge className="bg-primary/10 text-primary border-primary/20">Pagado</Badge>;
    if (status === 'pending') return <Badge variant="secondary">Pendiente</Badge>;
    if (status === 'failed') return <Badge variant="destructive">Fallido</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const roleLabel = currentRole === 'musician' ? 'Artista' : currentRole === 'organizer' ? 'Organizador' : 'Usuario';

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Mi Suscripción</h1>
        <p className="text-muted-foreground mt-1">Planes diseñados para <span className="text-primary font-semibold">{roleLabel}s</span> · Gestiona tu plan, pagos e historial</p>
      </div>

      {/* Current Plan Card */}
      {sub && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-display font-bold">{sub.plan?.name || 'Plan'}</h2>
                    {statusBadge(sub.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{sub.plan?.description}</p>
                </div>
              </div>
              <div className="text-right">
                {(sub.plan?.price_monthly ?? 0) === 0 && (sub.plan?.price_yearly ?? 0) === 0 ? (
                  <>
                    <p className="text-2xl font-display font-bold text-primary">Gratis</p>
                    <p className="text-xs text-muted-foreground">Prueba / plan incluido</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-display font-bold text-primary">
                      ${(sub.plan?.price_monthly ?? 0).toLocaleString()} MXN
                    </p>
                    <p className="text-xs text-muted-foreground">/mes</p>
                  </>
                )}
              </div>
            </div>

            {sub.status === 'trial' && (
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Período de prueba
                  </span>
                  <span className="text-sm font-bold text-primary">{trialDaysLeft} días restantes</span>
                </div>
                <Progress value={trialProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Tu prueba termina el {sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}. Para un plan de pago visita{' '}
                  <button type="button" className="text-primary font-medium underline" onClick={() => setWebPurchaseNoticeOpen(true)}>mnmusic.mx</button>.
                </p>
              </div>
            )}

            {sub.status === 'active' && sub.current_period_end && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Próxima renovación: {new Date(sub.current_period_end).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Planes para {roleLabel}s</TabsTrigger>
          <TabsTrigger value="history">Historial de pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6 space-y-6">
          <p className="text-sm text-muted-foreground text-center max-w-lg mx-auto">
            En la app solo se gestiona el acceso gratuito o de prueba. Las suscripciones de pago se contratan en la web.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {displayPlans.map((plan) => {
              const isCurrent = sub?.plan_id === plan.id;
              return (
                <Card key={plan.id} className={`relative transition-all flex flex-col ${isCurrent ? 'ring-2 ring-primary' : 'hover:border-primary/40'}`}>
                  <CardHeader className="text-center pb-2 pt-6">
                    <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="text-center space-y-4 flex-1 flex flex-col">
                    <div>
                      <p className="text-3xl font-display font-bold">Gratis</p>
                    </div>

                    <div className="text-left space-y-2 flex-1">
                      {plan.features.map((f, fi) => (
                        <div key={fi} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{String(f)}</span>
                        </div>
                      ))}
                    </div>

                    {isCurrent ? (
                      <Button className="w-full" variant="outline" disabled>
                        <Check className="w-4 h-4 mr-2" /> Plan actual
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        Plan gratuito
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {displayPlans.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                No hay planes gratuitos configurados. Contacta a soporte o visita mnmusic.mx
              </CardContent>
            </Card>
          )}

          <Card className="border-primary/25 bg-primary/5">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">¿Quieres un plan de pago?</p>
                  <p className="text-xs text-muted-foreground mt-1">{SUBSCRIPTION_WEB_ONLY_MESSAGE}</p>
                </div>
              </div>
              <Button className="w-full gradient-primary text-white border-0" onClick={() => setWebPurchaseNoticeOpen(true)}>
                Ir a mnmusic.mx <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium text-muted-foreground">Sin transacciones</p>
                <p className="text-sm text-muted-foreground">Los pagos de suscripción se realizan en mnmusic.mx. Aquí solo verás registros si hubo cargos asociados a tu cuenta.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => (
                <Card key={tx.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{tx.description || 'Pago'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}{tx.provider === 'openpay' ? 'OpenPay' : tx.provider === 'openpay_sim' ? 'OpenPay (Sim)' : tx.provider}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-bold text-sm">${tx.amount.toLocaleString()} {tx.currency}</p>
                      {txStatusBadge(tx.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={webPurchaseNoticeOpen} onOpenChange={setWebPurchaseNoticeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Suscripciones</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-base text-foreground/90">
              {SUBSCRIPTION_WEB_ONLY_MESSAGE}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0">Continuar en la app</AlertDialogCancel>
            <AlertDialogAction
              className="gradient-primary text-white border-0"
              onClick={() => openMnmusicWeb()}
            >
              Abrir mnmusic.mx
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
