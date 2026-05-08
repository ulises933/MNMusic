import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, ArrowRight, Mic2, Guitar, Headphones, PartyPopper, Building2, Heart, Check, Crown, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { publicAsset } from '@/lib/utils';
import { MNMUSIC_WEB_URL } from '@/lib/constants';
import type { UserRole } from '@/contexts/AuthContext';

const categories = [
  { icon: Heart, label: 'Bodas', count: 45 },
  { icon: Mic2, label: 'Bares', count: 120 },
  { icon: Building2, label: 'Corporativos', count: 38 },
  { icon: PartyPopper, label: 'Fiestas', count: 67 },
  { icon: Guitar, label: 'Festivales', count: 23 },
  { icon: Headphones, label: 'Restaurantes', count: 89 },
];

const testimonials = [
  { name: 'Ana Martínez', role: 'Organizadora de bodas', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana', quote: 'MN Music me ha facilitado encontrar artistas increíbles para mis eventos. El proceso es súper sencillo.' },
  { name: 'Diego Ramírez', role: 'Guitarrista', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diego', quote: 'Desde que uso MN Music, mis ingresos como artista han crecido un 40%. La plataforma conecta directamente con organizadores serios.' },
  { name: 'Patricia Gómez', role: 'Dueña de restaurante', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=patricia', quote: 'Contraté artistas para nuestros brunches dominicales en minutos. Los clientes están encantados.' },
];

const stepsMusician = [
  { step: '01', title: 'Crea tu perfil', desc: 'Muestra tu talento, géneros, portafolio y tarifas.' },
  { step: '02', title: 'Explora eventos', desc: 'Filtra por ciudad, tipo, fecha y aplica al instante.' },
  { step: '03', title: 'Toca y cobra', desc: 'Confirma, toca y recibe tu pago de forma segura.' },
];

const stepsOrganizer = [
  { step: '01', title: 'Publica tu evento', desc: 'Describe el evento, requisitos y presupuesto.' },
  { step: '02', title: 'Recibe aplicaciones', desc: 'Artistas aplican con su perfil, mensaje y cotización.' },
  { step: '03', title: 'Elige y disfruta', desc: 'Selecciona al artista ideal y gestiona todo desde la app.' },
];

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
  sort_order: number;
}

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [freePlan, setFreePlan] = useState<Plan | null>(null);

  useEffect(() => {
    supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (!data?.length) return;
      const list = data as Plan[];
      const trial = list.find(p => p.slug === 'free_trial');
      const zero = list.find(p => p.price_monthly === 0 && p.price_yearly === 0);
      setFreePlan(trial || zero || null);
    });
  }, []);

  const goAuth = () => navigate('/auth');
  const goAuthAs = (r: UserRole) => navigate(`/auth?role=${r}`);

  return (
    <div className="min-h-dvh bg-background safe-area-pb">
      {/* Navbar: safe-area evita solaparse con notch / Dynamic Island */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md safe-area-pt">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-14 sm:h-16 flex items-center justify-between gap-2 py-2 sm:py-0">
          <div className="flex items-center gap-2 min-w-0 shrink">
            <img src={publicAsset("/logo.png")} alt="MN Music" className="w-9 h-9 rounded-xl object-cover shrink-0" />
            <span className="font-display font-bold text-lg sm:text-xl truncate">MN Music</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="sm" className="px-2 sm:px-4 max-[380px]:px-1.5" onClick={goAuth}>
              <span className="max-[380px]:hidden">Iniciar sesión</span>
              <span className="hidden max-[380px]:inline">Entrar</span>
            </Button>
            <Button size="sm" className="gradient-primary text-white border-0 px-3 sm:px-4 shrink-0" onClick={goAuth}>
              Registrarse
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero: padding superior = barra fija (~4rem) + safe-area + aire */}
      <section className="pt-[calc(4.25rem+env(safe-area-inset-top,0px)+0.75rem)] sm:pt-[calc(4.5rem+env(safe-area-inset-top,0px)+1rem)] pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">
              🎵 La plataforma #1 para artistas y eventos
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold tracking-tight mb-6 leading-tight">
              Conecta tu <span className="text-gradient">talento</span> con el{' '}
              <span className="text-gradient">escenario</span> perfecto
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              MN Music conecta artistas con organizadores de eventos. Encuentra gigs, gestiona tu agenda o contrata talento.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-xl mx-auto">
              <Button size="lg" className="gradient-primary text-white border-0 text-base px-6 sm:px-8 h-12 rounded-xl" onClick={() => goAuthAs('musician')}>
                <Music className="w-5 h-5 mr-2 shrink-0" /> Soy Artista
              </Button>
              <Button size="lg" variant="outline" className="text-base px-6 sm:px-8 h-12 rounded-xl" onClick={() => goAuthAs('organizer')}>
                <Users className="w-5 h-5 mr-2 shrink-0" /> Soy Organizador
              </Button>
              <Button size="lg" variant="outline" className="text-base px-6 sm:px-8 h-12 rounded-xl" onClick={() => goAuthAs('user')}>
                <Star className="w-5 h-5 mr-2 shrink-0" /> Busco Artistas
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto"
          >
            {[
              { value: '2,500+', label: 'Artistas activos' },
              { value: '1,200+', label: 'Eventos al mes' },
              { value: '4.8★', label: 'Valoración media' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-display font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-4">¿Cómo funciona?</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">Sencillo, rápido y profesional para artistas y organizadores.</p>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-display font-semibold text-xl mb-6 flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" /> Para Artistas
              </h3>
              <div className="space-y-6">
                {stepsMusician.map(s => (
                  <div key={s.step} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-display font-bold text-sm shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="font-semibold">{s.title}</h4>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-display font-semibold text-xl mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Para Organizadores
              </h3>
              <div className="space-y-6">
                {stepsOrganizer.map(s => (
                  <div key={s.step} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-display font-bold text-sm shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="font-semibold">{s.title}</h4>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-4">Categorías de Eventos</h2>
          <p className="text-muted-foreground text-center mb-12">Encuentra el escenario que se adapte a tu estilo.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Card key={cat.label} className="group cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <cat.icon className="w-8 h-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-sm">{cat.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{cat.count} eventos</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-12">Lo que dicen nuestros usuarios</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <Card key={t.name} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — solo entrada gratuita en la app; pagos en web */}
      <section className="py-20 px-4" id="precios">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">Empieza gratis</h2>
          <p className="text-muted-foreground mb-8">
            En la app solo necesitas crear tu cuenta como artista con la prueba gratuita. Los planes de pago están disponibles en nuestra web.
          </p>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="border-primary/30 text-left">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Badge className="gradient-primary text-white border-0"><Crown className="w-3 h-3 mr-1" /> Artistas</Badge>
                </div>
                <h3 className="font-display font-bold text-xl">{freePlan?.name || 'Prueba gratuita'}</h3>
                {freePlan?.description && <p className="text-sm text-muted-foreground">{freePlan.description}</p>}
                <p className="text-3xl font-display font-bold">$0 <span className="text-sm font-normal text-muted-foreground">MXN</span></p>
                <ul className="space-y-2 text-sm">
                  {(freePlan && Array.isArray(freePlan.features) ? freePlan.features : ['Perfil de artista', 'Explorar eventos', 'Prueba de 14 días']).slice(0, 6).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{String(f)}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full gradient-primary text-white border-0" onClick={() => goAuthAs('musician')}>
                  Registrarse como artista <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <a href={MNMUSIC_WEB_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline text-center">
                  Ver planes de pago en mnmusic.mx
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">¿Listo para tu próximo gig?</h2>
          <p className="text-muted-foreground mb-8">Únete a miles de artistas y organizadores que ya usan MN Music.</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Button size="lg" className="gradient-primary text-white border-0 px-8 h-12 rounded-xl" onClick={() => goAuthAs('musician')}>
              Empezar como Artista <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="px-8 h-12 rounded-xl" onClick={() => goAuthAs('organizer')}>
              Empezar como Organizador <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="px-8 h-12 rounded-xl" onClick={() => goAuthAs('user')}>
              Buscar Artistas <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={publicAsset("/logo.png")} alt="MN Music" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-display font-bold">MN Music</span>
            </div>
            <p className="text-sm text-muted-foreground">Conectando talento con oportunidades desde 2024.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground cursor-pointer">Cómo funciona</li>
              <li className="hover:text-foreground cursor-pointer"><a href="#precios">Precios</a></li>
              <li className="hover:text-foreground cursor-pointer">FAQ</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground cursor-pointer">Términos</li>
              <li className="hover:text-foreground cursor-pointer">Privacidad</li>
              <li className="hover:text-foreground cursor-pointer">Cookies</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Contacto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground cursor-pointer">Soporte</li>
              <li className="hover:text-foreground cursor-pointer">Blog</li>
              <li className="hover:text-foreground cursor-pointer">Twitter</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © 2026 MN Music. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
