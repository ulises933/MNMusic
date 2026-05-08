import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Save, CalendarIcon, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { eventTypeLabels } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const MEXICAN_STATES: Record<string, string[]> = {
  'Aguascalientes': ['Aguascalientes', 'Calvillo', 'Jesús María', 'Rincón de Romos', 'San Francisco de los Romo'],
  'Baja California': ['Tijuana', 'Mexicali', 'Ensenada', 'Rosarito', 'Tecate'],
  'Baja California Sur': ['La Paz', 'Los Cabos', 'Comondú', 'Loreto', 'Mulegé'],
  'Campeche': ['Campeche', 'Ciudad del Carmen', 'Champotón', 'Escárcega', 'Calkiní'],
  'Chiapas': ['Tuxtla Gutiérrez', 'San Cristóbal de las Casas', 'Tapachula', 'Comitán', 'Palenque'],
  'Chihuahua': ['Chihuahua', 'Ciudad Juárez', 'Delicias', 'Cuauhtémoc', 'Parral'],
  'Ciudad de México': ['Álvaro Obregón', 'Azcapotzalco', 'Benito Juárez', 'Coyoacán', 'Cuajimalpa', 'Cuauhtémoc', 'Gustavo A. Madero', 'Iztacalco', 'Iztapalapa', 'Miguel Hidalgo', 'Milpa Alta', 'Tlalpan', 'Tláhuac', 'Venustiano Carranza', 'Xochimilco'],
  'Coahuila': ['Saltillo', 'Torreón', 'Monclova', 'Piedras Negras', 'Acuña'],
  'Colima': ['Colima', 'Manzanillo', 'Tecomán', 'Villa de Álvarez', 'Comala'],
  'Durango': ['Durango', 'Gómez Palacio', 'Lerdo', 'Santiago Papasquiaro', 'Canatlán'],
  'Estado de México': ['Toluca', 'Naucalpan', 'Ecatepec', 'Nezahualcóyotl', 'Tlalnepantla', 'Atizapán', 'Metepec', 'Huixquilucan', 'Texcoco', 'Coacalco'],
  'Guanajuato': ['León', 'Guanajuato', 'Irapuato', 'Celaya', 'Salamanca', 'San Miguel de Allende'],
  'Guerrero': ['Acapulco', 'Chilpancingo', 'Zihuatanejo', 'Iguala', 'Taxco'],
  'Hidalgo': ['Pachuca', 'Tulancingo', 'Tula', 'Huejutla', 'Ixmiquilpan'],
  'Jalisco': ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'Puerto Vallarta', 'Tlajomulco', 'Lagos de Moreno'],
  'Michoacán': ['Morelia', 'Uruapan', 'Lázaro Cárdenas', 'Zamora', 'Pátzcuaro'],
  'Morelos': ['Cuernavaca', 'Cuautla', 'Jiutepec', 'Temixco', 'Yautepec'],
  'Nayarit': ['Tepic', 'Bahía de Banderas', 'Compostela', 'Santiago Ixcuintla', 'Acaponeta'],
  'Nuevo León': ['Monterrey', 'San Pedro Garza García', 'San Nicolás', 'Guadalupe', 'Apodaca', 'Santa Catarina'],
  'Oaxaca': ['Oaxaca de Juárez', 'Salina Cruz', 'Juchitán', 'Tuxtepec', 'Huatulco'],
  'Puebla': ['Puebla', 'Tehuacán', 'San Martín Texmelucan', 'Atlixco', 'Cholula'],
  'Querétaro': ['Querétaro', 'San Juan del Río', 'El Marqués', 'Corregidora', 'Tequisquiapan'],
  'Quintana Roo': ['Cancún', 'Playa del Carmen', 'Chetumal', 'Tulum', 'Cozumel'],
  'San Luis Potosí': ['San Luis Potosí', 'Ciudad Valles', 'Soledad de Graciano Sánchez', 'Matehuala', 'Rioverde'],
  'Sinaloa': ['Culiacán', 'Mazatlán', 'Los Mochis', 'Guasave', 'Navolato'],
  'Sonora': ['Hermosillo', 'Ciudad Obregón', 'Nogales', 'Guaymas', 'San Luis Río Colorado'],
  'Tabasco': ['Villahermosa', 'Cárdenas', 'Comalcalco', 'Paraíso', 'Macuspana'],
  'Tamaulipas': ['Reynosa', 'Tampico', 'Matamoros', 'Nuevo Laredo', 'Ciudad Victoria'],
  'Tlaxcala': ['Tlaxcala', 'Apizaco', 'Huamantla', 'San Pablo del Monte', 'Chiautempan'],
  'Veracruz': ['Veracruz', 'Xalapa', 'Coatzacoalcos', 'Córdoba', 'Orizaba', 'Poza Rica', 'Boca del Río'],
  'Yucatán': ['Mérida', 'Valladolid', 'Progreso', 'Tizimín', 'Umán'],
  'Zacatecas': ['Zacatecas', 'Fresnillo', 'Guadalupe', 'Jerez', 'Río Grande'],
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0');
  return { value: `${h}:00`, label: `${h}:00` };
}).flatMap(h => [
  h,
  { value: h.value.replace(':00', ':30'), label: h.value.replace(':00', ':30') },
]);

