import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Star, MapPin, Music, Filter, Send, Eye, Globe, Phone, Briefcase, GraduationCap, Wrench, ExternalLink, Facebook, Instagram, Youtube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { allGenres, type DbEvent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.21 8.21 0 0 0 4.8 1.53V6.79a4.85 4.85 0 0 1-1.04-.1z"/>
  </svg>
);

const socialIcons: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: null,
};

interface ArtistWithProfile {
  id: string;
  user_id: string;
  artist_name: string;
  base_rate: number;
  rate_type: string;
  genres: string[];
  instruments: string[];
  experience: string | null;
  education: string | null;
  languages: string[];
  availability: string | null;
  travel_radius: string | null;
  equipment: string[];
  website: string | null;
  social_media: any;
  profile: {
    display_name: string;
    avatar_url: string | null;
    city: string | null;
    phone: string | null;
    bio: string | null;
  } | null;
  reviews: { rating: number; comment: string; created_at: string }[];
  portfolio: { id: string; title: string; type: string; url: string }[];
}

function ReviewForm({ artistId, onReviewAdded }: { artistId: string; onReviewAdded: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      artist_id: artistId,
      reviewer_id: user.id,
      rating,
      comment: comment || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.code === '23505' ? 'Ya dejaste una reseña para este artista' : error.message, variant: 'destructive' });
    } else {
      toast({ title: '⭐ Reseña enviada' });
      setRating(0);
      setComment('');
      onReviewAdded();
    }
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold">Escribe una reseña</p>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(s => (
            <button
              key={s}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(s)}
              className="transition-transform hover:scale-110"
            >
              <Star className={`w-6 h-6 ${s <= (hoverRating || rating) ? 'fill-primary text-primary' : 'text-muted'}`} />
            </button>
          ))}
          {rating > 0 && <span className="text-sm text-muted-foreground ml-2">{rating}/5</span>}
        </div>
        <Textarea placeholder="Comparte tu experiencia..." value={comment} onChange={e => setComment(e.target.value)} rows={3} />
        <Button size="sm" className="gradient-primary text-white border-0" onClick={submit} disabled={rating === 0 || submitting}>
          {submitting ? 'Enviando...' : 'Enviar reseña'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BrowseArtists() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [artists, setArtists] = useState<ArtistWithProfile[]>([]);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState<string>('all');
  const [city, setCity] = useState<string>('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      // Fetch artist profiles with error handling
      const { data: artistData, error: artistError } = await supabase
        .from('artist_profiles')
        .select('*');
      
      if (artistError) {
        console.error('Error fetching artists:', artistError);
        toast({ title: 'Error', description: 'Error al cargar artistas: ' + artistError.message, variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { data: eventsData } = await supabase.from('events').select('*').eq('status', 'published');
      setEvents((eventsData as DbEvent[]) || []);

      if (artistData && artistData.length > 0) {
        const enriched: ArtistWithProfile[] = [];
        for (const a of artistData) {
          const [profRes, revRes, portRes] = await Promise.all([
            supabase.from('profiles').select('display_name, avatar_url, city, phone, bio').eq('user_id', a.user_id).maybeSingle(),
            supabase.from('reviews').select('rating, comment, created_at').eq('artist_id', a.user_id),
            supabase.from('portfolio_items').select('id, title, type, url').eq('artist_id', a.user_id),
          ]);
          
          // Include artist even if profile is missing (they might not have completed profile setup)
          enriched.push({
            ...a,
            rate_type: (a as any).rate_type || 'per_event',
            genres: Array.isArray(a.genres) ? a.genres : [],
            instruments: Array.isArray(a.instruments) ? a.instruments : [],
            languages: Array.isArray(a.languages) ? a.languages : [],
            equipment: Array.isArray(a.equipment) ? a.equipment : [],
            profile: profRes.data,
            reviews: revRes.data || [],
            portfolio: portRes.data || [],
          });
        }
        setArtists(enriched);
        console.log(`Loaded ${enriched.length} artists`);
      } else {
        console.log('No artist profiles found in database');
        setArtists([]);
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
      toast({ title: 'Error', description: 'Error al cargar datos', variant: 'destructive' });
    }
    setLoading(false);
  };

  const allCities = [...new Set(artists.map(m => m.profile?.city).filter(Boolean) as string[])];

  const filtered = artists.filter(m => {
    // Search filter - more lenient, matches if search is empty or if any field matches
    const matchSearch = !search.trim() || 
      m.artist_name?.toLowerCase().includes(search.toLowerCase()) ||
      (m.profile?.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(m.instruments) && m.instruments.some(i => i?.toLowerCase().includes(search.toLowerCase())));
    
    // Genre filter - only apply if not 'all' and artist has that genre
    const matchGenre = genre === 'all' || 
      (Array.isArray(m.genres) && m.genres.length > 0 && m.genres.includes(genre));
    
    // City filter - only apply if not 'all'
    const matchCity = city === 'all' || m.profile?.city === city;
    
    return matchSearch && matchGenre && matchCity;
  });

  const openInvite = (m: ArtistWithProfile) => { setSelectedArtist(m); setInviteMessage(''); setSelectedEvent(''); setInviteOpen(true); };
  const openDetail = (m: ArtistWithProfile) => { setSelectedArtist(m); setDetailOpen(true); };

  const getRateLabel = (type: string) => type === 'per_hour' ? '/hr' : type === 'negotiable' ? '' : '/evento';

  const sendInvite = async () => {
    if (!selectedArtist || !user || !selectedEvent) return;
    setSubmitting(true);
    
    // Get event details
    const { data: eventData } = await supabase.from('events').select('*').eq('id', selectedEvent).maybeSingle();
    if (!eventData) {
      toast({ title: 'Error', description: 'Evento no encontrado', variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Create invitation
    const { data: invitation, error: invError } = await supabase.from('invitations').insert({
      event_id: selectedEvent,
      artist_id: selectedArtist.user_id,
      sender_id: user.id,
      message: inviteMessage,
    }).select().single();

    if (invError) {
      setSubmitting(false);
      toast({ title: 'Error', description: invError.code === '23505' ? 'Ya has invitado a este artista a este evento' : invError.message, variant: 'destructive' });
      return;
    }

    // Create or get conversation between sender and artist
    let conversationId: string | null = null;
    
    // Check if conversation already exists between these two users
    const { data: senderConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
    
    if (senderConvs) {
      for (const senderConv of senderConvs) {
        // Check if the artist is also in this conversation
        const { data: artistInConv } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', senderConv.conversation_id)
          .eq('user_id', selectedArtist.user_id)
          .maybeSingle();
        
        if (artistInConv) {
          conversationId = senderConv.conversation_id;
          // Update conversation with invitation_id if not already set
          await supabase
            .from('conversations')
            .update({ invitation_id: invitation.id })
            .eq('id', conversationId)
            .is('invitation_id', null);
          break;
        }
      }
    }

    // Create new conversation if doesn't exist
    if (!conversationId) {
      // Generate conversation ID first
      const newConvId = crypto.randomUUID();
      
      // Create new conversation without select to avoid RLS issues
      const { error: convError } = await supabase
        .from('conversations')
        .insert({ id: newConvId, invitation_id: invitation.id });
      
      if (convError) {
        setSubmitting(false);
        toast({ title: 'Error', description: 'Error al crear conversación: ' + convError.message, variant: 'destructive' });
        return;
      }

      conversationId = newConvId;

      // Add participants (use upsert to avoid duplicates)
      const { error: part1Error } = await supabase
        .from('conversation_participants')
        .upsert({ conversation_id: conversationId, user_id: user.id }, { onConflict: 'conversation_id,user_id' });
      
      const { error: part2Error } = await supabase
        .from('conversation_participants')
        .upsert({ conversation_id: conversationId, user_id: selectedArtist.user_id }, { onConflict: 'conversation_id,user_id' });

      if (part1Error || part2Error) {
        console.error('Error adding participants:', part1Error || part2Error);
      }
    }

    // Create initial message with event details
    const eventInfo = `🎵 Invitación a Evento: ${eventData.title}

📅 Fecha: ${eventData.date}
🕐 Hora: ${eventData.time}${eventData.end_time ? ` - ${eventData.end_time}` : ''}
📍 Ubicación: ${eventData.venue}, ${eventData.city}
💰 Pago: $${eventData.payment}${eventData.payment_max ? ` - $${eventData.payment_max}` : ''} MXN

${eventData.description ? `Descripción:\n${eventData.description}\n\n` : ''}${inviteMessage ? `Mensaje del organizador:\n${inviteMessage}` : ''}`;

    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      text: eventInfo,
    });

    if (msgError) {
      console.error('Error creating initial message:', msgError);
    }

    setSubmitting(false);
    setInviteOpen(false);
    toast({ 
      title: '✅ Invitación enviada', 
      description: `Se ha enviado una invitación a ${selectedArtist.artist_name} y se ha iniciado una conversación.` 
    });
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-60" />)}</div></div>;
  }

  const socialLinks = (artist: ArtistWithProfile) => {
    const sm = Array.isArray(artist.social_media) ? artist.social_media : [];
    return sm.filter((s: any) => s.url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Buscar Artistas</h1>
        <p className="text-muted-foreground mt-1">Encuentra el artista perfecto para tu evento</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, instrumento..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="w-full sm:w-40"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Género" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los géneros</SelectItem>
            {allGenres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-full sm:w-40"><MapPin className="w-4 h-4 mr-2" /><SelectValue placeholder="Ciudad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ciudades</SelectItem>
            {allCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} artistas encontrados</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No se encontraron artistas</p>
          <p className="text-sm">Intenta ajustar los filtros</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(m => {
            const avgRating = m.reviews.length > 0 ? (m.reviews.reduce((sum, r) => sum + r.rating, 0) / m.reviews.length).toFixed(1) : null;
            return (
              <Card key={m.id} className="hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={m.profile?.avatar_url || ''} />
                      <AvatarFallback>{(m.artist_name || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-base truncate">{m.artist_name}</h3>
                      <p className="text-xs text-muted-foreground">{m.profile?.display_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {m.profile?.city || '—'}</span>
                        {avgRating && (
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-primary text-primary" /> {avgRating}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-display font-bold text-primary">${m.base_rate}</p>
                      <p className="text-[10px] text-muted-foreground">{getRateLabel(m.rate_type)}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{m.profile?.bio || 'Sin descripción'}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {m.genres.slice(0, 3).map(g => <Badge key={g} variant="outline" className="text-[10px] px-2 py-0">{g}</Badge>)}
                    {m.instruments.slice(0, 2).map(i => <Badge key={i} className="bg-primary/10 text-primary border-0 text-[10px] px-2 py-0"><Music className="w-2.5 h-2.5 mr-0.5" />{i}</Badge>)}
                  </div>

                  {/* Social icons row */}
                  {socialLinks(m).length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {socialLinks(m).map((s: any) => {
                        const Icon = socialIcons[s.platform];
                        return (
                          <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                            {s.platform === 'tiktok' ? <TikTokIcon /> : Icon && <Icon className="w-4 h-4" />}
                          </a>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openDetail(m)}>
                      <Eye className="w-3 h-3 mr-1" /> Ver perfil
                    </Button>
                    <Button size="sm" className="flex-1 gradient-primary text-white border-0 text-xs" onClick={() => openInvite(m)}>
                      <Send className="w-3 h-3 mr-1" /> Invitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal — Enhanced */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedArtist && (() => {
            const a = selectedArtist;
            const avgRating = a.reviews.length > 0 ? (a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length).toFixed(1) : '—';
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">{a.artist_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start gap-5">
                    <Avatar className="w-24 h-24 ring-4 ring-primary/10">
                      <AvatarImage src={a.profile?.avatar_url || ''} />
                      <AvatarFallback className="text-3xl">{(a.artist_name || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{a.profile?.display_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {a.profile?.city || '—'}</span>
                        <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-primary text-primary" /> {avgRating} ({a.reviews.length})</span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed">{a.profile?.bio || 'Sin bio'}</p>

                      {/* Social + Contact */}
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        {a.profile?.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3.5 h-3.5" />{a.profile.phone}</span>}
                        {a.website && <a href={a.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><Globe className="w-3.5 h-3.5" />{a.website}</a>}
                      </div>
                      {socialLinks(a).length > 0 && (
                        <div className="flex gap-3 mt-2">
                          {socialLinks(a).map((s: any) => {
                            const Icon = socialIcons[s.platform];
                            return (
                              <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                {s.platform === 'tiktok' ? <TikTokIcon /> : Icon && <Icon className="w-5 h-5" />}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-display font-bold text-primary">${a.base_rate} MXN</p>
                      <p className="text-xs text-muted-foreground">{getRateLabel(a.rate_type)}</p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="info">Info</TabsTrigger>
                      <TabsTrigger value="portfolio">Portafolio ({a.portfolio.length})</TabsTrigger>
                      <TabsTrigger value="equipment">Equipo</TabsTrigger>
                      <TabsTrigger value="reviews">Reseñas ({a.reviews.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="mt-4 space-y-4">
                      {/* Genres & Instruments */}
                      <div>
                        <p className="font-semibold text-sm mb-2">Géneros e Instrumentos</p>
                        <div className="flex flex-wrap gap-1.5">
                          {a.genres.map(g => <Badge key={g} className="bg-primary/10 text-primary border-0 text-xs">{g}</Badge>)}
                          {a.instruments.map(i => <Badge key={i} variant="outline" className="text-xs"><Music className="w-3 h-3 mr-1" />{i}</Badge>)}
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {a.experience && (
                          <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1 text-sm font-semibold"><Briefcase className="w-4 h-4" /> Experiencia</div><p className="text-xs text-muted-foreground">{a.experience}</p></CardContent></Card>
                        )}
                        {a.education && (
                          <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1 text-sm font-semibold"><GraduationCap className="w-4 h-4" /> Formación</div><p className="text-xs text-muted-foreground">{a.education}</p></CardContent></Card>
                        )}
                        {a.availability && (
                          <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1 text-sm font-semibold">📅 Disponibilidad</div><p className="text-xs text-muted-foreground">{a.availability}</p></CardContent></Card>
                        )}
                        {a.travel_radius && (
                          <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1 text-sm font-semibold">🗺️ Radio de viaje</div><p className="text-xs text-muted-foreground">{a.travel_radius}</p></CardContent></Card>
                        )}
                      </div>
                      {a.languages && a.languages.length > 0 && (
                        <div>
                          <p className="font-semibold text-sm mb-1">Idiomas</p>
                          <div className="flex gap-1.5">{a.languages.map(l => <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>)}</div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="portfolio" className="mt-4">
                      {a.portfolio.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground"><Music className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">Sin portafolio aún</p></div>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {a.portfolio.map(p => (
                            <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="block">
                              <Card className="hover:shadow-md transition-shadow group/port">
                                <CardContent className="p-4 flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold text-sm">{p.title}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{p.type === 'video' ? '🎬 Video' : p.type === 'audio' ? '🎵 Audio' : '🔗 Enlace'}</p>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover/port:text-primary transition-colors" />
                                </CardContent>
                              </Card>
                            </a>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="equipment" className="mt-4">
                      {(a.equipment || []).length > 0 ? (
                        <div className="space-y-2">
                          {a.equipment.map((e, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <Wrench className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{e}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground"><Wrench className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">Sin equipo listado</p></div>
                      )}
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-4 space-y-4">
                      {/* Write review form */}
                      {user && user.id !== a.user_id && (
                        <ReviewForm artistId={a.user_id} onReviewAdded={() => { fetchData(); setDetailOpen(false); }} />
                      )}
                      {a.reviews.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground"><Star className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">Sin reseñas aún</p></div>
                      ) : (
                        <div className="space-y-3">
                          {a.reviews.map((r, i) => (
                            <div key={i} className="border-b border-border pb-3 last:border-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex">{[...Array(5)].map((_, j) => <Star key={j} className={`w-3 h-3 ${j < r.rating ? 'fill-primary text-primary' : 'text-muted'}`} />)}</div>
                                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{r.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
                  <Button className="gradient-primary text-white border-0" onClick={() => { setDetailOpen(false); openInvite(a); }}>
                    <Send className="w-4 h-4 mr-2" /> Invitar a evento
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Invitar a {selectedArtist?.artist_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecciona un evento</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger><SelectValue placeholder="Elige un evento" /></SelectTrigger>
                <SelectContent>
                  {events.map(e => <SelectItem key={e.id} value={e.id}>{e.title} — {e.date}</SelectItem>)}
                </SelectContent>
              </Select>
              {events.length === 0 && <p className="text-xs text-muted-foreground mt-1">No tienes eventos publicados. Crea uno primero.</p>}
            </div>
            <div>
              <Label>Mensaje</Label>
              <Textarea placeholder="Escribe un mensaje para el artista..." value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button className="gradient-primary text-white border-0" onClick={sendInvite} disabled={!selectedEvent || submitting}>
              {submitting ? 'Enviando...' : <><Send className="w-4 h-4 mr-2" /> Enviar invitación</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
