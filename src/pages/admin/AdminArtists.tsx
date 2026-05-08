import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, Star, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminArtists() {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchArtists(); }, []);

  const fetchArtists = async () => {
    const { data } = await supabase.from('artist_profiles').select('*');
    if (data) {
      const enriched = [];
      for (const a of data) {
        const { data: prof } = await supabase.from('profiles').select('display_name, avatar_url, city').eq('user_id', a.user_id).maybeSingle();
        const { data: revs } = await supabase.from('reviews').select('rating').eq('artist_id', a.user_id);
        const avgRating = revs && revs.length > 0 ? (revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1) : '—';
        enriched.push({ ...a, profile: prof, avgRating, reviewCount: revs?.length || 0 });
      }
      setArtists(enriched);
    }
    setLoading(false);
  };

  const filtered = artists.filter(a =>
    a.artist_name.toLowerCase().includes(search.toLowerCase()) ||
    (a.profile?.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Gestión de Artistas</h1>
        <p className="text-muted-foreground mt-1">{artists.length} artistas registrados</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar artistas..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artista</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Géneros</TableHead>
              <TableHead>Tarifa</TableHead>
              <TableHead>Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(a => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={a.profile?.avatar_url || ''} />
                      <AvatarFallback>{(a.artist_name || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{a.artist_name}</p>
                      <p className="text-xs text-muted-foreground">{a.profile?.display_name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{a.profile?.city || '—'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">{(a.genres || []).slice(0, 3).map((g: string) => <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>)}</div>
                </TableCell>
                <TableCell className="text-sm font-semibold">${a.base_rate} MXN</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="w-3 h-3 fill-primary text-primary" /> {a.avgRating} ({a.reviewCount})
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