export default function CreateEditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    type: 'bar',
    date: '',
    time: '',
    end_time: '',
    state: '',
    city: '',
    venue: '',
    street: '',
    ext_number: '',
    int_number: '',
    neighborhood: '',
    zip_code: '',
    description: '',
    payment: '',
    payment_max: '',
    musicians_needed: '1',
    duration: '',
    dress_code: '',
    sound_provided: false,
  });

  const [dateValue, setDateValue] = useState<Date | undefined>();

  useEffect(() => {
    if (id) loadEvent();
  }, [id]);

  const loadEvent = async () => {
    const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    if (data) {
      // Try to parse venue back into address parts
      setForm({
        title: data.title || '',
        type: data.type || 'bar',
        date: data.date || '',
        time: data.time || '',
        end_time: data.end_time || '',
        state: '',
        city: data.city || '',
        venue: data.venue || '',
        street: '',
        ext_number: '',
        int_number: '',
        neighborhood: '',
        zip_code: '',
        description: data.description || '',
        payment: data.payment?.toString() || '',
        payment_max: data.payment_max?.toString() || '',
        musicians_needed: data.musicians_needed?.toString() || '1',
        duration: data.duration || '',
        dress_code: data.dress_code || '',
        sound_provided: data.sound_provided || false,
      });
      if (data.date) {
        setDateValue(new Date(data.date + 'T12:00:00'));
      }
    }
  };

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const citiesForState = useMemo(() => {
    return form.state ? (MEXICAN_STATES[form.state] || []) : [];
  }, [form.state]);

  const filteredStates = useMemo(() => {
    if (!stateSearch) return Object.keys(MEXICAN_STATES);
    return Object.keys(MEXICAN_STATES).filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));
  }, [stateSearch]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return citiesForState;
    return citiesForState.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
  }, [citySearch, citiesForState]);

  const backPath = role === 'organizer' ? '/o/events' : '/u/dashboard';

  const buildFullAddress = () => {
    const parts = [form.street];
    if (form.ext_number) parts.push(`#${form.ext_number}`);
    if (form.int_number) parts.push(`Int. ${form.int_number}`);
    if (form.neighborhood) parts.push(`Col. ${form.neighborhood}`);
    if (form.zip_code) parts.push(`C.P. ${form.zip_code}`);
    if (form.venue) parts.push(form.venue);
    return parts.filter(Boolean).join(', ');
  };

  const handlePublish = async () => {
    if (!user) return;
    if (!form.title || !form.date || !form.time || !form.city) {
      toast({ title: 'Faltan datos', description: 'Completa título, fecha, hora y ciudad.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);

    const fullVenue = buildFullAddress();

    const eventData = {
      organizer_id: user.id,
      title: form.title,
      type: form.type as "bar" | "corporate" | "festival" | "private" | "restaurant" | "wedding",
      date: form.date,
      time: form.time,
      end_time: form.end_time || null,
      city: form.city,
      venue: fullVenue || form.venue,
      description: form.description,
      payment: parseFloat(form.payment) || 0,
      payment_max: form.payment_max ? parseFloat(form.payment_max) : null,
      musicians_needed: parseInt(form.musicians_needed) || 1,
      duration: form.duration,
      dress_code: form.dress_code,
      sound_provided: form.sound_provided,
      status: 'published' as const,
    };

    let error;
    if (id) {
      ({ error } = await supabase.from('events').update(eventData).eq('id', id));
    } else {
      ({ error } = await supabase.from('events').insert(eventData));
    }

    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: id ? 'Evento actualizado' : 'Evento publicado', description: 'Los artistas ya pueden verlo.' });
      navigate(backPath);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold">{id ? 'Editar Evento' : 'Crear Evento'}</h1>
          <p className="text-muted-foreground text-sm">Completa los datos del evento</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">Datos Básicos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título del evento</Label>
            <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Ej: Boda García - Recepción" />
          </div>
          <div>
            <Label>Tipo de evento</Label>
            <Select value={form.type} onValueChange={v => update('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(eventTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Date picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Fecha del evento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateValue && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValue ? format(dateValue, "PPP", { locale: es }) : "Selecciona fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={(d) => {
                      setDateValue(d);
                      if (d) update('date', format(d, 'yyyy-MM-dd'));
                    }}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Hora de inicio</Label>
              <Select value={form.time} onValueChange={v => update('time', v)}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecciona hora" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Hora de fin (opcional)</Label>
              <Select value={form.end_time || 'none'} onValueChange={v => update('end_time', v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecciona hora" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Sin definir</SelectItem>
                  {HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div><Label>Descripción</Label><Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="Describe el evento, ambiente, requisitos especiales..." /></div>
        </CardContent>
      </Card>

      {/* Address Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Dirección del Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Estado</Label>
              <Popover open={stateOpen} onOpenChange={setStateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    {form.state || 'Selecciona estado'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar estado..." value={stateSearch} onValueChange={setStateSearch} />
                    <CommandList>
                      <CommandEmpty>No encontrado</CommandEmpty>
                      <CommandGroup>
                        {filteredStates.map(s => (
                          <CommandItem key={s} onSelect={() => { update('state', s); update('city', ''); setStateOpen(false); setStateSearch(''); }}>
                            {s}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Ciudad / Municipio</Label>
              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal" disabled={!form.state}>
                    {form.city || 'Selecciona ciudad'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar ciudad..." value={citySearch} onValueChange={setCitySearch} />
                    <CommandList>
                      <CommandEmpty>No encontrada</CommandEmpty>
                      <CommandGroup>
                        {filteredCities.map(c => (
                          <CommandItem key={c} onSelect={() => { update('city', c); setCityOpen(false); setCitySearch(''); }}>
                            {c}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Nombre del venue / lugar</Label>
            <Input value={form.venue} onChange={e => update('venue', e.target.value)} placeholder="Ej: Salón de Eventos Los Arcos" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Label>Calle</Label>
              <Input value={form.street} onChange={e => update('street', e.target.value)} placeholder="Ej: Av. Reforma" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>No. Ext.</Label>
                <Input value={form.ext_number} onChange={e => update('ext_number', e.target.value)} placeholder="123" />
              </div>
              <div>
                <Label>No. Int.</Label>
                <Input value={form.int_number} onChange={e => update('int_number', e.target.value)} placeholder="4B" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Colonia</Label>
              <Input value={form.neighborhood} onChange={e => update('neighborhood', e.target.value)} placeholder="Ej: Centro" />
            </div>
            <div>
              <Label>Código Postal</Label>
              <Input value={form.zip_code} onChange={e => update('zip_code', e.target.value)} placeholder="01000" maxLength={5} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">Presupuesto</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Pago mínimo ($ MXN)</Label><Input type="number" value={form.payment} onChange={e => update('payment', e.target.value)} /></div>
            <div><Label>Pago máximo ($ MXN) — opcional</Label><Input type="number" value={form.payment_max} onChange={e => update('payment_max', e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">Requisitos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Artistas necesarios</Label><Input type="number" value={form.musicians_needed} onChange={e => update('musicians_needed', e.target.value)} /></div>
            <div><Label>Duración</Label><Input value={form.duration} onChange={e => update('duration', e.target.value)} placeholder="Ej: 3h" /></div>
          </div>
          <div><Label>Dress code</Label><Input value={form.dress_code} onChange={e => update('dress_code', e.target.value)} /></div>
          <div className="flex items-center gap-3">
            <Switch checked={form.sound_provided} onCheckedChange={v => update('sound_provided', v)} />
            <Label>¿Se proporciona equipo de sonido?</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => navigate(backPath)}>Cancelar</Button>
        <Button className="gradient-primary text-white border-0" onClick={handlePublish} disabled={submitting}>
          <Save className="w-4 h-4 mr-2" /> {submitting ? 'Guardando...' : id ? 'Guardar Cambios' : 'Publicar Evento'}
        </Button>
      </div>
    </div>
  );
}
