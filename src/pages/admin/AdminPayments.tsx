import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  description: string | null;
  created_at: string;
  user_name?: string;
}

export default function AdminPayments() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase.from('payment_transactions').select('*').order('created_at', { ascending: false });
    if (data) {
      const enriched = [];
      for (const t of data) {
        const { data: prof } = await supabase.from('profiles').select('display_name').eq('user_id', t.user_id).maybeSingle();
        enriched.push({ ...t, user_name: prof?.display_name || 'Desconocido' });
      }
      setTransactions(enriched);
    }
    setLoading(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Pagos y Transacciones</h1>
        <p className="text-muted-foreground mt-1">{transactions.length} transacciones registradas</p>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-display font-semibold text-lg mb-2">No hay transacciones aún</p>
          <p className="text-sm">Las transacciones aparecerán cuando los usuarios realicen pagos a través de OpenPay</p>
          <Badge variant="outline" className="mt-4">Modo simulación activo</Badge>
        </div>
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.user_name}</TableCell>
                    <TableCell className="font-semibold">${t.amount} {t.currency}</TableCell>
                    <TableCell><Badge className={statusColor(t.status)}>{t.status}</Badge></TableCell>
                    <TableCell>{t.provider}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
