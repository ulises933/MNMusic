import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Music, CreditCard, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArtists: 0,
    totalOrganizers: 0,
    totalEvents: 0,
    totalApplications: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [profiles, artists, events, apps, subs, transactions] = await Promise.all([
      supabase.from('profiles').select('id, role', { count: 'exact' }),
      supabase.from('artist_profiles').select('id', { count: 'exact' }),
      supabase.from('events').select('id', { count: 'exact' }),
      supabase.from('applications').select('id', { count: 'exact' }),
      supabase.from('user_subscriptions').select('id, status', { count: 'exact' }),
      supabase.from('payment_transactions').select('amount, status').eq('status', 'completed'),
    ]);

    const organizers = (profiles.data || []).filter(p => p.role === 'organizer').length;
    const activeSubs = (subs.data || []).filter(s => s.status === 'active').length;
    const trialUsers = (subs.data || []).filter(s => s.status === 'trial').length;
    const totalRevenue = (transactions.data || []).reduce((sum, t) => sum + Number(t.amount), 0);

    setStats({
      totalUsers: profiles.count || 0,
      totalArtists: artists.count || 0,
      totalOrganizers: organizers,
      totalEvents: events.count || 0,
      totalApplications: apps.count || 0,
      activeSubscriptions: activeSubs,
      trialUsers,
      revenue: totalRevenue,
    });
    setLoading(false);
  };

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}</div></div>;

  const statCards = [
    { label: 'Usuarios Totales', value: stats.totalUsers, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Artistas', value: stats.totalArtists, icon: Music, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Eventos', value: stats.totalEvents, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Aplicaciones', value: stats.totalApplications, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Suscripciones Activas', value: stats.activeSubscriptions, icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'En Prueba Gratuita', value: stats.trialUsers, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Organizadores', value: stats.totalOrganizers, icon: Users, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Ingresos (MXN)', value: `$${stats.revenue.toLocaleString()}`, icon: CreditCard, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">Resumen general de la plataforma MN Music</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-display font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
