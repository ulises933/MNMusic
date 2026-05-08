import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MapPin, Music, Edit, ExternalLink, Phone, Globe, GraduationCap, Briefcase, Wrench, Camera, Plus, Trash2, Facebook, Instagram, Youtube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { allGenres, allInstruments } from '@/lib/types';

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.21 8.21 0 0 0 4.8 1.53V6.79a4.85 4.85 0 0 1-1.04-.1z"/>
  </svg>
);

const socialPlatforms = [
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/...' },
  { key: 'tiktok', label: 'TikTok', icon: null, placeholder: 'https://tiktok.com/@...' },
];

export default function MusicianProfile() {
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Portfolio management
  const [addPortfolioOpen, setAddPortfolioOpen] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({ title: '', type: 'link', url: '' });
  const [savingPortfolio, setSavingPortfolio] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [apRes, revRes, portRes] = await Promise.all([
      supabase.from('artist_profiles').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('reviews').select('*').eq('artist_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('portfolio_items').select('*').eq('artist_id', user!.id),
    ]);
    setArtistProfile(apRes.data);
    setReviews(revRes.data || []);
    setPortfolio(portRes.data || []);
    if (apRes.data) {
      const sm = apRes.data.social_media || [];
      const socialMap: Record<string, string> = {};
      if (Array.isArray(sm)) {
        sm.forEach((s: any) => { if (s.platform && s.url) socialMap[s.platform] = s.url; });
      }
      setForm({
        artist_name: apRes.data.artist_name || '',
        bio: profile?.bio || '',
        city: profile?.city || '',
        phone: profile?.phone || '',
        base_rate: apRes.data.base_rate || 0,
        rate_type: apRes.data.rate_type || 'per_event',
        experience: apRes.data.experience || '',
        education: apRes.data.education || '',
        availability: apRes.data.availability || '',
        travel_radius: apRes.data.travel_radius || '',
        website: apRes.data.website || '',
        genres: apRes.data.genres || [],
        instruments: apRes.data.instruments || [],
        languages: (apRes.data.languages || []).join(', '),
        equipment: (apRes.data.equipment || []).join('\n'),
        social_facebook: socialMap.facebook || '',
        social_instagram: socialMap.instagram || '',
        social_youtube: socialMap.youtube || '',
        social_tiktok: socialMap.tiktok || '',
      });
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Error al subir imagen', description: uploadError.message, variant: 'destructive' });
      setUploadingAvatar(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
    await refreshProfile();
    setUploadingAvatar(false);
    toast({ title: 'Foto actualizada' });
  };

  const handleSave = async () => {
    if (!user) return;
    await supabase.from('profiles').update({
      bio: form.bio,
      city: form.city,
      phone: form.phone,
    }).eq('user_id', user.id);

    const socialMedia = socialPlatforms
      .map(p => ({ platform: p.key, url: form[`social_${p.key}`] || '' }))
      .filter(s => s.url);

    const artistData = {
      user_id: user.id,
      artist_name: form.artist_name,
      base_rate: parseFloat(form.base_rate) || 0,
      rate_type: form.rate_type || 'per_event',
      experience: form.experience,
      education: form.education,
      availability: form.availability,
      travel_radius: form.travel_radius,
      website: form.website,
      genres: form.genres,
      instruments: form.instruments,
      languages: form.languages.split(',').map((l: string) => l.trim()).filter(Boolean),
      equipment: form.equipment.split('\n').map((e: string) => e.trim()).filter(Boolean),
      social_media: socialMedia,
    };

    if (artistProfile) {
      await supabase.from('artist_profiles').update(artistData).eq('user_id', user.id);
    } else {
      await supabase.from('artist_profiles').insert(artistData);
    }

    await refreshProfile();
    setEditing(false);
    toast({ title: 'Perfil actualizado' });
    fetchData();
  };

  const handleAddPortfolio = async () => {
    if (!user || !portfolioForm.title || !portfolioForm.url) return;
    setSavingPortfolio(true);
    const { error } = await supabase.from('portfolio_items').insert({
      artist_id: user.id,
      title: portfolioForm.title,
      type: portfolioForm.type,
      url: portfolioForm.url,
    });
    setSavingPortfolio(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Elemento agregado al portafolio' });
      setAddPortfolioOpen(false);
      setPortfolioForm({ title: '', type: 'link', url: '' });
      fetchData();
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    await supabase.from('portfolio_items').delete().eq('id', id);
    toast({ title: 'Elemento eliminado' });
    fetchData();
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>;

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const rateLabel = artistProfile?.rate_type === 'per_hour' ? '/hr' : '/evento';

  const socialLinks = Array.isArray(artistProfile?.social_media) ? artistProfile.social_media : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Mi Perfil</h1>
        <Button onClick={() => setEditing(true)} variant="outline">
          <Edit className="w-4 h-4 mr-2" /> Editar
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-6">
          <div className="relative group">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl">{(artistProfile?.artist_name || profile?.display_name || '?')[0]}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              disabled={uploadingAvatar}
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold">{artistProfile?.artist_name || profile?.display_name}</h2>
            <p className="text-muted-foreground text-sm">{profile?.display_name}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              {profile?.city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.city}</span>}
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-primary text-primary" /> {avgRating} ({reviews.length} reseñas)</span>
            </div>
            <p className="mt-3 text-sm">{profile?.bio || 'Sin bio aún'}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {(artistProfile?.genres || []).map((g: string) => <Badge key={g} className="bg-primary/10 text-primary border-0">{g}</Badge>)}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              {profile?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {profile.phone}</span>}
              {artistProfile?.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {artistProfile.website}</span>}
            </div>
            {/* Social Media Icons */}
            {socialLinks.length > 0 && (
              <div className="flex gap-3 mt-3">
                {socialLinks.map((s: any) => {
                  const platform = socialPlatforms.find(p => p.key === s.platform);
                  if (!platform || !s.url) return null;
                  return (
                    <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      {s.platform === 'tiktok' ? <TikTokIcon /> : platform.icon && <platform.icon className="w-5 h-5" />}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tarifa base</p>
            <p className="text-2xl font-display font-bold text-primary">${artistProfile?.base_rate || 0} MXN</p>
            <p className="text-xs text-muted-foreground">{rateLabel}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="portfolio">Portafolio</TabsTrigger>
          <TabsTrigger value="equipment">Equipo</TabsTrigger>
          <TabsTrigger value="reviews">Reseñas</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg font-display flex items-center gap-2"><Music className="w-5 h-5" /> Instrumentos</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(artistProfile?.instruments || []).map((i: string) => (
                  <Badge key={i} variant="outline" className="px-3 py-1"><Music className="w-3 h-3 mr-1" /> {i}</Badge>
                ))}
                {(!artistProfile?.instruments || artistProfile.instruments.length === 0) && <p className="text-sm text-muted-foreground">No has agregado instrumentos aún</p>}
              </div>
            </CardContent>
          </Card>
          <div className="grid sm:grid-cols-2 gap-4">
            {artistProfile?.experience && (
              <Card>
                <CardHeader><CardTitle className="text-lg font-display flex items-center gap-2"><Briefcase className="w-5 h-5" /> Experiencia</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{artistProfile.experience}</p></CardContent>
              </Card>
            )}
            {artistProfile?.education && (
              <Card>
                <CardHeader><CardTitle className="text-lg font-display flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Formación</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{artistProfile.education}</p></CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-display">Portafolio</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setAddPortfolioOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {portfolio.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No hay elementos en el portafolio aún</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setAddPortfolioOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Agregar primer elemento
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {portfolio.map(p => (
                    <Card key={p.id} className="hover:shadow-md transition-shadow group">
                      <CardContent className="p-4 flex items-center justify-between">
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <p className="font-semibold text-sm">{p.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{p.type === 'video' ? '🎬 Video' : '🔗 Enlace'}</p>
                        </a>
                        <div className="flex items-center gap-1">
                          <a href={p.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </a>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeletePortfolio(p.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg font-display flex items-center gap-2"><Wrench className="w-5 h-5" /> Mi Equipo</CardTitle></CardHeader>
            <CardContent>
              {(artistProfile?.equipment || []).length > 0 ? (
                <div className="space-y-2">
                  {artistProfile.equipment.map((e: string) => (
                    <div key={e} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">{e}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No has agregado equipo aún</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Reseñas ({reviews.length})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Aún no tienes reseñas</p>
                </div>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-primary text-primary' : 'text-muted'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre artístico</Label><Input value={form.artist_name || ''} onChange={e => setForm({ ...form, artist_name: e.target.value })} /></div>
            <div><Label>Bio</Label><Textarea value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ciudad</Label><Input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tarifa base ($ MXN)</Label><Input type="number" value={form.base_rate || ''} onChange={e => setForm({ ...form, base_rate: e.target.value })} /></div>
              <div>
                <Label>Tipo de tarifa</Label>
                <Select value={form.rate_type || 'per_event'} onValueChange={v => setForm({ ...form, rate_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_event">Por evento</SelectItem>
                    <SelectItem value="per_hour">Por hora</SelectItem>
                    <SelectItem value="negotiable">Negociable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Sitio web</Label><Input value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
            
            {/* Social Media */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Redes Sociales</Label>
              {socialPlatforms.map(p => (
                <div key={p.key} className="flex items-center gap-2">
                  <div className="w-8 flex justify-center">
                    {p.key === 'tiktok' ? <TikTokIcon /> : p.icon && <p.icon className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <Input
                    placeholder={p.placeholder}
                    value={form[`social_${p.key}`] || ''}
                    onChange={e => setForm({ ...form, [`social_${p.key}`]: e.target.value })}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>

            <div><Label>Experiencia</Label><Textarea value={form.experience || ''} onChange={e => setForm({ ...form, experience: e.target.value })} rows={2} /></div>
            <div><Label>Formación</Label><Input value={form.education || ''} onChange={e => setForm({ ...form, education: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Disponibilidad</Label><Input value={form.availability || ''} onChange={e => setForm({ ...form, availability: e.target.value })} /></div>
              <div><Label>Radio de viaje</Label><Input value={form.travel_radius || ''} onChange={e => setForm({ ...form, travel_radius: e.target.value })} /></div>
            </div>
            <div><Label>Idiomas (separados por coma)</Label><Input value={form.languages || ''} onChange={e => setForm({ ...form, languages: e.target.value })} /></div>
            <div><Label>Equipo (uno por línea)</Label><Textarea value={form.equipment || ''} onChange={e => setForm({ ...form, equipment: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button className="gradient-primary text-white border-0" onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Portfolio Modal */}
      <Dialog open={addPortfolioOpen} onOpenChange={setAddPortfolioOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Agregar al Portafolio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={portfolioForm.title} onChange={e => setPortfolioForm({ ...portfolioForm, title: e.target.value })} placeholder="Ej: Demo en vivo" /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={portfolioForm.type} onValueChange={v => setPortfolioForm({ ...portfolioForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Enlace</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>URL</Label><Input value={portfolioForm.url} onChange={e => setPortfolioForm({ ...portfolioForm, url: e.target.value })} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPortfolioOpen(false)}>Cancelar</Button>
            <Button className="gradient-primary text-white border-0" onClick={handleAddPortfolio} disabled={savingPortfolio || !portfolioForm.title || !portfolioForm.url}>
              {savingPortfolio ? 'Guardando...' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
