import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Music, Users, User, ArrowLeft, Gift, Check } from 'lucide-react';
import { cn, publicAsset } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { UserRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

function parseRoleParam(value: string | null): UserRole | null {
  if (value === 'musician' || value === 'organizer' || value === 'user') return value;
  return null;
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, signup, isAuthenticated, isAdmin, logout, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>(() => parseRoleParam(searchParams.get('role')) ?? 'musician');

  useEffect(() => {
    const r = parseRoleParam(searchParams.get('role'));
    if (r) setRole(r);
  }, [searchParams]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (showPlanSelection) {
      fetchPlans();
    }
  }, [showPlanSelection]);

  // Handle redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading && !submitting && !redirecting) {
      setRedirecting(true);
      // Small delay to ensure state is ready
      const timer = setTimeout(async () => {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) {
            setRedirecting(false);
            return;
          }
          
          // Check if user has trial subscription
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('status, plan_id')
            .eq('user_id', currentUser.id)
            .maybeSingle();
          
          let isTrial = false;
          if (subscription?.plan_id) {
            const { data: plan } = await supabase
              .from('subscription_plans')
              .select('slug')
              .eq('id', subscription.plan_id)
              .maybeSingle();
            isTrial = plan?.slug === 'free_trial' && subscription.status === 'trial';
          }
          
          if (isTrial) {
            navigate('/subscription', { replace: true });
            return;
          }
          
          // Check admin role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentUser.id)
            .eq('role', 'admin')
            .maybeSingle();
          
          if (roleData?.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
            return;
          }
          
          // Get profile role
          const { data: prof } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', currentUser.id)
            .maybeSingle();
          
          const userRole = prof?.role || 'user';
          const dashboardPath = userRole === 'musician' ? '/m/dashboard' : userRole === 'organizer' ? '/o/dashboard' : '/u/dashboard';
          navigate(dashboardPath, { replace: true });
        } catch (err) {
          console.error('Error during redirect:', err);
          setRedirecting(false);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, submitting, redirecting, navigate]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (data && data.length > 0) {
      const freeOnly = (data as any[]).filter(
        (p) => p.slug === 'free_trial' || (Number(p.price_monthly) === 0 && Number(p.price_yearly) === 0)
      );
      setPlans(freeOnly);
      const first = freeOnly[0];
      if (first) setSelectedPlanId(first.id);
    }
    setLoadingPlans(false);
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background safe-area-pt safe-area-pb">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-muted-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  // Don't render if authenticated and redirecting
  if (isAuthenticated && (redirecting || !submitting)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background safe-area-pt safe-area-pb">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-muted-foreground">Redirigiendo...</div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={async () => {
              await logout();
              setRedirecting(false);
            }}
            className="mt-4"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  const validate = (isRegister: boolean) => {
    const e: Record<string, string> = {};
    if (!email) e.email = 'Email es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido';
    if (!password) e.password = 'Contraseña es requerida';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (isRegister && !name) e.name = 'Nombre es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate(false)) return;
    setSubmitting(true);
    const { error } = await login(email, password);
    
    if (error) {
      setSubmitting(false);
      setErrors({ general: error });
      return;
    }
    
    // Wait for auth state to update and profile to load
    await new Promise(r => setTimeout(r, 800));
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setSubmitting(false);
        setErrors({ general: 'Error al obtener información del usuario' });
        return;
      }
      
      // Check if user has trial subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('status, plan_id')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      // Check subscription plan slug
      let isTrial = false;
      if (subscription?.plan_id) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('slug')
          .eq('id', subscription.plan_id)
          .maybeSingle();
        isTrial = plan?.slug === 'free_trial' && subscription.status === 'trial';
      }
      
      // If user has trial, redirect to subscription page
      if (isTrial) {
        navigate('/subscription', { replace: true });
        return;
      }
      
      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (roleData?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      
      // Get profile role
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      const userRole = prof?.role || 'user';
      const dashboardPath = userRole === 'musician' ? '/m/dashboard' : userRole === 'organizer' ? '/o/dashboard' : '/u/dashboard';
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      console.error('Error during login redirect:', err);
      setSubmitting(false);
      setErrors({ general: 'Error al cargar información del usuario' });
    }
  };

  const handleRegister = async () => {
    if (!validate(true)) return;
    // Show plan selection before creating account
    setShowPlanSelection(true);
  };

  const handlePlanSelection = async () => {
    if (!selectedPlanId) {
      setErrors({ general: 'Por favor selecciona un plan' });
      return;
    }
    
    setSubmitting(true);
    const { error } = await signup(email, password, name, role);
    setSubmitting(false);
    
    if (error) {
      setErrors({ general: error });
      setShowPlanSelection(false);
    } else {
      // Note: The trial is automatically assigned by the trigger function
      // All users start with trial regardless of selected plan
      // They can upgrade later from the subscription page
      setShowTrialBanner(true);
      setTimeout(() => {
        navigate('/subscription');
      }, 3000);
    }
  };

  if (showTrialBanner) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-4 safe-area-pt safe-area-pb">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <div className="w-16 h-16 rounded-full gradient-primary mx-auto flex items-center justify-center">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-display font-bold">¡Bienvenido a MN Music!</h2>
            <p className="text-muted-foreground">Tu cuenta ha sido creada exitosamente.</p>
            <Badge className="gradient-primary text-white border-0 text-sm px-4 py-1">Cuenta Creada</Badge>
            <p className="text-xs text-muted-foreground">Redirigiendo a tu panel de suscripciones...</p>
            <div className="animate-pulse text-xs text-muted-foreground">Redirigiendo...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPlanSelection) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-4 safe-area-pt safe-area-pb">
        <div className="w-full max-w-4xl">
          <Link to="/" className="flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Plan de bienvenida</CardTitle>
              <CardDescription>
                En la app solo está disponible el <strong>acceso gratuito / prueba</strong>. Las suscripciones de pago se gestionan en mnmusic.mx.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errors.general && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {errors.general}
                </div>
              )}

              {loadingPlans ? (
                <div className="text-center py-8 text-muted-foreground">Cargando planes...</div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No hay planes disponibles. Se asignará el plan gratuito por defecto.</p>
                  <Button onClick={handlePlanSelection} disabled={submitting}>
                    {submitting ? 'Creando cuenta...' : 'Continuar con plan gratuito'}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 mb-6 max-w-md mx-auto">
                    {plans.map((plan) => {
                      const isTrial = plan.slug === 'free_trial';
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <Card
                          key={plan.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            isSelected && "ring-2 ring-primary border-primary"
                          )}
                          onClick={() => setSelectedPlanId(plan.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between mb-2">
                              <CardTitle className="text-lg font-display">{plan.name}</CardTitle>
                              {(isTrial || plan.price_monthly === 0) && <Gift className="w-5 h-5 text-primary" />}
                            </div>
                            {plan.description && (
                              <CardDescription className="text-xs">{plan.description}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="text-2xl font-bold">Gratis</div>
                            <ul className="space-y-2 text-sm">
                              {Array.isArray(plan.features) && plan.features.slice(0, 6).map((feature: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                  <span className="text-muted-foreground">{feature}</span>
                                </li>
                              ))}
                            </ul>
                            {isSelected && (
                              <Badge className="w-full justify-center gradient-primary text-white border-0">
                                <Check className="w-4 h-4 mr-1" /> Incluido
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowPlanSelection(false)}>
                      Volver
                    </Button>
                    <Button 
                      className="flex-1 gradient-primary text-white border-0" 
                      onClick={handlePlanSelection}
                      disabled={submitting || !selectedPlanId}
                    >
                      {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3 mt-4">
                    <Gift className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-primary mb-1">Solo plan gratuito en la app</p>
                      <p className="text-muted-foreground">
                        Para contratar un plan de pago visita mnmusic.mx desde el navegador.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Al continuar, aceptas los términos y condiciones.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4 safe-area-pt safe-area-pb">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="flex items-center gap-2 mb-6">
          <img src={publicAsset("/logo.png")} alt="MN Music" className="w-10 h-10 rounded-xl object-cover" />
          <span className="font-display font-bold text-2xl">MN Music</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Bienvenido</CardTitle>
            <CardDescription>Inicia sesión o crea tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.general && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {errors.general}
              </div>
            )}
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="register">Crear cuenta</TabsTrigger>
              </TabsList>

              <div className="mb-6">
                <Label className="text-sm mb-2 block">Soy...</Label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {([
                    { value: 'musician' as UserRole, icon: Music, label: 'Artista' },
                    { value: 'organizer' as UserRole, icon: Users, label: 'Organizador' },
                    { value: 'user' as UserRole, icon: User, label: 'Usuario' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setRole(opt.value);
                        setSearchParams({ role: opt.value }, { replace: true });
                      }}
                      className={cn(
                        'flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl border-2 transition-all text-xs sm:text-sm font-medium text-center',
                        role === opt.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <opt.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span className="leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <TabsContent value="login" className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input id="login-password" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} />
                  {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                </div>
                <Button className="w-full gradient-primary text-white border-0 h-11" onClick={handleLogin} disabled={submitting}>
                  {submitting ? 'Cargando...' : 'Iniciar sesión'}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                {/* Free trial badge */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
                  <Gift className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-primary">Prueba gratuita de 14 días</p>
                    <p className="text-xs text-muted-foreground">Acceso completo sin tarjeta de crédito</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reg-name">Nombre</Label>
                  <Input id="reg-name" placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="reg-password">Contraseña</Label>
                  <Input id="reg-password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
                  {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                </div>
                <Button className="w-full gradient-primary text-white border-0 h-11" onClick={handleRegister} disabled={submitting}>
                  {submitting ? 'Creando cuenta...' : 'Comenzar prueba gratuita'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Al registrarte aceptas los términos y condiciones</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
