import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon, Bell, Globe, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-display font-bold">Ajustes</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />} Apariencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Modo oscuro</Label>
              <p className="text-sm text-muted-foreground">Cambia entre tema claro y oscuro</p>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Bell className="w-5 h-5" /> Notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Nuevas aplicaciones', desc: 'Cuando un artista aplica a tu evento', default: true },
            { label: 'Mensajes', desc: 'Cuando recibes un nuevo mensaje', default: true },
            { label: 'Recordatorios de eventos', desc: '24h antes de cada evento', default: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.default} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Globe className="w-5 h-5" /> Idioma</CardTitle>
        </CardHeader>
        <CardContent>
          <Select defaultValue="es">
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Shield className="w-5 h-5" /> Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
