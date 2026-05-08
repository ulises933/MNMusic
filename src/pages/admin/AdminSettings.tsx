import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Cog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('platform_settings').select('*');
    if (data) {
      const map: Record<string, any> = {};
      data.forEach(s => { map[s.key] = s.value; });
      setSettings(map);
    }
    setLoading(false);
  };

  const updateSetting = async (key: string, value: any) => {
    const { error } = await supabase.from('platform_settings').update({ value: JSON.parse(JSON.stringify(value)) }).eq('key', key);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
      toast({ title: 'Configuración actualizada' });
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Configuración de Plataforma</h1>
        <p className="text-muted-foreground mt-1">Ajustes generales del sistema MN MusicMusic</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display flex items-center gap-2"><Cog className="w-5 h-5" /> General</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Días de prueba gratuita</p>
              <p className="text-xs text-muted-foreground">Duración de la prueba para nuevos usuarios</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-20"
                value={settings.trial_duration_days ?? 14}
                onChange={e => setSettings(prev => ({ ...prev, trial_duration_days: parseInt(e.target.value) || 14 }))}
              />
              <Button size="sm" variant="outline" onClick={() => updateSetting('trial_duration_days', parseInt(settings.trial_duration_days) || 14)}>
                <Save className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Comisión de plataforma (%)</p>
              <p className="text-xs text-muted-foreground">Porcentaje que cMN Musica s21 por cada transacción</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-20"
                value={settings.platform_commission ?? 10}
                onChange={e => setSettings(prev => ({ ...prev, platform_commission: parseInt(e.target.value) || 10 }))}
              />
              <Button size="sm" variant="outline" onClick={() => updateSetting('platform_commission', parseInt(settings.platform_commission) || 10)}>
                <Save className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">OpenPay habilitado</p>
              <p className="text-xs text-muted-foreground">Activa para procesar pagos reales con OpenPay</p>
            </div>
            <Switch
              checked={settings.openpay_enabled === true || settings.openpay_enabled === 'true'}
              onCheckedChange={v => updateSetting('openpay_enabled', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Modo mantenimiento</p>
              <p className="text-xs text-muted-foreground">Desactiva el acceso público a la plataforma</p>
            </div>
            <Switch
              checked={settings.maintenance_mode === true || settings.maintenance_mode === 'true'}
              onCheckedChange={v => updateSetting('maintenance_mode', v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
